"""
服務發現機制
動態服務註冊和健康檢查
遵循 Clean Code 原則
"""
import asyncio
import httpx
import time
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ServiceStatus(Enum):
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class ServiceInstance:
    """服務實例資訊"""
    name: str
    host: str
    port: int
    status: ServiceStatus = ServiceStatus.UNKNOWN
    last_check: float = field(default_factory=time.time)
    metadata: Dict = field(default_factory=dict)
    
    @property
    def url(self) -> str:
        return f"http://{self.host}:{self.port}"
    
    @property
    def health_url(self) -> str:
        return f"{self.url}/health"


class ServiceDiscoveryInterface(ABC):
    """服務發現介面"""
    
    @abstractmethod
    async def register_service(self, instance: ServiceInstance) -> bool:
        """註冊服務"""
        pass
    
    @abstractmethod
    async def deregister_service(self, service_name: str, instance_id: str) -> bool:
        """取消註冊服務"""
        pass
    
    @abstractmethod
    async def discover_services(self, service_name: str) -> List[ServiceInstance]:
        """發現服務實例"""
        pass
    
    @abstractmethod
    async def get_healthy_instance(self, service_name: str) -> Optional[ServiceInstance]:
        """獲取健康的服務實例"""
        pass


class InMemoryServiceDiscovery(ServiceDiscoveryInterface):
    """記憶體內服務發現實作"""
    
    def __init__(self, health_check_interval: int = 30):
        self._services: Dict[str, Dict[str, ServiceInstance]] = {}
        self._health_check_interval = health_check_interval
        self._health_check_task: Optional[asyncio.Task] = None
        self._running = False
    
    async def start(self):
        """啟動服務發現"""
        if not self._running:
            self._running = True
            self._health_check_task = asyncio.create_task(self._health_check_loop())
            logger.info("Service discovery started")
    
    async def stop(self):
        """停止服務發現"""
        self._running = False
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
        logger.info("Service discovery stopped")
    
    async def register_service(self, instance: ServiceInstance) -> bool:
        """註冊服務"""
        service_name = instance.name
        instance_id = f"{instance.host}:{instance.port}"
        
        if service_name not in self._services:
            self._services[service_name] = {}
        
        self._services[service_name][instance_id] = instance
        logger.info(f"Registered service: {service_name} at {instance.url}")
        return True
    
    async def deregister_service(self, service_name: str, instance_id: str) -> bool:
        """取消註冊服務"""
        if service_name in self._services and instance_id in self._services[service_name]:
            del self._services[service_name][instance_id]
            logger.info(f"Deregistered service: {service_name} instance {instance_id}")
            return True
        return False
    
    async def discover_services(self, service_name: str) -> List[ServiceInstance]:
        """發現服務實例"""
        if service_name not in self._services:
            return []
        return list(self._services[service_name].values())
    
    async def get_healthy_instance(self, service_name: str) -> Optional[ServiceInstance]:
        """獲取健康的服務實例"""
        instances = await self.discover_services(service_name)
        healthy_instances = [i for i in instances if i.status == ServiceStatus.HEALTHY]
        
        if not healthy_instances:
            return None
        
        # 簡單輪詢負載均衡
        return healthy_instances[0]
    
    async def _health_check_loop(self):
        """健康檢查循環"""
        while self._running:
            try:
                await self._check_all_services()
                await asyncio.sleep(self._health_check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(5)
    
    async def _check_all_services(self):
        """檢查所有服務健康狀態"""
        tasks = []
        for service_name, instances in self._services.items():
            for instance in instances.values():
                tasks.append(self._check_service_health(instance))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _check_service_health(self, instance: ServiceInstance):
        """檢查單個服務健康狀態"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(instance.health_url)
                if response.status_code == 200:
                    instance.status = ServiceStatus.HEALTHY
                else:
                    instance.status = ServiceStatus.UNHEALTHY
        except Exception:
            instance.status = ServiceStatus.UNHEALTHY
        
        instance.last_check = time.time()


class ServiceRegistry:
    """服務註冊表"""
    
    def __init__(self, discovery: ServiceDiscoveryInterface):
        self.discovery = discovery
        self._registered_services: Set[str] = set()
    
    async def register_current_service(self, name: str, host: str, port: int, metadata: Dict = None):
        """註冊當前服務"""
        instance = ServiceInstance(
            name=name,
            host=host,
            port=port,
            metadata=metadata or {}
        )
        
        success = await self.discovery.register_service(instance)
        if success:
            self._registered_services.add(f"{name}:{host}:{port}")
        return success
    
    async def deregister_all(self):
        """取消註冊所有服務"""
        for service_id in self._registered_services.copy():
            parts = service_id.split(":")
            if len(parts) >= 3:
                service_name = parts[0]
                instance_id = f"{parts[1]}:{parts[2]}"
                await self.discovery.deregister_service(service_name, instance_id)
                self._registered_services.discard(service_id)


# 全局服務發現實例
_service_discovery: Optional[ServiceDiscoveryInterface] = None
_service_registry: Optional[ServiceRegistry] = None


def get_service_discovery() -> ServiceDiscoveryInterface:
    """獲取服務發現實例"""
    global _service_discovery
    if _service_discovery is None:
        _service_discovery = InMemoryServiceDiscovery()
    return _service_discovery


def get_service_registry() -> ServiceRegistry:
    """獲取服務註冊表"""
    global _service_registry
    if _service_registry is None:
        _service_registry = ServiceRegistry(get_service_discovery())
    return _service_registry


async def setup_service_discovery():
    """設置服務發現"""
    discovery = get_service_discovery()
    if hasattr(discovery, 'start'):
        await discovery.start()


async def cleanup_service_discovery():
    """清理服務發現"""
    registry = get_service_registry()
    await registry.deregister_all()
    
    discovery = get_service_discovery()
    if hasattr(discovery, 'stop'):
        await discovery.stop()
