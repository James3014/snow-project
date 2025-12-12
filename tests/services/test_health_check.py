"""
健康檢查測試
"""
import pytest
import asyncio
from services.shared.health_check import (
    HealthStatus, HealthCheckResult, HealthChecker,
    DatabaseHealthChecker, RedisHealthChecker, ExternalServiceHealthChecker,
    HealthCheckManager, get_health_manager, setup_default_health_checks
)


class TestHealthCheckResult:
    """健康檢查結果測試"""
    
    def test_health_check_result_creation(self):
        """測試健康檢查結果創建"""
        result = HealthCheckResult(
            name="test",
            status=HealthStatus.HEALTHY,
            message="All good"
        )
        
        assert result.name == "test"
        assert result.status == HealthStatus.HEALTHY
        assert result.message == "All good"
        assert result.timestamp is not None
        assert result.details == {}
    
    def test_health_check_result_to_dict(self):
        """測試轉換為字典"""
        result = HealthCheckResult(
            name="test",
            status=HealthStatus.DEGRADED,
            message="Slow response",
            duration_ms=150.5,
            details={"response_time": 150}
        )
        
        result_dict = result.to_dict()
        
        assert result_dict["name"] == "test"
        assert result_dict["status"] == "degraded"
        assert result_dict["message"] == "Slow response"
        assert result_dict["duration_ms"] == 150.5
        assert result_dict["details"]["response_time"] == 150
        assert "timestamp" in result_dict


class TestHealthCheckers:
    """健康檢查器測試"""
    
    @pytest.mark.asyncio
    async def test_database_health_checker(self):
        """測試資料庫健康檢查器"""
        checker = DatabaseHealthChecker()
        result = await checker.check()
        
        assert result.name == "database"
        assert result.status == HealthStatus.HEALTHY
        assert "Database connection is healthy" in result.message
        assert result.duration_ms > 0
        assert "active_connections" in result.details
    
    @pytest.mark.asyncio
    async def test_redis_health_checker(self):
        """測試 Redis 健康檢查器"""
        checker = RedisHealthChecker()
        result = await checker.check()
        
        assert result.name == "redis"
        assert result.status == HealthStatus.HEALTHY
        assert "Redis connection is healthy" in result.message
        assert result.duration_ms > 0
        assert "connected_clients" in result.details
    
    @pytest.mark.asyncio
    async def test_external_service_health_checker(self):
        """測試外部服務健康檢查器"""
        checker = ExternalServiceHealthChecker("api", "https://api.example.com")
        result = await checker.check()
        
        assert result.name == "api"
        assert result.status in [HealthStatus.HEALTHY, HealthStatus.DEGRADED]
        assert result.duration_ms > 0
        assert result.details["url"] == "https://api.example.com"


class TestHealthCheckManager:
    """健康檢查管理器測試"""
    
    @pytest.fixture
    def manager(self):
        manager = HealthCheckManager()
        manager.set_service_info("test-service", "1.0.0", "test")
        return manager
    
    def test_add_checker(self, manager):
        """測試添加檢查器"""
        checker = DatabaseHealthChecker()
        manager.add_checker(checker)
        
        assert len(manager.checkers) == 1
        assert manager.checkers[0] == checker
    
    def test_set_service_info(self, manager):
        """測試設置服務信息"""
        assert manager.service_info["name"] == "test-service"
        assert manager.service_info["version"] == "1.0.0"
        assert manager.service_info["environment"] == "test"
    
    @pytest.mark.asyncio
    async def test_check_all_healthy(self, manager):
        """測試所有檢查都健康的情況"""
        manager.add_checker(DatabaseHealthChecker())
        manager.add_checker(RedisHealthChecker())
        
        result = await manager.check_all()
        
        assert result["status"] == "healthy"
        assert "timestamp" in result
        assert result["duration_ms"] > 0
        assert result["service"]["name"] == "test-service"
        assert len(result["checks"]) == 2
        
        # 檢查每個檢查結果
        for check in result["checks"]:
            assert check["status"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_check_all_with_failure(self, manager):
        """測試包含失敗檢查的情況"""
        # 添加一個會失敗的檢查器
        class FailingChecker(HealthChecker):
            def __init__(self):
                super().__init__("failing")
            
            async def check(self):
                raise Exception("Simulated failure")
        
        manager.add_checker(DatabaseHealthChecker())
        manager.add_checker(FailingChecker())
        
        result = await manager.check_all()
        
        assert result["status"] == "unhealthy"
        assert len(result["checks"]) == 2
        
        # 找到失敗的檢查
        failing_check = next(check for check in result["checks"] if check["name"] == "failing")
        assert failing_check["status"] == "unhealthy"
        assert "Simulated failure" in failing_check["message"]
    
    @pytest.mark.asyncio
    async def test_check_readiness(self, manager):
        """測試就緒檢查"""
        manager.add_checker(DatabaseHealthChecker())
        
        result = await manager.check_readiness()
        
        assert result["ready"] is True
        assert "timestamp" in result
        assert result["service"]["name"] == "test-service"
        assert "health" in result
    
    @pytest.mark.asyncio
    async def test_check_readiness_not_ready(self, manager):
        """測試未就緒情況"""
        class DegradedChecker(HealthChecker):
            def __init__(self):
                super().__init__("degraded")
            
            async def check(self):
                return HealthCheckResult(
                    name="degraded",
                    status=HealthStatus.DEGRADED,
                    message="Slow response"
                )
        
        manager.add_checker(DegradedChecker())
        
        result = await manager.check_readiness()
        
        assert result["ready"] is False
        assert result["health"]["status"] == "degraded"
    
    @pytest.mark.asyncio
    async def test_check_liveness(self, manager):
        """測試存活檢查"""
        manager.start()
        
        result = await manager.check_liveness()
        
        assert result["alive"] is True
        assert "timestamp" in result
        assert result["service"]["name"] == "test-service"
        assert result["uptime_seconds"] >= 0


class TestGlobalHealthManager:
    """全局健康管理器測試"""
    
    def test_get_health_manager_singleton(self):
        """測試全局管理器單例"""
        manager1 = get_health_manager()
        manager2 = get_health_manager()
        
        assert manager1 is manager2
    
    def test_setup_default_health_checks(self):
        """測試設置默認健康檢查"""
        manager = setup_default_health_checks("test-service", "2.0.0", "production")
        
        assert manager.service_info["name"] == "test-service"
        assert manager.service_info["version"] == "2.0.0"
        assert manager.service_info["environment"] == "production"
        assert len(manager.checkers) >= 2  # 至少有資料庫和 Redis 檢查器


if __name__ == "__main__":
    pytest.main([__file__])
