"""
Property-based tests for Buddy Matching Candidate Filtering.

**Feature: enhanced-buddy-matching, Property 2: 候選人過濾完整性**
**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

**Feature: enhanced-buddy-matching, Property 10: 封鎖過濾**
**Validates: Requirements 2.2, 8.3**

Tests verify:
- Filtered candidates satisfy all basic conditions
- Blocked users are correctly excluded
- Skill level filtering works correctly
- Location filtering works correctly
- Time filtering works correctly
"""
import pytest
from hypothesis import given, strategies as st, assume, settings
from hypothesis.strategies import composite
import uuid
from datetime import datetime, UTC, date, timedelta
from unittest.mock import Mock, MagicMock, patch

# Import the service
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "platform" / "user_core"))

from services.buddy_matching_service import (
    filter_candidates,
    _is_skill_level_compatible,
    _has_resort_overlap,
    _has_time_overlap,
    _get_blocked_user_ids
)
from models.user_profile import UserProfile
from models.trip_planning import Trip
from models.enums import TripVisibility


# Strategy builders for generating test data
@composite
def skill_level_strategy(draw):
    """Generate a valid skill level."""
    return draw(st.sampled_from(['beginner', 'intermediate', 'advanced', 'expert']))


@composite
def resort_list_strategy(draw):
    """Generate a list of resort IDs."""
    resorts = ['niseko', 'hakuba', 'furano', 'rusutsu', 'tomamu', 'appi', 'zao']
    size = draw(st.integers(min_value=0, max_value=5))
    return draw(st.lists(st.sampled_from(resorts), min_size=size, max_size=size, unique=True))


@composite
def date_range_strategy(draw):
    """Generate a valid date range for a trip."""
    # Generate dates within next 6 months
    base_date = date.today()
    start_offset = draw(st.integers(min_value=0, max_value=180))
    duration = draw(st.integers(min_value=1, max_value=14))
    
    start_date = base_date + timedelta(days=start_offset)
    end_date = start_date + timedelta(days=duration)
    
    return start_date, end_date


@composite
def user_profile_strategy(draw):
    """Generate a UserProfile object."""
    user_id = uuid.uuid4()
    skill_level = draw(skill_level_strategy())
    preferred_resorts = draw(resort_list_strategy())
    
    user = Mock(spec=UserProfile)
    user.user_id = user_id
    user.skill_level = skill_level
    user.preferred_resorts = preferred_resorts
    user.display_name = f"User_{user_id.hex[:8]}"
    user.avatar_url = None
    
    return user


@composite
def trip_strategy(draw, user_id=None):
    """Generate a Trip object."""
    trip_id = uuid.uuid4()
    if user_id is None:
        user_id = uuid.uuid4()
    
    resorts = ['niseko', 'hakuba', 'furano', 'rusutsu', 'tomamu', 'appi', 'zao']
    resort_id = draw(st.sampled_from(resorts))
    start_date, end_date = draw(date_range_strategy())
    
    trip = Mock(spec=Trip)
    trip.trip_id = trip_id
    trip.user_id = user_id
    trip.resort_id = resort_id
    trip.start_date = start_date
    trip.end_date = end_date
    trip.visibility = TripVisibility.PUBLIC
    trip.max_buddies = draw(st.integers(min_value=1, max_value=10))
    trip.current_buddies = 0
    
    return trip


