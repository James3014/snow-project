"""
Property-based tests for CASI Skill Analyzer.

**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
**Validates: Requirements 10.1**

**Feature: enhanced-buddy-matching, Property 15: CASI 技能相似度加分**
**Validates: Requirements 10.3**

Tests verify:
- Skill values are always in [0.0, 1.0] range
- Skill inference from events is consistent
- Skill similarity calculation is symmetric
- Identical profiles have similarity 1.0
"""
import pytest
from hypothesis import given, strategies as st, assume, settings
from hypothesis.strategies import composite
import uuid
from datetime import datetime, UTC
from unittest.mock import Mock, MagicMock

# Import the service
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "platform" / "user_core"))

from services.casi_skill_analyzer import CASISkillAnalyzer
from schemas.buddy_matching import CASISkillProfile
from schemas.behavior_event import BehaviorEvent


# Strategy builders for generating test data
@composite
def casi_skill_value_strategy(draw):
    """Generate a valid CASI skill value (0.0-1.0)."""
    return draw(st.floats(min_value=0.0, max_value=1.0))


@composite
def casi_skill_profile_strategy(draw):
    """Generate a valid CASISkillProfile object."""
    user_id = uuid.uuid4()
    
    return CASISkillProfile(
        user_id=user_id,
        stance_balance=draw(casi_skill_value_strategy()),
        rotation=draw(casi_skill_value_strategy()),
        edging=draw(casi_skill_value_strategy()),
        pressure=draw(casi_skill_value_strategy()),
        timing_coordination=draw(casi_skill_value_strategy()),
        updated_at=datetime.now(UTC)
    )


@composite
def behavior_event_strategy(draw):
    """Generate a valid practice BehaviorEvent."""
    event_types = ["lesson_completed", "practice_session", "drill_completed"]
    lesson_ids = ["basic_stance", "falling_leaf", "j_turn", "linked_turns", 
                  "carving", "switch_riding", "unknown_lesson"]
    
    event_id = uuid.uuid4()
    user_id = uuid.uuid4()
    event_type = draw(st.sampled_from(event_types))
    lesson_id = draw(st.sampled_from(lesson_ids))
    
    # Generate rating (0-5 scale)
    rating = draw(st.floats(min_value=0.0, max_value=5.0))
    
    payload = {
        "lesson_id": lesson_id,
        "rating": rating,
    }
    
    return BehaviorEvent(
        event_id=event_id,
        user_id=user_id,
        source_project="單板教學",
        event_type=event_type,
        payload=payload,
        version=1,
        occurred_at=datetime.now(UTC),
        recorded_at=datetime.now(UTC)
    )


