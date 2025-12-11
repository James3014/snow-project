"""Shared Calendar Infrastructure API endpoints."""
from __future__ import annotations

import datetime as dt
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config.settings import settings
from domain.calendar.enums import EventType
from repositories.calendar_repository import CalendarEventRepository
from services import db
from services.auth_dependencies import get_current_user
from services.bot_protection import verify_captcha
from services.calendar_service import CalendarService

try:  # pragma: no cover - optional dependency
    import redis
except Exception:  # pragma: no cover - redis import failure
    redis = None  # type: ignore


router = APIRouter(prefix="/calendar", tags=["Calendar"])
_RATE_LIMIT: dict[str, list[dt.datetime]] = {}
RATE_LIMIT_COUNT = 50
RATE_LIMIT_WINDOW = dt.timedelta(minutes=1)

if redis and settings.redis_url:
    try:
        _RL_CLIENT = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    except Exception:  # pragma: no cover - redis connection fallback
        _RL_CLIENT = None
else:
    _RL_CLIENT = None


def _rate_limit(key: str) -> None:
    now = dt.datetime.now(dt.timezone.utc)
    if _RL_CLIENT:
        window_ms = int(RATE_LIMIT_WINDOW.total_seconds() * 1000)
        now_ms = int(now.timestamp() * 1000)
        key_name = f"calendar:rl:{key}"
        pipeline = _RL_CLIENT.pipeline()
        pipeline.zremrangebyscore(key_name, 0, now_ms - window_ms)
        pipeline.zcard(key_name)
        pipeline.zadd(key_name, {str(now_ms): now_ms})
        pipeline.expire(key_name, int(RATE_LIMIT_WINDOW.total_seconds()))
        try:
            _, count, _, _ = pipeline.execute()
            if count >= RATE_LIMIT_COUNT:
                raise HTTPException(status_code=429, detail="Too many calendar operations")
            return
        except Exception:
            pass

    entries = _RATE_LIMIT.setdefault(key, [])
    entries[:] = [t for t in entries if now - t <= RATE_LIMIT_WINDOW]
    if len(entries) >= RATE_LIMIT_COUNT:
        raise HTTPException(status_code=429, detail="Too many calendar operations")
    entries.append(now)


# ==================== Request/Response Models ====================

class EventCreateRequest(BaseModel):
    """Request model for creating a calendar event."""
    type: EventType
    title: str
    start_date: dt.datetime
    end_date: dt.datetime
    all_day: bool = False
    description: Optional[str] = None
    timezone: str = Field(default="Asia/Taipei")
    
    # Source tracking
    source_app: str = Field(..., min_length=1, max_length=50)
    source_id: str = Field(..., min_length=1, max_length=100)
    
    # Optional relations
    related_trip_id: Optional[str] = None
    resort_id: Optional[str] = None
    
    # External calendar sync
    google_event_id: Optional[str] = None
    outlook_event_id: Optional[str] = None
    
    # Matching related
    matching_id: Optional[str] = None
    participants: Optional[List[str]] = None
    
    # Reminders
    reminders: Optional[List[dict]] = None


class EventUpdateRequest(BaseModel):
    """Request model for updating a calendar event."""
    title: Optional[str] = None
    start_date: Optional[dt.datetime] = None
    end_date: Optional[dt.datetime] = None
    description: Optional[str] = None
    all_day: Optional[bool] = None
    timezone: Optional[str] = None
    related_trip_id: Optional[str] = None
    resort_id: Optional[str] = None
    google_event_id: Optional[str] = None
    outlook_event_id: Optional[str] = None
    matching_id: Optional[str] = None
    participants: Optional[List[str]] = None
    reminders: Optional[List[dict]] = None


class EventResponse(BaseModel):
    """Response model for calendar events."""
    id: str
    type: EventType
    title: str
    start_date: dt.datetime
    end_date: dt.datetime
    all_day: bool
    timezone: str
    source_app: str
    source_id: str
    related_trip_id: Optional[str]
    resort_id: Optional[str]
    google_event_id: Optional[str]
    outlook_event_id: Optional[str]
    matching_id: Optional[str]
    participants: Optional[List[str]]
    reminders: Optional[List[dict]]
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True


