"""
Repositories for calendar domain.
"""
from __future__ import annotations

from typing import Iterable
from uuid import UUID

from sqlalchemy.orm import Session

from platform.user_core.domain.calendar.trip import Trip
from platform.user_core.domain.calendar.calendar_event import CalendarEvent
from platform.user_core.domain.calendar.trip_buddy import TripBuddy
from platform.user_core.domain.calendar.matching_request import MatchingRequest
from platform.user_core.domain.calendar.day import Day
from platform.user_core.domain.calendar.item import Item
from platform.user_core.models.calendar import (
    CalendarTrip,
    CalendarDay as DayModel,
    CalendarItem as ItemModel,
    CalendarEvent as EventModel,
    CalendarTripBuddy as TripBuddyModel,
    CalendarMatchingRequest as MatchingModel,
)


class CalendarTripRepository:
    """Persist calendar trips."""

    def __init__(self, db: Session):
        self.db = db

    def add(self, trip: Trip) -> Trip:
        model = CalendarTrip(
            id=trip.id,
            user_id=trip.user_id,
            title=trip.title,
            template_id=trip.template_id,
            start_date=trip.start_date,
            end_date=trip.end_date,
            timezone=trip.timezone,
            visibility=trip.visibility,
            status=trip.status,
            resort_id=trip.resort_id,
            resort_name=trip.resort_name,
            region=trip.region,
            people_count=trip.people_count,
            note=trip.note,
            max_buddies=trip.max_buddies,
            current_buddies=trip.current_buddies,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_trip(model)

    def get(self, trip_id: UUID) -> Trip | None:
        model = self.db.query(CalendarTrip).filter(CalendarTrip.id == trip_id).first()
        return _to_domain_trip(model) if model else None

    def list_for_user(self, user_id: UUID) -> list[Trip]:
        models = (
            self.db.query(CalendarTrip)
            .filter(CalendarTrip.user_id == user_id)
            .order_by(CalendarTrip.start_date.asc())
            .all()
        )
        return [_to_domain_trip(m) for m in models]

    def update(self, trip: Trip) -> Trip:
        model = self.db.query(CalendarTrip).filter(CalendarTrip.id == trip.id).first()
        if not model:
            raise ValueError("Trip not found")
        model.title = trip.title
        model.template_id = trip.template_id
        model.start_date = trip.start_date
        model.end_date = trip.end_date
        model.timezone = trip.timezone
        model.visibility = trip.visibility
        model.status = trip.status
        model.resort_id = trip.resort_id
        model.resort_name = trip.resort_name
        model.region = trip.region
        model.people_count = trip.people_count
        model.note = trip.note
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_trip(model)

    def get(self, trip_id: UUID) -> Trip | None:
        model = self.db.query(CalendarTrip).filter(CalendarTrip.id == trip_id).first()
        return _to_domain_trip(model) if model else None


def _to_domain_trip(model: CalendarTrip) -> Trip:
    return Trip.from_persistence(
        id=model.id,
        user_id=model.user_id,
        title=model.title,
        start_date=model.start_date,
        end_date=model.end_date,
        timezone=model.timezone,
        visibility=model.visibility,
        status=model.status,
        template_id=model.template_id,
        resort_id=model.resort_id,
        resort_name=model.resort_name,
        region=model.region,
        people_count=model.people_count,
        note=model.note,
        max_buddies=model.max_buddies,
        current_buddies=model.current_buddies,
    )


class CalendarDayRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, day: Day) -> Day:
        model = DayModel(
            id=day.id,
            trip_id=day.trip_id,
            day_index=day.day_index,
            label=day.label,
            city=day.city,
            resort_id=day.resort_id,
            resort_name=day.resort_name,
            region=day.region,
            is_ski_day=day.is_ski_day,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_day(model)

    def list_for_trip(self, trip_id: UUID) -> list[Day]:
        models = self.db.query(DayModel).filter(DayModel.trip_id == trip_id).order_by(DayModel.day_index.asc()).all()
        return [_to_domain_day(m) for m in models]


def _to_domain_day(model: DayModel) -> Day:
    return Day(
        id=model.id,
        trip_id=model.trip_id,
        day_index=model.day_index,
        label=model.label,
        city=model.city,
        resort_id=model.resort_id,
        resort_name=model.resort_name,
        region=model.region,
        is_ski_day=model.is_ski_day,
    )


class CalendarItemRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, item: Item) -> Item:
        model = ItemModel(
            id=item.id,
            trip_id=item.trip_id,
            day_id=item.day_id,
            type=item.type,
            title=item.title,
            start_time=item.start_time,
            end_time=item.end_time,
            time_hint=item.time_hint,
            location=item.location,
            resort_id=item.resort_id,
            resort_name=item.resort_name,
            note=item.note,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_item(model)

    def list_for_day(self, day_id: UUID) -> list[Item]:
        models = (
            self.db.query(ItemModel)
            .filter(ItemModel.day_id == day_id)
            .order_by(ItemModel.start_time.asc())
            .all()
        )
        return [_to_domain_item(m) for m in models]


def _to_domain_item(model: ItemModel) -> Item:
    return Item(
        id=model.id,
        day_id=model.day_id,
        trip_id=model.trip_id,
        type=model.type,
        title=model.title,
        start_time=model.start_time,
        end_time=model.end_time,
        time_hint=model.time_hint,
        location=model.location,
        resort_id=model.resort_id,
        resort_name=model.resort_name,
        note=model.note,
    )


class CalendarEventRepository:
    """Persist calendar events."""

    def __init__(self, db: Session):
        self.db = db

    def add(self, event: CalendarEvent) -> CalendarEvent:
        model = EventModel(
            id=event.id,
            user_id=event.user_id,
            type=event.type,
            title=event.title,
            description=event.description,
            start_date=event.start_date,
            end_date=event.end_date,
            all_day=event.all_day,
            timezone=event.timezone,
            trip_id=event.trip_id,
            resort_id=event.resort_id,
            google_event_id=event.google_event_id,
            outlook_event_id=event.outlook_event_id,
            matching_id=event.matching_id,
            participants=list(event.participants),
            reminders=list(event.reminders),
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_event(model)

    def list_for_user(self, user_id: UUID) -> list[CalendarEvent]:
        models = (
            self.db.query(EventModel)
            .filter(EventModel.user_id == user_id)
            .order_by(EventModel.start_date.asc())
            .all()
        )
        return [_to_domain_event(m) for m in models]

    def get(self, event_id: UUID) -> CalendarEvent | None:
        model = self.db.query(EventModel).filter(EventModel.id == event_id).first()
        return _to_domain_event(model) if model else None

    def update(self, event: CalendarEvent) -> CalendarEvent:
        model = self.db.query(EventModel).filter(EventModel.id == event.id).first()
        if not model:
            raise ValueError("Event not found")
        model.title = event.title
        model.description = event.description
        model.start_date = event.start_date
        model.end_date = event.end_date
        model.all_day = event.all_day
        model.reminders = list(event.reminders)
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_event(model)


def _to_domain_event(model: EventModel) -> CalendarEvent:
    return CalendarEvent(
        id=model.id,
        user_id=model.user_id,
        type=model.type,
        title=model.title,
        description=model.description,
        start_date=model.start_date,
        end_date=model.end_date,
        all_day=model.all_day,
        timezone=model.timezone,
        trip_id=model.trip_id,
        resort_id=model.resort_id,
        google_event_id=model.google_event_id,
        outlook_event_id=model.outlook_event_id,
        matching_id=model.matching_id,
        participants=tuple(model.participants or []),
        reminders=tuple(model.reminders or []),
    )


class CalendarTripBuddyRepository:
    """Persist trip buddies."""

    def __init__(self, db: Session):
        self.db = db

    def add(self, buddy: TripBuddy) -> TripBuddy:
        model = TripBuddyModel(
            id=buddy.id,
            trip_id=buddy.trip_id,
            user_id=buddy.user_id,
            inviter_id=buddy.inviter_id,
            status=buddy.status,
            role=buddy.role,
            request_message=buddy.request_message,
            response_message=buddy.response_message,
            requested_at=buddy.requested_at,
            responded_at=buddy.responded_at,
            joined_at=buddy.joined_at,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_buddy(model)

    def update(self, buddy: TripBuddy) -> TripBuddy:
        model = self.db.query(TripBuddyModel).filter(TripBuddyModel.id == buddy.id).first()
        if not model:
            raise ValueError("Buddy not found")
        model.status = buddy.status
        model.role = buddy.role
        model.request_message = buddy.request_message
        model.response_message = buddy.response_message
        model.requested_at = buddy.requested_at
        model.responded_at = buddy.responded_at
        model.joined_at = buddy.joined_at
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_buddy(model)

    def get(self, buddy_id: UUID) -> TripBuddy | None:
        model = self.db.query(TripBuddyModel).filter(TripBuddyModel.id == buddy_id).first()
        return _to_domain_buddy(model) if model else None

    def list_for_trip(self, trip_id: UUID) -> list[TripBuddy]:
        models = (
            self.db.query(TripBuddyModel)
            .filter(TripBuddyModel.trip_id == trip_id)
            .all()
        )
        return [_to_domain_buddy(m) for m in models]


def _to_domain_buddy(model: TripBuddyModel) -> TripBuddy:
    return TripBuddy(
        id=model.id,
        trip_id=model.trip_id,
        user_id=model.user_id,
        inviter_id=model.inviter_id,
        status=model.status,
        role=model.role,
        request_message=model.request_message,
        response_message=model.response_message,
        requested_at=model.requested_at,
        responded_at=model.responded_at,
        joined_at=model.joined_at,
    )


class CalendarMatchingRequestRepository:
    """Persist matching requests."""

    def __init__(self, db: Session):
        self.db = db

    def add(self, req: MatchingRequest) -> MatchingRequest:
        model = MatchingModel(
            id=req.id,
            trip_id=req.trip_id,
            requester_id=req.requester_id,
            preferences=req.preferences,
            status=req.status,
            results=req.results,
            created_at=req.created_at,
            completed_at=req.completed_at,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_matching(model)

    def update(self, req: MatchingRequest) -> MatchingRequest:
        model = self.db.query(MatchingModel).filter(MatchingModel.id == req.id).first()
        if not model:
            raise ValueError("Matching request not found")
        model.status = req.status
        model.results = req.results
        model.completed_at = req.completed_at
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_matching(model)

    def list_for_trip(self, trip_id: UUID) -> list[MatchingRequest]:
        models = self.db.query(MatchingModel).filter(MatchingModel.trip_id == trip_id).all()
        return [_to_domain_matching(m) for m in models]

    def get(self, request_id: UUID) -> MatchingRequest | None:
        model = self.db.query(MatchingModel).filter(MatchingModel.id == request_id).first()
        return _to_domain_matching(model) if model else None


def _to_domain_matching(model: MatchingModel) -> MatchingRequest:
    return MatchingRequest(
        id=model.id,
        trip_id=model.trip_id,
        requester_id=model.requester_id,
        preferences=model.preferences,
        status=model.status,
        results=model.results,
        created_at=model.created_at,
        completed_at=model.completed_at,
    )
