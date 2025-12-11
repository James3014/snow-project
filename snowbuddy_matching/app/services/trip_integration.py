"""
Trip Integration Service for Calendar Sync
"""
import httpx
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from ..config import get_settings
from ..models.trip_participant import TripParticipant


class TripIntegrationService:
    """Service for integrating with Trip and Calendar systems"""
    
    def __init__(self):
        self.settings = get_settings()
    
    async def get_trip_info(self, trip_id: str) -> Optional[Dict[str, Any]]:
        """Get trip information from ski-platform"""
        try:
            # ski-platform trips API (假設存在)
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.settings.ski_platform_api_url}/api/trips/{trip_id}"
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            print(f"Error getting trip info: {e}")
            return None
    
    async def get_trip_calendar_event(self, trip_id: str) -> Optional[Dict[str, Any]]:
        """Get trip's calendar event from user-core"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.settings.user_core_api_url}/calendar/events",
                    params={
                        "source_app": "ski-platform",
                        "source_id": trip_id
                    },
                    headers={"Authorization": f"Bearer {self.settings.service_token}"}
                )
                if response.status_code == 200:
                    events = response.json()
                    return events[0] if events else None
                return None
        except Exception as e:
            print(f"Error getting trip calendar event: {e}")
            return None
    
    async def create_participant_calendar_event(
        self, 
        user_id: str, 
        trip_info: Dict[str, Any],
        original_event: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Create calendar event for trip participant"""
        try:
            # 使用原事件資訊或 trip 資訊
            if original_event:
                start_date = original_event.get("start_date")
                end_date = original_event.get("end_date")
                title = f"參與行程 - {trip_info.get('title', 'Unknown Trip')}"
            else:
                # 如果沒有原事件，使用 trip 的日期資訊
                start_date = trip_info.get("start_date")
                end_date = trip_info.get("end_date") or start_date
                title = f"參與行程 - {trip_info.get('title', 'Unknown Trip')}"
            
            event_data = {
                "user_id": user_id,
                "event_type": "MATCHING",
                "title": title,
                "start_date": start_date,
                "end_date": end_date,
                "source_app": "snowbuddy-matching",
                "source_id": f"participant_{trip_info['id']}_{user_id}",
                "description": f"加入 {trip_info.get('title', 'Trip')} 行程\n雪場: {trip_info.get('resort_name', 'Unknown')}",
                "related_trip_id": trip_info["id"]
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.settings.user_core_api_url}/calendar/events",
                    json=event_data,
                    headers={"Authorization": f"Bearer {self.settings.service_token}"}
                )
                if response.status_code == 201:
                    return response.json()
                return None
        except Exception as e:
            print(f"Error creating participant calendar event: {e}")
            return None
    
    async def delete_calendar_event(self, event_id: str) -> bool:
        """Delete calendar event"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.settings.user_core_api_url}/calendar/events/{event_id}",
                    headers={"Authorization": f"Bearer {self.settings.service_token}"}
                )
                return response.status_code == 200
        except Exception as e:
            print(f"Error deleting calendar event: {e}")
            return False
    
    async def join_trip_with_calendar(
        self, 
        trip_id: str, 
        user_id: str
    ) -> Optional[TripParticipant]:
        """User joins trip and creates calendar event"""
        
        # 1. 獲取 Trip 資訊
        trip_info = await self.get_trip_info(trip_id)
        if not trip_info:
            return None
        
        # 2. 獲取原 Trip 的 Calendar 事件 (可選)
        original_event = await self.get_trip_calendar_event(trip_id)
        
        # 3. 為參與者建立 Calendar 事件
        participant_event = await self.create_participant_calendar_event(
            user_id, trip_info, original_event
        )
        
        # 4. 建立參與者記錄
        participant = TripParticipant(
            trip_id=trip_id,
            user_id=user_id,
            joined_at=datetime.now(),
            status="confirmed",
            calendar_event_id=participant_event.get("id") if participant_event else None
        )
        
        return participant
    
    async def leave_trip_with_calendar(
        self, 
        trip_id: str, 
        user_id: str,
        calendar_event_id: Optional[str] = None
    ) -> bool:
        """User leaves trip and cleans up calendar event"""
        
        # 刪除 Calendar 事件
        if calendar_event_id:
            await self.delete_calendar_event(calendar_event_id)
        
        # TODO: 移除參與者記錄 (需要資料庫實現)
        
        return True