# ==================== Dependency Injection ====================

def get_calendar_service(db_session: Session = Depends(db.get_db)) -> CalendarService:
    """Get calendar service with database session."""
    repo = CalendarEventRepository(db_session)
    return CalendarService(repo)


# ==================== API Endpoints ====================

@router.post("/events", response_model=EventResponse, status_code=201)
def create_event(
    request: EventCreateRequest,
    current_user = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service),
    captcha_token: str | None = Header(None, alias="X-Captcha-Token"),
):
    """Create a new calendar event."""
    _rate_limit(f"event:{current_user.user_id}")
    verify_captcha(captcha_token)
    
    event = service.create_event(
        user_id=UUID(current_user.user_id),
        event_type=request.type,
        title=request.title,
        start_date=request.start_date,
        end_date=request.end_date,
        source_app=request.source_app,
        source_id=request.source_id,
        description=request.description,
        all_day=request.all_day,
        timezone=request.timezone,
        related_trip_id=request.related_trip_id,
        resort_id=request.resort_id,
        google_event_id=request.google_event_id,
        outlook_event_id=request.outlook_event_id,
        matching_id=UUID(request.matching_id) if request.matching_id else None,
        participants=request.participants,
        reminders=request.reminders,
    )
    
    return EventResponse(
        id=str(event.id),
        type=event.type,
        title=event.title,
        start_date=event.start_date,
        end_date=event.end_date,
        all_day=event.all_day,
        timezone=event.timezone,
        source_app=event.source_app,
        source_id=event.source_id,
        related_trip_id=event.related_trip_id,
        resort_id=event.resort_id,
        google_event_id=event.google_event_id,
        outlook_event_id=event.outlook_event_id,
        matching_id=str(event.matching_id) if event.matching_id else None,
        participants=list(event.participants) if event.participants else None,
        reminders=list(event.reminders) if event.reminders else None,
        created_at=event.created_at if hasattr(event, 'created_at') else dt.datetime.now(dt.timezone.utc),
        updated_at=event.updated_at if hasattr(event, 'updated_at') else dt.datetime.now(dt.timezone.utc),
    )


@router.get("/events", response_model=List[EventResponse])
def list_events(
    current_user = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service),
    start_date: Optional[dt.datetime] = None,
    end_date: Optional[dt.datetime] = None,
    event_type: Optional[str] = None,
    source_app: Optional[str] = None,
):
    """List calendar events for the current user."""
    events = service.list_events(
        user_id=UUID(current_user.user_id),
        start_date=start_date,
        end_date=end_date,
        event_type=event_type,
        source_app=source_app,
    )
    
    return [
        EventResponse(
            id=str(e.id),
            type=e.type,
            title=e.title,
            start_date=e.start_date,
            end_date=e.end_date,
            all_day=e.all_day,
            timezone=e.timezone,
            source_app=e.source_app,
            source_id=e.source_id,
            related_trip_id=e.related_trip_id,
            resort_id=e.resort_id,
            google_event_id=e.google_event_id,
            outlook_event_id=e.outlook_event_id,
            matching_id=str(e.matching_id) if e.matching_id else None,
            participants=list(e.participants) if e.participants else None,
            reminders=list(e.reminders) if e.reminders else None,
            created_at=e.created_at if hasattr(e, 'created_at') else dt.datetime.now(dt.timezone.utc),
            updated_at=e.updated_at if hasattr(e, 'updated_at') else dt.datetime.now(dt.timezone.utc),
        )
        for e in events
    ]


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(
    event_id: str,
    current_user = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service),
):
    """Get a specific calendar event."""
    event = service.get_event(UUID(event_id))
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify ownership
    if str(event.user_id) != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this event")
    
    return EventResponse(
        id=str(event.id),
        type=event.type,
        title=event.title,
        start_date=event.start_date,
        end_date=event.end_date,
        all_day=event.all_day,
        timezone=event.timezone,
        source_app=event.source_app,
        source_id=event.source_id,
        related_trip_id=event.related_trip_id,
        resort_id=event.resort_id,
        google_event_id=event.google_event_id,
        outlook_event_id=event.outlook_event_id,
        matching_id=str(event.matching_id) if event.matching_id else None,
        participants=list(event.participants) if event.participants else None,
        reminders=list(event.reminders) if event.reminders else None,
        created_at=event.created_at if hasattr(event, 'created_at') else dt.datetime.now(dt.timezone.utc),
        updated_at=event.updated_at if hasattr(event, 'updated_at') else dt.datetime.now(dt.timezone.utc),
    )


