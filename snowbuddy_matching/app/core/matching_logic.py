from typing import List, Dict, Any
from snowbuddy_matching.app.models.matching import CandidateProfile, MatchingPreference

# --- Scoring Weights (configurable in the future) ---
WEIGHT_SKILL = 0.4
WEIGHT_LOCATION = 0.3
WEIGHT_AVAILABILITY = 0.2
WEIGHT_ROLE = 0.1

def calculate_skill_score(seeker_pref: MatchingPreference, candidate: CandidateProfile) -> float:
    """
    Calculates a score based on skill level compatibility.
    Returns a float between 0.0 and 1.0.
    """
    # Simple logic: score is high if candidate's level is within seeker's range.
    if seeker_pref.skill_level_min <= candidate.skill_level <= seeker_pref.skill_level_max:
        # Further refinement: closer to the middle of the range is better?
        # For now, a binary score is sufficient.
        return 1.0
    return 0.0

def calculate_location_score(seeker_pref: MatchingPreference, candidate: CandidateProfile, all_resorts: List[Dict[str, Any]]) -> float:
    """
    Calculates a score based on preferred locations, using actual resort data.
    Returns a float between 0.0 and 1.0.
    """
    # Create a lookup for region by resort_id for efficient access
    resort_to_region = {resort['resort_id']: resort['region'] for resort in all_resorts}

    # 1. Direct resort match (highest score)
    if seeker_pref.preferred_resorts and candidate.preferences.preferred_resorts:
        if set(seeker_pref.preferred_resorts) & set(candidate.preferences.preferred_resorts):
            return 1.0
    
    # 2. Region match (medium score)
    # This includes checking regions of preferred resorts
    seeker_regions = set(seeker_pref.preferred_regions)
    for resort_id in seeker_pref.preferred_resorts:
        if region := resort_to_region.get(resort_id):
            seeker_regions.add(region)

    candidate_regions = set(candidate.preferences.preferred_regions)
    for resort_id in candidate.preferences.preferred_resorts:
        if region := resort_to_region.get(resort_id):
            candidate_regions.add(region)

    if seeker_regions & candidate_regions:
        return 0.5
            
    return 0.0

def calculate_availability_score(seeker_pref: MatchingPreference, candidate: CandidateProfile) -> float:
    """
    Calculates a score based on overlapping availability.
    Returns a float between 0.0 and 1.0.
    """
    if not seeker_pref.availability or not candidate.preferences.availability:
        return 0.2 # No preference means they are flexible, give a small base score

    if set(seeker_pref.availability) & set(candidate.preferences.availability):
        return 1.0
        
    return 0.0

def calculate_role_score(seeker_pref: MatchingPreference, candidate: CandidateProfile) -> float:
    """
    Calculates a score based on complementary roles.
    Returns a float between 0.0 and 1.0.
    """
    # Seeker wants a coach, candidate is a coach
    if seeker_pref.seeking_role == 'coach' and candidate.self_role == 'coach':
        return 1.0
    # Seeker wants a student, candidate is a student
    if seeker_pref.seeking_role == 'student' and candidate.self_role == 'student':
        return 1.0
    # Seeker wants a buddy, candidate is a buddy
    if seeker_pref.seeking_role == 'buddy' and candidate.self_role == 'buddy':
        return 1.0
    # A coach is also a buddy
    if seeker_pref.seeking_role == 'buddy' and candidate.self_role == 'coach':
        return 0.8
        
    return 0.1 # Low score for non-complementary roles

def calculate_total_match_score(seeker_pref: MatchingPreference, candidate: CandidateProfile, all_resorts: List[Dict[str, Any]]) -> float:
    """
    Calculates the final weighted score for a potential match.
    """
    s_skill = calculate_skill_score(seeker_pref, candidate)
    s_location = calculate_location_score(seeker_pref, candidate, all_resorts)
    s_availability = calculate_availability_score(seeker_pref, candidate)
    s_role = calculate_role_score(seeker_pref, candidate)
    
    total_score = (
        s_skill * WEIGHT_SKILL +
        s_location * WEIGHT_LOCATION +
        s_availability * WEIGHT_AVAILABILITY +
        s_role * WEIGHT_ROLE
    )
    
    return round(total_score, 2)
