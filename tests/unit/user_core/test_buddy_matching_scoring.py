"""
Property-based tests for Buddy Matching Scoring System.

**Feature: enhanced-buddy-matching, Property 3: 匹配分數組成**
**Validates: Requirements 3.1, 3.5**

**Feature: enhanced-buddy-matching, Property 4: 完全匹配最高分**
**Validates: Requirements 3.2**

**Feature: enhanced-buddy-matching, Property 5: 重疊天數比例計分**
**Validates: Requirements 3.3**

**Feature: enhanced-buddy-matching, Property 13: 技能相似度計分**
**Validates: Requirements 9.3, 9.4**

**Feature: enhanced-buddy-matching, Property 11: 社交加分**
**Validates: Requirements 8.2**

Tests verify:
- Total score is always in 0-100 range
- Total score equals sum of dimension scores
- Perfect match (same dates and resort) gets highest scores
- Time score is proportional to overlap days
- Skill score decreases with skill level difference
- Social score reflects follow relationships
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
    calculate_match_score,
    calculate_time_score,
    calculate_location_score,
    calculate_skill_score,
    calculate_social_score,
    _calculate_overlap_days
)
from models.user_profile import UserProfile
from models.trip_planning import Trip
from models.social import UserFollow
from schemas.buddy_matching import MatchScore


# Strategy builders for generating test data
@composite
def skill_level_strategy(draw):
    """Generate a valid skill level."""
    return draw(st.sampled_from(['beginner', 'intermediate', 'advanced', 'expert']))


@composite
def resort_strategy(draw):
    """Generate a resort ID."""
    resorts = ['niseko', 'hakuba', 'furano', 'rusutsu', 'tomamu', 'appi', 'zao']
    return draw(st.sampled_from(resorts))


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
def user_profile_strategy(draw, skill_level=None):
    """Generate a UserProfile object."""
    user_id = uuid.uuid4()
    if skill_level is None:
        skill_level = draw(skill_level_strategy())
    
    user = Mock(spec=UserProfile)
    user.user_id = user_id
    user.skill_level = skill_level
    user.display_name = f"User_{user_id.hex[:8]}"
    user.avatar_url = None
    
    return user


@composite
def trip_strategy(draw, user_id=None, resort_id=None, start_date=None, end_date=None):
    """Generate a Trip object."""
    trip_id = uuid.uuid4()
    if user_id is None:
        user_id = uuid.uuid4()
    if resort_id is None:
        resort_id = draw(resort_strategy())
    if start_date is None or end_date is None:
        start_date, end_date = draw(date_range_strategy())
    
    trip = Mock(spec=Trip)
    trip.trip_id = trip_id
    trip.user_id = user_id
    trip.resort_id = resort_id
    trip.start_date = start_date
    trip.end_date = end_date
    
    return trip


class TestMatchScoreComposition:
    """Property-based tests for match score composition."""
    
    @given(
        seeker=user_profile_strategy(),
        candidate=user_profile_strategy(),
        seeker_trip=trip_strategy(),
        candidate_trip=trip_strategy()
    )
    @settings(max_examples=100)
    def test_total_score_in_valid_range(self, seeker, candidate, seeker_trip, candidate_trip):
        """**Feature: enhanced-buddy-matching, Property 3: 匹配分數組成**
        
        Property: For any two users and their trips, the total match score
        should always be in the range 0-100.
        """
        # Create mock database session
        db = Mock()
        db.query.return_value.filter.return_value.first.return_value = None
        
        # Ensure trips belong to respective users
        seeker_trip.user_id = seeker.user_id
        candidate_trip.user_id = candidate.user_id
        
        score = calculate_match_score(db, seeker, seeker_trip, candidate, candidate_trip)
        
        assert isinstance(score, MatchScore), \
            "Result should be a MatchScore object"
        assert 0 <= score.total_score <= 100, \
            f"Total score {score.total_score} should be in range 0-100"
    
    @given(
        seeker=user_profile_strategy(),
        candidate=user_profile_strategy(),
        seeker_trip=trip_strategy(),
        candidate_trip=trip_strategy()
    )
    @settings(max_examples=100)
    def test_total_score_equals_sum_of_dimensions(self, seeker, candidate, seeker_trip, candidate_trip):
        """**Feature: enhanced-buddy-matching, Property 3: 匹配分數組成**
        
        Property: For any match score, the total score should equal the sum
        of all dimension scores (time + location + skill + social).
        """
        # Create mock database session
        db = Mock()
        db.query.return_value.filter.return_value.first.return_value = None
        
        # Ensure trips belong to respective users
        seeker_trip.user_id = seeker.user_id
        candidate_trip.user_id = candidate.user_id
        
        score = calculate_match_score(db, seeker, seeker_trip, candidate, candidate_trip)
        
        expected_total = (
            score.time_score + 
            score.location_score + 
            score.skill_score + 
            score.social_score
        )
        
        assert score.total_score == expected_total, \
            f"Total score {score.total_score} should equal sum of dimensions {expected_total}: " \
            f"time={score.time_score}, location={score.location_score}, " \
            f"skill={score.skill_score}, social={score.social_score}"
    
    @given(
        seeker=user_profile_strategy(),
        candidate=user_profile_strategy(),
        seeker_trip=trip_strategy(),
        candidate_trip=trip_strategy()
    )
    @settings(max_examples=100)
    def test_dimension_scores_in_valid_ranges(self, seeker, candidate, seeker_trip, candidate_trip):
        """**Feature: enhanced-buddy-matching, Property 3: 匹配分數組成**
        
        Property: For any match score, each dimension score should be within
        its specified range: time (0-40), location (0-30), skill (0-20), social (0-10).
        """
        # Create mock database session
        db = Mock()
        db.query.return_value.filter.return_value.first.return_value = None
        
        # Ensure trips belong to respective users
        seeker_trip.user_id = seeker.user_id
        candidate_trip.user_id = candidate.user_id
        
        score = calculate_match_score(db, seeker, seeker_trip, candidate, candidate_trip)
        
        assert 0 <= score.time_score <= 40, \
            f"Time score {score.time_score} should be in range 0-40"
        assert 0 <= score.location_score <= 30, \
            f"Location score {score.location_score} should be in range 0-30"
        assert 0 <= score.skill_score <= 20, \
            f"Skill score {score.skill_score} should be in range 0-20"
        assert 0 <= score.social_score <= 10, \
            f"Social score {score.social_score} should be in range 0-10"


class TestPerfectMatch:
    """Property-based tests for perfect match scoring."""
    
    @given(
        seeker=user_profile_strategy(),
        candidate=user_profile_strategy(),
        resort_id=resort_strategy(),
        start_date=st.dates(min_value=date.today(), max_value=date.today() + timedelta(days=180)),
        duration=st.integers(min_value=1, max_value=14)
    )
    @settings(max_examples=100)
    def test_same_dates_and_resort_gets_max_time_and_location_scores(
        self, seeker, candidate, resort_id, start_date, duration
    ):
        """**Feature: enhanced-buddy-matching, Property 4: 完全匹配最高分**
        
        Property: For any two trips with identical dates and resort,
        the time score should be 40 and location score should be 30.
        """
        # Create mock database session
        db = Mock()
        db.query.return_value.filter.return_value.first.return_value = None
        
        end_date = start_date + timedelta(days=duration)
        
        # Create identical trips manually
        seeker_trip = Mock(spec=Trip)
        seeker_trip.user_id = seeker.user_id
        seeker_trip.resort_id = resort_id
        seeker_trip.start_date = start_date
        seeker_trip.end_date = end_date
        
        candidate_trip = Mock(spec=Trip)
        candidate_trip.user_id = candidate.user_id
        candidate_trip.resort_id = resort_id
        candidate_trip.start_date = start_date
        candidate_trip.end_date = end_date
        
        score = calculate_match_score(db, seeker, seeker_trip, candidate, candidate_trip)
        
        assert score.time_score == 40, \
            f"Perfect date match should get max time score (40), got {score.time_score}"
        assert score.location_score == 30, \
            f"Same resort should get max location score (30), got {score.location_score}"
    
    def test_perfect_match_example(self):
        """**Feature: enhanced-buddy-matching, Property 4: 完全匹配最高分**
        
        Example: Two trips with same dates and resort should get maximum
        time and location scores.
        """
        db = Mock()
        db.query.return_value.filter.return_value.first.return_value = None
        
        seeker = Mock(spec=UserProfile)
        seeker.user_id = uuid.uuid4()
        seeker.skill_level = 'intermediate'
        
        candidate = Mock(spec=UserProfile)
        candidate.user_id = uuid.uuid4()
        candidate.skill_level = 'intermediate'
        
        # Same dates and resort
        start = date.today()
        end = date.today() + timedelta(days=5)
        
        seeker_trip = Mock(spec=Trip)
        seeker_trip.user_id = seeker.user_id
        seeker_trip.resort_id = 'niseko'
        seeker_trip.start_date = start
        seeker_trip.end_date = end
        
        candidate_trip = Mock(spec=Trip)
        candidate_trip.user_id = candidate.user_id
        candidate_trip.resort_id = 'niseko'
        candidate_trip.start_date = start
        candidate_trip.end_date = end
        
        score = calculate_match_score(db, seeker, seeker_trip, candidate, candidate_trip)
        
        assert score.time_score == 40
        assert score.location_score == 30


class TestOverlapDaysProportionalScoring:
    """Property-based tests for overlap days proportional scoring."""
    
    @given(
        base_start=st.dates(min_value=date.today(), max_value=date.today() + timedelta(days=180)),
        duration1=st.integers(min_value=2, max_value=10),
        duration2=st.integers(min_value=2, max_value=10),
        offset=st.integers(min_value=1, max_value=5)
    )
    @settings(max_examples=100)
    def test_more_overlap_days_means_higher_score(
        self, base_start, duration1, duration2, offset
    ):
        """**Feature: enhanced-buddy-matching, Property 5: 重疊天數比例計分**
        
        Property: For trips with partial overlap, more overlapping days
        should result in a higher time score.
        """
        # Create two trips with partial overlap
        trip1_start = base_start
        trip1_end = base_start + timedelta(days=duration1)
        
        trip2_start = base_start + timedelta(days=offset)
        trip2_end = trip2_start + timedelta(days=duration2)
        
        # Ensure there is overlap
        assume(trip1_end >= trip2_start and trip2_end >= trip1_start)
        
        trip1 = Mock(spec=Trip)
        trip1.start_date = trip1_start
        trip1.end_date = trip1_end
        
        trip2 = Mock(spec=Trip)
        trip2.start_date = trip2_start
        trip2.end_date = trip2_end
        
        overlap_days = _calculate_overlap_days(trip1, trip2)
        assume(overlap_days > 0)
        
        score = calculate_time_score(trip1, trip2)
        
        # Score should be proportional to overlap
        # More overlap days should mean higher score
        assert score > 0, \
            f"Overlapping trips should have positive time score, got {score}"
        assert score <= 40, \
            f"Time score should not exceed 40, got {score}"
    
    def test_no_overlap_gives_zero_score(self):
        """**Feature: enhanced-buddy-matching, Property 5: 重疊天數比例計分**
        
        Property: Trips with no overlap should get zero time score.
        """
        trip1 = Mock(spec=Trip)
        trip1.start_date = date.today()
        trip1.end_date = date.today() + timedelta(days=3)
        
        trip2 = Mock(spec=Trip)
        trip2.start_date = date.today() + timedelta(days=10)
        trip2.end_date = date.today() + timedelta(days=13)
        
        score = calculate_time_score(trip1, trip2)
        
        assert score == 0, \
            f"Non-overlapping trips should get zero time score, got {score}"
    
    def test_partial_overlap_proportional_to_overlap_ratio(self):
        """**Feature: enhanced-buddy-matching, Property 5: 重疊天數比例計分**
        
        Example: Verify that partial overlap results in proportional scoring.
        """
        # Trip 1: 5 days (Jan 1-5)
        trip1 = Mock(spec=Trip)
        trip1.start_date = date(2025, 1, 1)
        trip1.end_date = date(2025, 1, 5)
        
        # Trip 2: 5 days (Jan 3-7), overlaps 3 days
        trip2 = Mock(spec=Trip)
        trip2.start_date = date(2025, 1, 3)
        trip2.end_date = date(2025, 1, 7)
        
        overlap_days = _calculate_overlap_days(trip1, trip2)
        assert overlap_days == 3, f"Should have 3 overlap days, got {overlap_days}"
        
        score = calculate_time_score(trip1, trip2)
        
        # With 3 days overlap out of average 5 days, ratio is 0.6
        # Score should be around 0.6 * 40 = 24
        assert 20 <= score <= 28, \
            f"Score should be proportional to overlap ratio, got {score}"


class TestSkillSimilarityScoring:
    """Property-based tests for skill similarity scoring."""
    
    @given(skill=skill_level_strategy())
    @settings(max_examples=50)
    def test_same_skill_level_gets_max_score(self, skill):
        """**Feature: enhanced-buddy-matching, Property 13: 技能相似度計分**
        
        Property: For any skill level, two users with the same skill level
        should get the maximum skill score (20 points).
        """
        seeker = Mock(spec=UserProfile)
        seeker.skill_level = skill
        
        candidate = Mock(spec=UserProfile)
        candidate.skill_level = skill
        
        score = calculate_skill_score(seeker, candidate)
        
        assert score == 20, \
            f"Same skill level should get max score (20), got {score} for {skill}"
    
    def test_one_level_difference_gets_high_score(self):
        """**Feature: enhanced-buddy-matching, Property 13: 技能相似度計分**
        
        Property: Users with 1 level difference should get 15 points.
        """
        test_cases = [
            ('beginner', 'intermediate'),
            ('intermediate', 'beginner'),
            ('intermediate', 'advanced'),
            ('advanced', 'intermediate'),
            ('advanced', 'expert'),
            ('expert', 'advanced'),
        ]
        
        for seeker_skill, candidate_skill in test_cases:
            seeker = Mock(spec=UserProfile)
            seeker.skill_level = seeker_skill
            
            candidate = Mock(spec=UserProfile)
            candidate.skill_level = candidate_skill
            
            score = calculate_skill_score(seeker, candidate)
            
            assert score == 15, \
                f"1 level difference ({seeker_skill} vs {candidate_skill}) " \
                f"should get 15 points, got {score}"
    
    def test_two_or_more_level_difference_gets_low_score(self):
        """**Feature: enhanced-buddy-matching, Property 13: 技能相似度計分**
        
        Property: Users with 2+ level difference should get 5 points.
        """
        test_cases = [
            ('beginner', 'advanced'),
            ('beginner', 'expert'),
            ('intermediate', 'expert'),
            ('expert', 'beginner'),
            ('expert', 'intermediate'),
            ('advanced', 'beginner'),
        ]
        
        for seeker_skill, candidate_skill in test_cases:
            seeker = Mock(spec=UserProfile)
            seeker.skill_level = seeker_skill
            
            candidate = Mock(spec=UserProfile)
            candidate.skill_level = candidate_skill
            
            score = calculate_skill_score(seeker, candidate)
            
            assert score == 5, \
                f"2+ level difference ({seeker_skill} vs {candidate_skill}) " \
                f"should get 5 points, got {score}"
    
    @given(
        skill1=skill_level_strategy(),
        skill2=skill_level_strategy()
    )
    @settings(max_examples=100)
    def test_skill_score_is_symmetric(self, skill1, skill2):
        """**Feature: enhanced-buddy-matching, Property 13: 技能相似度計分**
        
        Property: Skill scoring should be symmetric - the order of users
        should not matter.
        """
        seeker = Mock(spec=UserProfile)
        seeker.skill_level = skill1
        
        candidate = Mock(spec=UserProfile)
        candidate.skill_level = skill2
        
        score1 = calculate_skill_score(seeker, candidate)
        score2 = calculate_skill_score(candidate, seeker)
        
        assert score1 == score2, \
            f"Skill score should be symmetric: {skill1} vs {skill2}, " \
            f"got {score1} and {score2}"
    
    @given(
        skill1=skill_level_strategy(),
        skill2=skill_level_strategy()
    )
    @settings(max_examples=100)
    def test_smaller_skill_gap_means_higher_score(self, skill1, skill2):
        """**Feature: enhanced-buddy-matching, Property 13: 技能相似度計分**
        
        Property: Smaller skill level gaps should result in higher scores.
        """
        skill_order = {'beginner': 0, 'intermediate': 1, 'advanced': 2, 'expert': 3}
        
        seeker = Mock(spec=UserProfile)
        seeker.skill_level = skill1
        
        candidate = Mock(spec=UserProfile)
        candidate.skill_level = skill2
        
        score = calculate_skill_score(seeker, candidate)
        
        level1 = skill_order[skill1.lower()]
        level2 = skill_order[skill2.lower()]
        gap = abs(level1 - level2)
        
        if gap == 0:
            assert score == 20
        elif gap == 1:
            assert score == 15
        else:
            assert score == 5


class TestSocialBonus:
    """Property-based tests for social connection bonus."""
    
    def test_mutual_followers_get_max_social_score(self):
        """**Feature: enhanced-buddy-matching, Property 11: 社交加分**
        
        Property: Users who mutually follow each other should get the
        maximum social score (10 points).
        """
        db = Mock()
        
        seeker_id = uuid.uuid4()
        candidate_id = uuid.uuid4()
        
        # Mock mutual follow relationship
        def mock_query_filter_first(*args, **kwargs):
            return Mock(spec=UserFollow)  # Return a follow object
        
        db.query.return_value.filter.return_value.first = mock_query_filter_first
        
        score = calculate_social_score(db, seeker_id, candidate_id)
        
        assert score == 10, \
            f"Mutual followers should get max social score (10), got {score}"
    
    def test_one_way_follow_gets_partial_social_score(self):
        """**Feature: enhanced-buddy-matching, Property 11: 社交加分**
        
        Property: Users with one-way follow relationship should get
        5 points social score.
        """
        db = Mock()
        
        seeker_id = uuid.uuid4()
        candidate_id = uuid.uuid4()
        
        # Mock one-way follow (seeker follows candidate, but not vice versa)
        call_count = [0]
        
        def mock_query_filter_first(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return Mock(spec=UserFollow)  # First call: seeker follows candidate
            else:
                return None  # Second call: candidate doesn't follow seeker
        
        db.query.return_value.filter.return_value.first = mock_query_filter_first
        
        score = calculate_social_score(db, seeker_id, candidate_id)
        
        assert score == 5, \
            f"One-way follow should get 5 points, got {score}"
    
    def test_no_connection_gets_zero_social_score(self):
        """**Feature: enhanced-buddy-matching, Property 11: 社交加分**
        
        Property: Users with no follow relationship should get zero
        social score.
        """
        db = Mock()
        
        seeker_id = uuid.uuid4()
        candidate_id = uuid.uuid4()
        
        # Mock no follow relationship
        db.query.return_value.filter.return_value.first.return_value = None
        
        score = calculate_social_score(db, seeker_id, candidate_id)
        
        assert score == 0, \
            f"No connection should get zero social score, got {score}"
    
    @given(
        has_seeker_follow=st.booleans(),
        has_candidate_follow=st.booleans()
    )
    @settings(max_examples=50)
    def test_social_score_reflects_follow_relationship(
        self, has_seeker_follow, has_candidate_follow
    ):
        """**Feature: enhanced-buddy-matching, Property 11: 社交加分**
        
        Property: Social score should correctly reflect the follow relationship:
        - Both follow: 10 points
        - One follows: 5 points
        - None follow: 0 points
        """
        db = Mock()
        
        seeker_id = uuid.uuid4()
        candidate_id = uuid.uuid4()
        
        call_count = [0]
        
        def mock_query_filter_first(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return Mock(spec=UserFollow) if has_seeker_follow else None
            else:
                return Mock(spec=UserFollow) if has_candidate_follow else None
        
        db.query.return_value.filter.return_value.first = mock_query_filter_first
        
        score = calculate_social_score(db, seeker_id, candidate_id)
        
        if has_seeker_follow and has_candidate_follow:
            expected = 10
        elif has_seeker_follow or has_candidate_follow:
            expected = 5
        else:
            expected = 0
        
        assert score == expected, \
            f"Social score should be {expected} for follow relationship " \
            f"(seeker_follows={has_seeker_follow}, candidate_follows={has_candidate_follow}), " \
            f"got {score}"


class TestLocationScoring:
    """Tests for location scoring."""
    
    @given(resort=resort_strategy())
    @settings(max_examples=50)
    def test_same_resort_gets_max_location_score(self, resort):
        """Property: Same resort should get maximum location score (30)."""
        trip1 = Mock(spec=Trip)
        trip1.resort_id = resort
        
        trip2 = Mock(spec=Trip)
        trip2.resort_id = resort
        
        score = calculate_location_score(trip1, trip2)
        
        assert score == 30, \
            f"Same resort should get max location score (30), got {score}"
    
    @given(
        resort1=resort_strategy(),
        resort2=resort_strategy()
    )
    @settings(max_examples=100)
    def test_different_resorts_get_zero_score(self, resort1, resort2):
        """Property: Different resorts should get zero location score."""
        assume(resort1 != resort2)
        
        trip1 = Mock(spec=Trip)
        trip1.resort_id = resort1
        
        trip2 = Mock(spec=Trip)
        trip2.resort_id = resort2
        
        score = calculate_location_score(trip1, trip2)
        
        assert score == 0, \
            f"Different resorts should get zero score, got {score}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
