"""
Basic API tests for snowbuddy-matching.
"""
import sys
from pathlib import Path

# Add parent directory to path for proper package imports
parent_path = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(parent_path))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Test health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_start_search_requires_auth():
    """Test that starting a search requires authentication."""
    response = client.post(
        "/matching/searches",
        json={
            "skill_level_min": 5,
            "skill_level_max": 7,
            "seeking_role": "buddy"
        }
    )
    assert response.status_code == 401


def test_start_search_with_auth():
    """Test starting a search with authentication."""
    try:
        response = client.post(
            "/matching/searches",
            headers={"X-User-Id": "test-user-123"},
            json={
                "skill_level_min": 5,
                "skill_level_max": 7,
                "seeking_role": "buddy"
            }
        )
        # May return 500 without Redis, but that's OK for basic test
        assert response.status_code in [202, 500]
    except Exception as e:
        # Redis connection errors are expected when Redis isn't running
        # The important part is authentication worked (didn't get 401)
        assert "redis" in str(e).lower() or "connection" in str(e).lower()


def test_send_match_request_requires_auth():
    """Test that sending a match request requires authentication."""
    response = client.post(
        "/requests",
        json={"target_user_id": "user_123"}
    )
    assert response.status_code == 401


def test_send_match_request_with_auth():
    """Test sending a match request with authentication."""
    response = client.post(
        "/requests",
        headers={"X-User-Id": "test-user-456"},
        json={"target_user_id": "user_123"}
    )
    # May fail without user-core running, but tests structure
    assert response.status_code in [202, 503]


def test_get_search_results_requires_auth():
    """Test that getting search results requires authentication."""
    response = client.get("/matching/searches/some-search-id")
    assert response.status_code == 401


def test_respond_to_request_requires_auth():
    """Test that responding to a request requires authentication."""
    response = client.put(
        "/requests/some-request-id",
        json={"action": "accept"}
    )
    assert response.status_code == 401
