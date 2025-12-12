"""
健康檢查標準化
統一服務健康檢查和監控
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import asyncio
import time


class HealthStatus(Enum):
    """健康狀態"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


@dataclass
class HealthCheckResult:
    """健康檢查結果"""
    name: str
    status: HealthStatus
    message: str = ""
    duration_ms: float = 0.0
    timestamp: datetime = None
    details: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
        if self.details is None:
            self.details = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典"""
        result = asdict(self)
        result['status'] = self.status.value
        result['timestamp'] = self.timestamp.isoformat()
        return result


class HealthChecker(ABC):
    """健康檢查器介面"""
    
    def __init__(self, name: str, timeout: float = 5.0):
        self.name = name
        self.timeout = timeout
    
    @abstractmethod
    async def check(self) -> HealthCheckResult:
        """執行健康檢查"""
        pass


class DatabaseHealthChecker(HealthChecker):
    """資料庫健康檢查器"""
    
    def __init__(self, name: str = "database", timeout: float = 5.0):
        super().__init__(name, timeout)
        self._connection_pool = None
    
    async def check(self) -> HealthCheckResult:
        """檢查資料庫連接"""
        start_time = time.time()
        
        try:
            # 模擬資料庫連接檢查
            await asyncio.sleep(0.1)  # 模擬查詢延遲
            
            # 檢查連接池狀態
            pool_status = {
                "active_connections": 5,
                "idle_connections": 10,
                "max_connections": 20
            }
            
            duration_ms = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.HEALTHY,
                message="Database connection is healthy",
                duration_ms=duration_ms,
                details=pool_status
            )
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNHEALTHY,
                message=f"Database connection failed: {str(e)}",
                duration_ms=duration_ms,
                details={"error": str(e)}
            )


class RedisHealthChecker(HealthChecker):
    """Redis 健康檢查器"""
    
    def __init__(self, name: str = "redis", timeout: float = 3.0):
        super().__init__(name, timeout)
    
    async def check(self) -> HealthCheckResult:
        """檢查 Redis 連接"""
        start_time = time.time()
        
        try:
            # 模擬 Redis ping
            await asyncio.sleep(0.05)
            
            redis_info = {
                "connected_clients": 12,
                "used_memory": "2.5MB",
                "uptime_seconds": 86400
            }
            
            duration_ms = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.HEALTHY,
                message="Redis connection is healthy",
                duration_ms=duration_ms,
                details=redis_info
            )
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNHEALTHY,
                message=f"Redis connection failed: {str(e)}",
                duration_ms=duration_ms,
                details={"error": str(e)}
            )


class ExternalServiceHealthChecker(HealthChecker):
    """外部服務健康檢查器"""
    
    def __init__(self, name: str, url: str, timeout: float = 10.0):
        super().__init__(name, timeout)
        self.url = url
    
    async def check(self) -> HealthCheckResult:
        """檢查外部服務"""
        start_time = time.time()
        
        try:
            # 模擬 HTTP 請求
            await asyncio.sleep(0.2)
            
            # 模擬響應時間檢查
            response_time = 150  # ms
            status = HealthStatus.HEALTHY if response_time < 500 else HealthStatus.DEGRADED
            
            duration_ms = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                name=self.name,
                status=status,
                message=f"External service responded in {response_time}ms",
                duration_ms=duration_ms,
                details={
                    "url": self.url,
                    "response_time_ms": response_time,
                    "status_code": 200
                }
            )
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNHEALTHY,
                message=f"External service check failed: {str(e)}",
                duration_ms=duration_ms,
                details={"url": self.url, "error": str(e)}
            )


class HealthCheckManager:
    """健康檢查管理器"""
    
    def __init__(self):
        self.checkers: List[HealthChecker] = []
        self.service_info = {
            "name": "unknown",
            "version": "1.0.0",
            "environment": "development"
        }
    
    def add_checker(self, checker: HealthChecker):
        """添加健康檢查器"""
        self.checkers.append(checker)
    
    def set_service_info(self, name: str, version: str, environment: str):
        """設置服務信息"""
        self.service_info = {
            "name": name,
            "version": version,
            "environment": environment
        }
    
    async def check_all(self) -> Dict[str, Any]:
        """執行所有健康檢查"""
        start_time = time.time()
        
        # 並行執行所有檢查
        tasks = [checker.check() for checker in self.checkers]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 處理結果
        check_results = []
        overall_status = HealthStatus.HEALTHY
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                # 處理異常
                check_result = HealthCheckResult(
                    name=self.checkers[i].name,
                    status=HealthStatus.UNHEALTHY,
                    message=f"Health check failed: {str(result)}",
                    details={"error": str(result)}
                )
            else:
                check_result = result
            
            check_results.append(check_result.to_dict())
            
            # 更新整體狀態
            if check_result.status == HealthStatus.UNHEALTHY:
                overall_status = HealthStatus.UNHEALTHY
            elif check_result.status == HealthStatus.DEGRADED and overall_status == HealthStatus.HEALTHY:
                overall_status = HealthStatus.DEGRADED
        
        total_duration = (time.time() - start_time) * 1000
        
        return {
            "status": overall_status.value,
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": total_duration,
            "service": self.service_info,
            "checks": check_results
        }
    
    async def check_readiness(self) -> Dict[str, Any]:
        """就緒檢查（所有依賴服務必須健康）"""
        health_result = await self.check_all()
        
        # 就緒檢查更嚴格，任何非健康狀態都視為未就緒
        is_ready = health_result["status"] == HealthStatus.HEALTHY.value
        
        return {
            "ready": is_ready,
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_info,
            "health": health_result
        }
    
    async def check_liveness(self) -> Dict[str, Any]:
        """存活檢查（服務本身是否運行）"""
        # 簡單的存活檢查，只要能響應就認為存活
        return {
            "alive": True,
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_info,
            "uptime_seconds": time.time() - self._start_time if hasattr(self, '_start_time') else 0
        }
    
    def start(self):
        """啟動健康檢查管理器"""
        self._start_time = time.time()


# 全局健康檢查管理器
_health_manager: Optional[HealthCheckManager] = None


def get_health_manager() -> HealthCheckManager:
    """獲取健康檢查管理器"""
    global _health_manager
    if _health_manager is None:
        _health_manager = HealthCheckManager()
    return _health_manager


def setup_default_health_checks(service_name: str, version: str = "1.0.0", environment: str = "development"):
    """設置默認健康檢查"""
    manager = get_health_manager()
    manager.set_service_info(service_name, version, environment)
    
    # 添加基本檢查器
    manager.add_checker(DatabaseHealthChecker())
    manager.add_checker(RedisHealthChecker())
    
    manager.start()
    return manager


# FastAPI 整合示例
def create_health_endpoints():
    """創建健康檢查端點（FastAPI 示例）"""
    from fastapi import APIRouter
    
    router = APIRouter()
    manager = get_health_manager()
    
    @router.get("/health")
    async def health_check():
        """健康檢查端點"""
        return await manager.check_all()
    
    @router.get("/health/ready")
    async def readiness_check():
        """就緒檢查端點"""
        return await manager.check_readiness()
    
    @router.get("/health/live")
    async def liveness_check():
        """存活檢查端點"""
        return await manager.check_liveness()
    
    return router
