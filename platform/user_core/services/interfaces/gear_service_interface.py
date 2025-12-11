"""
Gear Service Interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class GearServiceInterface(ABC):
    """Gear service interface for calendar integration."""

    @abstractmethod
    def create_reminder_with_calendar(
        self,
        gear_item_id: UUID,
        reminder_type: str,
        scheduled_at: datetime,
        message: Optional[str] = None
    ) -> 'GearReminder':
        """Create a gear reminder with corresponding calendar event."""
        pass

    @abstractmethod
    def complete_inspection_with_calendar(
        self,
        gear_item_id: UUID,
        inspector_user_id: UUID,
        checklist: dict,
        overall_status: str,
        notes: Optional[str] = None
    ) -> 'GearInspection':
        """Complete gear inspection and schedule next inspection calendar event."""
        pass

    @abstractmethod
    def schedule_trade_meeting(
        self,
        gear_item_id: UUID,
        buyer_id: UUID,
        meeting_time: datetime,
        location: str,
        notes: Optional[str] = None
    ) -> dict:
        """Schedule a trade meeting with calendar events for both parties."""
        pass
