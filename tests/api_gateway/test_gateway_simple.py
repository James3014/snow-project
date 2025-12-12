"""
API Gateway 簡化測試
專注於核心功能，避免複雜的 Mock 設置
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# 添加項目根目錄到路徑
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from api_gateway.main import app, GatewayError
from services.shared.config_service import set_config_service, MockConfigService

class TestAPIGatewayBasic:
    """API Gateway 基礎功能測試"""
    
    def setup_method(self):
        """每個測試前的設置"""
        # 使用測試配置服務
        mock_config = MockConfigService()
        set_config_service(mock_config)
        self.client = TestClient(app)
    
    def test_health_check(self):
        """測試健康檢查端點"""
        response = self.client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "api-gateway"
        assert "timestamp" in data
        assert "services" in data
        
        # 驗證服務列表
        expected_services = ["auth", "users", "resorts", "calendar", "gear", "social", "matching", "trips"]
        assert data["services"] == expected_services
    
    def test_invalid_service_route(self):
        """測試無效的服務路由"""
        response = self.client.get("/api/invalid-service/test")
        assert response.status_code == 404
        
        data = response.json()
        assert "Service route not found" in data["error"]
        assert "invalid-service" in data["error"]
        assert "timestamp" in data
        assert "path" in data


class TestGatewayError:
    """GatewayError 測試類"""
    
    def test_gateway_error_creation(self):
        """測試 GatewayError 創建"""
        error = GatewayError(404, "Not found", {"service": "test"})
        
        assert error.status_code == 404
        assert error.message == "Not found"
        assert error.details == {"service": "test"}
    
    def test_gateway_error_default_details(self):
        """測試 GatewayError 預設詳情"""
        error = GatewayError(500, "Internal error")
        
        assert error.status_code == 500
        assert error.message == "Internal error"
        assert error.details == {}


class TestServiceRoutes:
    """服務路由測試類"""
    
    def test_service_routes_mapping(self):
        """測試服務路由映射"""
        from api_gateway.main import SERVICE_ROUTES
        
        expected_routes = {
            "auth": "user-core",
            "users": "user-core",
            "resorts": "resort-api",
            "calendar": "calendar-service",
            "gear": "gear-service",
            "social": "social-service",
            "matching": "snowbuddy-matching",
            "trips": "tour"
        }
        
        assert SERVICE_ROUTES == expected_routes
        
        # 驗證所有路由都有對應的服務
        for route, service in SERVICE_ROUTES.items():
            assert isinstance(route, str)
            assert isinstance(service, str)
            assert len(route) > 0
            assert len(service) > 0


class TestConfigIntegration:
    """配置整合測試"""
    
    def setup_method(self):
        """每個測試前的設置"""
        mock_config = MockConfigService()
        set_config_service(mock_config)
    
    def test_config_service_integration(self):
        """測試配置服務整合"""
        from services.shared.config_service import get_config_service
        
        config = get_config_service()
        
        # 測試獲取 user-core 配置
        user_core_config = config.get_service_config("user-core")
        assert user_core_config.name == "user-core"
        assert user_core_config.host == "localhost"
        assert user_core_config.port == 8001
        
        # 測試獲取服務 URL
        url = config.get_service_url("user-core")
        assert url == "http://localhost:8001"
