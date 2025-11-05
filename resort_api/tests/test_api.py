"""
Basic tests for resort-services API.
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
