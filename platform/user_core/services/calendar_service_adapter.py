"""
Calendar Service 適配器
提供向後相容的 API，內部委派給新的 Calendar Service
"""
import sys
from pathlib import Path
from typing import List, Optional
from datetime import date

# 添加 calendar-service 到 Python 路徑
CALENDAR_SERVICE_ROOT = Path(__file__).resolve().parents[3] / "services" / "calendar-service"
sys.path.insert(0, str(CALENDAR_SERVICE_ROOT))

from calendar_service import create_calendar_service, CalendarEvent as NewCalendarEvent
from services.interfaces.calendar_service_interface import CalendarServiceInterface, CalendarEvent

class CalendarServiceAdapter:
    """
    Calendar Service 適配器
    將舊的 user_core calendar API 適配到新的 Calendar Service
    """
    
    def __init__(self):
        self._calendar_service = create_calendar_service()
    
    async def create_event(self, user_id: str, title: str, start_date: date, end_date: date, 
                          description: str = None, event_type: str = "general") -> dict:
        """建立行事曆事件 (舊 API 格式)"""
        event = CalendarEvent(
            user_id=user_id,
            title=title,
            description=description,
            start_date=start_date,
            end_date=end_date,
            event_type=event_type
        )
        
        created_event = await self._calendar_service.create_event(event)
        
        # 轉換為舊 API 格式
        return {
            "id": created_event.id,
            "user_id": created_event.user_id,
            "title": created_event.title,
            "description": created_event.description,
            "start_date": created_event.start_date.isoformat(),
            "end_date": created_event.end_date.isoformat(),
            "event_type": created_event.event_type,
            "created_at": created_event.created_at.isoformat() if created_event.created_at else None,
            "updated_at": created_event.updated_at.isoformat() if created_event.updated_at else None
        }
    
    async def get_events(self, user_id: str, start_date: Optional[date] = None, 
                        end_date: Optional[date] = None) -> List[dict]:
        """取得用戶行事曆事件 (舊 API 格式)"""
        events = await self._calendar_service.get_events(user_id, start_date, end_date)
        
        # 轉換為舊 API 格式
        return [
            {
                "id": event.id,
                "user_id": event.user_id,
                "title": event.title,
                "description": event.description,
                "start_date": event.start_date.isoformat(),
                "end_date": event.end_date.isoformat(),
                "event_type": event.event_type,
                "created_at": event.created_at.isoformat() if event.created_at else None,
                "updated_at": event.updated_at.isoformat() if event.updated_at else None
            }
            for event in events
        ]
    
    async def update_event(self, event_id: str, user_id: str, **kwargs) -> dict:
        """更新行事曆事件 (舊 API 格式)"""
        # 先取得現有事件
        events = await self._calendar_service.get_events(user_id)
        current_event = next((e for e in events if e.id == event_id), None)
        
        if not current_event:
            raise ValueError(f"Event {event_id} not found")
        
        # 更新欄位
        updated_data = {
            "user_id": user_id,
            "title": kwargs.get("title", current_event.title),
            "description": kwargs.get("description", current_event.description),
            "start_date": kwargs.get("start_date", current_event.start_date),
            "end_date": kwargs.get("end_date", current_event.end_date),
            "event_type": kwargs.get("event_type", current_event.event_type)
        }
        
        updated_event_model = CalendarEvent(**updated_data)
        updated_event = await self._calendar_service.update_event(event_id, updated_event_model)
        
        # 轉換為舊 API 格式
        return {
            "id": updated_event.id,
            "user_id": updated_event.user_id,
            "title": updated_event.title,
            "description": updated_event.description,
            "start_date": updated_event.start_date.isoformat(),
            "end_date": updated_event.end_date.isoformat(),
            "event_type": updated_event.event_type,
            "created_at": updated_event.created_at.isoformat() if updated_event.created_at else None,
            "updated_at": updated_event.updated_at.isoformat() if updated_event.updated_at else None
        }
    
    async def delete_event(self, event_id: str, user_id: str) -> bool:
        """刪除行事曆事件"""
        return await self._calendar_service.delete_event(event_id, user_id)

# 全域實例 (單例模式)
_calendar_adapter = None

def get_calendar_service() -> CalendarServiceAdapter:
    """取得 Calendar Service 適配器實例"""
    global _calendar_adapter
    if _calendar_adapter is None:
        _calendar_adapter = CalendarServiceAdapter()
    return _calendar_adapter
