"""
Shared calendar infrastructure repository.

This module provides the repository for the shared calendar infrastructure.
All applications (Trip Planning, Tour, Matching) use this repository to create and query events.
"""
from __future__ import annotations

from typing import Iterable, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from domain.calendar.calendar_event import CalendarEvent
from models.calendar import CalendarEvent as EventModel


class CalendarEventRepository:
    """Persist and query calendar events for the shared calendar infrastructure."""

    def __init__(self, db: Session):
        self.db = db

    def add(self, event: CalendarEvent) -> CalendarEvent:
        """Add a new calendar event."""
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
            source_app=event.source_app,
            source_id=event.source_id,
            related_trip_id=event.related_trip_id,
            resort_id=event.resort_id,
            google_event_id=event.google_event_id,
            outlook_event_id=event.outlook_event_id,
            matching_id=event.matching_id,
            participants=event.participants,
            reminders=event.reminders,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_event(model)

    def get(self, event_id: UUID) -> Optional[CalendarEvent]:
        """Get a calendar event by ID."""
        model = self.db.query(EventModel).filter(EventModel.id == event_id).first()
        return _to_domain_event(model) if model else None

    def list_for_user(
        self,
        user_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        event_type: Optional[str] = None,
        source_app: Optional[str] = None,
    ) -> list[CalendarEvent]:
        """List calendar events for a user with optional filters."""
        query = self.db.query(EventModel).filter(EventModel.user_id == user_id)
        
        # Apply filters
        if start_date:
            query = query.filter(EventModel.end_date >= start_date)
        if end_date:
            query = query.filter(EventModel.start_date <= end_date)
        if event_type:
            query = query.filter(EventModel.type == event_type)
        if source_app:
            query = query.filter(EventModel.source_app == source_app)
        
        # Order by start date
        models = query.order_by(EventModel.start_date.asc()).all()
        return [_to_domain_event(m) for m in models]

    def list_for_source(
        self,
        source_app: str,
        source_id: str,
    ) -> list[CalendarEvent]:
        """List calendar events for a specific source."""
        models = (
            self.db.query(EventModel)
            .filter(
                and_(
                    EventModel.source_app == source_app,
                    EventModel.source_id == source_id
                )
            )
            .order_by(EventModel.start_date.asc())
            .all()
        )
        return [_to_domain_event(m) for m in models]

    def update(self, event: CalendarEvent) -> CalendarEvent:
        """Update a calendar event."""
        model = self.db.query(EventModel).filter(EventModel.id == event.id).first()
        if not model:
            raise ValueError("Event not found")
        
        # Update fields
        model.title = event.title
        model.description = event.description
        model.start_date = event.start_date
        model.end_date = event.end_date
        model.all_day = event.all_day
        model.timezone = event.timezone
        model.source_app = event.source_app
        model.source_id = event.source_id
        model.related_trip_id = event.related_trip_id
        model.resort_id = event.resort_id
        model.google_event_id = event.google_event_id
        model.outlook_event_id = event.outlook_event_id
        model.matching_id = event.matching_id
        model.participants = event.participants
        model.reminders = event.reminders
        
        self.db.commit()
        self.db.refresh(model)
        return _to_domain_event(model)

    def delete(self, event_id: UUID) -> bool:
        """Delete a calendar event."""
        model = self.db.query(EventModel).filter(EventModel.id == event_id).first()
        if not model:
            return False
        
        self.db.delete(model)
        self.db.commit()
        return True

    def delete_by_source(self, source_app: str, source_id: str) -> int:
        """Delete all events for a specific source."""
        result = (
            self.db.query(EventModel)
            .filter(
                and_(
                    EventModel.source_app == source_app,
                    EventModel.source_id == source_id
                )
            )
            .delete()
        )
        self.db.commit()
        return result


def _to_domain_event(model: EventModel) -> CalendarEvent:
    """Convert ORM model to domain object."""
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
        source_app=model.source_app,
        source_id=model.source_id,
        related_trip_id=model.related_trip_id,
        resort_id=model.resort_id,
        google_event_id=model.google_event_id,
        outlook_event_id=model.outlook_event_id,
        matching_id=model.matching_id,
        participants=tuple(model.participants) if model.participants else tuple(),
        reminders=tuple(model.reminders) if model.reminders else tuple(),
    )
