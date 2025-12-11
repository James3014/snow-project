"""
Shared calendar infrastructure services (use cases).

This module provides the services for the shared calendar infrastructure.
All applications (Trip Planning, Tour, Matching) use these services to create and query events.
"""
from __future__ import annotations

import datetime as dt
from typing import Optional, List
from uuid import UUID

from domain.calendar.calendar_event import CalendarEvent
from domain.calendar.enums import EventType
from repositories.calendar_repository import CalendarEventRepository
from services.interfaces.calendar_service_interface import CalendarServiceInterface


class CalendarService(CalendarServiceInterface):
    """Use cases for shared calendar events.
    
    Concrete implementation of CalendarServiceInterface.
    """

    def __init__(self, repo: CalendarEventRepository):
        self.repo = repo

    def create_event(
        self,
        *,
        user_id: UUID,
        event_type: EventType,
        title: str,
        start_date: dt.datetime,
        end_date: dt.datetime,
        source_app: str,
        source_id: str,
        description: Optional[str] = None,
        all_day: bool = False,
        timezone: str = "Asia/Taipei",
        related_trip_id: Optional[str] = None,
        resort_id: Optional[str] = None,
        google_event_id: Optional[str] = None,
        outlook_event_id: Optional[str] = None,
        matching_id: Optional[UUID] = None,
        participants: Optional[List[UUID]] = None,
        reminders: Optional[List[dict]] = None,
    ) -> CalendarEvent:
        """Create a new calendar event."""
        event = CalendarEvent.create(
            user_id=user_id,
            type=event_type,
            title=title,
            start_date=start_date,
            end_date=end_date,
            source_app=source_app,
            source_id=source_id,
            description=description,
            all_day=all_day,
            timezone=timezone,
            related_trip_id=related_trip_id,
            resort_id=resort_id,
            google_event_id=google_event_id,
            outlook_event_id=outlook_event_id,
            matching_id=matching_id,
            participants=participants or [],
            reminders=reminders or [],
        )
        return self.repo.add(event)

    def get_event(self, event_id: UUID) -> Optional[CalendarEvent]:
        """Get a calendar event by ID."""
        return self.repo.get(event_id)

    def list_events(
        self,
        user_id: UUID,
        start_date: Optional[dt.datetime] = None,
        end_date: Optional[dt.datetime] = None,
        event_type: Optional[str] = None,
        source_app: Optional[str] = None,
    ) -> List[CalendarEvent]:
        """List calendar events for a user with optional filters."""
        return self.repo.list_for_user(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            event_type=event_type,
            source_app=source_app,
        )

    def list_events_for_source(
        self,
        source_app: str,
        source_id: str,
    ) -> List[CalendarEvent]:
        """List calendar events for a specific source."""
        return self.repo.list_for_source(
            source_app=source_app,
            source_id=source_id,
        )

    def update_event(
        self,
        event_id: UUID,
        *,
        title: Optional[str] = None,
        start_date: Optional[dt.datetime] = None,
        end_date: Optional[dt.datetime] = None,
        description: Optional[str] = None,
        all_day: Optional[bool] = None,
        timezone: Optional[str] = None,
        related_trip_id: Optional[str] = None,
        resort_id: Optional[str] = None,
        google_event_id: Optional[str] = None,
        outlook_event_id: Optional[str] = None,
        matching_id: Optional[UUID] = None,
        participants: Optional[List[UUID]] = None,
        reminders: Optional[List[dict]] = None,
    ) -> CalendarEvent:
        """Update a calendar event."""
        event = self.repo.get(event_id)
        if not event:
            raise ValueError("Event not found")
        
        # Update fields
        updated = event.update(
            title=title,
            start_date=start_date,
            end_date=end_date,
            description=description,
            reminders=reminders,
        )
        
        return self.repo.update(updated)

    def delete_event(self, event_id: UUID) -> bool:
        """Delete a calendar event."""
        return self.repo.delete(event_id)

    def delete_events_for_source(self, source_app: str, source_id: str) -> int:
        """Delete all events for a specific source."""
        return self.repo.delete_by_source(source_app, source_id)
