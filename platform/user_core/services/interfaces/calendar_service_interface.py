"""
Calendar Service 介面定義
用於依賴注入和解耦
"""
from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator

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