class TestCASISkillInference:
    """Property-based tests for CASI skill inference from events."""
    
    @given(events=st.lists(behavior_event_strategy(), min_size=0, max_size=50))
    @settings(max_examples=100)
    def test_skill_values_always_in_valid_range(self, events):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: For any set of practice events, inferred skill values
        should always be in the range [0.0, 1.0].
        """
        analyzer = CASISkillAnalyzer()
        
        # Compute skill scores from events
        skill_scores = analyzer._compute_skill_scores_from_events(events)
        
        # Verify all scores are in valid range
        for skill, score in skill_scores.items():
            assert 0.0 <= score <= 1.0, \
                f"Skill {skill} has invalid score {score}, must be in [0.0, 1.0]"
    
    @given(events=st.lists(behavior_event_strategy(), min_size=1, max_size=50))
    @settings(max_examples=100)
    def test_all_casi_skills_have_scores(self, events):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: For any set of events, all five CASI skills should have scores.
        """
        analyzer = CASISkillAnalyzer()
        
        skill_scores = analyzer._compute_skill_scores_from_events(events)
        
        # Verify all CASI skills are present
        expected_skills = set(analyzer.CASI_SKILLS)
        actual_skills = set(skill_scores.keys())
        
        assert expected_skills == actual_skills, \
            f"Missing skills: {expected_skills - actual_skills}"
    
    @given(rating=st.floats(min_value=0.0, max_value=5.0))
    @settings(max_examples=50)
    def test_higher_ratings_give_higher_scores(self, rating):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: Events with higher ratings should result in higher skill scores
        (for the same lesson).
        """
        analyzer = CASISkillAnalyzer()
        
        # Create event with low rating
        event_low = BehaviorEvent(
            event_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            source_project="單板教學",
            event_type="lesson_completed",
            payload={"lesson_id": "basic_stance", "rating": 1.0},
            version=1,
            occurred_at=datetime.now(UTC),
            recorded_at=datetime.now(UTC)
        )
        
        # Create event with high rating
        event_high = BehaviorEvent(
            event_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            source_project="單板教學",
            event_type="lesson_completed",
            payload={"lesson_id": "basic_stance", "rating": 5.0},
            version=1,
            occurred_at=datetime.now(UTC),
            recorded_at=datetime.now(UTC)
        )
        
        scores_low = analyzer._compute_skill_scores_from_events([event_low])
        scores_high = analyzer._compute_skill_scores_from_events([event_high])
        
        # For the primary skill of this lesson (stance_balance), high rating should give higher score
        assert scores_high["stance_balance"] >= scores_low["stance_balance"], \
            f"Higher rating should give higher score: {scores_high['stance_balance']} < {scores_low['stance_balance']}"
    
    @given(events=st.lists(behavior_event_strategy(), min_size=1, max_size=20))
    @settings(max_examples=50)
    def test_more_events_same_lesson_increases_confidence(self, events):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: Multiple events for the same lesson should result in
        averaged skill scores (not just the last event).
        """
        analyzer = CASISkillAnalyzer()
        
        # Ensure all events are for the same lesson
        lesson_id = "basic_stance"
        for event in events:
            event.payload["lesson_id"] = lesson_id
            event.payload["rating"] = 3.0  # Same rating
        
        skill_scores = analyzer._compute_skill_scores_from_events(events)
        
        # The score should be based on the average (which is 3.0/5.0 = 0.6)
        # For basic_stance, stance_balance has weight 1.0
        expected_score = 0.6  # 3.0/5.0 normalized rating
        
        # Allow small floating point differences
        assert abs(skill_scores["stance_balance"] - expected_score) < 0.01, \
            f"Expected score ~{expected_score}, got {skill_scores['stance_balance']}"
    
    def test_empty_events_give_zero_scores(self):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: With no events, all skill scores should be 0.0.
        """
        analyzer = CASISkillAnalyzer()
        
        skill_scores = analyzer._compute_skill_scores_from_events([])
        
        for skill, score in skill_scores.items():
            assert score == 0.0, \
                f"Skill {skill} should have score 0.0 with no events, got {score}"
    
    @given(events=st.lists(behavior_event_strategy(), min_size=1, max_size=50))
    @settings(max_examples=50)
    def test_events_without_lesson_id_are_ignored(self, events):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: Events without lesson_id should be ignored in skill computation.
        """
        analyzer = CASISkillAnalyzer()
        
        # Remove lesson_id from all events
        for event in events:
            event.payload.pop("lesson_id", None)
            event.payload.pop("drill_id", None)
        
        skill_scores = analyzer._compute_skill_scores_from_events(events)
        
        # All scores should be 0.0 since no valid events
        for skill, score in skill_scores.items():
            assert score == 0.0, \
                f"Skill {skill} should have score 0.0 when no lesson_id, got {score}"
    
    @given(rating=st.floats(min_value=-10.0, max_value=10.0))
    @settings(max_examples=50)
    def test_out_of_range_ratings_are_clamped(self, rating):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: Ratings outside [0, 5] range should be clamped to valid range.
        """
        analyzer = CASISkillAnalyzer()
        
        event = BehaviorEvent(
            event_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            source_project="單板教學",
            event_type="lesson_completed",
            payload={"lesson_id": "basic_stance", "rating": rating},
            version=1,
            occurred_at=datetime.now(UTC),
            recorded_at=datetime.now(UTC)
        )
        
        skill_scores = analyzer._compute_skill_scores_from_events([event])
        
        # All scores should still be in valid range
        for skill, score in skill_scores.items():
            assert 0.0 <= score <= 1.0, \
                f"Skill {skill} has invalid score {score} after clamping"


class TestCASISkillSimilarity:
    """Property-based tests for CASI skill similarity calculation."""
    
    @given(profile=casi_skill_profile_strategy())
    @settings(max_examples=100)
    def test_similarity_with_self_is_one(self, profile):
        """**Feature: enhanced-buddy-matching, Property 15: CASI 技能相似度加分**
        
        Property: For any skill profile, similarity with itself should be 1.0.
        """
        analyzer = CASISkillAnalyzer()
        similarity = analyzer.calculate_skill_similarity(profile, profile)
        
        assert similarity == 1.0, \
            f"Self-similarity should be 1.0, got {similarity}"
    
    @given(profile_a=casi_skill_profile_strategy(), profile_b=casi_skill_profile_strategy())
    @settings(max_examples=100)
    def test_similarity_is_symmetric(self, profile_a, profile_b):
        """**Feature: enhanced-buddy-matching, Property 15: CASI 技能相似度加分**
        
        Property: For any two profiles, similarity(A, B) == similarity(B, A).
        """
        analyzer = CASISkillAnalyzer()
        
        similarity_ab = analyzer.calculate_skill_similarity(profile_a, profile_b)
        similarity_ba = analyzer.calculate_skill_similarity(profile_b, profile_a)
        
        # Allow small floating point differences
        assert abs(similarity_ab - similarity_ba) < 0.0001, \
            f"Similarity should be symmetric: {similarity_ab} != {similarity_ba}"
    
    @given(profile_a=casi_skill_profile_strategy(), profile_b=casi_skill_profile_strategy())
    @settings(max_examples=100)
    def test_similarity_in_valid_range(self, profile_a, profile_b):
        """**Feature: enhanced-buddy-matching, Property 15: CASI 技能相似度加分**
        
        Property: For any two profiles, similarity should be between 0.0 and 1.0.
        """
        analyzer = CASISkillAnalyzer()
        similarity = analyzer.calculate_skill_similarity(profile_a, profile_b)
        
        assert 0.0 <= similarity <= 1.0, \
            f"Similarity must be in [0, 1], got {similarity}"
    
    def test_identical_profiles_have_perfect_similarity(self):
        """**Feature: enhanced-buddy-matching, Property 15: CASI 技能相似度加分**
        
        Property: Two profiles with identical skill values should have similarity 1.0.
        """
        analyzer = CASISkillAnalyzer()
        
        profile_a = CASISkillProfile(
            user_id=uuid.uuid4(),
            stance_balance=0.8,
            rotation=0.6,
            edging=0.7,
            pressure=0.5,
            timing_coordination=0.9,
            updated_at=datetime.now(UTC)
        )
        
        profile_b = CASISkillProfile(
            user_id=uuid.uuid4(),  # Different user
            stance_balance=0.8,
            rotation=0.6,
            edging=0.7,
            pressure=0.5,
            timing_coordination=0.9,
            updated_at=datetime.now(UTC)
        )
        
        similarity = analyzer.calculate_skill_similarity(profile_a, profile_b)
        
        # Should be 1.0 or very close (allowing for floating point precision)
        assert 0.99 <= similarity <= 1.0, \
            f"Identical profiles should have similarity ~1.0, got {similarity}"
    
    def test_completely_different_profiles_have_low_similarity(self):
        """**Feature: enhanced-buddy-matching, Property 15: CASI 技能相似度加分**
        
        Property: Profiles with very different skill distributions should have low similarity.
        """
        analyzer = CASISkillAnalyzer()
        
        # Profile A: strong in stance_balance, weak in others
        profile_a = CASISkillProfile(
            user_id=uuid.uuid4(),
            stance_balance=1.0,
            rotation=0.0,
            edging=0.0,
            pressure=0.0,
            timing_coordination=0.0,
            updated_at=datetime.now(UTC)
        )
        
        # Profile B: strong in rotation, weak in others
        profile_b = CASISkillProfile(
            user_id=uuid.uuid4(),
            stance_balance=0.0,
            rotation=1.0,
            edging=0.0,
            pressure=0.0,
            timing_coordination=0.0,
            updated_at=datetime.now(UTC)
        )
        
        similarity = analyzer.calculate_skill_similarity(profile_a, profile_b)
        
        # Should be low (orthogonal vectors have cosine similarity 0)
        assert similarity < 0.5, \
            f"Very different profiles should have low similarity, got {similarity}"
    
    def test_zero_profiles_have_perfect_similarity(self):
        """**Feature: enhanced-buddy-matching, Property 15: CASI 技能相似度加分**
        
        Property: Two profiles with all zero skills should have similarity 1.0
        (both have no skills, so they're identical).
        """
        analyzer = CASISkillAnalyzer()
        
        profile_a = CASISkillProfile(
            user_id=uuid.uuid4(),
            stance_balance=0.0,
            rotation=0.0,
            edging=0.0,
            pressure=0.0,
            timing_coordination=0.0,
            updated_at=datetime.now(UTC)
        )
        
        profile_b = CASISkillProfile(
            user_id=uuid.uuid4(),
            stance_balance=0.0,
            rotation=0.0,
            edging=0.0,
            pressure=0.0,
            timing_coordination=0.0,
            updated_at=datetime.now(UTC)
        )
        
        similarity = analyzer.calculate_skill_similarity(profile_a, profile_b)
        
        assert similarity == 1.0, \
            f"Zero profiles should have similarity 1.0, got {similarity}"
    
    def test_zero_profile_vs_nonzero_has_zero_similarity(self):
        """**Feature: enhanced-buddy-matching, Property 15: CASI 技能相似度加分**
        
        Property: A zero profile compared to a non-zero profile should have similarity 0.0.
        """
        analyzer = CASISkillAnalyzer()
        
        profile_zero = CASISkillProfile(
            user_id=uuid.uuid4(),
            stance_balance=0.0,
            rotation=0.0,
            edging=0.0,
            pressure=0.0,
            timing_coordination=0.0,
            updated_at=datetime.now(UTC)
        )
        
        profile_nonzero = CASISkillProfile(
            user_id=uuid.uuid4(),
            stance_balance=0.5,
            rotation=0.5,
            edging=0.5,
            pressure=0.5,
            timing_coordination=0.5,
            updated_at=datetime.now(UTC)
        )
        
        similarity = analyzer.calculate_skill_similarity(profile_zero, profile_nonzero)
        
        assert similarity == 0.0, \
            f"Zero vs non-zero profile should have similarity 0.0, got {similarity}"
    
    @given(
        scale=st.floats(min_value=0.1, max_value=1.25)  # Limit scale to avoid clamping
    )
    @settings(max_examples=50)
    def test_scaling_profile_preserves_similarity(self, scale):
        """**Feature: enhanced-buddy-matching, Property 15: CASI 技能相似度加分**
        
        Property: Scaling all skills by the same factor should preserve similarity
        (cosine similarity is scale-invariant).
        """
        analyzer = CASISkillAnalyzer()
        
        profile_a = CASISkillProfile(
            user_id=uuid.uuid4(),
            stance_balance=0.5,
            rotation=0.6,
            edging=0.7,
            pressure=0.4,
            timing_coordination=0.8,
            updated_at=datetime.now(UTC)
        )
        
        # Scale all skills (but clamp to [0, 1])
        profile_b = CASISkillProfile(
            user_id=uuid.uuid4(),
            stance_balance=min(1.0, 0.5 * scale),
            rotation=min(1.0, 0.6 * scale),
            edging=min(1.0, 0.7 * scale),
            pressure=min(1.0, 0.4 * scale),
            timing_coordination=min(1.0, 0.8 * scale),
            updated_at=datetime.now(UTC)
        )
        
        similarity = analyzer.calculate_skill_similarity(profile_a, profile_b)
        
        # Should be 1.0 or very close (same direction, different magnitude)
        assert 0.99 <= similarity <= 1.0, \
            f"Scaled profile should have similarity ~1.0, got {similarity}"


class TestLessonSkillMapping:
    """Tests for lesson to skill mapping."""
    
    @given(lesson_id=st.text(min_size=1, max_size=50))
    @settings(max_examples=100)
    def test_all_lessons_have_mapping(self, lesson_id):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: Every lesson ID should have a skill mapping (at least default).
        """
        analyzer = CASISkillAnalyzer()
        
        mapping = analyzer._get_lesson_skill_mapping(lesson_id)
        
        # Should return a non-empty dict
        assert isinstance(mapping, dict), \
            f"Mapping should be a dict, got {type(mapping)}"
        assert len(mapping) > 0, \
            f"Mapping should not be empty for lesson {lesson_id}"
    
    @given(lesson_id=st.text(min_size=1, max_size=50))
    @settings(max_examples=100)
    def test_mapping_weights_in_valid_range(self, lesson_id):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: All skill weights in mapping should be in [0.0, 1.0] range.
        """
        analyzer = CASISkillAnalyzer()
        
        mapping = analyzer._get_lesson_skill_mapping(lesson_id)
        
        for skill, weight in mapping.items():
            assert 0.0 <= weight <= 1.0, \
                f"Weight for skill {skill} should be in [0, 1], got {weight}"
    
    def test_known_lessons_have_specific_mappings(self):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: Known lessons should have their specific mappings, not default.
        """
        analyzer = CASISkillAnalyzer()
        
        # Test a known lesson
        mapping = analyzer._get_lesson_skill_mapping("basic_stance")
        
        # Should have high weight for stance_balance
        assert "stance_balance" in mapping, \
            "basic_stance should map to stance_balance"
        assert mapping["stance_balance"] >= 0.5, \
            f"basic_stance should have high stance_balance weight, got {mapping['stance_balance']}"
    
    def test_unknown_lessons_use_default_mapping(self):
        """**Feature: enhanced-buddy-matching, Property 14: CASI 技能記錄**
        
        Property: Unknown lessons should use the default mapping.
        """
        analyzer = CASISkillAnalyzer()
        
        # Test an unknown lesson
        mapping = analyzer._get_lesson_skill_mapping("completely_unknown_lesson_xyz")
        
        # Should be the default mapping
        default_mapping = analyzer.LESSON_SKILL_MAPPING["_default"]
        assert mapping == default_mapping, \
            f"Unknown lesson should use default mapping"
