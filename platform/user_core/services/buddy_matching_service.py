"""
Buddy matching service - candidate filtering and matching logic.
"""
from datetime import datetime, UTC, date
from typing import List, Optional, Set, Tuple
import uuid

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from models.user_profile import UserProfile
from models.trip_planning import Trip, TripBuddy
from models.social import UserFollow
from models.enums import TripVisibility, BuddyStatus
from schemas.buddy_matching import MatchScore


class BuddyMatchingError(Exception):
    """Base exception for buddy matching errors."""
    pass


class TripNotFoundError(BuddyMatchingError):
    """Raised when trip is not found."""
    pass


class UnauthorizedMatchingError(BuddyMatchingError):
    """Raised when user is not authorized to perform matching."""
    pass


def filter_candidates(
    db: Session,
    seeker: UserProfile,
    seeker_trip: Trip,
    all_users: List[UserProfile]
) -> List[UserProfile]:
    """
    Filter candidates based on basic criteria before scoring.
    
    Filters applied:
    1. Block filtering - exclude blocked users and users who blocked seeker
    2. Skill level filtering - only include users within acceptable skill range
    3. Location filtering - at least one overlapping preferred resort
    4. Time filtering - available time overlaps with seeker's trip dates
    
    Args:
        db: Database session
        seeker: User searching for buddies
        seeker_trip: Trip for which buddies are being searched
        all_users: List of all potential candidate users
        
    Returns:
        List of filtered candidate users
        
    Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
    """
    if not all_users:
        return []
    
    # Get seeker's skill level
    seeker_skill = seeker.skill_level or 'beginner'
    
    # Get blocked user IDs (both directions)
    blocked_ids = _get_blocked_user_ids(db, seeker.user_id)
    
    # Get seeker's preferred resorts
    seeker_resorts = set(seeker.preferred_resorts or [])
    # Also include the trip's resort
    seeker_resorts.add(seeker_trip.resort_id)
    
    filtered = []
    
    for candidate in all_users:
        # Skip self
        if candidate.user_id == seeker.user_id:
            continue
            
        # 1. Block filtering (Requirement 2.2)
        if candidate.user_id in blocked_ids:
            continue
            
        # 2. Skill level filtering (Requirement 2.3)
        candidate_skill = candidate.skill_level or 'beginner'
        if not _is_skill_level_compatible(seeker_skill, candidate_skill):
            continue
            
        # 3. Location filtering (Requirement 2.4)
        candidate_resorts = set(candidate.preferred_resorts or [])
        if not _has_resort_overlap(seeker_resorts, candidate_resorts):
            continue
            
        # 4. Time filtering (Requirement 2.5)
        if not _has_time_overlap(db, candidate.user_id, seeker_trip):
            continue
            
        filtered.append(candidate)
    
    return filtered


def _get_blocked_user_ids(db: Session, user_id: uuid.UUID) -> Set[uuid.UUID]:
    """
    Get IDs of users who are blocked by or have blocked the given user.
    
    Note: Currently blocking is not implemented in the database.
    This function returns an empty set but is ready for when blocking is added.
    
    Args:
        db: Database session
        user_id: User ID to check blocks for
        
    Returns:
        Set of blocked user IDs
    """
    # TODO: Implement when UserBlock model is added
    # For now, return empty set
    return set()


def _is_skill_level_compatible(
    seeker_skill: str,
    candidate_skill: str,
    max_level_diff: int = 1
) -> bool:
    """
    Check if two skill levels are compatible.
    
    Skill levels in order: beginner, intermediate, advanced, expert
    Compatible if difference is within max_level_diff.
    
    Args:
        seeker_skill: Seeker's skill level
        candidate_skill: Candidate's skill level
        max_level_diff: Maximum acceptable level difference
        
    Returns:
        True if compatible, False otherwise
        
    Requirement: 2.3
    """
    skill_order = {
        'beginner': 0,
        'intermediate': 1,
        'advanced': 2,
        'expert': 3
    }
    
    seeker_level = skill_order.get(seeker_skill.lower(), 0)
    candidate_level = skill_order.get(candidate_skill.lower(), 0)
    
    return abs(seeker_level - candidate_level) <= max_level_diff


