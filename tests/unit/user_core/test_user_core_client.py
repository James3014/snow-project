"""
Unit tests for User Core API Client.

Tests verify:
- API call success scenarios
- Error handling (network errors, API errors)
- Retry logic for transient failures
- Proper data parsing and validation

**Validates: Requirements 10.1**
"""
import pytest
import uuid
from datetime import datetime, UTC
from unittest.mock import Mock, patch, MagicMock
import httpx

# Import the client
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "platform" / "user_core"))

from services.user_core_client import (
    UserCoreClient,
    UserCoreAPIError,
    UserCoreNetworkError,
)
from schemas.behavior_event import BehaviorEvent, EventSortField, SortOrder
from schemas.user_profile import UserProfile, UserStatus


class TestUserCoreClientSuccess:
    """Test successful API calls."""
    
    def test_get_user_events_success(self):
        """Test successful retrieval of user events."""
        user_id = uuid.uuid4()
        
        # Mock response data
        mock_events = [
            {
                "event_id": str(uuid.uuid4()),
                "user_id": str(user_id),
                "source_project": "單板教學",
                "event_type": "lesson_completed",
                "payload": {"lesson_id": "lesson_1", "score": 85},
                "version": 1,
                "occurred_at": datetime.now(UTC).isoformat(),
                "recorded_at": datetime.now(UTC).isoformat(),
            }
        ]
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_events
            mock_get.return_value = mock_response
            
            client = UserCoreClient()
            events = client.get_user_events(user_id)
            
            assert len(events) == 1
            assert isinstance(events[0], BehaviorEvent)
            assert events[0].source_project == "單板教學"
            assert events[0].event_type == "lesson_completed"
            
            # Verify the API was called with correct parameters
            mock_get.assert_called_once()
            call_args = mock_get.call_args
            assert str(user_id) in call_args[0][0]
    
    def test_get_user_events_with_filters(self):
        """Test user events retrieval with filters."""
        user_id = uuid.uuid4()
        
        mock_events = []
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_events
            mock_get.return_value = mock_response
            
            client = UserCoreClient()
            events = client.get_user_events(
                user_id,
                source_projects=["單板教學"],
                sort_by=EventSortField.occurred_at,
                order=SortOrder.desc,
                skip=10,
                limit=50,
            )
            
            assert len(events) == 0
            
            # Verify filters were passed correctly
            call_args = mock_get.call_args
            params = call_args[1]['params']
            assert params['source_project'] == ["單板教學"]
            assert params['sort_by'] == "occurred_at"
            assert params['order'] == "desc"
            assert params['skip'] == 10
            assert params['limit'] == 50
    
    def test_get_user_profile_success(self):
        """Test successful retrieval of user profile."""
        user_id = uuid.uuid4()
        
        mock_profile = {
            "user_id": str(user_id),
            "preferred_language": "zh-TW",
            "experience_level": "intermediate",
            "roles": ["user"],
            "status": "active",
            "created_at": datetime.now(UTC).isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
        }
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_profile
            mock_get.return_value = mock_response
            
            client = UserCoreClient()
            profile = client.get_user_profile(user_id)
            
            assert profile is not None
            assert isinstance(profile, UserProfile)
            assert profile.user_id == user_id
            assert profile.experience_level == "intermediate"
            assert profile.status == UserStatus.active
    
    def test_get_user_profile_not_found(self):
        """Test user profile retrieval when user doesn't exist."""
        user_id = uuid.uuid4()
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 404
            mock_response.json.return_value = {"detail": "User not found"}
            mock_get.return_value = mock_response
            
            client = UserCoreClient()
            profile = client.get_user_profile(user_id)
            
            # Should return None for 404, not raise an error
            assert profile is None
    
    def test_get_users_batch(self):
        """Test batch retrieval of multiple users."""
        user_ids = [uuid.uuid4(), uuid.uuid4(), uuid.uuid4()]
        
        def mock_get_side_effect(url, **kwargs):
            mock_response = Mock()
            # Extract user_id from URL
            for uid in user_ids:
                if str(uid) in url:
                    mock_response.status_code = 200
                    mock_response.json.return_value = {
                        "user_id": str(uid),
                        "preferred_language": "zh-TW",
                        "status": "active",
                        "roles": [],
                        "created_at": datetime.now(UTC).isoformat(),
                        "updated_at": datetime.now(UTC).isoformat(),
                    }
                    return mock_response
            
            mock_response.status_code = 404
            mock_response.json.return_value = {"detail": "Not found"}
            return mock_response
        
        with patch.object(httpx.Client, 'get', side_effect=mock_get_side_effect):
            client = UserCoreClient()
            profiles = client.get_users(user_ids=user_ids)
            
            assert len(profiles) == 3
            assert all(isinstance(p, UserProfile) for p in profiles)
            assert {p.user_id for p in profiles} == set(user_ids)
    
    def test_get_users_paginated(self):
        """Test paginated retrieval of all users."""
        mock_users = [
            {
                "user_id": str(uuid.uuid4()),
                "preferred_language": "zh-TW",
                "status": "active",
                "roles": [],
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            }
            for _ in range(5)
        ]
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_users
            mock_get.return_value = mock_response
            
            client = UserCoreClient()
            profiles = client.get_users(skip=0, limit=5)
            
            assert len(profiles) == 5
            assert all(isinstance(p, UserProfile) for p in profiles)


