from __future__ import annotations

import datetime as dt
import uuid
from dataclasses import dataclass, field

from .enums import MatchingStatus


@dataclass(frozen=True)
class MatchingRequest:
    trip_id: uuid.UUID
    requester_id: uuid.UUID
    preferences: dict
    status: MatchingStatus = MatchingStatus.PENDING
    results: list[dict] | None = None
    created_at: dt.datetime = field(default_factory=lambda: dt.datetime.now(dt.timezone.utc))
    completed_at: dt.datetime | None = None
    id: uuid.UUID = field(default_factory=uuid.uuid4)

    def mark_completed(self, results: list[dict]) -> "MatchingRequest":
        return MatchingRequest(
            trip_id=self.trip_id,
            requester_id=self.requester_id,
            preferences=self.preferences,
            status=MatchingStatus.COMPLETED,
            results=results,
            created_at=self.created_at,
            completed_at=dt.datetime.now(dt.timezone.utc),
            id=self.id,
        )
