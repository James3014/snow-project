"""
快取策略標準化
統一快取管理和策略
"""
from abc import ABC, abstractmethod
from typing import Any, Optional, Dict, List
from dataclasses import dataclass
from enum import Enum
import time
import json
import hashlib


class CacheStrategy(Enum):
    """快取策略"""
    LRU = "lru"          # 最近最少使用
    TTL = "ttl"          # 時間過期
    LFU = "lfu"          # 最少使用頻率


@dataclass
class CacheEntry:
    """快取條目"""
    key: str
    value: Any
    created_at: float
    accessed_at: float
    access_count: int = 0
    ttl: Optional[float] = None
    
    def is_expired(self) -> bool:
        """檢查是否過期"""
        if self.ttl is None:
            return False
        return time.time() - self.created_at > self.ttl
    
    def touch(self):
        """更新訪問時間"""
        self.accessed_at = time.time()
        self.access_count += 1


class CacheInterface(ABC):
    """快取介面"""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """獲取快取值"""
        pass
    
    @abstractmethod
    async def set(self, key: str, value: Any, ttl: Optional[float] = None) -> bool:
        """設置快取值"""
        pass
    
    @abstractmethod
    async def delete(self, key: str) -> bool:
        """刪除快取值"""
        pass
    
    @abstractmethod
    async def clear(self) -> bool:
        """清空快取"""
        pass


class InMemoryCache(CacheInterface):
    """記憶體快取實作"""
    
    def __init__(self, max_size: int = 1000, default_ttl: Optional[float] = None):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: Dict[str, CacheEntry] = {}
    
    async def get(self, key: str) -> Optional[Any]:
        """獲取快取值"""
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        
        # 檢查過期
        if entry.is_expired():
            del self._cache[key]
            return None
        
        # 更新訪問記錄
        entry.touch()
        return entry.value
    
    async def set(self, key: str, value: Any, ttl: Optional[float] = None) -> bool:
        """設置快取值"""
        # 檢查容量限制
        if len(self._cache) >= self.max_size and key not in self._cache:
            await self._evict_one()
        
        now = time.time()
        entry = CacheEntry(
            key=key,
            value=value,
            created_at=now,
            accessed_at=now,
            ttl=ttl or self.default_ttl
        )
        
        self._cache[key] = entry
        return True
    
    async def delete(self, key: str) -> bool:
        """刪除快取值"""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    async def clear(self) -> bool:
        """清空快取"""
        self._cache.clear()
        return True
    
    async def _evict_one(self):
        """驅逐一個條目（LRU 策略）"""
        if not self._cache:
            return
        
        # 找到最久未訪問的條目
        oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k].accessed_at)
        del self._cache[oldest_key]


class CacheManager:
    """快取管理器"""
    
    def __init__(self, cache: CacheInterface):
        self.cache = cache
    
    def cache_key(self, prefix: str, *args, **kwargs) -> str:
        """生成快取鍵"""
        key_parts = [prefix] + [str(arg) for arg in args]
        
        if kwargs:
            sorted_kwargs = sorted(kwargs.items())
            key_parts.extend([f"{k}={v}" for k, v in sorted_kwargs])
        
        key = ":".join(key_parts)
        
        # 如果鍵太長，使用哈希
        if len(key) > 200:
            return f"{prefix}:{hashlib.md5(key.encode()).hexdigest()}"
        
        return key
    
    async def get_or_set(
        self,
        key: str,
        factory: Callable[[], Any],
        ttl: Optional[float] = None
    ) -> Any:
        """獲取或設置快取"""
        value = await self.cache.get(key)
        
        if value is None:
            value = await factory() if asyncio.iscoroutinefunction(factory) else factory()
            await self.cache.set(key, value, ttl)
        
        return value
    
    async def invalidate_pattern(self, pattern: str):
        """按模式失效快取"""
        # 簡化實作：清空所有快取
        # 實際實作可能需要更複雜的模式匹配
        await self.cache.clear()


# 快取裝飾器
def cached(ttl: Optional[float] = None, key_prefix: str = ""):
    """快取裝飾器"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # 生成快取鍵
            cache_manager = get_cache_manager()
            cache_key = cache_manager.cache_key(
                key_prefix or func.__name__,
                *args,
                **kwargs
            )
            
            # 嘗試從快取獲取
            cached_result = await cache_manager.cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # 執行函數並快取結果
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            await cache_manager.cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator


# 全局快取管理器
_cache_manager: Optional[CacheManager] = None


def get_cache_manager() -> CacheManager:
    """獲取快取管理器"""
    global _cache_manager
    if _cache_manager is None:
        cache = InMemoryCache(max_size=1000, default_ttl=300)  # 5分鐘預設TTL
        _cache_manager = CacheManager(cache)
    return _cache_manager


def set_cache_manager(manager: CacheManager):
    """設置快取管理器"""
    global _cache_manager
    _cache_manager = manager


import asyncio
