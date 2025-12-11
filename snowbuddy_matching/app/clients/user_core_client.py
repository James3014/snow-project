"""
User Core API client with calendar integration.
"""
import httpx
from typing import Optional, Dict, Any, List

from ..config import get_settings


async def get_users(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Fetch users from user-core service."""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{settings.user_core_api_url}/users", params=filters)
            response.raise_for_status()
            return response.json().get("items", [])
        except httpx.RequestError as e:
            print(f"Error requesting users: {e}")
            return []
        except httpx.HTTPStatusError as e:
            print(f"Error {e.response.status_code} requesting users: {e.response.text}")
            return []


async def get_casi_skills(user_id: str) -> Optional[Dict[str, Any]]:
    """獲取使用者 CASI 技能資料 (供媒合算法使用)"""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.user_core_api_url}/users/{user_id}/casi-skills/summary"
            )
            if response.status_code == 404:
                # 使用者沒有 CASI 技能資料，返回預設值
                return {
                    "user_id": user_id,
                    "overall_skill": 0.0,
                    "has_profile": False
                }
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            print(f"Error requesting CASI skills for {user_id}: {e}")
            return None
        except httpx.HTTPStatusError as e:
            print(f"Error {e.response.status_code} requesting CASI skills: {e.response.text}")
            return None


async def post_event(event_payload: Dict[str, Any]) -> bool:
    """Post a behavior event to user-core service."""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{settings.user_core_api_url}/events", json=event_payload)
            response.raise_for_status()
            return True
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            print(f"Error posting event: {e}")
            return False


async def create_calendar_event(event_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Create a calendar event via user-core service."""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{settings.user_core_api_url}/calendar/events", json=event_payload)
            response.raise_for_status()
            return response.json()
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            print(f"Error creating calendar event: {e}")
            return {}


async def list_calendar_events(params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """List calendar events from user-core service."""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{settings.user_core_api_url}/calendar/events", params=params)
            response.raise_for_status()
            return response.json()
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            print(f"Error listing calendar events: {e}")
            return []


async def get_calendar_events_for_source(source_app: str, source_id: str) -> List[Dict[str, Any]]:
    """Get calendar events for a specific source."""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.user_core_api_url}/calendar/events/source/{source_app}/{source_id}"
            )
            response.raise_for_status()
            return response.json()
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            print(f"Error getting calendar events for source: {e}")
            return []
