from __future__ import annotations

import datetime as dt
import uuid
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Item:
    day_id: uuid.UUID
    trip_id: uuid.UUID
    type: str
    title: str
    start_time: dt.datetime | None = None
    end_time: dt.datetime | None = None
    time_hint: str | None = None
    location: str | None = None
    resort_id: str | None = None
    resort_name: str | None = None
    note: str | None = None
    id: uuid.UUID = field(default_factory=uuid.uuid4)

    @classmethod
    def create(
        cls,
        day_id: uuid.UUID,
        trip_id: uuid.UUID,
        type: str,
        title: str,
        start_time: dt.datetime | None = None,
        end_time: dt.datetime | None = None,
        **kwargs,
    ) -> "Item":
        if start_time and start_time.tzinfo is None:
            raise ValueError("start_time must be timezone-aware")
        if end_time and end_time.tzinfo is None:
            raise ValueError("end_time must be timezone-aware")
        if start_time and end_time and end_time < start_time:
            raise ValueError("end_time must be >= start_time")
        return cls(day_id=day_id, trip_id=trip_id, type=type, title=title, start_time=start_time, end_time=end_time, **kwargs)
