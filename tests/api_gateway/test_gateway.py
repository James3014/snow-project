"""
API Gateway 測試
遵循 TDD 原則：Red → Green → Refactor
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import sys
import os

# 添加項目根目錄到路徑
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from api_gateway.main import app, get_service_url, extract_user_context, GatewayError
from services.shared.config_service import set_config_service, MockConfigService

class TestAPIGateway:
    """API Gateway 測試類"""
    
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
    
    @pytest.mark.asyncio
    async def test_get_service_url_valid_service(self):
        """測試獲取有效服務 URL"""
        # 測試 user-core 服務
        url = await get_service_url("user-core")
        assert url == "http://localhost:8001"
    
    @pytest.mark.asyncio
    async def test_get_service_url_tour_service(self):
        """測試獲取 tour 服務 URL（特殊處理）"""
        url = await get_service_url("tour")
        assert url == "http://localhost:3010"
    
    @pytest.mark.asyncio
    async def test_get_service_url_invalid_service(self):
        """測試獲取無效服務 URL 拋出錯誤"""
        with pytest.raises(GatewayError) as exc_info:
            await get_service_url("invalid-service")
        
        assert exc_info.value.status_code == 404
        assert "Unknown service" in exc_info.value.message
    
    @pytest.mark.asyncio
    async def test_extract_user_context_with_auth(self):
        """測試提取有認證的用戶上下文"""
        from fastapi import Request
        
        # 模擬請求
        request = Request({
            "type": "http",
            "headers": [
                (b"x-user-id", b"user123"),
                (b"authorization", b"Bearer token123")
            ]
        })
        
        context = await extract_user_context(request)
        
        assert context["user_id"] == "user123"
        assert context["auth_token"] == "Bearer token123"
        assert context["authenticated"] is True
    
    @pytest.mark.asyncio
    async def test_extract_user_context_without_auth(self):
        """測試提取無認證的用戶上下文"""
        from fastapi import Request
        
        # 模擬請求
        request = Request({
            "type": "http",
            "headers": []
        })
        
        context = await extract_user_context(request)
        
        assert context["user_id"] is None
        assert context["auth_token"] is None
        assert context["authenticated"] is False
    
    def test_invalid_service_route(self):
        """測試無效的服務路由"""
        response = self.client.get("/api/invalid-service/test")
        assert response.status_code == 404
        
        data = response.json()
        assert "Service route not found" in data["error"]
    
    @patch('httpx.AsyncClient.request')
    def test_proxy_request_success(self, mock_request):
        """測試成功的代理請求"""
        # 模擬成功響應
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message": "success"}
        mock_response.headers = {"content-type": "application/json"}
        mock_request.return_value = mock_response
        
        response = self.client.get("/api/auth/login")
        assert response.status_code == 200
    
    @patch('httpx.AsyncClient.request')
    def test_proxy_request_timeout(self, mock_request):
        """測試代理請求超時"""
        import httpx
        mock_request.side_effect = httpx.TimeoutException("Timeout")
        
        response = self.client.get("/api/auth/login")
        assert response.status_code == 504
        
        data = response.json()
        assert "Service timeout" in data["error"]
    
    @patch('httpx.AsyncClient.request')
    def test_proxy_request_connection_error(self, mock_request):
        """測試代理請求連接錯誤"""
        import httpx
        mock_request.side_effect = httpx.ConnectError("Connection failed")
        
        response = self.client.get("/api/auth/login")
        assert response.status_code == 503
        
        data = response.json()
        assert "Service unavailable" in data["error"]
    
    def test_proxy_request_with_user_context(self):
        """測試帶用戶上下文的代理請求"""
        headers = {
            "X-User-Id": "user123",
            "Authorization": "Bearer token123"
        }
        
        with patch('httpx.AsyncClient.request') as mock_request:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"data": "test"}
            mock_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_response
            
            response = self.client.get("/api/users/profile", headers=headers)
            assert response.status_code == 200
            
            # 驗證請求包含用戶上下文
            call_args = mock_request.call_args
            assert call_args[1]["headers"]["X-User-Id"] == "user123"
    
    @patch('httpx.AsyncClient.get')
    def test_services_health_check(self, mock_get):
        """測試服務健康檢查"""
        # 模擬健康的服務響應
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.elapsed.total_seconds.return_value = 0.1
        mock_get.return_value = mock_response
        
        response = self.client.get("/health/services")
        assert response.status_code == 200
        
        data = response.json()
        assert data["gateway"] == "healthy"
        assert "services" in data
        assert "timestamp" in data


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
