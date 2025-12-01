"""
Redis repository for search results storage.
"""
import json
from typing import Optional, Dict, Any, List
import redis

from ..config import get_settings


class RedisRepository:
    """Handles Redis operations for search results."""
    
    def __init__(self):
        settings = get_settings()
        self._client = redis.from_url(settings.redis_url)
        self._ttl = settings.redis_ttl
    
    def set_processing(self, search_id: str) -> None:
        """Mark a search as processing."""
        self._client.set(
            search_id,
            json.dumps({"status": "processing", "results": []}),
            ex=self._ttl
        )
    
    def set_completed(self, search_id: str, results: List[Dict[str, Any]]) -> None:
        """Store completed search results."""
        self._client.set(
            search_id,
            json.dumps({"status": "completed", "results": results}),
            ex=self._ttl
        )
    
    def get_results(self, search_id: str) -> Optional[Dict[str, Any]]:
        """Get search results by ID."""
        data = self._client.get(search_id)
        if data:
            return json.loads(data)
        return None


# Singleton instance
_repository: Optional[RedisRepository] = None


def get_redis_repository() -> RedisRepository:
    """Get or create Redis repository instance."""
    global _repository
    if _repository is None:
        _repository = RedisRepository()
    return _repository