def _has_resort_overlap(
    seeker_resorts: Set[str],
    candidate_resorts: Set[str]
) -> bool:
    """
    Check if there is at least one overlapping resort.
    
    Args:
        seeker_resorts: Set of seeker's preferred resorts
        candidate_resorts: Set of candidate's preferred resorts
        
    Returns:
        True if there is overlap, False otherwise
        
    Requirement: 2.4
    """
    if not seeker_resorts or not candidate_resorts:
        # If either has no preferences, consider it compatible
        return True
    
    return bool(seeker_resorts & candidate_resorts)


def _has_time_overlap(
    db: Session,
    candidate_id: uuid.UUID,
    seeker_trip: Trip
) -> bool:
    """
    Check if candidate has any trips that overlap with seeker's trip dates.
    
    Args:
        db: Database session
        candidate_id: Candidate user ID
        seeker_trip: Seeker's trip
        
    Returns:
        True if there is time overlap, False otherwise
        
    Requirement: 2.5
    """
    # Get candidate's trips that overlap with seeker's trip dates
    candidate_trips = db.query(Trip).filter(
        Trip.user_id == candidate_id,
        Trip.start_date <= seeker_trip.end_date,
        Trip.end_date >= seeker_trip.start_date
    ).all()
    
    return len(candidate_trips) > 0


def _calculate_overlap_days(trip_a: Trip, trip_b: Trip) -> int:
    """
    Calculate number of overlapping days between two trips.
    
    Args:
        trip_a: First trip
        trip_b: Second trip
        
    Returns:
        Number of overlapping days
    """
    overlap_start = max(trip_a.start_date, trip_b.start_date)
    overlap_end = min(trip_a.end_date, trip_b.end_date)
    
    if overlap_start > overlap_end:
        return 0
    
    return (overlap_end - overlap_start).days + 1


def calculate_time_score(seeker_trip: Trip, candidate_trip: Trip) -> int:
    """
    Calculate time compatibility score (0-40 points).
    
    Perfect match (same dates) = 40 points
    Partial overlap = proportional score based on overlap days
    No overlap = 0 points
    
    Args:
        seeker_trip: Seeker's trip
        candidate_trip: Candidate's trip
        
    Returns:
        Time score (0-40)
        
    Requirement: 3.1, 3.2, 3.3
    """
    MAX_TIME_SCORE = 40
    
    # Calculate overlap days
    overlap_days = _calculate_overlap_days(seeker_trip, candidate_trip)
    
    if overlap_days == 0:
        return 0
    
    # Calculate total days for each trip
    seeker_days = (seeker_trip.end_date - seeker_trip.start_date).days + 1
    candidate_days = (candidate_trip.end_date - candidate_trip.start_date).days + 1
    
    # Check for perfect match (same dates)
    if (seeker_trip.start_date == candidate_trip.start_date and 
        seeker_trip.end_date == candidate_trip.end_date):
        return MAX_TIME_SCORE
    
    # Calculate proportional score based on overlap
    # Use the average of both trips' durations as the baseline
    avg_days = (seeker_days + candidate_days) / 2
    overlap_ratio = overlap_days / avg_days
    
    # Score is proportional to overlap ratio, capped at MAX_TIME_SCORE
    score = int(overlap_ratio * MAX_TIME_SCORE)
    return min(score, MAX_TIME_SCORE)


def calculate_location_score(seeker_trip: Trip, candidate_trip: Trip) -> int:
    """
    Calculate location compatibility score (0-30 points).
    
    Same resort = 30 points
    Different resort = 0 points
    
    Args:
        seeker_trip: Seeker's trip
        candidate_trip: Candidate's trip
        
    Returns:
        Location score (0-30)
        
    Requirement: 3.1
    """
    MAX_LOCATION_SCORE = 30
    
    if seeker_trip.resort_id == candidate_trip.resort_id:
        return MAX_LOCATION_SCORE
    
    return 0


