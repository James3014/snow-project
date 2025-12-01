"""
Property-based tests for Learning Focus Tracker.

**Feature: enhanced-buddy-matching, Property 16: 學習焦點相似度加分**
**Validates: Requirements 11.2**

Tests verify:
- Users with same learning focus receive similarity bonus
- Learning focus identification accuracy
"""
import pytest
from hypothesis import given, strategies as st, assume, settings
from hypothesis.strategies import composite
import uuid
from datetime import datetime, UTC

# Import the service
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "platform" / "user_core"))

from services.learning_focus_tracker import LearningFocusTracker
from schemas.buddy_matching import LearningFocus


# Strategy builders for generating test data
@composite
def casi_skill_strategy(draw):
    """Generate a valid CASI skill name."""
    skills = [
        "stance_balance",
        "rotation",
        "edging",
        "pressure",
        "timing_coordination"
    ]
    return draw(st.sampled_from(skills))


@composite
def skill_trend_strategy(draw):
    """Generate a valid skill trend."""
    trends = ["improving", "stable", "declining"]
    return draw(st.sampled_from(trends))


@composite
def learning_focus_strategy(draw):
    """Generate a valid LearningFocus object."""
    user_id = uuid.uuid4()
    primary_skill = draw(casi_skill_strategy())
    
    # Generate 0-10 recent lesson IDs
    num_lessons = draw(st.integers(min_value=0, max_value=10))
    recent_lessons = [f"lesson_{i}" for i in range(num_lessons)]
    
    # Generate skill trends for all CASI skills
    skills = [
        "stance_balance",
        "rotation",
        "edging",
        "pressure",
        "timing_coordination"
    ]
    skill_trend = {
        skill: draw(skill_trend_strategy())
        for skill in skills
    }
    
    # Generate focus strength
    focus_strength = draw(st.floats(min_value=0.0, max_value=1.0))
    
    return LearningFocus(
        user_id=user_id,
        primary_skill=primary_skill,
        recent_lessons=recent_lessons,
        skill_trend=skill_trend,
        focus_strength=focus_strength
    )


