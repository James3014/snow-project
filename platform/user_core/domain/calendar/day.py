from __future__ import annotations

import uuid
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Day:
    trip_id: uuid.UUID
    day_index: int
    label: str
    city: str | None = None
    resort_id: str | None = None
    resort_name: str | None = None
    region: str | None = None
    is_ski_day: bool = False
    id: uuid.UUID = field(default_factory=uuid.uuid4)

    @classmethod
    def create(
        cls,
        trip_id: uuid.UUID,
        day_index: int,
        label: str,
        **kwargs,
    ) -> "Day":
        if day_index < 0:
            raise ValueError("day_index must be >= 0")
        return cls(trip_id=trip_id, day_index=day_index, label=label, **kwargs)

    def update(self, *, label: str | None = None, is_ski_day: bool | None = None, **kwargs) -> "Day":
        return Day(
            id=self.id,
            trip_id=self.trip_id,
            day_index=self.day_index,
            label=label or self.label,
            city=kwargs.get("city", self.city),
            resort_id=kwargs.get("resort_id", self.resort_id),
            resort_name=kwargs.get("resort_name", self.resort_name),
            region=kwargs.get("region", self.region),
            is_ski_day=is_ski_day if is_ski_day is not None else self.is_ski_day,
        )
