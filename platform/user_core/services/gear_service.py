"""
Gear Service - Calendar Integration
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from domain.calendar.enums import EventType
from services.interfaces.gear_service_interface import GearServiceInterface


class GearService(GearServiceInterface):
    """Gear service with calendar integration."""

    def __init__(self, gear_repo, calendar_service):
        self.gear_repo = gear_repo
        self.calendar_service = calendar_service

    def create_reminder_with_calendar(
        self,
        gear_item_id: UUID,
        reminder_type: str,
        scheduled_at: datetime,
        message: Optional[str] = None
    ):
        """Create a gear reminder with corresponding calendar event."""
        # Get gear item
        gear_item = self.gear_repo.get_gear_item(gear_item_id)
        
        # Create reminder
        reminder = self.gear_repo.create_reminder(
            gear_item_id=gear_item_id,
            reminder_type=reminder_type,
            scheduled_at=scheduled_at,
            message=message
        )
        
        # Create calendar event
        self.calendar_service.create_event(
            user_id=gear_item.user_id,
            event_type=EventType.GEAR,
            title=f"裝備{reminder_type}提醒",
            start_date=scheduled_at,
            end_date=scheduled_at + timedelta(hours=1),
            source_app="gear_ops",
            source_id=str(reminder.id),
            description=message or f"{gear_item.name} {reminder_type}提醒"
        )
        
        return reminder

    def complete_inspection_with_calendar(
        self,
        gear_item_id: UUID,
        inspector_user_id: UUID,
        checklist: dict,
        overall_status: str,
        notes: Optional[str] = None
    ):
        """Complete gear inspection and schedule next inspection calendar event."""
        # Get gear item
        gear_item = self.gear_repo.get_gear_item(gear_item_id)
        
        # Create inspection record
        inspection = self.gear_repo.create_inspection(
            gear_item_id=gear_item_id,
            inspector_user_id=inspector_user_id,
            checklist=checklist,
            overall_status=overall_status,
            notes=notes
        )
        
        # Schedule next inspection based on status
        next_inspection_days = {
            "unsafe": 1,           # 立即提醒
            "needs_attention": 7,  # 1週後
            "good": 30            # 1個月後
        }
        
        days = next_inspection_days.get(overall_status, 30)
        next_inspection_date = datetime.now() + timedelta(days=days)
        
        # Create next inspection reminder with calendar event
        self.create_reminder_with_calendar(
            gear_item_id=gear_item_id,
            reminder_type="inspection",
            scheduled_at=next_inspection_date,
            message=f"根據上次檢查結果({overall_status})安排的下次檢查"
        )
        
        return inspection

    def schedule_trade_meeting(
        self,
        gear_item_id: UUID,
        buyer_id: UUID,
        meeting_time: datetime,
        location: str,
        notes: Optional[str] = None
    ) -> dict:
        """Schedule a trade meeting with calendar events for both parties."""
        # Get gear item and seller info
        gear_item = self.gear_repo.get_gear_item(gear_item_id)
        seller_id = gear_item.user_id
        
        # Create meeting record
        meeting = self.gear_repo.create_trade_meeting(
            gear_item_id=gear_item_id,
            seller_id=seller_id,
            buyer_id=buyer_id,
            meeting_time=meeting_time,
            location=location,
            notes=notes
        )
        
        # Create calendar event for seller
        seller_event = self.calendar_service.create_event(
            user_id=seller_id,
            event_type=EventType.GEAR,
            title=f"裝備交易會面 - {gear_item.name}",
            start_date=meeting_time,
            end_date=meeting_time + timedelta(hours=1),
            source_app="gear_ops",
            source_id=f"meeting_{meeting.id}_seller",
            description=f"地點: {location}\n買家會面\n{notes or ''}"
        )
        
        # Create calendar event for buyer
        buyer_event = self.calendar_service.create_event(
            user_id=buyer_id,
            event_type=EventType.GEAR,
            title=f"裝備交易會面 - {gear_item.name}",
            start_date=meeting_time,
            end_date=meeting_time + timedelta(hours=1),
            source_app="gear_ops",
            source_id=f"meeting_{meeting.id}_buyer",
            description=f"地點: {location}\n賣家會面\n{notes or ''}"
        )
        
        return {
            "meeting": meeting,
            "seller_event": seller_event,
            "buyer_event": buyer_event
        }
