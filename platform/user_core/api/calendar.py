"""
Calendar API endpoints (minimal).
"""
from __future__ import annotations

import datetime as dt
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from services import db
from services.calendar_service import TripService, CalendarEventService, TripBuddyService, MatchingService
from repositories.calendar_repository import (
    CalendarTripRepository,
    CalendarEventRepository,
    CalendarTripBuddyRepository,
    CalendarMatchingRequestRepository,
    CalendarDayRepository,
    CalendarItemRepository,
)
from services.auth_dependencies import get_current_user
from domain.calendar.enums import TripVisibility, TripStatus, EventType
from domain.calendar.calendar_event import CalendarEvent

router = APIRouter(prefix="/calendar", tags=["Calendar"])
_RATE_LIMIT: dict[str, list[dt.datetime]] = {}
RATE_LIMIT_COUNT = 50
RATE_LIMIT_WINDOW = dt.timedelta(minutes=1)


def _rate_limit(key: str):
    now = dt.datetime.now(dt.timezone.utc)
    entries = _RATE_LIMIT.setdefault(key, [])
    entries[:] = [t for t in entries if now - t <= RATE_LIMIT_WINDOW]
    if len(entries) >= RATE_LIMIT_COUNT:
        raise HTTPException(status_code=429, detail="Too many calendar operations")
    entries.append(now)


class TripCreateRequest(BaseModel):
    title: str
    start_date: dt.datetime
    end_date: dt.datetime
    timezone: str | None = Field(default="Asia/Taipei")
    visibility: TripVisibility = TripVisibility.PRIVATE
    status: TripStatus = TripStatus.PLANNING
    resort_id: Optional[str] = None
    resort_name: Optional[str] = None
    region: Optional[str] = None
    people_count: Optional[int] = None
    note: Optional[str] = None


class TripResponse(BaseModel):
    id: str
    title: str
    start_date: dt.datetime
    end_date: dt.datetime
    timezone: str
    visibility: TripVisibility
    status: TripStatus

    class Config:
        from_attributes = True


class EventCreateRequest(BaseModel):
    type: EventType
    title: str
    start_date: dt.datetime
    end_date: dt.datetime
    all_day: bool = False
    description: str | None = None
    trip_id: str | None = None


class EventResponse(BaseModel):
    id: str
    type: EventType
    title: str
    start_date: dt.datetime
    end_date: dt.datetime
    all_day: bool

    class Config:
        from_attributes = True


class BuddyInviteRequest(BaseModel):
    user_id: str
    message: str | None = None


class BuddyRespondRequest(BaseModel):
    accept: bool
    message: str | None = None


class BuddyResponse(BaseModel):
    id: str
    user_id: str
    status: str


class MatchingCreateRequest(BaseModel):
    preferences: dict


class MatchingResponse(BaseModel):
    id: str
    status: str
    results: list[dict] | None



def get_trip_service(db_session: Session = Depends(db.get_db)) -> TripService:
    repo = CalendarTripRepository(db_session)
    day_repo = CalendarDayRepository(db_session)
    item_repo = CalendarItemRepository(db_session)
    return TripService(repo, day_repo=day_repo, item_repo=item_repo)


def get_event_service(db_session: Session = Depends(db.get_db)) -> CalendarEventService:
    repo = CalendarEventRepository(db_session)
    return CalendarEventService(repo)


def get_buddy_service(db_session: Session = Depends(db.get_db)) -> TripBuddyService:
    repo = CalendarTripBuddyRepository(db_session)
    return TripBuddyService(repo)


def get_matching_service(db_session: Session = Depends(db.get_db)) -> MatchingService:
    repo = CalendarMatchingRequestRepository(db_session)
    return MatchingService(repo)


