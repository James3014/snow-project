#!/usr/bin/env python3
"""Validation script for snowbuddy-matching changes"""

import sys
sys.path.insert(0, '/Users/jameschen/Downloads/diyski/project/snowbuddy_matching')

from app.models.matching import MatchingPreference, CandidateProfile
from app.core.matching_logic import (
    calculate_knowledge_score,
    filter_candidates,
    calculate_total_match_score
)

def test_matching_preference_with_knowledge():
    """Test that MatchingPreference now has include_knowledge_score field"""
    pref = MatchingPreference(
        skill_level_min=3,
        skill_level_max=7,
        include_knowledge_score=True
    )
    assert hasattr(pref, 'include_knowledge_score')
    assert pref.include_knowledge_score == True
    print("✓ MatchingPreference has include_knowledge_score field")

def test_knowledge_score_calculation():
    """Test calculate_knowledge_score function"""
    # Test with similar scores
    seeker = {'overall_score': 80}
    candidate = {'overall_score': 85}
    score = calculate_knowledge_score(seeker, candidate)
    assert 0.0 <= score <= 1.0
    assert score > 0.9  # Should be high similarity
    print(f"✓ Knowledge score calculation works (score: {score})")
    
    # Test with no data
    score_none = calculate_knowledge_score(None, None)
    assert score_none == 0.5
    print(f"✓ Knowledge score handles missing data (score: {score_none})")

def test_filter_candidates():
    """Test filter_candidates function"""
    pref = MatchingPreference(
        skill_level_min=3,
        skill_level_max=7,
        preferred_resorts=['resort1']
    )
    
    all_users = [
        {
            'user_id': 'seeker',
            'nickname': 'Seeker',
            'skill_level': 5,
            'preferences': {'preferred_resorts': ['resort1']}
        },
        {
            'user_id': 'match1',
            'nickname': 'Match1',
            'skill_level': 5,
            'preferences': {'preferred_resorts': ['resort1']}
        },
        {
            'user_id': 'nomatch1',
            'nickname': 'NoMatch1',
            'skill_level': 10,  # Outside range
            'preferences': {'preferred_resorts': ['resort1']}
        },
        {
            'user_id': 'nomatch2',
            'nickname': 'NoMatch2',
            'skill_level': 5,
            'preferences': {'preferred_resorts': ['resort2']}  # Different resort
        }
    ]
    
    candidates = filter_candidates(pref, all_users, 'seeker')
    assert len(candidates) == 1
    assert candidates[0].user_id == 'match1'
    print(f"✓ Filter candidates works (filtered {len(all_users)} to {len(candidates)})")

def test_total_score_with_knowledge():
    """Test calculate_total_match_score with knowledge scores"""
    pref = MatchingPreference(
        skill_level_min=3,
        skill_level_max=7,
        include_knowledge_score=True
    )
    
    candidate = CandidateProfile(
        user_id='test',
        nickname='Test',
        skill_level=5,
        preferences=MatchingPreference(skill_level_min=3, skill_level_max=7)
    )
    
    seeker_knowledge = {'overall_score': 80}
    candidate_knowledge = {'overall_score': 85}
    
    score = calculate_total_match_score(
        pref, 
        candidate, 
        [],
        seeker_knowledge,
        candidate_knowledge
    )
    
    assert 0.0 <= score <= 1.0
    print(f"✓ Total score calculation with knowledge works (score: {score})")
    
    # Test without knowledge
    pref_no_knowledge = MatchingPreference(
        skill_level_min=3,
        skill_level_max=7,
        include_knowledge_score=False
    )
    
    score_no_knowledge = calculate_total_match_score(
        pref_no_knowledge,
        candidate,
        []
    )
    
    assert 0.0 <= score_no_knowledge <= 1.0
    print(f"✓ Total score calculation without knowledge works (score: {score_no_knowledge})")

def main():
    print("Running validation tests...\n")
    
    try:
        test_matching_preference_with_knowledge()
        test_knowledge_score_calculation()
        test_filter_candidates()
        test_total_score_with_knowledge()
        
        print("\n" + "="*50)
        print("✓ All validation tests passed!")
        print("="*50)
        return 0
    except Exception as e:
        print(f"\n✗ Validation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
