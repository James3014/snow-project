from enum import Enum

from platform.user_core.models.enums import (
    TripVisibility as BaseTripVisibility,
    TripStatus as BaseTripStatus,
    BuddyStatus as BaseBuddyStatus,
    BuddyRole as BaseBuddyRole,
)


TripVisibility = BaseTripVisibility
TripStatus = BaseTripStatus
BuddyStatus = BaseBuddyStatus
BuddyRole = BaseBuddyRole


class EventType(str, Enum):
    TRIP = "TRIP"
    REMINDER = "REMINDER"
    MATCHING = "MATCHING"
    GEAR = "GEAR"


class MatchingStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