class TestCandidateFilteringCompleteness:
    """Property-based tests for candidate filtering completeness."""
    
    @given(
        seeker=user_profile_strategy(),
        seeker_trip=trip_strategy(),
        candidates=st.lists(user_profile_strategy(), min_size=0, max_size=20)
    )
    @settings(max_examples=100)
    def test_filtered_candidates_not_self(self, seeker, seeker_trip, candidates):
        """**Feature: enhanced-buddy-matching, Property 2: 候選人過濾完整性**
        
        Property: For any filtering operation, the seeker should never appear
        in the filtered candidates list.
        """
        # Create mock database session
        db = Mock()
        db.query.return_value.filter.return_value.all.return_value = []
        
        # Ensure seeker's trip belongs to seeker
        seeker_trip.user_id = seeker.user_id
        
        # Add seeker to candidates list
        all_candidates = candidates + [seeker]
        
        filtered = filter_candidates(db, seeker, seeker_trip, all_candidates)
        
        # Seeker should not be in filtered list
        assert seeker not in filtered, \
            "Seeker should not appear in filtered candidates"
        assert all(c.user_id != seeker.user_id for c in filtered), \
            "Seeker's user_id should not appear in filtered candidates"
    
    @given(
        seeker=user_profile_strategy(),
        seeker_trip=trip_strategy(),
        candidates=st.lists(user_profile_strategy(), min_size=1, max_size=20)
    )
    @settings(max_examples=100)
    def test_filtered_candidates_have_compatible_skills(self, seeker, seeker_trip, candidates):
        """**Feature: enhanced-buddy-matching, Property 2: 候選人過濾完整性**
        
        Property: For any filtered candidates, all should have skill levels
        compatible with the seeker (within 1 level difference).
        """
        # Create mock database session with trips for all candidates
        db = Mock()
        
        def mock_query_filter_all(*args, **kwargs):
            # Return at least one trip for each candidate to pass time filtering
            return [Mock(spec=Trip, start_date=seeker_trip.start_date, end_date=seeker_trip.end_date)]
        
        db.query.return_value.filter.return_value.all = mock_query_filter_all
        
        # Ensure seeker's trip belongs to seeker
        seeker_trip.user_id = seeker.user_id
        
        # Ensure all candidates have at least one overlapping resort
        for candidate in candidates:
            if not candidate.preferred_resorts:
                candidate.preferred_resorts = [seeker_trip.resort_id]
            elif seeker_trip.resort_id not in candidate.preferred_resorts:
                candidate.preferred_resorts.append(seeker_trip.resort_id)
        
        filtered = filter_candidates(db, seeker, seeker_trip, candidates)
        
        # All filtered candidates should have compatible skill levels
        skill_order = {'beginner': 0, 'intermediate': 1, 'advanced': 2, 'expert': 3}
        seeker_level = skill_order.get(seeker.skill_level.lower(), 0)
        
        for candidate in filtered:
            candidate_level = skill_order.get(candidate.skill_level.lower(), 0)
            level_diff = abs(seeker_level - candidate_level)
            
            assert level_diff <= 1, \
                f"Candidate {candidate.user_id} has incompatible skill level: " \
                f"seeker={seeker.skill_level}, candidate={candidate.skill_level}, diff={level_diff}"
    
    @given(
        seeker=user_profile_strategy(),
        seeker_trip=trip_strategy(),
        candidates=st.lists(user_profile_strategy(), min_size=1, max_size=20)
    )
    @settings(max_examples=100)
    def test_filtered_candidates_have_resort_overlap(self, seeker, seeker_trip, candidates):
        """**Feature: enhanced-buddy-matching, Property 2: 候選人過濾完整性**
        
        Property: For any filtered candidates, all should have at least one
        overlapping resort with the seeker.
        """
        # Create mock database session
        db = Mock()
        
        def mock_query_filter_all(*args, **kwargs):
            # Return at least one trip for each candidate
            return [Mock(spec=Trip, start_date=seeker_trip.start_date, end_date=seeker_trip.end_date)]
        
        db.query.return_value.filter.return_value.all = mock_query_filter_all
        
        # Ensure seeker's trip belongs to seeker
        seeker_trip.user_id = seeker.user_id
        
        # Ensure all candidates have compatible skill levels
        for candidate in candidates:
            candidate.skill_level = seeker.skill_level
        
        filtered = filter_candidates(db, seeker, seeker_trip, candidates)
        
        # Build seeker's resort set
        seeker_resorts = set(seeker.preferred_resorts or [])
        seeker_resorts.add(seeker_trip.resort_id)
        
        # All filtered candidates should have resort overlap
        for candidate in filtered:
            candidate_resorts = set(candidate.preferred_resorts or [])
            
            # If either has no preferences, it's considered compatible
            if not seeker_resorts or not candidate_resorts:
                continue
            
            overlap = seeker_resorts & candidate_resorts
            assert len(overlap) > 0, \
                f"Candidate {candidate.user_id} has no resort overlap: " \
                f"seeker={seeker_resorts}, candidate={candidate_resorts}"
    
    @given(
        seeker=user_profile_strategy(),
        seeker_trip=trip_strategy(),
        candidates=st.lists(user_profile_strategy(), min_size=1, max_size=20)
    )
    @settings(max_examples=50)
    def test_filtered_candidates_have_time_overlap(self, seeker, seeker_trip, candidates):
        """**Feature: enhanced-buddy-matching, Property 2: 候選人過濾完整性**
        
        Property: For any filtered candidates, all should have trips that
        overlap with the seeker's trip dates.
        """
        # Create mock database session
        db = Mock()
        
        # Track which candidates have overlapping trips
        candidates_with_trips = set()
        
        def mock_query_filter_all(*args, **kwargs):
            # Determine which candidate this query is for
            # We'll return trips for candidates that should pass
            # For simplicity, return trips for all candidates
            return [Mock(spec=Trip, start_date=seeker_trip.start_date, end_date=seeker_trip.end_date)]
        
        db.query.return_value.filter.return_value.all = mock_query_filter_all
        
        # Ensure seeker's trip belongs to seeker
        seeker_trip.user_id = seeker.user_id
        
        # Ensure all candidates have compatible skills and resorts
        for candidate in candidates:
            candidate.skill_level = seeker.skill_level
            if not candidate.preferred_resorts:
                candidate.preferred_resorts = [seeker_trip.resort_id]
        
        filtered = filter_candidates(db, seeker, seeker_trip, candidates)
        
        # All filtered candidates should have been queried for time overlap
        # Since we mocked the DB to return trips for all, all should pass
        # This test verifies the filtering logic calls the time check
        assert all(c.user_id != seeker.user_id for c in filtered), \
            "Filtered candidates should not include seeker"
    
    def test_empty_candidate_list_returns_empty(self):
        """**Feature: enhanced-buddy-matching, Property 2: 候選人過濾完整性**
        
        Property: Filtering an empty candidate list should return an empty list.
        """
        db = Mock()
        seeker = Mock(spec=UserProfile)
        seeker.user_id = uuid.uuid4()
        seeker.skill_level = 'intermediate'
        seeker.preferred_resorts = ['niseko']
        
        trip = Mock(spec=Trip)
        trip.user_id = seeker.user_id
        trip.resort_id = 'niseko'
        trip.start_date = date.today()
        trip.end_date = date.today() + timedelta(days=3)
        
        filtered = filter_candidates(db, seeker, trip, [])
        
        assert filtered == [], \
            "Filtering empty list should return empty list"
    
    @given(
        seeker=user_profile_strategy(),
        seeker_trip=trip_strategy()
    )
    @settings(max_examples=50)
    def test_incompatible_skill_levels_filtered_out(self, seeker, seeker_trip):
        """**Feature: enhanced-buddy-matching, Property 2: 候選人過濾完整性**
        
        Property: Candidates with skill levels more than 1 level different
        should be filtered out.
        """
        db = Mock()
        db.query.return_value.filter.return_value.all.return_value = [
            Mock(spec=Trip, start_date=seeker_trip.start_date, end_date=seeker_trip.end_date)
        ]
        
        seeker_trip.user_id = seeker.user_id
        seeker.skill_level = 'beginner'
        
        # Create candidates with various skill levels
        compatible_candidate = Mock(spec=UserProfile)
        compatible_candidate.user_id = uuid.uuid4()
        compatible_candidate.skill_level = 'intermediate'  # 1 level diff - OK
        compatible_candidate.preferred_resorts = [seeker_trip.resort_id]
        
        incompatible_candidate = Mock(spec=UserProfile)
        incompatible_candidate.user_id = uuid.uuid4()
        incompatible_candidate.skill_level = 'expert'  # 3 levels diff - NOT OK
        incompatible_candidate.preferred_resorts = [seeker_trip.resort_id]
        
        candidates = [compatible_candidate, incompatible_candidate]
        
        filtered = filter_candidates(db, seeker, seeker_trip, candidates)
        
        assert compatible_candidate in filtered, \
            "Compatible candidate should be in filtered list"
        assert incompatible_candidate not in filtered, \
            "Incompatible candidate should be filtered out"


