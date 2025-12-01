"""
Unit tests for matching logic.
"""
import sys
from pathlib import Path
from datetime import date

# Add parent to path for proper imports
parent_path = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(parent_path))

from app.core.scorers import (
    calculate_skill_score,
    calculate_location_score,
    calculate_availability_score,
    calculate_role_score,
)
from app.core.matching_logic import calculate_total_match_score
from app.models.matching import MatchingPreference, CandidateProfile


def test_skill_score_exact_match():
    """Test skill score with exact match."""
    seeker = MatchingPreference(skill_level_min=5, skill_level_max=7)
    candidate = CandidateProfile(
        user_id="test",
        nickname="Test",
        skill_level=6,
        preferences=MatchingPreference()
    )
    score = calculate_skill_score(seeker, candidate)
    assert score == 1.0


def test_skill_score_out_of_range():
    """Test skill score when candidate is out of range."""
    seeker = MatchingPreference(skill_level_min=8, skill_level_max=10)
    candidate = CandidateProfile(
        user_id="test",
        nickname="Test",
        skill_level=3,
        preferences=MatchingPreference()
    )
    score = calculate_skill_score(seeker, candidate)
    assert score == 0.0


def test_location_score_direct_resort_match():
    """Test location score with direct resort overlap."""
    seeker = MatchingPreference(preferred_resorts=["resort_001", "resort_002"])
    candidate = CandidateProfile(
        user_id="test",
        nickname="Test",
        skill_level=5,
        preferences=MatchingPreference(preferred_resorts=["resort_002", "resort_003"])
    )
    resorts = [
        {"resort_id": "resort_001", "region": "Hokkaido"},
        {"resort_id": "resort_002", "region": "Hokkaido"}
    ]
    score = calculate_location_score(seeker, candidate, resorts)
    assert score == 1.0


def test_location_score_region_match():
    """Test location score with region overlap."""
    seeker = MatchingPreference(preferred_regions=["Hokkaido"])
    candidate = CandidateProfile(
        user_id="test",
        nickname="Test",
        skill_level=5,
        preferences=MatchingPreference(preferred_regions=["Hokkaido"])
    )
    score = calculate_location_score(seeker, candidate, [])
    assert score == 0.5


def test_availability_score_overlap():
    """Test availability score with date overlap."""
    seeker = MatchingPreference(
        availability=[date(2025, 1, 15), date(2025, 1, 16)]
    )
    candidate = CandidateProfile(
        user_id="test",
        nickname="Test",
        skill_level=5,
        preferences=MatchingPreference(
            availability=[date(2025, 1, 16), date(2025, 1, 17)]
        )
    )
    score = calculate_availability_score(seeker, candidate)
    assert score == 1.0


def test_role_score_exact_match():
    """Test role score with exact match."""
    seeker = MatchingPreference(seeking_role="coach")
    candidate = CandidateProfile(
        user_id="test",
        nickname="Test",
        skill_level=8,
        self_role="coach",
        preferences=MatchingPreference()
    )
    score = calculate_role_score(seeker, candidate)
    assert score == 1.0


def test_total_match_score():
    """Test total match score calculation."""
    seeker = MatchingPreference(
        skill_level_min=5,
        skill_level_max=7,
        preferred_resorts=["resort_001"],
        seeking_role="buddy"
    )
    candidate = CandidateProfile(
        user_id="test",
        nickname="Test",
        skill_level=6,
        self_role="buddy",
        preferences=MatchingPreference(preferred_resorts=["resort_001"])
    )
    resorts = [{"resort_id": "resort_001", "region": "Hokkaido"}]
    score = calculate_total_match_score(seeker, candidate, resorts)
    assert score > 0.5  # Should be relatively high