@router.post("/trips", response_model=TripResponse, status_code=201)
def create_trip(
    request: TripCreateRequest,
    current_user = Depends(get_current_user),
    service: TripService = Depends(get_trip_service),
):
    _rate_limit(f"trip:{current_user.user_id}")
    trip = service.create_trip(
        user_id=current_user.user_id,
        title=request.title,
        start_date=request.start_date,
        end_date=request.end_date,
        timezone=request.timezone or "Asia/Taipei",
        visibility=request.visibility,
        status=request.status,
        resort_id=request.resort_id,
        resort_name=request.resort_name,
        region=request.region,
        people_count=request.people_count,
        note=request.note,
    )
    return TripResponse(
        id=str(trip.id),
        title=trip.title,
        start_date=trip.start_date,
        end_date=trip.end_date,
        timezone=trip.timezone,
        visibility=trip.visibility,
        status=trip.status,
    )


@router.get("/trips", response_model=List[TripResponse])
def list_trips(
    current_user = Depends(get_current_user),
    service: TripService = Depends(get_trip_service),
):
    trips = service.list_trips(user_id=current_user.user_id)
    return [
        TripResponse(
            id=str(trip.id),
            title=trip.title,
            start_date=trip.start_date,
            end_date=trip.end_date,
            timezone=trip.timezone,
            visibility=trip.visibility,
            status=trip.status,
        )
        for trip in trips
    ]


@router.post("/events", response_model=EventResponse, status_code=201)
def create_event(
    request: EventCreateRequest,
    current_user = Depends(get_current_user),
    service: CalendarEventService = Depends(get_event_service),
):
    _rate_limit(f"event:{current_user.user_id}")
    event = service.create_event(
        user_id=current_user.user_id,
        type=request.type,
        title=request.title,
        start_date=request.start_date,
        end_date=request.end_date,
        all_day=request.all_day,
        description=request.description,
        trip_id=UUID(request.trip_id) if request.trip_id else None,
    )
    return EventResponse(
        id=str(event.id),
        type=event.type,
        title=event.title,
        start_date=event.start_date,
        end_date=event.end_date,
        all_day=event.all_day,
    )


@router.get("/events", response_model=List[EventResponse])
def list_events(
    current_user = Depends(get_current_user),
    service: CalendarEventService = Depends(get_event_service),
):
    events = service.list_events(user_id=current_user.user_id)
    return [
        EventResponse(
            id=str(event.id),
            type=event.type,
            title=event.title,
            start_date=event.start_date,
            end_date=event.end_date,
            all_day=event.all_day,
        )
        for event in events
    ]


@router.patch("/trips/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: str,
    request: TripCreateRequest,
    current_user = Depends(get_current_user),
    service: TripService = Depends(get_trip_service),
):
    trip = service.get_trip(UUID(trip_id))
    if not trip or trip.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    updated = service.update_trip(
        trip,
        title=request.title,
        start_date=request.start_date,
        end_date=request.end_date,
        timezone=request.timezone,
        visibility=request.visibility,
        status=request.status,
        resort_id=request.resort_id,
        resort_name=request.resort_name,
        region=request.region,
        people_count=request.people_count,
        note=request.note,
    )
    return TripResponse(
        id=str(updated.id),
        title=updated.title,
        start_date=updated.start_date,
        end_date=updated.end_date,
        timezone=updated.timezone,
        visibility=updated.visibility,
        status=updated.status,
    )


@router.post("/trips/{trip_id}/days", response_model=DayResponse, status_code=201)
def add_day(
    trip_id: str,
    request: DayCreateRequest,
    current_user = Depends(get_current_user),
    service: TripService = Depends(get_trip_service),
):
    _rate_limit(f"day:{current_user.user_id}")
    day = service.add_day(
        trip_id=UUID(trip_id),
        day_index=request.day_index,
        label=request.label,
        city=request.city,
        resort_id=request.resort_id,
        resort_name=request.resort_name,
        region=request.region,
        is_ski_day=request.is_ski_day,
    )
    return DayResponse(id=str(day.id), day_index=day.day_index, label=day.label)


@router.get("/trips/{trip_id}/days", response_model=List[DayResponse])
def list_days(
    trip_id: str,
    service: TripService = Depends(get_trip_service),
):
    days = service.list_days(UUID(trip_id))
    return [DayResponse(id=str(d.id), day_index=d.day_index, label=d.label) for d in days]


