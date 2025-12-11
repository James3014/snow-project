"""
Calendar services (use cases) - built atop repositories.
"""
from __future__ import annotations

import datetime as dt
from uuid import UUID

from platform.user_core.domain.calendar.trip import Trip
from platform.user_core.domain.calendar.calendar_event import CalendarEvent
from platform.user_core.domain.calendar.day import Day
from platform.user_core.domain.calendar.item import Item
from platform.user_core.domain.calendar.trip_buddy import TripBuddy
from platform.user_core.domain.calendar.matching_request import MatchingRequest
from platform.user_core.domain.calendar.enums import TripVisibility, TripStatus, EventType
from platform.user_core.repositories.calendar_repository import (
    CalendarTripRepository,
    CalendarEventRepository,
    CalendarTripBuddyRepository,
    CalendarMatchingRequestRepository,
    CalendarDayRepository,
    CalendarItemRepository,
)


class TripService:
    """Use cases for trips."""

    def __init__(self, repo: CalendarTripRepository, day_repo: CalendarDayRepository | None = None, item_repo: CalendarItemRepository | None = None):
        self.repo = repo
        self.day_repo = day_repo
        self.item_repo = item_repo

    def create_trip(
        self,
        *,
        user_id: UUID,
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
    ) -> Trip:
        trip = Trip.create(
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
        )
        return self.repo.add(trip)

    def list_trips(self, *, user_id: UUID) -> list[Trip]:
        return self.repo.list_for_user(user_id)

    def get_trip(self, trip_id: UUID) -> Trip | None:
        return self.repo.get(trip_id)

    def update_trip(self, trip: Trip, **kwargs) -> Trip:
        updated = trip.update(**kwargs)
        return self.repo.update(updated)

    def add_day(self, *, trip_id: UUID, day_index: int, label: str, **kwargs) -> Day:
        if not self.day_repo:
            raise RuntimeError("Day repository not configured")
        day = Day.create(trip_id=trip_id, day_index=day_index, label=label, **kwargs)
        return self.day_repo.add(day)

    def list_days(self, trip_id: UUID) -> list[Day]:
        if not self.day_repo:
            raise RuntimeError("Day repository not configured")
        return self.day_repo.list_for_trip(trip_id)

    def add_item(
        self,
        *,
        trip_id: UUID,
        day_id: UUID,
        type: str,
        title: str,
        start_time: dt.datetime | None = None,
        end_time: dt.datetime | None = None,
        **kwargs,
    ) -> Item:
        if not self.item_repo:
            raise RuntimeError("Item repository not configured")
        item = Item.create(
            trip_id=trip_id,
            day_id=day_id,
            type=type,
            title=title,
            start_time=start_time,
            end_time=end_time,
            **kwargs,
        )
        return self.item_repo.add(item)

    def list_items(self, day_id: UUID) -> list[Item]:
        if not self.item_repo:
            raise RuntimeError("Item repository not configured")
        return self.item_repo.list_for_day(day_id)


class CalendarEventService:
    """Use cases for calendar events."""

    def __init__(self, repo: CalendarEventRepository):
        self.repo = repo

    def create_event(
        self,
        *,
        user_id: UUID,
        type: EventType,
        title: str,
        start_date: dt.datetime,
        end_date: dt.datetime,
        all_day: bool = False,
        description: str | None = None,
        trip_id: UUID | None = None,
    ) -> CalendarEvent:
        event = CalendarEvent.create(
            user_id=user_id,
            type=type,
            title=title,
            start_date=start_date,
            end_date=end_date,
            all_day=all_day,
            description=description,
            trip_id=trip_id,
        )
        return self.repo.add(event)

    def list_events(self, *, user_id: UUID) -> list[CalendarEvent]:
        return self.repo.list_for_user(user_id)

    def update_event(
        self,
        event_id: UUID,
        *,
        user_id: UUID,
        title: str | None = None,
        start_date: dt.datetime | None = None,
        end_date: dt.datetime | None = None,
        description: str | None = None,
        reminders: list[dict] | None = None,
    ) -> CalendarEvent:
        event = self.repo.get(event_id)
        if not event or event.user_id != user_id:
            raise ValueError("Event not found")
        updated = event.update(
            title=title,
            start_date=start_date,
            end_date=end_date,
            description=description,
            reminders=tuple(reminders) if reminders is not None else None,
        )
        return self.repo.update(updated)


class TripBuddyService:
    """Manage trip buddies."""

    def __init__(self, repo: CalendarTripBuddyRepository):
        self.repo = repo

    def invite(
        self,
        *,
        trip_id: UUID,
        inviter_id: UUID,
        user_id: UUID,
        message: str | None = None,
    ) -> TripBuddy:
        buddy = TripBuddy(
            trip_id=trip_id,
            user_id=user_id,
            inviter_id=inviter_id,
            request_message=message,
        )
        return self.repo.add(buddy)

    def respond(self, buddy_id: UUID, accept: bool, message: str | None = None) -> TripBuddy:
        buddy = self.repo.get(buddy_id)
        if not buddy:
            raise ValueError("Buddy not found")
        updated = buddy.accept() if accept else buddy.decline(message)
        return self.repo.update(updated)

    def list_buddies(self, trip_id: UUID) -> list[TripBuddy]:
        return self.repo.list_for_trip(trip_id)


class MatchingService:
    """Manage matching requests/results."""

    def __init__(self, repo: CalendarMatchingRequestRepository):
        self.repo = repo

    def create_request(
        self,
        *,
        trip_id: UUID,
        requester_id: UUID,
        preferences: dict,
    ) -> MatchingRequest:
        req = MatchingRequest(
            trip_id=trip_id,
            requester_id=requester_id,
            preferences=preferences,
        )
        return self.repo.add(req)

    def complete_request(self, request_id: UUID, results: list[dict]) -> MatchingRequest:
        req = self.repo.get(request_id)
        if not req:
            raise ValueError("Matching request not found")
        updated = req.mark_completed(results)
        return self.repo.update(updated)

    def list_requests(self, trip_id: UUID) -> list[MatchingRequest]:
        return self.repo.list_for_trip(trip_id)