class TestLearningFocusSimilarity:
    """Property-based tests for learning focus similarity calculation."""
    
    @given(focus=learning_focus_strategy())
    @settings(max_examples=100)
    def test_similarity_with_self_is_one(self, focus):
        """**Feature: enhanced-buddy-matching, Property 16: 學習焦點相似度加分**
        
        Property: For any learning focus, similarity with itself should be 1.0
        (or very close due to floating point precision).
        """
        tracker = LearningFocusTracker()
        similarity = tracker.calculate_focus_similarity(focus, focus)
        
        # Should be 1.0 or very close (allowing for floating point precision)
        assert 0.99 <= similarity <= 1.0, \
            f"Self-similarity should be ~1.0, got {similarity}"
    
    @given(focus_a=learning_focus_strategy(), focus_b=learning_focus_strategy())
    @settings(max_examples=100)
    def test_similarity_is_symmetric(self, focus_a, focus_b):
        """**Feature: enhanced-buddy-matching, Property 16: 學習焦點相似度加分**
        
        Property: For any two learning focuses, similarity(A, B) == similarity(B, A).
        """
        tracker = LearningFocusTracker()
        
        similarity_ab = tracker.calculate_focus_similarity(focus_a, focus_b)
        similarity_ba = tracker.calculate_focus_similarity(focus_b, focus_a)
        
        assert abs(similarity_ab - similarity_ba) < 0.0001, \
            f"Similarity should be symmetric: {similarity_ab} != {similarity_ba}"
    
    @given(focus_a=learning_focus_strategy(), focus_b=learning_focus_strategy())
    @settings(max_examples=100)
    def test_similarity_in_valid_range(self, focus_a, focus_b):
        """**Feature: enhanced-buddy-matching, Property 16: 學習焦點相似度加分**
        
        Property: For any two learning focuses, similarity should be between 0.0 and 1.0.
        """
        tracker = LearningFocusTracker()
        similarity = tracker.calculate_focus_similarity(focus_a, focus_b)
        
        assert 0.0 <= similarity <= 1.0, \
            f"Similarity must be in [0, 1], got {similarity}"
    
    @given(primary_skill=casi_skill_strategy())
    @settings(max_examples=50)
    def test_same_primary_skill_increases_similarity(self, primary_skill):
        """**Feature: enhanced-buddy-matching, Property 16: 學習焦點相似度加分**
        
        Property: Users with the same primary skill should have higher similarity
        than users with different primary skills (all else being equal).
        """
        tracker = LearningFocusTracker()
        
        # Create two focuses with same primary skill
        focus_same = LearningFocus(
            user_id=uuid.uuid4(),
            primary_skill=primary_skill,
            recent_lessons=[],
            skill_trend={skill: "stable" for skill in tracker.CASI_SKILLS},
            focus_strength=0.5
        )
        
        # Create focus with different primary skill
        other_skills = [s for s in tracker.CASI_SKILLS if s != primary_skill]
        assume(len(other_skills) > 0)  # Ensure we have a different skill
        
        focus_different = LearningFocus(
            user_id=uuid.uuid4(),
            primary_skill=other_skills[0],
            recent_lessons=[],
            skill_trend={skill: "stable" for skill in tracker.CASI_SKILLS},
            focus_strength=0.5
        )
        
        similarity_same = tracker.calculate_focus_similarity(focus_same, focus_same)
        similarity_different = tracker.calculate_focus_similarity(focus_same, focus_different)
        
        # Same primary skill should give higher similarity
        # (at least 0.4 from primary skill match + 0.3 from trend similarity)
        assert similarity_same >= similarity_different, \
            f"Same primary skill should have higher similarity: {similarity_same} < {similarity_different}"
    
    @given(
        lessons=st.lists(st.text(min_size=1, max_size=20), min_size=1, max_size=10, unique=True)
    )
    @settings(max_examples=50)
    def test_overlapping_lessons_increases_similarity(self, lessons):
        """**Feature: enhanced-buddy-matching, Property 16: 學習焦點相似度加分**
        
        Property: Users with overlapping recent lessons should have higher similarity
        than users with completely different lessons.
        """
        tracker = LearningFocusTracker()
        
        # Ensure we have at least 2 lessons to split
        assume(len(lessons) >= 2)
        
        # Split lessons into two groups with some overlap
        mid = len(lessons) // 2
        lessons_a = lessons[:mid + 1]  # First half + 1
        lessons_b = lessons[mid:]      # Second half (overlap at mid)
        lessons_c = [f"different_{i}" for i in range(len(lessons))]  # Completely different
        
        focus_a = LearningFocus(
            user_id=uuid.uuid4(),
            primary_skill="stance_balance",
            recent_lessons=lessons_a,
            skill_trend={skill: "stable" for skill in tracker.CASI_SKILLS},
            focus_strength=0.5
        )
        
        focus_b = LearningFocus(
            user_id=uuid.uuid4(),
            primary_skill="stance_balance",
            recent_lessons=lessons_b,
            skill_trend={skill: "stable" for skill in tracker.CASI_SKILLS},
            focus_strength=0.5
        )
        
        focus_c = LearningFocus(
            user_id=uuid.uuid4(),
            primary_skill="stance_balance",
            recent_lessons=lessons_c,
            skill_trend={skill: "stable" for skill in tracker.CASI_SKILLS},
            focus_strength=0.5
        )
        
        similarity_overlap = tracker.calculate_focus_similarity(focus_a, focus_b)
        similarity_no_overlap = tracker.calculate_focus_similarity(focus_a, focus_c)
        
        # Overlapping lessons should give higher similarity
        assert similarity_overlap >= similarity_no_overlap, \
            f"Overlapping lessons should increase similarity: {similarity_overlap} < {similarity_no_overlap}"
    
    @given(trend=skill_trend_strategy())
    @settings(max_examples=50)
    def test_same_skill_trends_increases_similarity(self, trend):
        """**Feature: enhanced-buddy-matching, Property 16: 學習焦點相似度加分**
        
        Property: Users with the same skill trends should have higher similarity
        than users with different trends.
        """
        tracker = LearningFocusTracker()
        
        # Create two focuses with same trends
        same_trend = {skill: trend for skill in tracker.CASI_SKILLS}
        
        # Create different trends
        other_trends = ["improving", "stable", "declining"]
        other_trends.remove(trend)
        different_trend = {skill: other_trends[0] for skill in tracker.CASI_SKILLS}
        
        focus_same = LearningFocus(
            user_id=uuid.uuid4(),
            primary_skill="stance_balance",
            recent_lessons=[],
            skill_trend=same_trend,
            focus_strength=0.5
        )
        
        focus_different = LearningFocus(
            user_id=uuid.uuid4(),
            primary_skill="stance_balance",
            recent_lessons=[],
            skill_trend=different_trend,
            focus_strength=0.5
        )
        
        similarity_same = tracker.calculate_focus_similarity(focus_same, focus_same)
        similarity_different = tracker.calculate_focus_similarity(focus_same, focus_different)
        
        # Same trends should give higher similarity
        assert similarity_same >= similarity_different, \
            f"Same trends should increase similarity: {similarity_same} < {similarity_different}"
    
    @given(focus_a=learning_focus_strategy(), focus_b=learning_focus_strategy())
    @settings(max_examples=100)
    def test_similarity_components_sum_correctly(self, focus_a, focus_b):
        """**Feature: enhanced-buddy-matching, Property 16: 學習焦點相似度加分**
        
        Property: The similarity score should be composed of weighted components
        that sum to at most 1.0 (primary skill 40%, lessons 30%, trends 30%).
        """
        tracker = LearningFocusTracker()
        similarity = tracker.calculate_focus_similarity(focus_a, focus_b)
        
        # Calculate expected maximum contribution from each component
        # Primary skill: 0.4 if same, 0.0 if different
        primary_contribution = 0.4 if focus_a.primary_skill == focus_b.primary_skill else 0.0
        
        # Lessons: up to 0.3 (100% overlap)
        lessons_a = set(focus_a.recent_lessons)
        lessons_b = set(focus_b.recent_lessons)
        if lessons_a and lessons_b:
            overlap = len(lessons_a & lessons_b)
            union = len(lessons_a | lessons_b)
            lesson_contribution = 0.3 * (overlap / union if union > 0 else 0.0)
        else:
            lesson_contribution = 0.0
        
        # Trends: up to 0.3 (100% matching trends)
        common_skills = set(focus_a.skill_trend.keys()) & set(focus_b.skill_trend.keys())
        if common_skills:
            matching_trends = sum(
                1 for skill in common_skills
                if focus_a.skill_trend[skill] == focus_b.skill_trend[skill]
            )
            trend_contribution = 0.3 * (matching_trends / len(common_skills))
        else:
            trend_contribution = 0.0
        
        expected_similarity = primary_contribution + lesson_contribution + trend_contribution
        
        # Allow small floating point differences
        assert abs(similarity - expected_similarity) < 0.01, \
            f"Similarity {similarity} doesn't match expected {expected_similarity}"


