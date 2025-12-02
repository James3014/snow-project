"""
Redis 緩存服務

提供統一的緩存接口用於優化性能。
主要用於：
- 關注列表緩存
- 熱門動態緩存
- 用戶資訊緩存
"""
import redis
import json
import os
from typing import Optional, Any
from functools import wraps


# Redis 連接配置
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
REDIS_DB = int(os.getenv('REDIS_DB', '0'))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)

# Redis 客戶端（單例）
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """
    獲取 Redis 客戶端

    如果 Redis 不可用，返回 None（降級處理）
    """
    global _redis_client

    if _redis_client is None:
        try:
            _redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                password=REDIS_PASSWORD,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
            # 測試連接
            _redis_client.ping()
            print(f"✅ Redis 連接成功: {REDIS_HOST}:{REDIS_PORT}")
        except (redis.ConnectionError, redis.TimeoutError) as e:
            print(f"⚠️ Redis 連接失敗，將不使用緩存: {e}")
            _redis_client = None

    return _redis_client


def cache_get(key: str) -> Optional[Any]:
    """
    從緩存獲取數據

    Args:
        key: 緩存鍵

    Returns:
        緩存的數據，如果不存在或 Redis 不可用則返回 None
    """
    client = get_redis_client()
    if client is None:
        return None

    try:
        value = client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        print(f"⚠️ Redis 讀取失敗: {e}")
        return None


def cache_set(key: str, value: Any, ttl: int = 300) -> bool:
    """
    設置緩存

    Args:
        key: 緩存鍵
        value: 要緩存的數據（將被序列化為 JSON）
        ttl: 過期時間（秒），默認 300 秒 (5 分鐘)

    Returns:
        是否成功設置
    """
    client = get_redis_client()
    if client is None:
        return False

    try:
        client.setex(key, ttl, json.dumps(value))
        return True
    except Exception as e:
        print(f"⚠️ Redis 寫入失敗: {e}")
        return False


def cache_delete(key: str) -> bool:
    """
    刪除緩存

    Args:
        key: 緩存鍵

    Returns:
        是否成功刪除
    """
    client = get_redis_client()
    if client is None:
        return False

    try:
        client.delete(key)
        return True
    except Exception as e:
        print(f"⚠️ Redis 刪除失敗: {e}")
        return False


def cache_invalidate_pattern(pattern: str) -> bool:
    """
    根據模式刪除緩存

    Args:
        pattern: 鍵模式，例如 "user:*:following"

    Returns:
        是否成功
    """
    client = get_redis_client()
    if client is None:
        return False

    try:
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
        return True
    except Exception as e:
        print(f"⚠️ Redis 批量刪除失敗: {e}")
        return False


# ==================== 裝飾器：緩存函數結果 ====================

def cached(key_prefix: str, ttl: int = 300):
    """
    緩存裝飾器

    用法：
    @cached(key_prefix="user_following", ttl=300)
    def get_user_following(user_id):
        # ...查詢數據庫
        return result
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成緩存鍵（使用第一個參數作為鍵的一部分）
            cache_key = f"{key_prefix}:{args[0] if args else 'default'}"

            # 嘗試從緩存獲取
            cached_value = cache_get(cache_key)
            if cached_value is not None:
                print(f"✅ 緩存命中: {cache_key}")
                return cached_value

            # 緩存未命中，執行函數
            print(f"❌ 緩存未命中: {cache_key}")
            result = func(*args, **kwargs)

            # 寫入緩存
            cache_set(cache_key, result, ttl)

            return result

        return wrapper
    return decorator


# ==================== 預定義緩存鍵 ====================

class CacheKeys:
    """緩存鍵命名規範"""

    @staticmethod
    def user_following(user_id: str) -> str:
        """用戶的關注列表"""
        return f"user:{user_id}:following"

    @staticmethod
    def user_followers(user_id: str) -> str:
        """用戶的粉絲列表"""
        return f"user:{user_id}:followers"

    @staticmethod
    def hot_feed() -> str:
        """熱門動態"""
        return "feed:hot"

    @staticmethod
    def user_info(user_id: str) -> str:
        """用戶資訊"""
        return f"user:{user_id}:info"
