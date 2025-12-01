"""
User Core API client.
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
