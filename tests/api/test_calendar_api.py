"""
TDD: Calendar API Integration Tests
TODO-CAL-005~007 (Repository via API)

Note: 需要認證的 API 會被跳過，除非提供有效的 token
"""
import pytest
import requests
import uuid
import os
from datetime import datetime, timezone, timedelta

BASE_URL = "https://user-core.zeabur.app"
TEST_USER_ID = str(uuid.uuid4())

# 從環境變數取得測試 token（可選）
TEST_TOKEN = os.environ.get("TEST_AUTH_TOKEN", "")


class TestHealthAndPublicAPIs:
    """測試公開 API"""

    def test_health_check(self):
        """API 健康檢查"""
        resp = requests.get(f"{BASE_URL}/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_resorts_api(self):
        """雪場 API"""
        resp = requests.get("https://resort-api.zeabur.app/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestCalendarAPISchema:
    """測試 Calendar API Schema（不需要認證的檢查）"""

    def test_calendar_trips_endpoint_exists(self):
        """確認 /calendar/trips 端點存在"""
        resp = requests.get(f"{BASE_URL}/calendar/trips")
        # 422 = 驗證錯誤（缺少認證），表示端點存在
        # 404 = 端點不存在
        assert resp.status_code != 404, "Calendar trips endpoint should exist"

    def test_calendar_events_endpoint_exists(self):
        """確認 /calendar/events 端點存在"""
        resp = requests.get(f"{BASE_URL}/calendar/events")
        assert resp.status_code != 404, "Calendar events endpoint should exist"

    def test_create_trip_requires_auth(self):
        """建立行程需要認證"""
        data = {
            "title": "Test",
            "start_date": "2025-01-15T00:00:00Z",
            "end_date": "2025-01-18T00:00:00Z",
        }
        resp = requests.post(f"{BASE_URL}/calendar/trips", json=data)
        # 應該返回 422（缺少 authorization header）
        assert resp.status_code == 422
        assert "authorization" in resp.text.lower()


@pytest.mark.skipif(not TEST_TOKEN, reason="No auth token provided")
class TestCalendarAPIWithAuth:
    """需要認證的 API 測試"""

    @pytest.fixture
    def headers(self):
        return {
            "Authorization": f"Bearer {TEST_TOKEN}",
            "Content-Type": "application/json",
        }

    def test_create_trip(self, headers):
        """建立行程"""
        start = datetime.now(timezone.utc) + timedelta(days=30)
        end = start + timedelta(days=3)

        data = {
            "title": "TDD 測試行程",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "resort_id": "naeba",
            "resort_name": "苗場",
            "visibility": "private",
        }

        resp = requests.post(f"{BASE_URL}/calendar/trips", json=data, headers=headers)
        assert resp.status_code in [200, 201]

    def test_get_user_trips(self, headers):
        """取得用戶行程列表"""
        resp = requests.get(f"{BASE_URL}/calendar/trips", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestAPIResponseFormat:
    """測試 API 回應格式"""

    def test_health_response_format(self):
        """健康檢查回應格式"""
        resp = requests.get(f"{BASE_URL}/health")
        data = resp.json()
        assert "status" in data

    def test_error_response_format(self):
        """錯誤回應格式"""
        resp = requests.get(f"{BASE_URL}/calendar/trips")
        data = resp.json()
        # FastAPI 標準錯誤格式
        assert "detail" in data


class TestPublicTripsAPI:
    """測試公開行程 API"""

    def test_public_trips_endpoint_exists(self):
        """確認 /calendar/public/trips 端點存在"""
        resp = requests.get(f"{BASE_URL}/calendar/public/trips")
        # 200 = 成功（公開端點不需認證）
        assert resp.status_code == 200

    def test_public_trips_returns_list(self):
        """公開行程返回列表"""
        resp = requests.get(f"{BASE_URL}/calendar/public/trips")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_public_trips_filter_by_resort(self):
        """按雪場篩選公開行程"""
        resp = requests.get(f"{BASE_URL}/calendar/public/trips?resort_id=naeba")
        assert resp.status_code == 200

    def test_public_trips_filter_by_region(self):
        """按地區篩選公開行程"""
        resp = requests.get(f"{BASE_URL}/calendar/public/trips?region=新潟")
        assert resp.status_code == 200


class TestSharedCalendarAPI:
    """測試共享行事曆 API"""

    def test_shared_calendar_requires_auth(self):
        """共享行事曆需要認證"""
        resp = requests.get(f"{BASE_URL}/calendar/shared")
        assert resp.status_code == 422  # 缺少認證

    def test_join_public_trip_requires_auth(self):
        """加入公開行程需要認證"""
        resp = requests.post(f"{BASE_URL}/calendar/public/trips/123/join")
        assert resp.status_code == 422  # 缺少認證
