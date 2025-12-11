from __future__ import annotations

import datetime as dt
import uuid
from dataclasses import dataclass, field

from .enums import BuddyStatus, BuddyRole


@dataclass(frozen=True)
class TripBuddy:
    trip_id: uuid.UUID
    user_id: uuid.UUID
    inviter_id: uuid.UUID
    status: BuddyStatus = BuddyStatus.PENDING
    role: BuddyRole = BuddyRole.BUDDY
    request_message: str | None = None
    response_message: str | None = None
    requested_at: dt.datetime = field(default_factory=lambda: dt.datetime.now(dt.timezone.utc))
    responded_at: dt.datetime | None = None
    joined_at: dt.datetime | None = None
    id: uuid.UUID = field(default_factory=uuid.uuid4)

    def accept(self) -> "TripBuddy":
        return self._with_status(BuddyStatus.ACCEPTED, joined=True)

    def decline(self, message: str | None = None) -> "TripBuddy":
        return self._with_status(BuddyStatus.DECLINED, response_message=message)

    def _with_status(
        self,
        status: BuddyStatus,
        *,
        joined: bool = False,
        response_message: str | None = None,
    ) -> "TripBuddy":
        return TripBuddy(
            trip_id=self.trip_id,
            user_id=self.user_id,
            inviter_id=self.inviter_id,
            status=status,
            role=self.role,
            request_message=self.request_message,
            response_message=response_message or self.response_message,
            requested_at=self.requested_at,
            responded_at=dt.datetime.now(dt.timezone.utc),
            joined_at=dt.datetime.now(dt.timezone.utc) if joined else self.joined_at,
            id=self.id,
        )
