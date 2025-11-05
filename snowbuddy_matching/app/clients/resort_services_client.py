import httpx
import os
from typing import Optional, Dict, Any, List

# Get the base URL for the resort-services from environment variables
# with a default for local development.
RESORT_SERVICES_BASE_URL = os.getenv("RESORT_SERVICES_API_URL", "http://localhost:8000")

async def get_resorts(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Fetches a list of resorts from the resort-services, applying optional filters.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{RESORT_SERVICES_BASE_URL}/resorts", params=filters)
            response.raise_for_status()
            return response.json().get("items", [])
        except httpx.RequestError as e:
            print(f"An error occurred while requesting resorts: {e}")
            return []
        except httpx.HTTPStatusError as e:
            print(f"Error response {e.response.status_code} while requesting resorts: {e.response.text}")
            return []
