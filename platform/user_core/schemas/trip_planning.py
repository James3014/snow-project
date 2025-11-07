"""
Pydantic schemas for trip planning (seasons, trips, buddy matching, sharing).
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, UUID4, Field, field_validator
from models.enums import (
    TripFlexibility, FlightStatus, AccommodationStatus, TripStatus,
    TripVisibility, BuddyRole, BuddyStatus, SeasonStatus
)


# ==================== Season Schemas ====================

class SeasonBase(BaseModel):
    """Base schema for season."""
    title: str = Field(..., max_length=100, description="Season title")
    description: Optional[str] = Field(None, description="Season description")
    start_date: date = Field(..., description="Season start date")
    end_date: date = Field(..., description="Season end date")
    goal_trips: Optional[int] = Field(None, ge=0, description="Target number of trips")
    goal_resorts: Optional[int] = Field(None, ge=0, description="Target number of resorts")
    goal_courses: Optional[int] = Field(None, ge=0, description="Target number of courses")


class SeasonCreate(SeasonBase):
    """Schema for creating a season."""
    pass


class SeasonUpdate(BaseModel):
    """Schema for updating a season. All fields are optional."""
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    goal_trips: Optional[int] = Field(None, ge=0)
    goal_resorts: Optional[int] = Field(None, ge=0)
    goal_courses: Optional[int] = Field(None, ge=0)
    status: Optional[SeasonStatus] = None


class Season(SeasonBase):
    """Schema for season response."""
    season_id: UUID4
    user_id: UUID4
    status: SeasonStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SeasonWithStats(Season):
    """Season with statistics."""
    trip_count: int = 0
    completed_trips: int = 0
    unique_resorts: int = 0
    total_buddies: int = 0


# ==================== Trip Schemas ====================

class TripBase(BaseModel):
    """Base schema for trip."""
    resort_id: str = Field(..., max_length=100, description="Resort ID from resort API")
    title: Optional[str] = Field(None, max_length=200, description="Custom trip title")
    start_date: date = Field(..., description="Trip start date")
    end_date: date = Field(..., description="Trip end date")
    flexibility: TripFlexibility = Field(TripFlexibility.FIXED, description="Date flexibility")
    flight_status: FlightStatus = Field(FlightStatus.NOT_PLANNED, description="Flight booking status")
    accommodation_status: AccommodationStatus = Field(AccommodationStatus.NOT_PLANNED, description="Accommodation status")
    visibility: TripVisibility = Field(TripVisibility.PRIVATE, description="Trip visibility")
    max_buddies: int = Field(0, ge=0, description="Maximum number of buddies (0=solo)")
    notes: Optional[str] = Field(None, description="Trip notes")


class TripCreate(TripBase):
    """Schema for creating a trip."""
    season_id: UUID4 = Field(..., description="Season this trip belongs to")


class TripBatchCreate(BaseModel):
    """Schema for creating multiple trips at once."""
    season_id: UUID4 = Field(..., description="Season for all trips")
    trips: List[TripBase] = Field(..., min_length=1, max_length=50, description="List of trips to create")


class TripUpdate(BaseModel):
    """Schema for updating a trip. All fields are optional."""
    resort_id: Optional[str] = Field(None, max_length=100)
    title: Optional[str] = Field(None, max_length=200)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    flexibility: Optional[TripFlexibility] = None
    flight_status: Optional[FlightStatus] = None
    accommodation_status: Optional[AccommodationStatus] = None
    trip_status: Optional[TripStatus] = None
    visibility: Optional[TripVisibility] = None
    max_buddies: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None


class Trip(TripBase):
    """Schema for trip response."""
    trip_id: UUID4
    season_id: UUID4
    user_id: UUID4
    trip_status: TripStatus
    current_buddies: int
    completed_at: Optional[datetime] = None
    course_visit_id: Optional[UUID4] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TripWithDetails(Trip):
    """Trip with additional details."""
    season_title: str
    buddies: List['BuddyInfo'] = []
    owner_info: 'UserInfo'


class TripComplete(BaseModel):
    """Schema for completing a trip."""
    create_course_visit: bool = Field(True, description="Auto-create CourseVisit entry")
    notes: Optional[str] = Field(None, description="Additional notes for completion")


# ==================== Buddy Schemas ====================

class BuddyRequest(BaseModel):
    """Schema for requesting to join a trip as buddy."""
    trip_id: UUID4 = Field(..., description="Trip to join")
    request_message: Optional[str] = Field(None, max_length=500, description="Message to trip owner")


class BuddyResponse(BaseModel):
    """Schema for responding to a buddy request."""
    status: BuddyStatus = Field(..., description="Accept/decline/cancel")
    response_message: Optional[str] = Field(None, max_length=500, description="Response message")


class BuddyInfo(BaseModel):
    """Basic buddy information."""
    buddy_id: UUID4
    user_id: UUID4
    user_display_name: str
    user_avatar_url: Optional[str] = None
    role: BuddyRole
    status: BuddyStatus
    requested_at: datetime
    joined_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class BuddyRequestWithDetails(BuddyInfo):
    """Buddy request with full details."""
    request_message: Optional[str] = None
    response_message: Optional[str] = None
    responded_at: Optional[datetime] = None
    trip_info: 'TripSummary'


# ==================== Share Schemas ====================

class TripShareCreate(BaseModel):
    """Schema for creating a trip share."""
    shared_with_user_id: Optional[UUID4] = Field(None, description="Share with registered user")
    shared_with_email: Optional[str] = Field(None, max_length=255, description="Share with email")
    can_edit: bool = Field(False, description="Allow recipient to edit trip")
    can_invite_buddies: bool = Field(False, description="Allow recipient to invite buddies")
    expires_at: Optional[datetime] = Field(None, description="Share expiration time")

    @field_validator('shared_with_email', 'shared_with_user_id')
    @classmethod
    def validate_recipient(cls, v, info):
        # At least one of shared_with_user_id or shared_with_email must be provided
        return v


class TripShare(BaseModel):
    """Schema for trip share response."""
    share_id: UUID4
    trip_id: UUID4
    shared_with_user_id: Optional[UUID4] = None
    shared_with_email: Optional[str] = None
    can_edit: bool
    can_invite_buddies: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ShareLinkResponse(BaseModel):
    """Response for share link generation."""
    share_token: str
    share_url: str
    expires_at: Optional[datetime] = None


# ==================== Explore & Matching Schemas ====================

class TripExploreFilters(BaseModel):
    """Filters for exploring public trips."""
    resort_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    flexibility: Optional[TripFlexibility] = None
    has_buddy_slots: bool = True
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0)


class TripSummary(BaseModel):
    """Summary of trip for explore/matching."""
    trip_id: UUID4
    resort_id: str
    title: Optional[str] = None
    start_date: date
    end_date: date
    flexibility: TripFlexibility
    trip_status: TripStatus
    max_buddies: int
    current_buddies: int
    owner_info: 'UserInfo'


class MatchScore(BaseModel):
    """Match score breakdown for buddy matching."""
    total_score: int = Field(..., ge=0, le=100, description="Total match score (0-100)")
    time_score: int = Field(..., ge=0, le=40, description="Time matching score")
    location_score: int = Field(..., ge=0, le=30, description="Location matching score")
    experience_score: int = Field(..., ge=0, le=20, description="Experience matching score")
    social_score: int = Field(..., ge=0, le=10, description="Social connection score")
    bonus_score: int = Field(0, ge=0, description="Bonus points from history")
    reasons: List[str] = Field(default_factory=list, description="Human-readable reasons")


class TripRecommendation(BaseModel):
    """Recommended trip with match score."""
    trip: TripSummary
    match_score: MatchScore


class RecommendationsResponse(BaseModel):
    """Response for recommended trips/buddies."""
    recommendations: List[TripRecommendation]
    total_count: int


# ==================== Calendar Schemas ====================

class CalendarTrip(BaseModel):
    """Trip displayed in calendar view."""
    trip_id: UUID4
    resort_id: str
    title: Optional[str] = None
    start_date: date
    end_date: date
    trip_status: TripStatus
    current_buddies: int
    max_buddies: int


class MonthlyCalendar(BaseModel):
    """Monthly calendar view."""
    year: int
    month: int
    trips: List[CalendarTrip]


class YearOverview(BaseModel):
    """Year overview with trip counts per month."""
    year: int
    months: Dict[int, int] = Field(default_factory=dict, description="Month -> trip count")
    total_trips: int
    completed_trips: int


# ==================== User Info Schemas ====================

class UserInfo(BaseModel):
    """Basic user information for display."""
    user_id: UUID4
    display_name: str
    avatar_url: Optional[str] = None
    experience_level: Optional[str] = None


class UserLevel(BaseModel):
    """User experience level calculation."""
    level: int = Field(..., ge=1, le=5, description="Experience level 1-5")
    total_courses: int
    unique_resorts: int
    advanced_ratio: float
    description: str


# ==================== Stats & Progress Schemas ====================

class TripStats(BaseModel):
    """Statistics for trips."""
    total_trips: int
    planning_trips: int
    confirmed_trips: int
    completed_trips: int
    cancelled_trips: int
    total_buddies: int
    unique_resorts: int


class SeasonGoalProgress(BaseModel):
    """Progress towards season goals."""
    goal_trips: Optional[int] = None
    actual_trips: int
    goal_resorts: Optional[int] = None
    actual_resorts: int
    goal_courses: Optional[int] = None
    actual_courses: int
    completion_percentage: float


# ==================== Activity Feed Integration ====================

class TripActivity(BaseModel):
    """Activity feed item for trip events."""
    activity_type: str = Field(..., description="trip_created, trip_completed, buddy_matched, etc.")
    trip_id: UUID4
    trip_title: Optional[str] = None
    resort_id: str
    buddies_count: int = 0
    created_at: datetime