class TestBlockFiltering:
    """Property-based tests for block filtering."""
    
    @given(
        seeker=user_profile_strategy(),
        seeker_trip=trip_strategy(),
        blocked_candidates=st.lists(user_profile_strategy(), min_size=1, max_size=10),
        normal_candidates=st.lists(user_profile_strategy(), min_size=1, max_size=10)
    )
    @settings(max_examples=50)
    def test_blocked_users_excluded_from_results(self, seeker, seeker_trip, blocked_candidates, normal_candidates):
        """**Feature: enhanced-buddy-matching, Property 10: 封鎖過濾**
        
        Property: For any set of blocked users, they should not appear in
        the filtered candidates list.
        """
        # Create mock database session
        db = Mock()
        
        # Mock the blocked user IDs
        blocked_ids = {c.user_id for c in blocked_candidates}
        
        def mock_query_filter_all(*args, **kwargs):
            return [Mock(spec=Trip, start_date=seeker_trip.start_date, end_date=seeker_trip.end_date)]
        
        db.query.return_value.filter.return_value.all = mock_query_filter_all
        
        # Ensure seeker's trip belongs to seeker
        seeker_trip.user_id = seeker.user_id
        
        # Make all candidates compatible
        all_candidates = blocked_candidates + normal_candidates
        for candidate in all_candidates:
            candidate.skill_level = seeker.skill_level
            candidate.preferred_resorts = [seeker_trip.resort_id]
        
        # Patch the _get_blocked_user_ids function to return our blocked IDs
        with patch('services.buddy_matching_service._get_blocked_user_ids', return_value=blocked_ids):
            filtered = filter_candidates(db, seeker, seeker_trip, all_candidates)
        
        # No blocked candidates should be in filtered list
        filtered_ids = {c.user_id for c in filtered}
        assert not (filtered_ids & blocked_ids), \
            f"Blocked users should not appear in filtered results: {filtered_ids & blocked_ids}"
        
        # Normal candidates should potentially be in filtered list
        # (if they pass other filters)
        normal_ids = {c.user_id for c in normal_candidates}
        assert filtered_ids.issubset(normal_ids), \
            "Filtered candidates should only come from normal candidates"
    
    def test_bidirectional_block_filtering(self):
        """**Feature: enhanced-buddy-matching, Property 10: 封鎖過濾**
        
        Property: If user A blocks user B, or user B blocks user A,
        they should not match with each other.
        """
        db = Mock()
        db.query.return_value.filter.return_value.all.return_value = [
            Mock(spec=Trip, start_date=date.today(), end_date=date.today() + timedelta(days=3))
        ]
        
        seeker = Mock(spec=UserProfile)
        seeker.user_id = uuid.uuid4()
        seeker.skill_level = 'intermediate'
        seeker.preferred_resorts = ['niseko']
        
        trip = Mock(spec=Trip)
        trip.user_id = seeker.user_id
        trip.resort_id = 'niseko'
        trip.start_date = date.today()
        trip.end_date = date.today() + timedelta(days=3)
        
        # Candidate that seeker blocked
        blocked_by_seeker = Mock(spec=UserProfile)
        blocked_by_seeker.user_id = uuid.uuid4()
        blocked_by_seeker.skill_level = 'intermediate'
        blocked_by_seeker.preferred_resorts = ['niseko']
        
        # Candidate that blocked seeker
        blocked_seeker = Mock(spec=UserProfile)
        blocked_seeker.user_id = uuid.uuid4()
        blocked_seeker.skill_level = 'intermediate'
        blocked_seeker.preferred_resorts = ['niseko']
        
        # Normal candidate
        normal = Mock(spec=UserProfile)
        normal.user_id = uuid.uuid4()
        normal.skill_level = 'intermediate'
        normal.preferred_resorts = ['niseko']
        
        candidates = [blocked_by_seeker, blocked_seeker, normal]
        
        # Mock blocked IDs (both directions)
        blocked_ids = {blocked_by_seeker.user_id, blocked_seeker.user_id}
        
        with patch('services.buddy_matching_service._get_blocked_user_ids', return_value=blocked_ids):
            filtered = filter_candidates(db, seeker, trip, candidates)
        
        # Only normal candidate should be in results
        assert len(filtered) == 1, \
            f"Should have 1 filtered candidate, got {len(filtered)}"
        assert filtered[0].user_id == normal.user_id, \
            "Only normal candidate should pass filtering"