@router.post("/items", response_model=ItemResponse, status_code=201)
def add_item(
    request: ItemCreateRequest,
    current_user = Depends(get_current_user),
    service: TripService = Depends(get_trip_service),
):
    _rate_limit(f"item:{current_user.user_id}")
    item = service.add_item(
        trip_id=UUID(request.trip_id),
        day_id=UUID(request.day_id),
        type=request.type,
        title=request.title,
        start_time=request.start_time,
        end_time=request.end_time,
        time_hint=request.time_hint,
        location=request.location,
        resort_id=request.resort_id,
        resort_name=request.resort_name,
        note=request.note,
    )
    return ItemResponse(id=str(item.id), title=item.title, type=item.type)


@router.post("/trips/{trip_id}/buddies", response_model=BuddyResponse, status_code=201)
def invite_trip_buddy(
    trip_id: str,
    request: BuddyInviteRequest,
    current_user = Depends(get_current_user),
    service: TripBuddyService = Depends(get_buddy_service),
):
    _rate_limit(f"buddy:{current_user.user_id}")
    buddy = service.invite(
        trip_id=UUID(trip_id),
        inviter_id=current_user.user_id,
        user_id=UUID(request.user_id),
        message=request.message,
    )
    return BuddyResponse(id=str(buddy.id), user_id=str(buddy.user_id), status=buddy.status.value)


@router.post("/trip-buddies/{buddy_id}/respond", response_model=BuddyResponse)
def respond_trip_buddy(
    buddy_id: str,
    request: BuddyRespondRequest,
    service: TripBuddyService = Depends(get_buddy_service),
):
    buddy = service.respond(UUID(buddy_id), request.accept, request.message)
    return BuddyResponse(id=str(buddy.id), user_id=str(buddy.user_id), status=buddy.status.value)


@router.get("/trips/{trip_id}/buddies", response_model=List[BuddyResponse])
def list_trip_buddies(
    trip_id: str,
    service: TripBuddyService = Depends(get_buddy_service),
):
    buddies = service.list_buddies(UUID(trip_id))
    return [BuddyResponse(id=str(b.id), user_id=str(b.user_id), status=b.status.value) for b in buddies]


@router.post("/trips/{trip_id}/matching", response_model=MatchingResponse, status_code=201)
def create_matching_request(
    trip_id: str,
    request: MatchingCreateRequest,
    current_user = Depends(get_current_user),
    service: MatchingService = Depends(get_matching_service),
    captcha_token: str | None = Header(None, alias="X-Captcha-Token"),
):
    _rate_limit(f"matching:{current_user.user_id}")
    verify_captcha(captcha_token)
    req = service.create_request(
        trip_id=UUID(trip_id),
        requester_id=current_user.user_id,
        preferences=request.preferences,
    )
    return MatchingResponse(id=str(req.id), status=req.status.value, results=req.results)


@router.get("/trips/{trip_id}/matching", response_model=List[MatchingResponse])
def list_matching_requests(
    trip_id: str,
    service: MatchingService = Depends(get_matching_service),
):
    reqs = service.list_requests(UUID(trip_id))
    return [MatchingResponse(id=str(r.id), status=r.status.value, results=r.results) for r in reqs]
from services.bot_protection import verify_captcha
class DayCreateRequest(BaseModel):
    day_index: int
    label: str
    city: str | None = None
    resort_id: str | None = None
    resort_name: str | None = None
    region: str | None = None
    is_ski_day: bool = False


class DayResponse(BaseModel):
    id: str
    day_index: int
    label: str


class ItemCreateRequest(BaseModel):
    trip_id: str
    day_id: str
    type: str
    title: str
    start_time: dt.datetime | None = None
    end_time: dt.datetime | None = None
    time_hint: str | None = None
    location: str | None = None
    resort_id: str | None = None
    resort_name: str | None = None
    note: str | None = None


class ItemResponse(BaseModel):
    id: str
    title: str
    type: str
