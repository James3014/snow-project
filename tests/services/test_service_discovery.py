"""
服務發現機制測試
遵循 TDD 原則
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from services.shared.service_discovery import (
    ServiceInstance,
    ServiceStatus,
    InMemoryServiceDiscovery,
    ServiceRegistry,
    get_service_discovery,
    get_service_registry
)


class TestServiceInstance:
    """ServiceInstance 測試"""
    
    def test_service_instance_creation(self):
        """測試服務實例創建"""
        instance = ServiceInstance(
            name="test-service",
            host="localhost",
            port=8080
        )
        
        assert instance.name == "test-service"
        assert instance.host == "localhost"
        assert instance.port == 8080
        assert instance.status == ServiceStatus.UNKNOWN
        assert instance.url == "http://localhost:8080"
        assert instance.health_url == "http://localhost:8080/health"
    
    def test_service_instance_with_metadata(self):
        """測試帶元數據的服務實例"""
        metadata = {"version": "1.0.0", "region": "us-east-1"}
        instance = ServiceInstance(
            name="api-service",
            host="api.example.com",
            port=443,
            metadata=metadata
        )
        
        assert instance.metadata == metadata
        assert instance.url == "http://api.example.com:443"


@pytest.mark.asyncio
class TestInMemoryServiceDiscovery:
    """記憶體服務發現測試"""
    
    async def test_register_and_discover_service(self):
        """測試註冊和發現服務"""
        discovery = InMemoryServiceDiscovery()
        
        instance = ServiceInstance("test-service", "localhost", 8080)
        
        # 註冊服務
        success = await discovery.register_service(instance)
        assert success is True
        
        # 發現服務
        instances = await discovery.discover_services("test-service")
        assert len(instances) == 1
        assert instances[0].name == "test-service"
        assert instances[0].host == "localhost"
        assert instances[0].port == 8080
    
    async def test_register_multiple_instances(self):
        """測試註冊多個服務實例"""
        discovery = InMemoryServiceDiscovery()
        
        instance1 = ServiceInstance("web-service", "host1", 8080)
        instance2 = ServiceInstance("web-service", "host2", 8080)
        
        await discovery.register_service(instance1)
        await discovery.register_service(instance2)
        
        instances = await discovery.discover_services("web-service")
        assert len(instances) == 2
        
        hosts = {i.host for i in instances}
        assert hosts == {"host1", "host2"}
    
    async def test_deregister_service(self):
        """測試取消註冊服務"""
        discovery = InMemoryServiceDiscovery()
        
        instance = ServiceInstance("temp-service", "localhost", 9000)
        await discovery.register_service(instance)
        
        # 確認服務已註冊
        instances = await discovery.discover_services("temp-service")
        assert len(instances) == 1
        
        # 取消註冊
        success = await discovery.deregister_service("temp-service", "localhost:9000")
        assert success is True
        
        # 確認服務已移除
        instances = await discovery.discover_services("temp-service")
        assert len(instances) == 0
    
    async def test_discover_nonexistent_service(self):
        """測試發現不存在的服務"""
        discovery = InMemoryServiceDiscovery()
        
        instances = await discovery.discover_services("nonexistent-service")
        assert instances == []
    
    async def test_get_healthy_instance(self):
        """測試獲取健康實例"""
        discovery = InMemoryServiceDiscovery()
        
        # 註冊健康和不健康的實例
        healthy_instance = ServiceInstance("api", "host1", 8080)
        healthy_instance.status = ServiceStatus.HEALTHY
        
        unhealthy_instance = ServiceInstance("api", "host2", 8080)
        unhealthy_instance.status = ServiceStatus.UNHEALTHY
        
        await discovery.register_service(healthy_instance)
        await discovery.register_service(unhealthy_instance)
        
        # 獲取健康實例
        instance = await discovery.get_healthy_instance("api")
        assert instance is not None
        assert instance.host == "host1"
        assert instance.status == ServiceStatus.HEALTHY
    
    async def test_get_healthy_instance_none_available(self):
        """測試沒有健康實例時返回 None"""
        discovery = InMemoryServiceDiscovery()
        
        unhealthy_instance = ServiceInstance("api", "host1", 8080)
        unhealthy_instance.status = ServiceStatus.UNHEALTHY
        await discovery.register_service(unhealthy_instance)
        
        instance = await discovery.get_healthy_instance("api")
        assert instance is None
    
    @patch('httpx.AsyncClient.get')
    async def test_health_check_success(self, mock_get):
        """測試健康檢查成功"""
        discovery = InMemoryServiceDiscovery()
        
        # 模擬健康檢查成功
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        instance = ServiceInstance("test", "localhost", 8080)
        await discovery.register_service(instance)
        
        # 執行健康檢查
        await discovery._check_service_health(instance)
        
        assert instance.status == ServiceStatus.HEALTHY
    
    @patch('httpx.AsyncClient.get')
    async def test_health_check_failure(self, mock_get):
        """測試健康檢查失敗"""
        discovery = InMemoryServiceDiscovery()
        
        # 模擬健康檢查失敗
        mock_get.side_effect = Exception("Connection failed")
        
        instance = ServiceInstance("test", "localhost", 8080)
        await discovery.register_service(instance)
        
        # 執行健康檢查
        await discovery._check_service_health(instance)
        
        assert instance.status == ServiceStatus.UNHEALTHY


@pytest.mark.asyncio
class TestServiceRegistry:
    """服務註冊表測試"""
    
    async def test_register_current_service(self):
        """測試註冊當前服務"""
        discovery = InMemoryServiceDiscovery()
        registry = ServiceRegistry(discovery)
        
        success = await registry.register_current_service(
            name="my-service",
            host="localhost",
            port=8080,
            metadata={"version": "1.0"}
        )
        
        assert success is True
        
        # 驗證服務已註冊
        instances = await discovery.discover_services("my-service")
        assert len(instances) == 1
        assert instances[0].metadata["version"] == "1.0"
    
    async def test_deregister_all(self):
        """測試取消註冊所有服務"""
        discovery = InMemoryServiceDiscovery()
        registry = ServiceRegistry(discovery)
        
        # 註冊多個服務
        await registry.register_current_service("service1", "host1", 8080)
        await registry.register_current_service("service2", "host2", 8081)
        
        # 取消註冊所有服務
        await registry.deregister_all()
        
        # 驗證所有服務已移除
        instances1 = await discovery.discover_services("service1")
        instances2 = await discovery.discover_services("service2")
        
        assert len(instances1) == 0
        assert len(instances2) == 0


class TestServiceDiscoveryGlobals:
    """全局服務發現測試"""
    
    def test_get_service_discovery_singleton(self):
        """測試服務發現單例"""
        discovery1 = get_service_discovery()
        discovery2 = get_service_discovery()
        
        assert discovery1 is discovery2
        assert isinstance(discovery1, InMemoryServiceDiscovery)
    
    def test_get_service_registry_singleton(self):
        """測試服務註冊表單例"""
        registry1 = get_service_registry()
        registry2 = get_service_registry()
        
        assert registry1 is registry2
        assert isinstance(registry1, ServiceRegistry)
