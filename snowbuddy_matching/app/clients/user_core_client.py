import httpx
import os
from typing import Optional, Dict, Any, List

# Get the base URL for the user-core service from environment variables
# with a default for local development.
USER_CORE_BASE_URL = os.getenv("USER_CORE_API_URL", "http://localhost:8001")

async def get_users(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Fetches a list of users from the user-core service, applying optional filters.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{USER_CORE_BASE_URL}/users", params=filters)
            response.raise_for_status()  # Raise an exception for 4xx or 5xx status codes
            return response.json().get("items", [])
        except httpx.RequestError as e:
            # Handle network errors (e.g., connection refused)
            print(f"An error occurred while requesting users: {e}")
            return []
        except httpx.HTTPStatusError as e:
            # Handle non-successful status codes
            print(f"Error response {e.response.status_code} while requesting users: {e.response.text}")
            return []

async def post_event(event_payload: Dict[str, Any]) -> bool:
    """
    Posts a behavior event to the user-core service.
    Returns True on success, False on failure.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{USER_CORE_BASE_URL}/events", json=event_payload)
            response.raise_for_status()
            return True
        except httpx.RequestError as e:
            print(f"An error occurred while posting an event: {e}")
            return False
        except httpx.HTTPStatusError as e:
            print(f"Error response {e.response.status_code} while posting an event: {e.response.text}")
            return False