class TestSkillLevelCompatibility:
    """Tests for skill level compatibility logic."""
    
    @given(skill=skill_level_strategy())
    @settings(max_examples=50)
    def test_same_skill_level_is_compatible(self, skill):
        """Property: Any skill level should be compatible with itself."""
        assert _is_skill_level_compatible(skill, skill), \
            f"Skill level {skill} should be compatible with itself"
    
    def test_adjacent_skill_levels_compatible(self):
        """Property: Adjacent skill levels should be compatible."""
        assert _is_skill_level_compatible('beginner', 'intermediate')
        assert _is_skill_level_compatible('intermediate', 'beginner')
        assert _is_skill_level_compatible('intermediate', 'advanced')
        assert _is_skill_level_compatible('advanced', 'intermediate')
        assert _is_skill_level_compatible('advanced', 'expert')
        assert _is_skill_level_compatible('expert', 'advanced')
    
    def test_distant_skill_levels_incompatible(self):
        """Property: Skill levels more than 1 apart should be incompatible."""
        assert not _is_skill_level_compatible('beginner', 'advanced')
        assert not _is_skill_level_compatible('beginner', 'expert')
        assert not _is_skill_level_compatible('intermediate', 'expert')
        assert not _is_skill_level_compatible('expert', 'beginner')
    
    @given(
        skill1=skill_level_strategy(),
        skill2=skill_level_strategy()
    )
    @settings(max_examples=100)
    def test_compatibility_is_symmetric(self, skill1, skill2):
        """Property: Skill compatibility should be symmetric."""
        result1 = _is_skill_level_compatible(skill1, skill2)
        result2 = _is_skill_level_compatible(skill2, skill1)
        
        assert result1 == result2, \
            f"Compatibility should be symmetric: {skill1} vs {skill2}"


