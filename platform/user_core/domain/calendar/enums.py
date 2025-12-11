"""
Calendar domain enums - 獨立定義，避免循環導入
"""
from enum import Enum


class TripVisibility(str, Enum):
    """Trip visibility settings"""
    PRIVATE = "private"
    FRIENDS_ONLY = "friends_only"
    PUBLIC = "public"
    CUSTOM = "custom"


class TripStatus(str, Enum):
    """Overall trip status"""
    PLANNING = "planning"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BuddyStatus(str, Enum):
    """Buddy request/join status"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class BuddyRole(str, Enum):
    """Role in a trip"""
    OWNER = "owner"
    BUDDY = "buddy"
    COACH = "coach"
    STUDENT = "student"


class EventType(str, Enum):
    """Calendar event types"""
    TRIP = "TRIP"
    REMINDER = "REMINDER"
    MATCHING = "MATCHING"
    GEAR = "GEAR"
    AVAILABILITY = "AVAILABILITY"
    MEETING = "MEETING"
    EXTERNAL = "EXTERNAL"


class MatchingStatus(str, Enum):
    """Matching request status"""
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
