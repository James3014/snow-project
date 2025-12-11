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
    template_id: str | None = None
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
        template_id: str | None = None,
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

        if start_date.tzinfo is None or end_date.tzinfo is None:
            raise ValueError("start_date and end_date must be timezone-aware")

        if max_buddies < 1:
            raise ValueError("max_buddies must be >= 1")
        if current_buddies < 0:
            raise ValueError("current_buddies must be >= 0")

        return cls(
            user_id=user_id,
            title=title,
            start_date=start_date,
            end_date=end_date,
            timezone=timezone,
            visibility=visibility,
            status=status,
            template_id=template_id,
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
        template_id: str | None,
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
            template_id=template_id,
            resort_id=resort_id,
            resort_name=resort_name,
            region=region,
            people_count=people_count,
            note=note,
            max_buddies=max_buddies,
            current_buddies=current_buddies,
        )

    def update(
        self,
        *,
        title: str | None = None,
        start_date: dt.datetime | None = None,
        end_date: dt.datetime | None = None,
        timezone: str | None = None,
        visibility: TripVisibility | None = None,
        status: TripStatus | None = None,
        template_id: str | None = None,
        resort_id: str | None = None,
        resort_name: str | None = None,
        region: str | None = None,
        people_count: int | None = None,
        note: str | None = None,
        max_buddies: int | None = None,
    ) -> "Trip":
        new_start = start_date or self.start_date
        new_end = end_date or self.end_date
        if new_end < new_start:
            raise ValueError("end_date must be >= start_date")

        updated_max = max_buddies if max_buddies is not None else self.max_buddies
        if updated_max < 1:
            raise ValueError("max_buddies must be >= 1")

        return Trip(
            id=self.id,
            user_id=self.user_id,
            title=title or self.title,
            start_date=new_start,
            end_date=new_end,
            timezone=timezone or self.timezone,
            visibility=visibility or self.visibility,
            status=status or self.status,
            template_id=template_id if template_id is not None else self.template_id,
            resort_id=resort_id if resort_id is not None else self.resort_id,
            resort_name=resort_name if resort_name is not None else self.resort_name,
            region=region if region is not None else self.region,
            people_count=people_count if people_count is not None else self.people_count,
            note=note if note is not None else self.note,
            max_buddies=updated_max,
            current_buddies=self.current_buddies,
        )
