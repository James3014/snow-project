import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
import sys
import types


class FakeRedisClient:
    def set(self, *args, **kwargs):
        return None
    def get(self, *args, **kwargs):
        return None


# Mock redis before importing app
if "redis" not in sys.modules:
    sys.modules["redis"] = types.SimpleNamespace(from_url=lambda *_args, **_kwargs: FakeRedisClient())

from snowbuddy_matching.app.main import app

client = TestClient(app)
AUTH_HEADERS = {"X-User-Id": "test-user-123"}


@pytest.fixture
def mock_clients(mocker):
    post_event = mocker.patch("snowbuddy_matching.app.clients.user_core_client.post_event", new_callable=AsyncMock)
    mocker.patch("snowbuddy_matching.app.clients.user_core_client.get_users", new_callable=AsyncMock, return_value=[])
    mocker.patch("snowbuddy_matching.app.clients.resort_services_client.get_resorts", new_callable=AsyncMock, return_value=[])
    return {"post_event": post_event}


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_send_match_request_emits_event(mock_clients):
    mock_clients["post_event"].return_value = True

    response = client.post("/requests", json={"target_user_id": "user-123"}, headers=AUTH_HEADERS)

    assert response.status_code == 202
    payload = mock_clients["post_event"].await_args.args[0]
    assert payload["source_project"] == "snowbuddy-matching"
    assert payload["event_type"] == "snowbuddy.match.request.sent"
    assert payload["payload"]["target_user_id"] == "user-123"
    assert "occurred_at" in payload


@pytest.mark.anyio
async def test_respond_to_match_request_emits_event(mock_clients):
    mock_clients["post_event"].return_value = True

    response = client.put("/requests/req-1", json={"action": "accept"}, headers=AUTH_HEADERS)

    assert response.status_code == 200
    payload = mock_clients["post_event"].await_args.args[0]
    assert payload["event_type"] == "snowbuddy.match.request.accepted"
    assert payload["payload"]["request_id"] == "req-1"
