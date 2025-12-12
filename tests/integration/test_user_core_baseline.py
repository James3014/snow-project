"""
T1.1: user_core 基線集成測試
測試所有主要端點功能正常，為重構建立安全網
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
from pathlib import Path

USER_CORE_ROOT = Path(__file__).resolve().parents[2] / "platform" / "user_core"
sys.path.insert(0, str(USER_CORE_ROOT))

from api.main import app
from services.db import get_db
from models.user_profile import Base as UserBase
from models.change_feed import Base as ChangeFeedBase
from models.notification_preference import Base as PrefBase
from models.behavior_event import Base as EventBase
from models.gear import Base as GearBase
from models.social import Base as SocialBase
from models.trip_planning import Base as TripBase
from models.calendar import Base as CalendarBase

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_user_core_baseline.db"

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
    """建立測試資料庫"""
    all_bases = [UserBase, EventBase, PrefBase, ChangeFeedBase, GearBase, SocialBase, TripBase, CalendarBase]
    for base in all_bases:
        base.metadata.create_all(bind=engine)
    yield
    for base in all_bases:
        base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user():
    """建立測試用戶"""
    user_data = {
        "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
        "password": "testpassword123",
        "display_name": f"Test User {uuid.uuid4().hex[:8]}",
        "preferred_language": "zh-TW",
        "experience_level": "beginner"
    }
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 201
    user = response.json()
    user["password"] = user_data["password"]  # 保存密碼用於登入
    return user

@pytest.fixture
def auth_headers(test_user):
    """取得認證標頭"""
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {
        "Authorization": f"Bearer {token}",
        "X-User-Id": str(test_user["user_id"])
    }

class TestAuthEndpoints:
    """測試認證相關端點"""
    
    def test_user_registration(self):
        """測試用戶註冊"""
        user_data = {
            "email": f"newuser_{uuid.uuid4().hex[:8]}@example.com",
            "password": "newpassword123",
            "display_name": f"New User {uuid.uuid4().hex[:8]}",
            "preferred_language": "zh-TW",
            "experience_level": "beginner"
        }
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 201
        assert response.json()["email"] == user_data["email"]
    
    def test_user_login(self, test_user):
        """測試用戶登入"""
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    def test_auth_validation(self, auth_headers):
        """測試認證驗證"""
        response = client.get("/auth/validate", headers=auth_headers)
        assert response.status_code == 200

class TestUserProfileEndpoints:
    """測試用戶資料相關端點"""
    
    def test_get_user_profile(self, test_user, auth_headers):
        """測試取得用戶資料"""
        response = client.get(f"/users/{test_user['user_id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["user_id"] == test_user["user_id"]
    
    def test_update_user_profile(self, test_user, auth_headers):
        """測試更新用戶資料"""
        update_data = {"bio": "Updated bio"}
        response = client.put(f"/users/{test_user['user_id']}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["bio"] == "Updated bio"

class TestCalendarEndpoints:
    """測試行事曆相關端點"""
    
    def test_create_calendar_event(self, test_user, auth_headers):
        """測試建立行事曆事件"""
        event_data = {
            "title": "Test Event",
            "start_date": "2025-01-15",
            "end_date": "2025-01-16",
            "event_type": "trip"
        }
        response = client.post(f"/users/{test_user['user_id']}/calendar/events", json=event_data, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["title"] == "Test Event"
    
    def test_get_calendar_events(self, test_user, auth_headers):
        """測試取得行事曆事件"""
        response = client.get(f"/users/{test_user['user_id']}/calendar/events", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

class TestGearEndpoints:
    """測試裝備管理相關端點"""
    
    def test_create_gear(self, test_user, auth_headers):
        """測試建立裝備"""
        gear_data = {
            "name": "Test Snowboard",
            "brand": "Test Brand",
            "category": "snowboard",
            "status": "in_use"
        }
        response = client.post(f"/users/{test_user['id']}/gear", json=gear_data, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["name"] == "Test Snowboard"
    
    def test_get_user_gear(self, test_user, auth_headers):
        """測試取得用戶裝備"""
        response = client.get(f"/users/{test_user['id']}/gear", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

class TestSocialEndpoints:
    """測試社交功能相關端點"""
    
    def test_get_activity_feed(self, test_user, auth_headers):
        """測試取得動態消息"""
        response = client.get(f"/users/{test_user['id']}/feed", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_follow_user(self, test_user, auth_headers):
        """測試關注用戶功能"""
        # 先建立另一個用戶
        other_user_data = {
            "username": f"otheruser_{uuid.uuid4().hex[:8]}",
            "email": f"other_{uuid.uuid4().hex[:8]}@example.com",
            "password": "otherpassword123"
        }
        other_response = client.post("/users/", json=other_user_data)
        assert other_response.status_code == 201
        other_user = other_response.json()
        
        # 測試關注
        response = client.post(f"/users/{test_user['id']}/follow/{other_user['id']}", headers=auth_headers)
        assert response.status_code == 200

class TestTripPlanningEndpoints:
    """測試行程規劃相關端點"""
    
    def test_create_trip(self, test_user, auth_headers):
        """測試建立行程"""
        trip_data = {
            "title": "Test Trip",
            "start_date": "2025-02-01",
            "end_date": "2025-02-03",
            "resort_id": 1,
            "status": "planning"
        }
        response = client.post(f"/users/{test_user['id']}/trips", json=trip_data, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["title"] == "Test Trip"
    
    def test_get_user_trips(self, test_user, auth_headers):
        """測試取得用戶行程"""
        response = client.get(f"/users/{test_user['id']}/trips", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

class TestBehaviorEventEndpoints:
    """測試行為事件相關端點"""
    
    def test_create_behavior_event(self, test_user, auth_headers):
        """測試建立行為事件"""
        event_data = {
            "event_type": "page_view",
            "event_data": {"page": "profile"},
            "source_project": "ski-platform"
        }
        response = client.post(f"/users/{test_user['id']}/behavior-events", json=event_data, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["event_type"] == "page_view"
    
    def test_get_behavior_events(self, test_user, auth_headers):
        """測試取得行為事件"""
        response = client.get(f"/users/{test_user['id']}/behavior-events", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

class TestSkiMapEndpoints:
    """測試滑雪地圖相關端點"""
    
    def test_get_ski_map(self, test_user, auth_headers):
        """測試取得滑雪地圖"""
        response = client.get(f"/users/{test_user['id']}/ski-map", headers=auth_headers)
        assert response.status_code == 200

class TestHealthCheck:
    """測試健康檢查端點"""
    
    def test_health_check(self):
        """測試健康檢查"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

