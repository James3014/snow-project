import pytest

from snowbuddy_matching.app.models.matching import MatchingPreference, CandidateProfile
from snowbuddy_matching.app.core.matching_logic import (
    calculate_skill_score,
    calculate_location_score,
    calculate_availability_score,
    calculate_role_score,
    calculate_total_match_score
)

# Sample data for testing
seeker_pref = MatchingPreference(skill_level_min=3, skill_level_max=7, seeking_role='buddy')

candidate_perfect_match = CandidateProfile(
    user_id="p1", nickname="Perfect", skill_level=5, self_role='buddy',
    preferences=MatchingPreference()
)

candidate_skill_mismatch = CandidateProfile(
    user_id="s1", nickname="Skill Mismatch", skill_level=9, self_role='buddy',
    preferences=MatchingPreference()
)

candidate_role_mismatch = CandidateProfile(
    user_id="r1", nickname="Role Mismatch", skill_level=5, self_role='student',
    preferences=MatchingPreference()
)

def test_calculate_skill_score():
    assert calculate_skill_score(seeker_pref, candidate_perfect_match) == 1.0
    assert calculate_skill_score(seeker_pref, candidate_skill_mismatch) == 0.0

def test_calculate_location_score():
    pref_resort = MatchingPreference(preferred_resorts=["resort_A"])
    cand_pref_resort = MatchingPreference(preferred_resorts=["resort_A", "resort_B"])
    cand_profile_resort = CandidateProfile(user_id="c1", nickname="c1", skill_level=1, preferences=cand_pref_resort)
    mock_resorts = [{"resort_id": "resort_A", "region": "region_X"}]
    assert calculate_location_score(pref_resort, cand_profile_resort, mock_resorts) == 1.0

    pref_region = MatchingPreference(preferred_regions=["region_X"])
    cand_pref_region = MatchingPreference(preferred_regions=["region_X"])
    cand_profile_region = CandidateProfile(user_id="c2", nickname="c2", skill_level=1, preferences=cand_pref_region)
    assert calculate_location_score(pref_region, cand_profile_region, mock_resorts) == 0.5

    pref_none = MatchingPreference()
    cand_profile_none = CandidateProfile(user_id="c3", nickname="c3", skill_level=1, preferences=MatchingPreference())
    assert calculate_location_score(pref_none, cand_profile_none, mock_resorts) == 0.0

def test_calculate_role_score():
    assert calculate_role_score(seeker_pref, candidate_perfect_match) == 1.0
    # A coach can be a buddy
    coach_as_buddy = CandidateProfile(user_id="c1", nickname="c1", skill_level=10, self_role='coach', preferences=MatchingPreference())
    assert calculate_role_score(seeker_pref, coach_as_buddy) == 0.8
    # Mismatch
    student_as_buddy = CandidateProfile(user_id="s1", nickname="s1", skill_level=2, self_role='student', preferences=MatchingPreference())
    assert calculate_role_score(seeker_pref, student_as_buddy) == 0.1

def test_calculate_total_match_score():
    # This is a simple integration test for the scoring logic
    mock_resorts = []
    score = calculate_total_match_score(seeker_pref, candidate_perfect_match, mock_resorts)
    assert score > 0
    # Based on current weights, skill(1.0*0.4) + role(1.0*0.1) + location(0) + availability(0.2*0.2) = 0.4 + 0.1 + 0.04 = 0.54
    assert score == 0.54
