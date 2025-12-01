"""Exceptions module."""
from exceptions.base import (
    AppException, NotFoundError, ValidationError, 
    ConflictError, UnauthorizedError, ForbiddenError, RateLimitError
)
from exceptions.domain import (
    UserNotFoundError, DuplicateCourseVisitError, RecommendationLimitError,
    SeasonNotFoundError, TripNotFoundError, FriendshipNotFoundError,
    DuplicateFriendRequestError, BuddyRequestNotFoundError
)
from exceptions.handlers import register_exception_handlers

__all__ = [
    'AppException', 'NotFoundError', 'ValidationError', 'ConflictError',
    'UnauthorizedError', 'ForbiddenError', 'RateLimitError',
    'UserNotFoundError', 'DuplicateCourseVisitError', 'RecommendationLimitError',
    'SeasonNotFoundError', 'TripNotFoundError', 'FriendshipNotFoundError',
    'DuplicateFriendRequestError', 'BuddyRequestNotFoundError',
    'register_exception_handlers'
]
