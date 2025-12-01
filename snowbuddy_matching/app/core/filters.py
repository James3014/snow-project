"""
Candidate filtering functions.
"""
from typing import List, Dict, Any
from ..models.matching import CandidateProfile, MatchingPreference


def filter_candidates(
    seeker_pref: MatchingPreference,
    all_users: List[Dict[str, Any]],
    seeker_id: str
) -> List[CandidateProfile]:
    """Filter candidates based on basic criteria before scoring."""
    candidates = []
    
    for user_data in all_users:
        if not _passes_basic_filters(user_data, seeker_pref, seeker_id):
            continue
        
        if not _passes_location_filter(user_data, seeker_pref):
            continue
        
        try:
            candidates.append(CandidateProfile(**user_data))
        except Exception as e:
            print(f"Error creating CandidateProfile for user {user_data.get('user_id')}: {e}")
    
    return candidates


def _passes_basic_filters(user_data: Dict[str, Any], seeker_pref: MatchingPreference, seeker_id: str) -> bool:
    """Check basic eligibility criteria."""
    # Skip self
    if user_data.get('user_id') == seeker_id:
        return False
    
    # Skip if not open to matching
    if not user_data.get('preferences', {}).get('open_to_matching', True):
        return False
    
    # Check skill level
    user_skill = user_data.get('skill_level', 5)
    if not (seeker_pref.skill_level_min <= user_skill <= seeker_pref.skill_level_max):
        return False
    
    return True


def _passes_location_filter(user_data: Dict[str, Any], seeker_pref: MatchingPreference) -> bool:
    """Check location preference overlap."""
    if not seeker_pref.preferred_resorts and not seeker_pref.preferred_regions:
        return True
    
    user_prefs = user_data.get('preferences', {})
    user_resorts = user_prefs.get('preferred_resorts', [])
    user_regions = user_prefs.get('preferred_regions', [])
    
    # Check resort overlap
    if seeker_pref.preferred_resorts and user_resorts:
        if set(seeker_pref.preferred_resorts) & set(user_resorts):
            return True
    
    # Check region overlap
    if seeker_pref.preferred_regions and user_regions:
        if set(seeker_pref.preferred_regions) & set(user_regions):
            return True
    
    return False
