"""
Knowledge Engagement API client.
"""
import httpx
from typing import Optional, Dict, Any

from ..config import get_settings


async def get_skill_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetch user's skill profile from knowledge-engagement service."""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{settings.knowledge_engagement_api_url}/users/{user_id}/skill-profile")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            print(f"Error {e.response.status_code} requesting skill profile: {e.response.text}")
            return None
        except httpx.RequestError as e:
            print(f"Error requesting skill profile: {e}")
            return None
