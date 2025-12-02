import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
from pathlib import Path

USER_CORE_ROOT = Path(__file__).resolve().parents[3] / "platform" / "user_core"
sys.path.insert(0, str(USER_CORE_ROOT))

from api.main import app  # type: ignore  # noqa: E402
from services.db import get_db  # type: ignore  # noqa: E402
from models.user_profile import Base as UserBase, LegacyMapping  # type: ignore  # noqa: E402
from models.change_feed import ChangeFeed, Base as ChangeFeedBase  # type: ignore  # noqa: E402
from models.notification_preference import Base as PrefBase  # type: ignore  # noqa: E402
from models.behavior_event import Base as EventBase  # type: ignore  # noqa: E402
from models.behavior_event import BehaviorEvent  # type: ignore  # noqa: E402

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_user_core.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
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
    # Create all tables once per session
    all_bases = [UserBase, EventBase, PrefBase, ChangeFeedBase]
    for base in all_bases:
        base.metadata.create_all(bind=engine)
    yield
    for base in all_bases:
        base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(setup_database):
    db = TestingSessionLocal()
    # Clean tables before each test
    for table in reversed(UserBase.metadata.sorted_tables):
        db.execute(table.delete())
    for table in reversed(PrefBase.metadata.sorted_tables):
        db.execute(table.delete())
    for table in reversed(EventBase.metadata.sorted_tables):
        db.execute(table.delete())
    for table in reversed(ChangeFeedBase.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    yield db
    db.close()

def test_user_profile_flow(db_session):
    payload = {
        "bio": "test bio",
        "roles": ["student"],
        "legacy_ids": {"tw_nid": "A123456789"},
        "legal_consent": {"privacy_version": "1.0", "marketing_opt_in": True},
        "locale_profiles": [
            {"country_code": "TW", "local_identifier": "A123456789", "verification_status": "pending"}
        ],
    }

    headers = {"X-Actor-Id": "coach-admin"}

    response = client.post("/users/", json=payload, headers=headers)
    assert response.status_code == 200
    user = response.json()
    user_id = user["user_id"]
    assert user["legal_consent"]["marketing_opt_in"] is True
    assert user["locale_profiles"][0]["country_code"] == "TW"

    # Read
    response = client.get(f"/users/{user_id}")
    assert response.status_code == 200
    fetched = response.json()
    assert fetched["locale_profiles"][0]["verification_status"] == "pending"

    # Update locale profile
    response = client.put(
        f"/users/{user_id}",
        json={
            "bio": "updated bio",
            "locale_profiles": [
                {"country_code": "TW", "verification_status": "verified"}
            ],
        },
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["bio"] == "updated bio"
    assert response.json()["locale_profiles"][0]["verification_status"] == "verified"

    # Deactivate
    response = client.delete(f"/users/{user_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "inactive"

    # List
    response = client.get("/users/")
    assert response.status_code == 200
    assert any(item["user_id"] == user_id for item in response.json())

    # Verify ChangeFeed entries exist for key transitions
    change_events = db_session.query(ChangeFeed).all()
    change_types = {event.change_type for event in change_events}
    assert {"created", "updated", "deactivated"}.issubset(change_types)

    actors = {event.payload["actor"] for event in change_events}
    assert actors == {"coach-admin"}

    updated_event = next(event for event in change_events if event.change_type == "updated")
    assert updated_event.payload["diff"]["bio"]["after"] == "updated bio"

    # Legacy mapping stored
    mapping = db_session.query(LegacyMapping).filter(LegacyMapping.user_id == uuid.UUID(user_id)).one()
    assert mapping.legacy_key == "A123456789"


def test_create_user_duplicate_conflict(db_session):
    payload = {
        "bio": "first user",
        "legacy_ids": {"passport": "X123"}
    }
    first = client.post("/users/", json=payload)
    assert first.status_code == 200

    second = client.post("/users/", json=payload)
    assert second.status_code == 409
    detail = second.json()["detail"]
    assert "existing_user_id" in detail


def test_behavior_event_validation(db_session):
    user_id = client.post("/users/", json={"bio": "event user"}).json()["user_id"]

    valid_event = {
        "user_id": user_id,
        "source_project": "resort-services",
        "event_type": "resort.visited",
        "payload": {"resort_id": "hakuba", "date": "2025-01-02"},
        "occurred_at": "2025-01-02T08:00:00Z",
    }
    response = client.post("/events/", json=valid_event)
    assert response.status_code == 200
    stored = db_session.query(BehaviorEvent).filter(BehaviorEvent.user_id == uuid.UUID(user_id)).one()
    assert stored.payload["resort_id"] == "hakuba"

    invalid_event = {
        "user_id": user_id,
        "source_project": "resort-services",
        "event_type": "resort.visited",
        "payload": {"resort_id": "hakuba"},
        "occurred_at": "2025-01-02T08:00:00Z",
    }
    response = client.post("/events/", json=invalid_event)
    assert response.status_code == 400


def test_behavior_event_query_requires_sort_by(db_session):
    user_id = client.post("/users/", json={"bio": "query user"}).json()["user_id"]
    client.post(
        "/events/",
        json={
            "user_id": user_id,
            "source_project": "resort-services",
            "event_type": "resort.visited",
            "payload": {"resort_id": "niseko", "date": "2025-01-10"},
            "occurred_at": "2025-01-10T08:00:00Z",
        },
    )

    # Missing sort_by should return 400 with allowed values
    response = client.get(f"/events/by-user/{user_id}")
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "allowed_values" in detail

    response = client.get(
        f"/events/by-user/{user_id}",
        params={"sort_by": "occurred_at", "order": "asc", "source_project": "resort-services"},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1


def test_merge_user_profiles(db_session):
    primary = client.post(
        "/users/",
        json={"roles": ["student"], "legacy_ids": {"tw_nid": "A0001"}},
        headers={"X-Actor-Id": "merge-admin"},
    ).json()["user_id"]

    duplicate = client.post(
        "/users/",
        json={"roles": ["coach"], "legacy_ids": {"passport": "P0001"}},
        headers={"X-Actor-Id": "merge-admin"},
    ).json()["user_id"]

    response = client.post(
        f"/users/{primary}/merge",
        json={"duplicate_user_id": duplicate},
        headers={"X-Actor-Id": "merge-admin"},
    )
    assert response.status_code == 200
    merged_profile = response.json()
    assert merged_profile["roles"] == ["student", "coach"]

    duplicate_profile = client.get(f"/users/{duplicate}").json()
    assert duplicate_profile["status"] == "merged"

    change_events = db_session.query(ChangeFeed).filter(ChangeFeed.entity_type == "user_profile").all()
    change_map = {str(event.entity_id): event for event in change_events}
    assert change_map[duplicate].change_type == "merged"
    assert change_map[duplicate].payload["actor"] == "merge-admin"
    assert change_map[primary].payload["diff"]["roles"]["after"] == ["student", "coach"]


def test_custom_behavior_event_with_schema_url(db_session):
    user_id = client.post("/users/", json={"bio": "custom event"}).json()["user_id"]

    response = client.post(
        "/events/",
        json={
            "user_id": user_id,
            "source_project": "gear-ops",
            "event_type": "gear.boot-fitting.completed",
            "version": 2,
            "schema_url": "https://schemas.snowtrace.dev/gear/boot-fitting/2",
            "payload": {"boot_size": "26.5"},
            "occurred_at": "2025-01-12T09:30:00Z",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["schema_url"] == "https://schemas.snowtrace.dev/gear/boot-fitting/2"


def test_notification_preference_flow(db_session):
    user_id = client.post("/users/", json={"bio": "pref user"}).json()["user_id"]

    preference_payload = {
        "channel": "email",
        "topic": "snowbuddy-match",
        "status": "opt-in",
        "frequency": "daily",
        "audited_by": "system",
        "consent_source": "web_form"
    }

    response = client.put(
        f"/users/{user_id}/preferences",
        json=preference_payload,
        headers={"X-Actor-Id": "pref-operator"},
    )
    assert response.status_code == 200
    pref = response.json()
    assert pref["frequency"] == "daily"
    assert pref["audited_by"] == "system"

    change_events = db_session.query(ChangeFeed).filter(ChangeFeed.entity_type == "notification_preference").all()
    assert len(change_events) == 1
    event_payload = change_events[0].payload
    assert event_payload["actor"] == "pref-operator"
    assert event_payload["diff"]["status"]["after"] == "opt-in"
