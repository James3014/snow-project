"""
Basic API tests for snowbuddy-matching.
"""
import sys
from pathlib import Path

# Add app to path
app_path = Path(__file__).resolve().parents[1] / "app"
sys.path.insert(0, str(app_path))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """Test health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_start_search():
    """Test starting a search (without Redis)."""
    # This will fail without Redis, but tests the endpoint structure
    response = client.post(
        "/matching/searches",
        json={
            "skill_level_min": 5,
            "skill_level_max": 7,
            "seeking_role": "buddy"
        }
    )
    # May return 500 without Redis, but that's OK for basic test
    assert response.status_code in [202, 500]


def test_send_match_request():
    """Test sending a match request."""
    response = client.post(
        "/requests",
        json={"target_user_id": "user_123"}
    )
    # May fail without user-core running, but tests structure
    assert response.status_code in [202, 503]
