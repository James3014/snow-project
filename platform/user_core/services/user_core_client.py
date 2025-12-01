"""
User Core API Client for querying user data and events.

This client is used by the buddy matching service to fetch user profiles
and learning events from the user-core service.
"""
from typing import List, Optional, Dict, Any
import uuid
import logging
from datetime import datetime

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from schemas.behavior_event import BehaviorEvent, EventSortField, SortOrder
from schemas.user_profile import UserProfile


logger = logging.getLogger(__name__)


class UserCoreClientError(Exception):
    """Base exception for User Core Client errors."""
    pass


class UserCoreAPIError(UserCoreClientError):
    """Raised when the API returns an error response."""
    
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"API Error {status_code}: {detail}")


class UserCoreNetworkError(UserCoreClientError):
    """Raised when network communication fails."""
    pass


class UserCoreClient:
    """
    Client for querying user-core service APIs.
    
    This client provides methods to:
    - Query user behavior events (learning activities)
    - Fetch user profiles
    - Batch query multiple users
    
    Includes automatic retry logic for transient failures.
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        timeout: float = 10.0,
        max_retries: int = 3,
    ):
        """
        Initialize the User Core API client.
        
        Args:
            base_url: Base URL of the user-core service
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts for failed requests
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self._client = httpx.Client(timeout=timeout)
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    
    def close(self):
        """Close the HTTP client."""
        self._client.close()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        reraise=True,
    )
    def get_user_events(
        self,
        user_id: uuid.UUID,
        *,
        source_projects: Optional[List[str]] = None,
        sort_by: EventSortField = EventSortField.occurred_at,
        order: SortOrder = SortOrder.desc,
        skip: int = 0,
        limit: int = 100,
    ) -> List[BehaviorEvent]:
        """
        Query behavior events for a specific user.
        
        This method fetches learning events from the user-core service,
        which can be used to analyze user's learning progress and focus.
        
        Args:
            user_id: UUID of the user
            source_projects: Filter by source projects (e.g., ["單板教學"])
            sort_by: Field to sort by (occurred_at or recorded_at)
            order: Sort order (asc or desc)
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
        
        Returns:
            List of BehaviorEvent objects
        
        Raises:
            UserCoreAPIError: If the API returns an error
            UserCoreNetworkError: If network communication fails
        """
        try:
            url = f"{self.base_url}/behavior-events/by-user/{user_id}"
            params: Dict[str, Any] = {
                "sort_by": sort_by.value,
                "order": order.value,
                "skip": skip,
                "limit": limit,
            }
            
            if source_projects:
                params["source_project"] = source_projects
            
            logger.debug(
                f"Fetching events for user {user_id} from {url} "
                f"with params: {params}"
            )
            
            response = self._client.get(url, params=params)
            
            if response.status_code == 200:
                events_data = response.json()
                return [BehaviorEvent(**event) for event in events_data]
            else:
                error_detail = response.json().get("detail", response.text)
                raise UserCoreAPIError(response.status_code, error_detail)
        
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            logger.error(f"Network error fetching events for user {user_id}: {e}")
            raise UserCoreNetworkError(f"Network error: {e}") from e
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching events for user {user_id}: {e}")
            raise UserCoreNetworkError(f"HTTP error: {e}") from e
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        reraise=True,
    )
    def get_user_profile(self, user_id: uuid.UUID) -> Optional[UserProfile]:
        """
        Fetch a user profile by ID.
        
        Args:
            user_id: UUID of the user
        
        Returns:
            UserProfile object if found, None otherwise
        
        Raises:
            UserCoreAPIError: If the API returns an error (except 404)
            UserCoreNetworkError: If network communication fails
        """
        try:
            url = f"{self.base_url}/user-profiles/{user_id}"
            
            logger.debug(f"Fetching user profile for {user_id} from {url}")
            
            response = self._client.get(url)
            
            if response.status_code == 200:
                return UserProfile(**response.json())
            elif response.status_code == 404:
                logger.warning(f"User profile not found: {user_id}")
                return None
            else:
                error_detail = response.json().get("detail", response.text)
                raise UserCoreAPIError(response.status_code, error_detail)
        
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            logger.error(f"Network error fetching profile for user {user_id}: {e}")
            raise UserCoreNetworkError(f"Network error: {e}") from e
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching profile for user {user_id}: {e}")
            raise UserCoreNetworkError(f"HTTP error: {e}") from e
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        reraise=True,
    )
    def get_users(
        self,
        user_ids: Optional[List[uuid.UUID]] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[UserProfile]:
        """
        Batch query multiple user profiles.
        
        If user_ids is provided, fetches those specific users.
        Otherwise, fetches a paginated list of all users.
        
        Args:
            user_ids: Optional list of user IDs to fetch
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
        
        Returns:
            List of UserProfile objects
        
        Raises:
            UserCoreAPIError: If the API returns an error
            UserCoreNetworkError: If network communication fails
        """
        try:
            if user_ids:
                # Fetch specific users individually
                # Note: This could be optimized with a batch endpoint if available
                profiles = []
                for user_id in user_ids:
                    profile = self.get_user_profile(user_id)
                    if profile:
                        profiles.append(profile)
                return profiles
            else:
                # Fetch paginated list of all users
                url = f"{self.base_url}/user-profiles/"
                params = {"skip": skip, "limit": limit}
                
                logger.debug(f"Fetching users from {url} with params: {params}")
                
                response = self._client.get(url, params=params)
                
                if response.status_code == 200:
                    users_data = response.json()
                    return [UserProfile(**user) for user in users_data]
                else:
                    error_detail = response.json().get("detail", response.text)
                    raise UserCoreAPIError(response.status_code, error_detail)
        
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            logger.error(f"Network error fetching users: {e}")
            raise UserCoreNetworkError(f"Network error: {e}") from e
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching users: {e}")
            raise UserCoreNetworkError(f"HTTP error: {e}") from e
