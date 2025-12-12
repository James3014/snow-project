"""
配置服務測試
遵循 TDD 原則：Red → Green → Refactor
"""
import os
import pytest
from unittest.mock import patch

from services.shared.config_service import (
    ConfigServiceInterface,
    EnvironmentConfigService,
    ServiceConfig,
    Environment,
    get_config_service,
    set_config_service
)


class MockConfigService(ConfigServiceInterface):
    """測試用的模擬配置服務"""
    
    def __init__(self):
        self.configs = {
            "test-service": ServiceConfig(
                name="test-service",
                host="test-host",
                port=9999,
                environment=Environment.TESTING
            )
        }
    
    def get_service_config(self, service_name: str) -> ServiceConfig:
        if service_name not in self.configs:
            raise ValueError(f"Unknown service: {service_name}")
        return self.configs[service_name]
    
    def get_environment(self) -> Environment:
        return Environment.TESTING
    
    def get_service_url(self, service_name: str) -> str:
        config = self.get_service_config(service_name)
        return f"http://{config.host}:{config.port}"


class TestConfigService:
    """配置服務測試類"""
    
    def setup_method(self):
        """每個測試前的設置"""
        # 重置單例
        set_config_service(None)
    
    def test_environment_detection_development(self):
        """測試開發環境檢測"""
        with patch.dict(os.environ, {"NODE_ENV": "development"}):
            service = EnvironmentConfigService()
            assert service.get_environment() == Environment.DEVELOPMENT
    
    def test_environment_detection_production(self):
        """測試生產環境檢測"""
        with patch.dict(os.environ, {"NODE_ENV": "production"}):
            service = EnvironmentConfigService()
            assert service.get_environment() == Environment.PRODUCTION
    
    def test_environment_detection_default(self):
        """測試預設環境檢測"""
        with patch.dict(os.environ, {}, clear=True):
            service = EnvironmentConfigService()
            assert service.get_environment() == Environment.DEVELOPMENT
    
    def test_get_user_core_config_default(self):
        """測試獲取 user-core 預設配置"""
        with patch.dict(os.environ, {}, clear=True):
            service = EnvironmentConfigService()
            config = service.get_service_config("user-core")
            
            assert config.name == "user-core"
            assert config.host == "localhost"
            assert config.port == 8001
            assert config.environment == Environment.DEVELOPMENT
    
    def test_get_user_core_config_custom(self):
        """測試獲取 user-core 自定義配置"""
        env_vars = {
            "USER_CORE_HOST": "custom-host",
            "USER_CORE_PORT": "9001",
            "USER_CORE_DB_URL": "postgresql://test:test@localhost/test"
        }
        with patch.dict(os.environ, env_vars):
            service = EnvironmentConfigService()
            config = service.get_service_config("user-core")
            
            assert config.host == "custom-host"
            assert config.port == 9001
            assert config.database_url == "postgresql://test:test@localhost/test"
    
    def test_get_calendar_service_config(self):
        """測試獲取 calendar-service 配置"""
        with patch.dict(os.environ, {}, clear=True):
            service = EnvironmentConfigService()
            config = service.get_service_config("calendar-service")
            
            assert config.name == "calendar-service"
            assert config.port == 8003
            assert "user-core" in config.dependencies
            assert config.dependencies["user-core"] == "http://localhost:8001"
    
    def test_get_gear_service_config(self):
        """測試獲取 gear-service 配置"""
        service = EnvironmentConfigService()
        config = service.get_service_config("gear-service")
        
        assert config.name == "gear-service"
        assert config.port == 8004
        assert "user-core" in config.dependencies
    
    def test_get_social_service_config(self):
        """測試獲取 social-service 配置"""
        service = EnvironmentConfigService()
        config = service.get_service_config("social-service")
        
        assert config.name == "social-service"
        assert config.port == 8005
        assert "user-core" in config.dependencies
    
    def test_get_unknown_service_raises_error(self):
        """測試獲取未知服務拋出錯誤"""
        service = EnvironmentConfigService()
        
        with pytest.raises(ValueError, match="Unknown service: unknown-service"):
            service.get_service_config("unknown-service")
    
    def test_get_service_url(self):
        """測試獲取服務 URL"""
        service = EnvironmentConfigService()
        url = service.get_service_url("user-core")
        assert url == "http://localhost:8001"
    
    def test_singleton_pattern(self):
        """測試單例模式"""
        service1 = get_config_service()
        service2 = get_config_service()
        assert service1 is service2
    
    def test_set_custom_config_service(self):
        """測試設置自定義配置服務"""
        mock_service = MockConfigService()
        set_config_service(mock_service)
        
        service = get_config_service()
        assert service is mock_service
        
        config = service.get_service_config("test-service")
        assert config.name == "test-service"
        assert config.host == "test-host"
        assert config.port == 9999
    
    def test_snowbuddy_service_config_with_dependencies(self):
        """測試 snowbuddy 服務配置包含多個依賴"""
        service = EnvironmentConfigService()
        config = service.get_service_config("snowbuddy-matching")
        
        assert config.name == "snowbuddy-matching"
        assert config.port == 8002
        assert "user-core" in config.dependencies
        assert "resort-api" in config.dependencies
        assert config.redis_url == "redis://localhost:6379"


class TestServiceConfig:
    """ServiceConfig 數據類測試"""
    
    def test_service_config_creation(self):
        """測試 ServiceConfig 創建"""
        config = ServiceConfig(
            name="test-service",
            host="localhost",
            port=8080,
            environment=Environment.TESTING
        )
        
        assert config.name == "test-service"
        assert config.host == "localhost"
        assert config.port == 8080
        assert config.environment == Environment.TESTING
        assert config.dependencies == {}
    
    def test_service_config_with_dependencies(self):
        """測試帶依賴的 ServiceConfig"""
        deps = {"service-a": "http://localhost:8001"}
        config = ServiceConfig(
            name="test-service",
            host="localhost",
            port=8080,
            environment=Environment.TESTING,
            dependencies=deps
        )
        
        assert config.dependencies == deps
