from __future__ import annotations

import datetime as dt
import uuid
from dataclasses import dataclass, field

from .enums import EventType


@dataclass(frozen=True)
class CalendarEvent:
    user_id: uuid.UUID
    type: EventType
    title: str
    start_date: dt.datetime
    end_date: dt.datetime
    description: str | None = None
    all_day: bool = False
    timezone: str = "Asia/Taipei"
    
    # Source tracking - which application created this event
    source_app: str = "unknown"
    source_id: str = ""
    
    # Optional relations
    trip_id: uuid.UUID | None = None
    related_trip_id: str | None = None
    resort_id: str | None = None
    
    # External calendar sync
    google_event_id: str | None = None
    outlook_event_id: str | None = None
    
    # Matching related
    matching_id: uuid.UUID | None = None
    participants: tuple[uuid.UUID, ...] = field(default_factory=tuple)
    
    # Reminders system
    reminders: tuple[dict, ...] = field(default_factory=tuple)
    
    id: uuid.UUID = field(default_factory=uuid.uuid4)

    @classmethod
    def create(
        cls,
        user_id: uuid.UUID,
        type: EventType,
        title: str,
        start_date: dt.datetime,
        end_date: dt.datetime,
        source_app: str,
        source_id: str,
        all_day: bool = False,
        **kwargs,
    ) -> "CalendarEvent":
        if start_date.tzinfo is None or end_date.tzinfo is None:
            raise ValueError("start/end must be timezone-aware")
        if end_date < start_date:
            raise ValueError("end_date must be >= start_date")
        if all_day and start_date.time() != dt.time(0, 0):
            raise ValueError("all-day events must start at 00:00")
        if not source_app or not source_id:
            raise ValueError("source_app and source_id are required")
        
        participants = tuple(kwargs.pop("participants", ()))
        reminders = tuple(kwargs.pop("reminders", ()))
        return cls(
            user_id=user_id,
            type=type,
            title=title,
            start_date=start_date,
            end_date=end_date,
            all_day=all_day,
            source_app=source_app,
            source_id=source_id,
            participants=participants,
            reminders=reminders,
            **kwargs,
        )

    def update(
        self,
        *,
        title: str | None = None,
        start_date: dt.datetime | None = None,
        end_date: dt.datetime | None = None,
        description: str | None = None,
        reminders: tuple[dict, ...] | None = None,
        source_app: str | None = None,
        source_id: str | None = None,
    ) -> "CalendarEvent":
        new_start = start_date or self.start_date
        new_end = end_date or self.end_date
        if new_end < new_start:
            raise ValueError("end_date must be >= start_date")
        return CalendarEvent(
            id=self.id,
            user_id=self.user_id,
            type=self.type,
            title=title or self.title,
            start_date=new_start,
            end_date=new_end,
            description=description if description is not None else self.description,
            all_day=self.all_day,
            timezone=self.timezone,
            source_app=source_app or self.source_app,
            source_id=source_id or self.source_id,
            trip_id=self.trip_id,
            related_trip_id=self.related_trip_id,
            resort_id=self.resort_id,
            google_event_id=self.google_event_id,
            outlook_event_id=self.outlook_event_id,
            matching_id=self.matching_id,
            participants=self.participants,
            reminders=reminders if reminders is not None else self.reminders,
        )
