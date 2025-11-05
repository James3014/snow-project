"""
Simplified contract tests for User Profile API - testing actual endpoints only.
"""
import sys
from pathlib import Path
import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[3]
USER_CORE_ROOT = ROOT / "platform" / "user_core"
sys.path.insert(0, str(USER_CORE_ROOT))

from api.main import app  # type: ignore  # noqa: E402
from services.db import get_db  # type: ignore  # noqa: E402
from models.user_profile import Base  # type: ignore  # noqa: E402

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_contract_simple.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = None
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        if db:
            db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clear_database():
    yield
    db = TestingSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    finally:
        db.close()


class TestUserProfileContract:
    """Test User Profile API contracts."""

    def test_create_user(self):
        response = client.post("/users/", json={"preferred_language": "en", "experience_level": "beginner"})
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["status"] == "active"

    def test_get_user(self):
        user = client.post("/users/", json={"preferred_language": "en", "experience_level": "beginner"}).json()
        response = client.get(f"/users/{user['user_id']}")
        assert response.status_code == 200
        assert response.json()["user_id"] == user["user_id"]

    def test_update_user(self):
        user = client.post("/users/", json={"preferred_language": "en", "experience_level": "beginner"}).json()
        response = client.put(f"/users/{user['user_id']}", json={"experience_level": "intermediate"})
        assert response.status_code == 200
        assert response.json()["experience_level"] == "intermediate"

    def test_delete_user(self):
        user = client.post("/users/", json={"preferred_language": "en", "experience_level": "beginner"}).json()
        response = client.delete(f"/users/{user['user_id']}")
        assert response.status_code == 200

    def test_list_users(self):
        response = client.get("/users/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_merge_users(self):
        user1 = client.post("/users/", json={"preferred_language": "en", "experience_level": "beginner"}).json()
        user2 = client.post("/users/", json={"preferred_language": "en", "experience_level": "intermediate"}).json()
        response = client.post(f"/users/{user1['user_id']}/merge", json={"duplicate_user_id": user2["user_id"]})
        assert response.status_code == 200


class TestNotificationPreferenceContract:
    """Test Notification Preference contracts."""

    def test_get_preferences(self):
        user = client.post("/users/", json={"preferred_language": "en", "experience_level": "beginner"}).json()
        response = client.get(f"/users/{user['user_id']}/preferences")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_update_preference(self):
        user = client.post("/users/", json={"preferred_language": "en", "experience_level": "beginner"}).json()
        response = client.put(
            f"/users/{user['user_id']}/preferences",
            json={"channel": "email", "topic": "test", "status": "opt-in", "frequency": "daily"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "opt-in"


class TestBehaviorEventContract:
    """Test Behavior Event contracts."""

    def test_create_event(self):
        user = client.post("/users/", json={"preferred_language": "en", "experience_level": "beginner"}).json()
        response = client.post(
            "/events/",
            json={
                "user_id": user["user_id"],
                "source_project": "test",
                "event_type": "test.event",
                "payload": {"test": "data"},
                "occurred_at": "2025-11-05T00:00:00Z"
            }
        )
        assert response.status_code == 200
        assert "event_id" in response.json()

    def test_get_user_events(self):
        user = client.post("/users/", json={"preferred_language": "en", "experience_level": "beginner"}).json()
        client.post("/events/", json={"user_id": user["user_id"], "source_project": "test", "event_type": "test.event", "payload": {"test": "data"}, "occurred_at": "2025-11-05T00:00:00Z"})
        response = client.get(f"/events/by-user/{user['user_id']}?sort_by=occurred_at")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestHealthCheck:
    """Test health check."""

    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
