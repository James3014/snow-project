"""
Shared Calendar Infrastructure Service Interface.

This module defines the abstract interface for the shared calendar service.
All applications should depend on this interface, not the concrete implementation.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from domain.calendar.calendar_event import CalendarEvent
from domain.calendar.enums import EventType


class CalendarServiceInterface(ABC):
    """Abstract interface for shared calendar services."""

    @abstractmethod
    def create_event(
        self,
        *,
        user_id: UUID,
        event_type: EventType,
        title: str,
        start_date: datetime,
        end_date: datetime,
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
        pass

    @abstractmethod
    def get_event(self, event_id: UUID) -> Optional[CalendarEvent]:
        """Get a calendar event by ID."""
        pass

    @abstractmethod
    def list_events(
        self,
        user_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        event_type: Optional[str] = None,
        source_app: Optional[str] = None,
    ) -> List[CalendarEvent]:
        """List calendar events for a user with optional filters."""
        pass

    @abstractmethod
    def list_events_for_source(
        self,
        source_app: str,
        source_id: str,
    ) -> List[CalendarEvent]:
        """List calendar events for a specific source."""
        pass

    @abstractmethod
    def update_event(
        self,
        event_id: UUID,
        *,
        title: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
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
        pass

    @abstractmethod
    def delete_event(self, event_id: UUID) -> bool:
        """Delete a calendar event."""
        pass

    @abstractmethod
    def delete_events_for_source(self, source_app: str, source_id: str) -> int:
        """Delete all events for a specific source."""
        pass
