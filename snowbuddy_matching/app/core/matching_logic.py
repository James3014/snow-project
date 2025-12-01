"""
Matching logic coordinator - combines scoring and filtering.
"""
from typing import List, Dict, Any, Optional
from ..models.matching import CandidateProfile, MatchingPreference
from .scorers import (
    calculate_skill_score,
    calculate_location_score,
    calculate_availability_score,
    calculate_role_score,
    calculate_knowledge_score,
)
from .filters import filter_candidates

# Scoring weights
WEIGHT_SKILL = 0.3
WEIGHT_LOCATION = 0.25
WEIGHT_AVAILABILITY = 0.2
WEIGHT_ROLE = 0.15
WEIGHT_KNOWLEDGE = 0.1

# Re-export filter_candidates for backward compatibility
__all__ = ['calculate_total_match_score', 'filter_candidates']


def calculate_total_match_score(
    seeker_pref: MatchingPreference,
    candidate: CandidateProfile,
    all_resorts: List[Dict[str, Any]],
    seeker_knowledge: Optional[Dict[str, Any]] = None,
    candidate_knowledge: Optional[Dict[str, Any]] = None
) -> float:
    """Calculate the final weighted score for a potential match."""
    s_skill = calculate_skill_score(seeker_pref, candidate)
    s_location = calculate_location_score(seeker_pref, candidate, all_resorts)
    s_availability = calculate_availability_score(seeker_pref, candidate)
    s_role = calculate_role_score(seeker_pref, candidate)
    
    total = (
        s_skill * WEIGHT_SKILL +
        s_location * WEIGHT_LOCATION +
        s_availability * WEIGHT_AVAILABILITY +
        s_role * WEIGHT_ROLE
    )
    
    if seeker_pref.include_knowledge_score:
        s_knowledge = calculate_knowledge_score(seeker_knowledge, candidate_knowledge)
        total += s_knowledge * WEIGHT_KNOWLEDGE
    else:
        # Redistribute knowledge weight
        redistribution = WEIGHT_KNOWLEDGE / 4
        total += redistribution * (s_skill + s_location + s_availability + s_role)
    
    return round(total, 2)
