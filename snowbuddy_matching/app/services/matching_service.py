"""
Matching service - orchestrates the matching process.
"""
from typing import List, Dict, Any

from ..models.matching import MatchSummary, MatchingPreference
from ..core.matching_logic import calculate_total_match_score, filter_candidates
from ..clients import user_core_client, resort_services_client, knowledge_engagement_client
from .redis_repository import get_redis_repository


class MatchingService:
    """Service for snowbuddy matching operations."""
    
    def __init__(self):
        self._redis = get_redis_repository()
    
    async def run_matching(self, search_id: str, seeker_id: str, seeker_prefs: MatchingPreference) -> None:
        """Execute the full matching process."""
        # 1. Mark as processing
        self._redis.set_processing(search_id)
        
        # 2. Fetch external data
        all_users = await user_core_client.get_users()
        all_resorts = await resort_services_client.get_resorts()
        
        # 3. Filter candidates
        candidates = filter_candidates(seeker_prefs, all_users, seeker_id)
        
        # 4. Fetch knowledge profiles if needed
        seeker_knowledge = None
        candidate_knowledge_map: Dict[str, Any] = {}
        
        if seeker_prefs.include_knowledge_score:
            seeker_knowledge = await knowledge_engagement_client.get_skill_profile(seeker_id)
            for candidate in candidates:
                profile = await knowledge_engagement_client.get_skill_profile(candidate.user_id)
                if profile:
                    candidate_knowledge_map[candidate.user_id] = profile
        
        # 5. Score candidates
        scored = self._score_candidates(
            seeker_prefs, candidates, all_resorts,
            seeker_knowledge, candidate_knowledge_map
        )
        
        # 6. Store results
        self._redis.set_completed(search_id, [r.model_dump() for r in scored])
    
    def _score_candidates(
        self,
        seeker_prefs: MatchingPreference,
        candidates: List,
        all_resorts: List[Dict[str, Any]],
        seeker_knowledge: Any,
        candidate_knowledge_map: Dict[str, Any]
    ) -> List[MatchSummary]:
        """Score and rank candidates."""
        scored = []
        for candidate in candidates:
            candidate_knowledge = candidate_knowledge_map.get(candidate.user_id) if seeker_prefs.include_knowledge_score else None
            
            score = calculate_total_match_score(
                seeker_prefs, candidate, all_resorts,
                seeker_knowledge, candidate_knowledge
            )
            
            if score > 0.2:
                scored.append(MatchSummary(**candidate.model_dump(), match_score=score))
        
        scored.sort(key=lambda x: x.match_score, reverse=True)
        return scored
    
    def get_results(self, search_id: str) -> Dict[str, Any]:
        """Get search results."""
        return self._redis.get_results(search_id)


def get_matching_service() -> MatchingService:
    """Get matching service instance."""
    return MatchingService()
