"""
Behavior Event Service for querying user actions
"""
import httpx
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..config import get_settings


class BehaviorEventService:
    """Service for querying behavior events from user-core"""
    
    def __init__(self):
        self.settings = get_settings()
    
    async def get_trip_application_events(
        self, 
        trip_id: str, 
        event_type: str = "trip.apply.sent"
    ) -> List[Dict[str, Any]]:
        """Get trip application events for a specific trip"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.settings.user_core_api_url}/events",
                    params={
                        "event_type": event_type,
                        "payload.trip_id": trip_id,
                        "limit": 100
                    },
                    headers={"Authorization": f"Bearer {self.settings.service_token}"}
                )
                
                if response.status_code == 200:
                    return response.json().get("events", [])
                return []
        except Exception as e:
            print(f"Error getting trip application events: {e}")
            return []
    
    async def get_applicant_id_from_request(
        self, 
        request_id: str, 
        trip_id: str
    ) -> Optional[str]:
        """Get applicant user ID from request ID"""
        events = await self.get_trip_application_events(trip_id)
        
        for event in events:
            payload = event.get("payload", {})
            if payload.get("request_id") == request_id:
                return event.get("user_id")
        
        return None
