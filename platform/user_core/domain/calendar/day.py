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
