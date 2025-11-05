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
