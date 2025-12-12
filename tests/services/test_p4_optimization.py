"""
P4 優化任務測試
"""
import pytest
import asyncio
import time
from services.shared.monitoring import MetricsCollector, StructuredLogger, get_metrics_collector, get_logger
from services.shared.security import RateLimiter, SecurityHeaders, InputValidator, SecretManager
from services.shared.performance import AsyncBatch, QueryOptimizer, ResourcePool, performance_monitor


class TestMonitoring:
    """監控測試"""
    
    def test_metrics_collector(self):
        """測試指標收集器"""
        collector = MetricsCollector()
        
        # 測試計數器
        collector.counter("requests", 1, {"method": "GET"})
        collector.counter("requests", 2, {"method": "POST"})
        collector.counter("requests", 1, {"method": "GET"})  # 累加
        
        # 測試儀表盤
        collector.gauge("memory_usage", 85.5)
        
        metrics = collector.get_metrics()
        
        # 驗證計數器累加
        get_key = next(k for k in metrics.keys() if "GET" in k)
        assert metrics[get_key]["value"] == 2
        
        # 驗證儀表盤
        memory_key = next(k for k in metrics.keys() if "memory_usage" in k)
        assert metrics[memory_key]["value"] == 85.5
    
    def test_structured_logger(self, capsys):
        """測試結構化日誌"""
        logger = StructuredLogger("test-service")
        
        logger.info("Test message", user_id=123, action="login")
        
        captured = capsys.readouterr()
        assert "test-service" in captured.out
        assert "INFO" in captured.out
        assert "Test message" in captured.out
        assert "user_id" in captured.out


class TestSecurity:
    """安全性測試"""
    
    def test_rate_limiter(self):
        """測試速率限制"""
        limiter = RateLimiter(max_requests=2, window_seconds=1)
        
        # 前兩個請求應該通過
        assert limiter.is_allowed("user1") is True
        assert limiter.is_allowed("user1") is True
        
        # 第三個請求應該被限制
        assert limiter.is_allowed("user1") is False
        
        # 不同用戶不受影響
        assert limiter.is_allowed("user2") is True
    
    def test_security_headers(self):
        """測試安全標頭"""
        headers = SecurityHeaders.get_headers()
        
        assert "X-Content-Type-Options" in headers
        assert "X-Frame-Options" in headers
        assert "Strict-Transport-Security" in headers
        assert headers["X-Frame-Options"] == "DENY"
    
    def test_input_validator(self):
        """測試輸入驗證"""
        # 測試字符串清理
        clean = InputValidator.sanitize_string("Hello <script>alert('xss')</script>")
        assert "<script>" not in clean
        assert "Hello" in clean
        
        # 測試長度限制
        with pytest.raises(ValueError):
            InputValidator.sanitize_string("x" * 1001)
        
        # 測試郵箱驗證
        assert InputValidator.validate_email("test@example.com") is True
        assert InputValidator.validate_email("invalid-email") is False
    
    def test_secret_manager(self):
        """測試密鑰管理"""
        manager = SecretManager()
        
        manager.set_secret("api_key", "secret123")
        
        # 能夠獲取設置的密鑰
        assert manager.get_secret("api_key") == "secret123"
        
        # 不存在的密鑰返回 None
        assert manager.get_secret("nonexistent") is None


class TestPerformance:
    """效能優化測試"""
    
    @pytest.mark.asyncio
    async def test_async_batch(self):
        """測試非同步批處理"""
        batch = AsyncBatch(batch_size=2, max_wait=0.1)
        results = []
        
        async def processor(item):
            results.append(item)
        
        # 添加項目
        await batch.add("item1", processor)
        await batch.add("item2", processor)  # 觸發批處理
        
        # 等待處理完成
        await asyncio.sleep(0.05)
        
        assert "item1" in results
        assert "item2" in results
    
    @pytest.mark.asyncio
    async def test_query_optimizer(self):
        """測試查詢優化器"""
        optimizer = QueryOptimizer()
        call_count = 0
        
        @optimizer.cache_query("test_query", ttl=1)
        async def expensive_query():
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.01)
            return "result"
        
        # 第一次調用
        result1 = await expensive_query()
        assert result1 == "result"
        assert call_count == 1
        
        # 第二次調用應該使用快取
        result2 = await expensive_query()
        assert result2 == "result"
        assert call_count == 1  # 沒有增加
        
        # 檢查統計
        stats = optimizer.get_stats()
        assert "test_query" in stats
        assert stats["test_query"]["total_queries"] == 1
    
    @pytest.mark.asyncio
    async def test_resource_pool(self):
        """測試資源池"""
        pool = ResourcePool(max_size=2)
        created_count = 0
        
        async def factory():
            nonlocal created_count
            created_count += 1
            return f"resource_{created_count}"
        
        # 獲取資源
        resource1 = await pool.acquire(factory)
        resource2 = await pool.acquire(factory)
        
        assert resource1 == "resource_1"
        assert resource2 == "resource_2"
        assert created_count == 2
        
        # 釋放並重用
        pool.release(resource1)
        resource3 = await pool.acquire(factory)
        
        assert resource3 == "resource_1"  # 重用了
        assert created_count == 2  # 沒有創建新的
    
    @pytest.mark.asyncio
    async def test_performance_monitor(self, capsys):
        """測試效能監控"""
        @performance_monitor()
        async def slow_function():
            await asyncio.sleep(0.01)
            return "done"
        
        @performance_monitor()
        async def failing_function():
            raise ValueError("Test error")
        
        # 正常函數
        result = await slow_function()
        assert result == "done"
        
        # 失敗函數
        with pytest.raises(ValueError):
            await failing_function()
        
        captured = capsys.readouterr()
        assert "Failed operation" in captured.out


class TestGlobalInstances:
    """全局實例測試"""
    
    def test_global_metrics_collector(self):
        """測試全局指標收集器"""
        collector1 = get_metrics_collector()
        collector2 = get_metrics_collector()
        
        assert collector1 is collector2
    
    def test_global_logger(self):
        """測試全局日誌器"""
        logger1 = get_logger("service1")
        logger2 = get_logger("service2")
        
        # 不同服務名應該返回不同實例
        assert logger1.service_name == "service1"
        assert logger2.service_name == "service1"  # 全局單例


if __name__ == "__main__":
    pytest.main([__file__])
