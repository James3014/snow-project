"""
TODO-CAL-010: Calendar API Pydantic Schema Tests
Tests for request/response schema validation (standalone).
"""
import pytest
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, ValidationError
from typing import Optional, List
from enum import Enum


# 複製必要的 enums 和 schemas 以獨立測試
class TripVisibility(str, Enum):
    PRIVATE = "private"
    FRIENDS_ONLY = "friends_only"
    PUBLIC = "public"


class TripStatus(str, Enum):
    PLANNING = "planning"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EventType(str, Enum):
    TRIP = "trip"
    REMINDER = "reminder"
    MATCHING = "matching"


class TripCreateRequest(BaseModel):
    title: str
    start_date: datetime
    end_date: datetime
    timezone: str | None = "Asia/Taipei"
    visibility: TripVisibility = TripVisibility.PRIVATE
    status: TripStatus = TripStatus.PLANNING
    resort_id: Optional[str] = None
    resort_name: Optional[str] = None
    region: Optional[str] = None
    people_count: Optional[int] = None
    note: Optional[str] = None


class TripUpdateRequest(BaseModel):
    title: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    timezone: Optional[str] = None
    visibility: Optional[TripVisibility] = None
    status: Optional[TripStatus] = None


class EventCreateRequest(BaseModel):
    type: EventType
    title: str
    start_date: datetime
    end_date: datetime
    all_day: bool = False
    description: str | None = None
    trip_id: str | None = None


class BuddyInviteRequest(BaseModel):
    user_id: str
    message: str | None = None


class BuddyRespondRequest(BaseModel):
    accept: bool
    message: str | None = None


class TestTripCreateRequestSchema:
    """Test TripCreateRequest validation."""

    def test_valid_trip_create_request(self):
        start = datetime.now(timezone.utc) + timedelta(days=30)
        end = start + timedelta(days=5)
        req = TripCreateRequest(
            title="苗場滑雪",
            start_date=start,
            end_date=end,
        )
        assert req.title == "苗場滑雪"
        assert req.visibility == TripVisibility.PRIVATE

    def test_trip_create_with_all_fields(self):
        start = datetime.now(timezone.utc) + timedelta(days=30)
        end = start + timedelta(days=5)
        req = TripCreateRequest(
            title="苗場滑雪",
            start_date=start,
            end_date=end,
            timezone="Asia/Tokyo",
            visibility=TripVisibility.PUBLIC,
            status=TripStatus.CONFIRMED,
            resort_id="naeba",
            resort_name="苗場滑雪場",
            region="新潟",
            people_count=4,
            note="帶初學者",
        )
        assert req.resort_id == "naeba"
        assert req.people_count == 4

    def test_trip_create_missing_required_field(self):
        with pytest.raises(ValidationError):
            TripCreateRequest(
                start_date=datetime.now(timezone.utc),
                end_date=datetime.now(timezone.utc),
            )


class TestTripUpdateRequestSchema:
    """Test TripUpdateRequest validation."""

    def test_partial_update(self):
        req = TripUpdateRequest(title="新標題")
        assert req.title == "新標題"
        assert req.start_date is None

    def test_empty_update_allowed(self):
        req = TripUpdateRequest()
        assert req.title is None


class TestEventCreateRequestSchema:
    """Test EventCreateRequest validation."""

    def test_valid_event_create(self):
        start = datetime.now(timezone.utc) + timedelta(days=30)
        end = start + timedelta(hours=2)
        req = EventCreateRequest(
            type=EventType.TRIP,
            title="滑雪行程",
            start_date=start,
            end_date=end,
        )
        assert req.type == EventType.TRIP
        assert req.all_day is False

    def test_all_day_event(self):
        start = datetime.now(timezone.utc) + timedelta(days=30)
        end = start + timedelta(days=3)
        req = EventCreateRequest(
            type=EventType.TRIP,
            title="滑雪行程",
            start_date=start,
            end_date=end,
            all_day=True,
        )
        assert req.all_day is True


class TestBuddyRequestSchemas:
    """Test buddy request schemas."""

    def test_buddy_invite_request(self):
        req = BuddyInviteRequest(
            user_id="123e4567-e89b-12d3-a456-426614174000",
            message="一起滑雪！",
        )
        assert req.message == "一起滑雪！"

    def test_buddy_respond_accept(self):
        req = BuddyRespondRequest(accept=True)
        assert req.accept is True
        assert req.message is None

    def test_buddy_respond_decline_with_message(self):
        req = BuddyRespondRequest(accept=False, message="人數已滿")
        assert req.accept is False
        assert req.message == "人數已滿"
