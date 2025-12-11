"""
Scoring functions for matching algorithm.
"""
from typing import List, Dict, Any, Optional
from ..models.matching import CandidateProfile, MatchingPreference


def calculate_skill_score(seeker_pref: MatchingPreference, candidate: CandidateProfile) -> float:
    """Score based on skill level compatibility. Returns 0.0-1.0."""
    if seeker_pref.skill_level_min <= candidate.skill_level <= seeker_pref.skill_level_max:
        return 1.0
    return 0.0


def calculate_location_score(
    seeker_pref: MatchingPreference,
    candidate: CandidateProfile,
    all_resorts: List[Dict[str, Any]]
) -> float:
    """Score based on location preferences. Returns 0.0-1.0."""
    resort_to_region = {r['resort_id']: r['region'] for r in all_resorts}
    
    # Direct resort match
    if seeker_pref.preferred_resorts and candidate.preferences.preferred_resorts:
        if set(seeker_pref.preferred_resorts) & set(candidate.preferences.preferred_resorts):
            return 1.0
    
    # Region match
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
    """Score based on overlapping availability. Returns 0.0-1.0."""
    if not seeker_pref.availability or not candidate.preferences.availability:
        return 0.2
    if set(seeker_pref.availability) & set(candidate.preferences.availability):
        return 1.0
    return 0.0


def calculate_role_score(seeker_pref: MatchingPreference, candidate: CandidateProfile) -> float:
    """Score based on complementary roles. Returns 0.0-1.0."""
    if seeker_pref.seeking_role == candidate.self_role:
        return 1.0
    if seeker_pref.seeking_role == 'buddy' and candidate.self_role == 'coach':
        return 0.8
    return 0.1


def calculate_casi_skill_score(
    seeker_casi: Optional[Dict[str, Any]], 
    candidate_casi: Optional[Dict[str, Any]]
) -> float:
    """
    基於 CASI 技能相似度計算評分
    
    使用 User Core 的 CASI API 資料進行精確技能匹配
    """
    if not seeker_casi or not candidate_casi:
        return 0.5  # 預設中等評分
    
    if not seeker_casi.get("has_profile") or not candidate_casi.get("has_profile"):
        return 0.5
    
    # 計算整體技能差異
    seeker_skill = seeker_casi.get("overall_skill", 0.0)
    candidate_skill = candidate_casi.get("overall_skill", 0.0)
    
    skill_diff = abs(seeker_skill - candidate_skill)
    
    # 技能差異越小，評分越高
    if skill_diff <= 0.1:
        return 1.0
    elif skill_diff <= 0.2:
        return 0.8
    elif skill_diff <= 0.3:
        return 0.6
    else:
        return 0.3


def calculate_knowledge_score(
    seeker_profile: Optional[Dict[str, Any]],
    candidate_profile: Optional[Dict[str, Any]]
) -> float:
    """Score based on knowledge engagement similarity. Returns 0.0-1.0."""
    if not seeker_profile or not candidate_profile:
        return 0.5
    
    seeker_score = seeker_profile.get('overall_score', 0)
    candidate_score = candidate_profile.get('overall_score', 0)
    
    if seeker_score == 0 or candidate_score == 0:
        return 0.5
    
    diff = abs(seeker_score - candidate_score)
    return max(0.0, min(1.0, 1.0 - (diff / 100)))