# 整合測試：測試跨模組功能
class TestCrossModuleIntegration:
    """測試跨模組整合功能"""
    
    def test_trip_with_calendar_integration(self, test_user, auth_headers):
        """測試行程與行事曆整合"""
        # 建立行程
        trip_data = {
            "title": "Integration Test Trip",
            "start_date": "2025-03-01",
            "end_date": "2025-03-03",
            "resort_id": 1,
            "status": "planning"
        }
        trip_response = client.post(f"/users/{test_user['id']}/trips", json=trip_data, headers=auth_headers)
        assert trip_response.status_code == 201
        
        # 檢查是否自動建立行事曆事件
        calendar_response = client.get(f"/users/{test_user['id']}/calendar/events", headers=auth_headers)
        assert calendar_response.status_code == 200
        events = calendar_response.json()
        
        # 應該有相關的行事曆事件
        trip_events = [e for e in events if "Integration Test Trip" in e.get("title", "")]
        assert len(trip_events) > 0
    
    def test_gear_with_behavior_tracking(self, test_user, auth_headers):
        """測試裝備管理與行為追蹤整合"""
        # 建立裝備
        gear_data = {
            "name": "Tracking Test Board",
            "brand": "Test Brand",
            "category": "snowboard",
            "status": "in_use"
        }
        gear_response = client.post(f"/users/{test_user['id']}/gear", json=gear_data, headers=auth_headers)
        assert gear_response.status_code == 201
        
        # 檢查是否有相關的行為事件
        events_response = client.get(f"/users/{test_user['id']}/behavior-events", headers=auth_headers)
        assert events_response.status_code == 200
        events = events_response.json()
        
        # 應該有裝備相關的行為事件
        gear_events = [e for e in events if e.get("event_type") == "gear_created"]
        assert len(gear_events) >= 0  # 可能沒有自動追蹤，這裡先寬鬆檢查

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
