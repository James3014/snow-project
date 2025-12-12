"""
效能優化工具
"""
import asyncio
import time
from typing import Any, Callable, Dict, List
from functools import wraps


class AsyncBatch:
    """非同步批處理"""
    
    def __init__(self, batch_size: int = 10, max_wait: float = 0.1):
        self.batch_size = batch_size
        self.max_wait = max_wait
        self.queue: List[Any] = []
        self.processing = False
    
    async def add(self, item: Any, processor: Callable):
        """添加項目到批次"""
        self.queue.append((item, processor))
        
        if len(self.queue) >= self.batch_size:
            await self._process_batch()
        elif not self.processing:
            asyncio.create_task(self._delayed_process())
    
    async def _delayed_process(self):
        """延遲處理"""
        await asyncio.sleep(self.max_wait)
        if self.queue and not self.processing:
            await self._process_batch()
    
    async def _process_batch(self):
        """處理批次"""
        if self.processing or not self.queue:
            return
        
        self.processing = True
        batch = self.queue[:self.batch_size]
        self.queue = self.queue[self.batch_size:]
        
        # 並行處理
        tasks = [processor(item) for item, processor in batch]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        self.processing = False


class QueryOptimizer:
    """查詢優化器"""
    
    def __init__(self):
        self.query_cache: Dict[str, Any] = {}
        self.query_stats: Dict[str, List[float]] = {}
    
    def cache_query(self, key: str, ttl: int = 300):
        """查詢快取裝飾器"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # 檢查快取
                if key in self.query_cache:
                    return self.query_cache[key]
                
                # 執行查詢
                start_time = time.time()
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                # 記錄統計
                if key not in self.query_stats:
                    self.query_stats[key] = []
                self.query_stats[key].append(duration)
                
                # 快取結果
                self.query_cache[key] = result
                
                # 設置過期（簡化實現）
                asyncio.create_task(self._expire_cache(key, ttl))
                
                return result
            return wrapper
        return decorator
    
    async def _expire_cache(self, key: str, ttl: int):
        """快取過期"""
        await asyncio.sleep(ttl)
        self.query_cache.pop(key, None)
    
    def get_stats(self) -> Dict[str, Dict[str, float]]:
        """獲取查詢統計"""
        stats = {}
        for key, durations in self.query_stats.items():
            if durations:
                stats[key] = {
                    "avg_duration": sum(durations) / len(durations),
                    "max_duration": max(durations),
                    "min_duration": min(durations),
                    "total_queries": len(durations)
                }
        return stats


class ResourcePool:
    """資源池"""
    
    def __init__(self, max_size: int = 10):
        self.max_size = max_size
        self.pool: List[Any] = []
        self.in_use: int = 0
    
    async def acquire(self, factory: Callable):
        """獲取資源"""
        if self.pool:
            resource = self.pool.pop()
        elif self.in_use < self.max_size:
            resource = await factory()
        else:
            # 等待資源釋放
            while not self.pool and self.in_use >= self.max_size:
                await asyncio.sleep(0.01)
            resource = self.pool.pop() if self.pool else await factory()
        
        self.in_use += 1
        return resource
    
    def release(self, resource: Any):
        """釋放資源"""
        self.pool.append(resource)
        self.in_use -= 1


# 全局實例
_query_optimizer = QueryOptimizer()
_async_batch = AsyncBatch()


def get_query_optimizer() -> QueryOptimizer:
    return _query_optimizer


def get_async_batch() -> AsyncBatch:
    return _async_batch


def performance_monitor():
    """效能監控裝飾器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                
                duration = time.time() - start_time
                
                # 記錄效能指標
                if duration > 1.0:  # 慢查詢警告
                    print(f"Slow operation: {func.__name__} took {duration:.2f}s")
                
                return result
                
            except Exception as e:
                duration = time.time() - start_time
                print(f"Failed operation: {func.__name__} failed after {duration:.2f}s: {e}")
                raise
        
        return wrapper
    return decorator
