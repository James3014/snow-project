from __future__ import annotations

import datetime as dt
import uuid
from dataclasses import dataclass, field

from .enums import TripVisibility, TripStatus


@dataclass(frozen=True)
class Trip:
    user_id: uuid.UUID
    title: str
    start_date: dt.datetime
    end_date: dt.datetime
    timezone: str = "Asia/Taipei"
    visibility: TripVisibility = TripVisibility.PRIVATE
    status: TripStatus = TripStatus.PLANNING
    resort_id: str | None = None
    resort_name: str | None = None
    region: str | None = None
    people_count: int | None = None
    note: str | None = None
    max_buddies: int = 1
    current_buddies: int = 0
    id: uuid.UUID = field(default_factory=uuid.uuid4)

    @classmethod
    def create(
        cls,
        user_id: uuid.UUID,
        title: str,
        start_date: dt.datetime,
        end_date: dt.datetime,
        timezone: str = "Asia/Taipei",
        visibility: TripVisibility = TripVisibility.PRIVATE,
        status: TripStatus = TripStatus.PLANNING,
        resort_id: str | None = None,
        resort_name: str | None = None,
        region: str | None = None,
        people_count: int | None = None,
        note: str | None = None,
        max_buddies: int = 1,
        current_buddies: int = 0,
    ) -> "Trip":
        if end_date < start_date:
            raise ValueError("end_date must be >= start_date")

        # enforce timezone-aware datetimes
        if start_date.tzinfo is None or end_date.tzinfo is None:
            raise ValueError("start_date and end_date must be timezone-aware")

        return cls(
            user_id=user_id,
            title=title,
            start_date=start_date,
            end_date=end_date,
            timezone=timezone,
            visibility=visibility,
            status=status,
            resort_id=resort_id,
            resort_name=resort_name,
            region=region,
            people_count=people_count,
            note=note,
            max_buddies=max_buddies,
            current_buddies=current_buddies,
            resort_id=resort_id,
            resort_name=resort_name,
            region=region,
            people_count=people_count,
            note=note,
            max_buddies=max_buddies,
            current_buddies=current_buddies,
        )

    @classmethod
    def from_persistence(
        cls,
        *,
        id: uuid.UUID,
        user_id: uuid.UUID,
        title: str,
        start_date: dt.datetime,
        end_date: dt.datetime,
        timezone: str,
        visibility: TripVisibility,
        status: TripStatus,
        resort_id: str | None,
        resort_name: str | None,
        region: str | None,
        people_count: int | None,
        note: str | None,
        max_buddies: int,
        current_buddies: int,
    ) -> "Trip":
        return cls(
            id=id,
            user_id=user_id,
            title=title,
            start_date=start_date,
            end_date=end_date,
            timezone=timezone,
            visibility=visibility,
            status=status,
        )
