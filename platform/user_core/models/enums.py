import enum

class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    merged = "merged"

class NotificationStatus(str, enum.Enum):
    opt_in = "opt-in"
    opt_out = "opt-out"
    paused = "paused"

class LocaleVerificationStatus(str, enum.Enum):
    unverified = "unverified"
    pending = "pending"
    verified = "verified"

class NotificationFrequency(str, enum.Enum):
    immediate = "immediate"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"

# ==================== Trip Planning Enums ====================

class TripFlexibility(str, enum.Enum):
    """Date flexibility options for trips"""
    FIXED = "fixed"
    FLEXIBLE_1_DAY = "flexible_1_day"
    FLEXIBLE_3_DAYS = "flexible_3_days"
    FLEXIBLE_WEEK = "flexible_week"
    ANY_WEEKEND = "any_weekend"
    ANY_WEEKDAY = "any_weekday"

class FlightStatus(str, enum.Enum):
    """Flight booking status"""
    NOT_PLANNED = "not_planned"
    RESEARCHING = "researching"
    READY_TO_BOOK = "ready_to_book"
    BOOKED = "booked"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class AccommodationStatus(str, enum.Enum):
    """Accommodation booking status"""
    NOT_PLANNED = "not_planned"
    RESEARCHING = "researching"
    READY_TO_BOOK = "ready_to_book"
    BOOKED = "booked"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class TripStatus(str, enum.Enum):
    """Overall trip status"""
    PLANNING = "planning"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TripVisibility(str, enum.Enum):
    """Trip visibility settings"""
    PRIVATE = "private"
    FRIENDS_ONLY = "friends_only"
    PUBLIC = "public"
    CUSTOM = "custom"

class BuddyRole(str, enum.Enum):
    """Role in a trip"""
    OWNER = "owner"
    BUDDY = "buddy"

class BuddyStatus(str, enum.Enum):
    """Buddy request/join status"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    CANCELLED = "cancelled"

class SeasonStatus(str, enum.Enum):
    """Season status"""
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"
