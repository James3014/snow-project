"""Models package exports."""

from .user_profile import Base, UserProfile, UserLocaleProfile, LegacyMapping
from .behavior_event import BehaviorEvent
from .notification_preference import NotificationPreference
from .course_tracking import CourseVisit, CourseRecommendation, UserAchievement, AchievementDefinition
from .social import UserFollow, ActivityFeedItem, ActivityLike, ActivityComment
from .trip_planning import Season, Trip, TripBuddy, TripShare
from .ski_preference import SkiPreference
from .gear import GearItem, GearInspection, GearReminder
from .calendar import (
    CalendarTrip,
    CalendarDay,
    CalendarItem,
    CalendarEvent,
    CalendarTripBuddy,
    CalendarMatchingRequest,
)
from .enums import (
    UserStatus, NotificationStatus, LocaleVerificationStatus, NotificationFrequency,
    TripFlexibility, FlightStatus, AccommodationStatus, TripStatus,
    TripVisibility, BuddyRole, BuddyStatus, SeasonStatus
)

__all__ = [
    'Base',
    'UserProfile',
    'UserLocaleProfile',
    'LegacyMapping',
    'BehaviorEvent',
    'NotificationPreference',
    'CourseVisit',
    'CourseRecommendation',
    'UserAchievement',
    'AchievementDefinition',
    'UserFollow',
    'ActivityFeedItem',
    'ActivityLike',
    'ActivityComment',
    'Season',
    'Trip',
    'TripBuddy',
    'TripShare',
    'SkiPreference',
    'GearItem',
    'GearInspection',
    'GearReminder',
    'CalendarTrip',
    'CalendarDay',
    'CalendarItem',
    'CalendarEvent',
    'CalendarTripBuddy',
    'CalendarMatchingRequest',
    'UserStatus',
    'NotificationStatus',
    'LocaleVerificationStatus',
    'NotificationFrequency',
    'TripFlexibility',
    'FlightStatus',
    'AccommodationStatus',
    'TripStatus',
    'TripVisibility',
    'BuddyRole',
    'BuddyStatus',
    'SeasonStatus',
]
