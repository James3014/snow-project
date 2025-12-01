"""
Resort Services API client.
"""
import httpx
from typing import Optional, Dict, Any, List

from ..config import get_settings


async def get_resorts(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Fetch resorts from resort-services."""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{settings.resort_services_api_url}/resorts", params=filters)
            response.raise_for_status()
            return response.json().get("items", [])
        except httpx.RequestError as e:
            print(f"Error requesting resorts: {e}")
            return []
        except httpx.HTTPStatusError as e:
            print(f"Error {e.response.status_code} requesting resorts: {e.response.text}")
            return []