@router.patch("/events/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    request: EventUpdateRequest,
    current_user = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service),
):
    """Update a calendar event."""
    # Get existing event
    event = service.get_event(UUID(event_id))
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify ownership
    if str(event.user_id) != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this event")
    
    # Update event
    updated_event = service.update_event(
        event_id=UUID(event_id),
        title=request.title,
        start_date=request.start_date,
        end_date=request.end_date,
        description=request.description,
        all_day=request.all_day,
        timezone=request.timezone,
        related_trip_id=request.related_trip_id,
        resort_id=request.resort_id,
        google_event_id=request.google_event_id,
        outlook_event_id=request.outlook_event_id,
        matching_id=UUID(request.matching_id) if request.matching_id else None,
        participants=request.participants,
        reminders=request.reminders,
    )
    
    return EventResponse(
        id=str(updated_event.id),
        type=updated_event.type,
        title=updated_event.title,
        start_date=updated_event.start_date,
        end_date=updated_event.end_date,
        all_day=updated_event.all_day,
        timezone=updated_event.timezone,
        source_app=updated_event.source_app,
        source_id=updated_event.source_id,
        related_trip_id=updated_event.related_trip_id,
        resort_id=updated_event.resort_id,
        google_event_id=updated_event.google_event_id,
        outlook_event_id=updated_event.outlook_event_id,
        matching_id=str(updated_event.matching_id) if updated_event.matching_id else None,
        participants=list(updated_event.participants) if updated_event.participants else None,
        reminders=list(updated_event.reminders) if updated_event.reminders else None,
        created_at=updated_event.created_at if hasattr(updated_event, 'created_at') else dt.datetime.now(dt.timezone.utc),
        updated_at=updated_event.updated_at if hasattr(updated_event, 'updated_at') else dt.datetime.now(dt.timezone.utc),
    )


@router.delete("/events/{event_id}", status_code=204)
def delete_event(
    event_id: str,
    current_user = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service),
):
    """Delete a calendar event."""
    # Get existing event
    event = service.get_event(UUID(event_id))
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify ownership
    if str(event.user_id) != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")
    
    # Delete event
    success = service.delete_event(UUID(event_id))
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete event")


@router.get("/events/source/{source_app}/{source_id}", response_model=List[EventResponse])
def list_events_for_source(
    source_app: str,
    source_id: str,
    current_user = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service),
):
    """List calendar events for a specific source."""
    events = service.list_events_for_source(
        source_app=source_app,
        source_id=source_id,
    )
    
    # Filter by current user
    user_events = [e for e in events if str(e.user_id) == current_user.user_id]
    
    return [
        EventResponse(
            id=str(e.id),
            type=e.type,
            title=e.title,
            start_date=e.start_date,
            end_date=e.end_date,
            all_day=e.all_day,
            timezone=e.timezone,
            source_app=e.source_app,
            source_id=e.source_id,
            related_trip_id=e.related_trip_id,
            resort_id=e.resort_id,
            google_event_id=e.google_event_id,
            outlook_event_id=e.outlook_event_id,
            matching_id=str(e.matching_id) if e.matching_id else None,
            participants=list(e.participants) if e.participants else None,
            reminders=list(e.reminders) if e.reminders else None,
            created_at=e.created_at if hasattr(e, 'created_at') else dt.datetime.now(dt.timezone.utc),
            updated_at=e.updated_at if hasattr(e, 'updated_at') else dt.datetime.now(dt.timezone.utc),
        )
        for e in user_events
    ]
