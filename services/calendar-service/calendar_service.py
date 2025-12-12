"""
T1.9: Calendar Service 最小實作 (TDD Green Phase)
實作 CalendarServiceInterface 的最小功能
"""
import uuid
from datetime import datetime, date
from typing import List, Optional, Dict
from pydantic import BaseModel, field_validator
from abc import ABC, abstractmethod

class CalendarEvent(BaseModel):
    """行事曆事件模型"""
    id: Optional[str] = None
    user_id: str
    title: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    event_type: str = "general"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v, info):
        """驗證結束日期不能早於開始日期"""
        if info.data and 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('End date cannot be before start date')
        return v

class CalendarServiceInterface(ABC):
    """Calendar Service 抽象介面"""
    
    @abstractmethod
    async def create_event(self, event: CalendarEvent) -> CalendarEvent:
        """建立行事曆事件"""
        pass
    
    @abstractmethod
    async def get_events(self, user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[CalendarEvent]:
        """取得用戶行事曆事件"""
        pass
    
    @abstractmethod
    async def update_event(self, event_id: str, event: CalendarEvent) -> CalendarEvent:
        """更新行事曆事件"""
        pass
    
    @abstractmethod
    async def delete_event(self, event_id: str, user_id: str) -> bool:
        """刪除行事曆事件"""
        pass

class InMemoryCalendarService(CalendarServiceInterface):
    """記憶體內 Calendar Service 實作 (最小實作)"""
    
    def __init__(self):
        self.events: Dict[str, CalendarEvent] = {}
    
    async def create_event(self, event: CalendarEvent) -> CalendarEvent:
        """建立行事曆事件"""
        # 驗證會在 Pydantic 模型層自動執行
        event.id = str(uuid.uuid4())
        event.created_at = datetime.now()
        event.updated_at = datetime.now()
        
        self.events[event.id] = event
        return event
    
    async def get_events(self, user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[CalendarEvent]:
        """取得用戶行事曆事件"""
        user_events = [e for e in self.events.values() if e.user_id == user_id]
        
        if start_date:
            user_events = [e for e in user_events if e.start_date >= start_date]
        if end_date:
            user_events = [e for e in user_events if e.end_date <= end_date]
        
        return sorted(user_events, key=lambda x: x.start_date)
    
    async def update_event(self, event_id: str, event: CalendarEvent) -> CalendarEvent:
        """更新行事曆事件"""
        if event_id not in self.events:
            raise ValueError(f"Event {event_id} not found")
        
        # 保留原有的 ID 和建立時間
        original_event = self.events[event_id]
        event.id = event_id
        event.created_at = original_event.created_at
        event.updated_at = datetime.now()
        
        self.events[event_id] = event
        return event
    
    async def delete_event(self, event_id: str, user_id: str) -> bool:
        """刪除行事曆事件"""
        if event_id not in self.events:
            return False
        
        # 檢查用戶權限
        if self.events[event_id].user_id != user_id:
            return False
        
        del self.events[event_id]
        return True

# 工廠函數
def create_calendar_service() -> CalendarServiceInterface:
    """建立 Calendar Service 實例"""
    return InMemoryCalendarService()
