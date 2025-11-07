"""Schemas package exports."""

from .user_profile import *
from .behavior_event import *
from .notification_preference import *
from .course_tracking import *
from .social import *
from .trip_planning import *

__all__ = [
    # User profile schemas
    'UserProfileBase',
    'UserProfileCreate',
    'UserProfile',

    # Trip planning schemas
    'SeasonBase',
    'SeasonCreate',
    'SeasonUpdate',
    'Season',
    'SeasonWithStats',
    'TripBase',
    'TripCreate',
    'TripBatchCreate',
    'TripUpdate',
    'Trip',
    'TripWithDetails',
    'TripComplete',
    'BuddyRequest',
    'BuddyResponse',
    'BuddyInfo',
    'BuddyRequestWithDetails',
    'TripShareCreate',
    'TripShare',
    'ShareLinkResponse',
    'TripExploreFilters',
    'TripSummary',
    'MatchScore',
    'TripRecommendation',
    'RecommendationsResponse',
    'CalendarTrip',
    'MonthlyCalendar',
    'YearOverview',
    'UserInfo',
    'UserLevel',
    'TripStats',
    'SeasonGoalProgress',
    'TripActivity',
]