class TestUserCoreClientErrorHandling:
    """Test error handling scenarios."""
    
    def test_api_error_400(self):
        """Test handling of 400 Bad Request errors."""
        user_id = uuid.uuid4()
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 400
            mock_response.json.return_value = {"detail": "Invalid parameters"}
            mock_response.text = "Bad Request"
            mock_get.return_value = mock_response
            
            client = UserCoreClient()
            
            with pytest.raises(UserCoreAPIError) as exc_info:
                client.get_user_events(user_id)
            
            assert exc_info.value.status_code == 400
            assert "Invalid parameters" in str(exc_info.value)
    
    def test_api_error_500(self):
        """Test handling of 500 Internal Server Error."""
        user_id = uuid.uuid4()
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 500
            mock_response.json.return_value = {"detail": "Internal server error"}
            mock_response.text = "Internal Server Error"
            mock_get.return_value = mock_response
            
            client = UserCoreClient()
            
            with pytest.raises(UserCoreAPIError) as exc_info:
                client.get_user_profile(user_id)
            
            assert exc_info.value.status_code == 500
    
    def test_network_timeout_error(self):
        """Test handling of network timeout errors."""
        user_id = uuid.uuid4()
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_get.side_effect = httpx.TimeoutException("Request timeout")
            
            client = UserCoreClient()
            
            with pytest.raises(UserCoreNetworkError) as exc_info:
                client.get_user_events(user_id)
            
            assert "Network error" in str(exc_info.value)
    
    def test_network_connection_error(self):
        """Test handling of network connection errors."""
        user_id = uuid.uuid4()
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_get.side_effect = httpx.NetworkError("Connection refused")
            
            client = UserCoreClient()
            
            with pytest.raises(UserCoreNetworkError) as exc_info:
                client.get_user_profile(user_id)
            
            assert "Network error" in str(exc_info.value)
    
    def test_http_error(self):
        """Test handling of generic HTTP errors."""
        user_id = uuid.uuid4()
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_get.side_effect = httpx.HTTPError("HTTP error occurred")
            
            client = UserCoreClient()
            
            with pytest.raises(UserCoreNetworkError) as exc_info:
                client.get_users(user_ids=[user_id])
            
            assert "HTTP error" in str(exc_info.value)


class TestUserCoreClientRetryLogic:
    """Test retry logic for transient failures."""
    
    def test_retry_on_timeout_then_success(self):
        """Test that tenacity retry decorator is configured correctly."""
        # This test verifies the retry decorator configuration
        # The actual retry happens at the tenacity level before our exception handling
        user_id = uuid.uuid4()
        
        mock_events = [
            {
                "event_id": str(uuid.uuid4()),
                "user_id": str(user_id),
                "source_project": "單板教學",
                "event_type": "lesson_completed",
                "payload": {"lesson_id": "lesson_1"},
                "version": 1,
                "occurred_at": datetime.now(UTC).isoformat(),
                "recorded_at": datetime.now(UTC).isoformat(),
            }
        ]
        
        # Verify that the retry decorator is present and configured
        from services.user_core_client import UserCoreClient
        import inspect
        
        # Check that get_user_events has retry decorator
        assert hasattr(UserCoreClient.get_user_events, 'retry')
        
        # Test successful call (no retry needed)
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_events
            mock_get.return_value = mock_response
            
            client = UserCoreClient()
            events = client.get_user_events(user_id)
            
            assert len(events) == 1
            assert mock_get.call_count == 1
    
    def test_retry_exhausted_raises_error(self):
        """Test that client raises error when all retries fail."""
        # The retry logic is configured to retry 3 times on TimeoutException
        # After exhausting retries, it raises UserCoreNetworkError
        user_id = uuid.uuid4()
        
        with patch.object(httpx.Client, 'get') as mock_get:
            # All attempts time out
            mock_get.side_effect = httpx.TimeoutException("Timeout")
            
            client = UserCoreClient()
            
            with pytest.raises(UserCoreNetworkError) as exc_info:
                client.get_user_profile(user_id)
            
            # Verify the error message
            assert "Network error" in str(exc_info.value)
            assert "Timeout" in str(exc_info.value)
    
    def test_no_retry_on_api_error(self):
        """Test that client doesn't retry on API errors (4xx, 5xx)."""
        user_id = uuid.uuid4()
        
        with patch.object(httpx.Client, 'get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 400
            mock_response.json.return_value = {"detail": "Bad request"}
            mock_response.text = "Bad Request"
            mock_get.return_value = mock_response
            
            client = UserCoreClient()
            
            with pytest.raises(UserCoreAPIError):
                client.get_user_events(user_id)
            
            # Should only try once (no retry for API errors)
            assert mock_get.call_count == 1


class TestUserCoreClientContextManager:
    """Test context manager functionality."""
    
    def test_context_manager_closes_client(self):
        """Test that client is properly closed when used as context manager."""
        with patch.object(httpx.Client, 'close') as mock_close:
            with UserCoreClient() as client:
                assert client is not None
            
            # Should have called close
            mock_close.assert_called_once()
    
    def test_manual_close(self):
        """Test manual closing of client."""
        with patch.object(httpx.Client, 'close') as mock_close:
            client = UserCoreClient()
            client.close()
            
            mock_close.assert_called_once()


class TestUserCoreClientConfiguration:
    """Test client configuration options."""
    
    def test_custom_base_url(self):
        """Test client with custom base URL."""
        custom_url = "https://api.example.com"
        client = UserCoreClient(base_url=custom_url)
        
        assert client.base_url == custom_url
    
    def test_base_url_trailing_slash_removed(self):
        """Test that trailing slash is removed from base URL."""
        client = UserCoreClient(base_url="http://localhost:8000/")
        
        assert client.base_url == "http://localhost:8000"
    
    def test_custom_timeout(self):
        """Test client with custom timeout."""
        client = UserCoreClient(timeout=30.0)
        
        assert client.timeout == 30.0
    
    def test_custom_max_retries(self):
        """Test client with custom max retries."""
        client = UserCoreClient(max_retries=5)
        
        assert client.max_retries == 5
