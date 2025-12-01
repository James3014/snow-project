"""Domain-specific exceptions."""
from exceptions.base import NotFoundError, ConflictError, ValidationError


# User exceptions
class UserNotFoundError(NotFoundError):
    """User not found."""
    error_code = "USER_NOT_FOUND"
    
    def __init__(self, user_id: str):
        super().__init__(f"User {user_id} not found", {"user_id": user_id})


# Course tracking exceptions
class DuplicateCourseVisitError(ConflictError):
    """Duplicate course visit."""
    error_code = "DUPLICATE_COURSE_VISIT"
    
    def __init__(self, user_id: str, course_name: str, date: str):
        super().__init__(
            f"Course visit already exists for {course_name} on {date}",
            {"user_id": user_id, "course_name": course_name, "date": date}
        )


class RecommendationLimitError(ValidationError):
    """Recommendation limit exceeded."""
    error_code = "RECOMMENDATION_LIMIT_EXCEEDED"
    
    def __init__(self, limit: int):
        super().__init__(
            f"Maximum {limit} recommendations allowed",
            {"limit": limit}
        )


# Trip planning exceptions
class SeasonNotFoundError(NotFoundError):
    """Season not found."""
    error_code = "SEASON_NOT_FOUND"
    
    def __init__(self, season_id: str):
        super().__init__(f"Season {season_id} not found", {"season_id": season_id})


class TripNotFoundError(NotFoundError):
    """Trip not found."""
    error_code = "TRIP_NOT_FOUND"
    
    def __init__(self, trip_id: str):
        super().__init__(f"Trip {trip_id} not found", {"trip_id": trip_id})


# Social exceptions
class FriendshipNotFoundError(NotFoundError):
    """Friendship not found."""
    error_code = "FRIENDSHIP_NOT_FOUND"


class DuplicateFriendRequestError(ConflictError):
    """Duplicate friend request."""
    error_code = "DUPLICATE_FRIEND_REQUEST"
    
    def __init__(self, user_id: str, friend_id: str):
        super().__init__(
            "Friend request already exists",
            {"user_id": user_id, "friend_id": friend_id}
        )


# Buddy matching exceptions
class BuddyRequestNotFoundError(NotFoundError):
    """Buddy request not found."""
    error_code = "BUDDY_REQUEST_NOT_FOUND"
    
    def __init__(self, request_id: str):
        super().__init__(f"Buddy request {request_id} not found", {"request_id": request_id})