class TestFocusStrengthCalculation:
    """Tests for focus strength calculation."""
    
    @given(
        skill_focus=st.dictionaries(
            casi_skill_strategy(),
            st.floats(min_value=0.0, max_value=1.0),
            min_size=1,
            max_size=5
        ),
        practice_count=st.integers(min_value=0, max_value=20)
    )
    @settings(max_examples=100)
    def test_focus_strength_in_valid_range(self, skill_focus, practice_count):
        """Property: Focus strength should always be between 0.0 and 1.0."""
        tracker = LearningFocusTracker()
        strength = tracker._calculate_focus_strength(skill_focus, practice_count)
        
        assert 0.0 <= strength <= 1.0, \
            f"Focus strength must be in [0, 1], got {strength}"
    
    @given(practice_count=st.integers(min_value=0, max_value=20))
    @settings(max_examples=50)
    def test_empty_focus_gives_zero_strength(self, practice_count):
        """Property: Empty skill focus should give zero strength."""
        tracker = LearningFocusTracker()
        strength = tracker._calculate_focus_strength({}, practice_count)
        
        assert strength == 0.0, \
            f"Empty focus should have zero strength, got {strength}"
    
    @given(
        max_focus=st.floats(min_value=0.5, max_value=1.0),
        practice_count=st.integers(min_value=5, max_value=20)
    )
    @settings(max_examples=50)
    def test_concentrated_focus_gives_higher_strength(self, max_focus, practice_count):
        """Property: More concentrated focus (one dominant skill) should give higher strength."""
        tracker = LearningFocusTracker()
        
        # Concentrated focus: one skill dominates
        concentrated = {
            "stance_balance": max_focus,
            "rotation": 0.1,
            "edging": 0.1,
            "pressure": 0.1,
            "timing_coordination": 0.1
        }
        
        # Distributed focus: all skills equal
        distributed = {
            "stance_balance": 0.2,
            "rotation": 0.2,
            "edging": 0.2,
            "pressure": 0.2,
            "timing_coordination": 0.2
        }
        
        strength_concentrated = tracker._calculate_focus_strength(concentrated, practice_count)
        strength_distributed = tracker._calculate_focus_strength(distributed, practice_count)
        
        # Concentrated focus should have higher strength
        assert strength_concentrated >= strength_distributed, \
            f"Concentrated focus should have higher strength: {strength_concentrated} < {strength_distributed}"
    
    @given(
        skill_focus=st.dictionaries(
            casi_skill_strategy(),
            st.floats(min_value=0.3, max_value=1.0),
            min_size=1,
            max_size=5
        )
    )
    @settings(max_examples=50)
    def test_more_practice_increases_strength(self, skill_focus):
        """Property: More practice should increase focus strength (up to a limit)."""
        tracker = LearningFocusTracker()
        
        strength_low = tracker._calculate_focus_strength(skill_focus, 1)
        strength_high = tracker._calculate_focus_strength(skill_focus, 10)
        
        # More practice should give higher or equal strength
        assert strength_high >= strength_low, \
            f"More practice should increase strength: {strength_high} < {strength_low}"


