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
    trip_id: uuid.UUID | None = None
    resort_id: str | None = None
    google_event_id: str | None = None
    outlook_event_id: str | None = None
    matching_id: uuid.UUID | None = None
    participants: tuple[uuid.UUID, ...] = field(default_factory=tuple)
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
        all_day: bool = False,
        **kwargs,
    ) -> "CalendarEvent":
        if start_date.tzinfo is None or end_date.tzinfo is None:
            raise ValueError("start/end must be timezone-aware")
        if end_date < start_date:
            raise ValueError("end_date must be >= start_date")
        if all_day and start_date.time() != dt.time(0, 0):
            raise ValueError("all-day events must start at 00:00")
        participants = tuple(kwargs.pop("participants", ()))
        reminders = tuple(kwargs.pop("reminders", ()))
        return cls(
            user_id=user_id,
            type=type,
            title=title,
            start_date=start_date,
            end_date=end_date,
            all_day=all_day,
            participants=participants,
            reminders=reminders,
            **kwargs,
        )
