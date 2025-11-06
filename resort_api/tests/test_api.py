"""
Basic tests for resort-services API.
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


def test_list_resorts():
    """Test listing resorts."""
    response = client.get("/resorts")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_list_resorts_with_filters():
    """Test listing resorts with region filter."""
    response = client.get("/resorts?region=Hokkaido")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


def test_list_resorts_pagination():
    """Test pagination."""
    response = client.get("/resorts?limit=5&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 5


def test_get_resort_not_found():
    """Test getting non-existent resort."""
    response = client.get("/resorts/non_existent_id")
    assert response.status_code == 404


def test_create_ski_history_requires_auth():
    """Test that creating ski history requires authentication."""
    response = client.post(
        "/users/test-user-123/ski-history",
        json={"resort_id": "hokkaido_niseko", "date": "2025-01-15"}
    )
    assert response.status_code == 401


def test_create_ski_history_with_auth():
    """Test creating ski history with X-User-Id header (development mode)."""
    user_id = "test-user-123"
    response = client.post(
        f"/users/{user_id}/ski-history",
        headers={"X-User-Id": user_id},
        json={"resort_id": "hokkaido_niseko_moiwa", "date": "2025-01-15"}
    )
    # Will return 202 or 503 depending on whether user-core is available
    assert response.status_code in [202, 503]


def test_create_ski_history_forbidden_for_other_user():
    """Test that users cannot create ski history for other users."""
    response = client.post(
        "/users/other-user-456/ski-history",
        headers={"X-User-Id": "test-user-123"},
        json={"resort_id": "hokkaido_niseko", "date": "2025-01-15"}
    )
    assert response.status_code == 403
    assert "yourself" in response.json()["detail"].lower()


def test_create_ski_history_invalid_resort():
    """Test creating ski history with invalid resort ID."""
    user_id = "test-user-123"
    response = client.post(
        f"/users/{user_id}/ski-history",
        headers={"X-User-Id": user_id},
        json={"resort_id": "invalid_resort_id", "date": "2025-01-15"}
    )
    assert response.status_code == 404