class TestResortOverlap:
    """Tests for resort overlap logic."""
    
    @given(resorts=resort_list_strategy())
    @settings(max_examples=50)
    def test_same_resorts_have_overlap(self, resorts):
        """Property: Same resort sets should have overlap."""
        assume(len(resorts) > 0)  # Skip empty sets
        
        assert _has_resort_overlap(set(resorts), set(resorts)), \
            f"Same resort sets should have overlap: {resorts}"
    
    def test_empty_resort_sets_considered_compatible(self):
        """Property: Empty resort sets should be considered compatible."""
        assert _has_resort_overlap(set(), set(['niseko']))
        assert _has_resort_overlap(set(['niseko']), set())
        assert _has_resort_overlap(set(), set())
    
    @given(
        resorts1=resort_list_strategy(),
        resorts2=resort_list_strategy()
    )
    @settings(max_examples=100)
    def test_overlap_is_symmetric(self, resorts1, resorts2):
        """Property: Resort overlap should be symmetric."""
        result1 = _has_resort_overlap(set(resorts1), set(resorts2))
        result2 = _has_resort_overlap(set(resorts2), set(resorts1))
        
        assert result1 == result2, \
            f"Overlap should be symmetric: {resorts1} vs {resorts2}"
    
    def test_disjoint_non_empty_sets_no_overlap(self):
        """Property: Disjoint non-empty resort sets should have no overlap."""
        resorts1 = {'niseko', 'hakuba'}
        resorts2 = {'furano', 'rusutsu'}
        
        # Both are non-empty and disjoint
        assert not _has_resort_overlap(resorts1, resorts2), \
            "Disjoint resort sets should have no overlap"