class TestTrendSimilarity:
    """Tests for skill trend similarity calculation."""
    
    @given(trend=skill_trend_strategy())
    @settings(max_examples=50)
    def test_identical_trends_give_perfect_similarity(self, trend):
        """Property: Identical skill trends should give similarity of 1.0."""
        tracker = LearningFocusTracker()
        
        trends = {skill: trend for skill in tracker.CASI_SKILLS}
        
        similarity = tracker._calculate_trend_similarity(trends, trends)
        
        assert similarity == 1.0, \
            f"Identical trends should have similarity 1.0, got {similarity}"
    
    @given(
        trend_a=skill_trend_strategy(),
        trend_b=skill_trend_strategy()
    )
    @settings(max_examples=100)
    def test_trend_similarity_in_valid_range(self, trend_a, trend_b):
        """Property: Trend similarity should be between 0.0 and 1.0."""
        tracker = LearningFocusTracker()
        
        trends_a = {skill: trend_a for skill in tracker.CASI_SKILLS}
        trends_b = {skill: trend_b for skill in tracker.CASI_SKILLS}
        
        similarity = tracker._calculate_trend_similarity(trends_a, trends_b)
        
        assert 0.0 <= similarity <= 1.0, \
            f"Trend similarity must be in [0, 1], got {similarity}"
    
    def test_empty_trends_give_zero_similarity(self):
        """Property: Empty trend dictionaries should give zero similarity."""
        tracker = LearningFocusTracker()
        
        similarity = tracker._calculate_trend_similarity({}, {})
        
        assert similarity == 0.0, \
            f"Empty trends should have zero similarity, got {similarity}"
    
    @given(trend=skill_trend_strategy())
    @settings(max_examples=50)
    def test_completely_different_trends_give_low_similarity(self, trend):
        """Property: Completely different trends should give low similarity."""
        tracker = LearningFocusTracker()
        
        # Get two different trends
        other_trends = ["improving", "stable", "declining"]
        other_trends.remove(trend)
        
        trends_a = {skill: trend for skill in tracker.CASI_SKILLS}
        trends_b = {skill: other_trends[0] for skill in tracker.CASI_SKILLS}
        
        similarity = tracker._calculate_trend_similarity(trends_a, trends_b)
        
        # Should be 0.0 since no trends match
        assert similarity == 0.0, \
            f"Completely different trends should have zero similarity, got {similarity}"