def calculate_skill_score(seeker: UserProfile, candidate: UserProfile) -> int:
    """
    Calculate skill level compatibility score (0-20 points).
    
    Same skill level = 20 points
    1 level difference = 15 points
    2+ level difference = 5 points
    
    Args:
        seeker: Seeker user profile
        candidate: Candidate user profile
        
    Returns:
        Skill score (0-20)
        
    Requirement: 3.1, 9.3, 9.4
    """
    MAX_SKILL_SCORE = 20
    
    skill_order = {
        'beginner': 0,
        'intermediate': 1,
        'advanced': 2,
        'expert': 3
    }
    
    seeker_skill = seeker.skill_level or 'beginner'
    candidate_skill = candidate.skill_level or 'beginner'
    
    seeker_level = skill_order.get(seeker_skill.lower(), 0)
    candidate_level = skill_order.get(candidate_skill.lower(), 0)
    
    level_diff = abs(seeker_level - candidate_level)
    
    if level_diff == 0:
        return MAX_SKILL_SCORE
    elif level_diff == 1:
        return 15
    else:
        return 5


def calculate_social_score(
    db: Session,
    seeker_id: uuid.UUID,
    candidate_id: uuid.UUID
) -> int:
    """
    Calculate social connection score (0-10 points).
    
    Mutual followers = 10 points
    One-way follow = 5 points
    No connection = 0 points
    
    Args:
        db: Database session
        seeker_id: Seeker user ID
        candidate_id: Candidate user ID
        
    Returns:
        Social score (0-10)
        
    Requirement: 3.1, 8.2
    """
    MAX_SOCIAL_SCORE = 10
    
    # Check if seeker follows candidate
    seeker_follows = db.query(UserFollow).filter(
        UserFollow.follower_id == seeker_id,
        UserFollow.following_id == candidate_id
    ).first() is not None
    
    # Check if candidate follows seeker
    candidate_follows = db.query(UserFollow).filter(
        UserFollow.follower_id == candidate_id,
        UserFollow.following_id == seeker_id
    ).first() is not None
    
    # Mutual followers
    if seeker_follows and candidate_follows:
        return MAX_SOCIAL_SCORE
    
    # One-way follow
    if seeker_follows or candidate_follows:
        return 5
    
    return 0


def calculate_match_score(
    db: Session,
    seeker: UserProfile,
    seeker_trip: Trip,
    candidate: UserProfile,
    candidate_trip: Trip
) -> MatchScore:
    """
    Calculate comprehensive match score across all dimensions.
    
    Total score = time_score + location_score + skill_score + social_score
    Maximum possible score = 100 (40 + 30 + 20 + 10)
    
    Args:
        db: Database session
        seeker: Seeker user profile
        seeker_trip: Seeker's trip
        candidate: Candidate user profile
        candidate_trip: Candidate's trip with overlapping dates
        
    Returns:
        MatchScore with breakdown and reasons
        
    Requirement: 3.1, 3.5, 3.6
    """
    # Calculate individual dimension scores
    time_score = calculate_time_score(seeker_trip, candidate_trip)
    location_score = calculate_location_score(seeker_trip, candidate_trip)
    skill_score = calculate_skill_score(seeker, candidate)
    social_score = calculate_social_score(db, seeker.user_id, candidate.user_id)
    
    # Calculate total score
    total_score = time_score + location_score + skill_score + social_score
    
    # Generate human-readable reasons
    reasons = []
    
    # Time reasons
    if time_score == 40:
        reasons.append("完全相同的日期")
    elif time_score > 30:
        overlap_days = _calculate_overlap_days(seeker_trip, candidate_trip)
        reasons.append(f"重疊 {overlap_days} 天")
    elif time_score > 0:
        overlap_days = _calculate_overlap_days(seeker_trip, candidate_trip)
        reasons.append(f"部分重疊 ({overlap_days} 天)")
    
    # Location reasons
    if location_score == 30:
        reasons.append(f"相同雪場 ({seeker_trip.resort_id})")
    
    # Skill reasons
    if skill_score == 20:
        reasons.append("相同技能等級")
    elif skill_score == 15:
        reasons.append("相近技能等級")
    elif skill_score > 0:
        reasons.append("可接受的技能差距")
    
    # Social reasons
    if social_score == 10:
        reasons.append("互相追蹤")
    elif social_score == 5:
        reasons.append("單向追蹤")
    
    return MatchScore(
        total_score=total_score,
        time_score=time_score,
        location_score=location_score,
        skill_score=skill_score,
        social_score=social_score,
        reasons=reasons
    )
