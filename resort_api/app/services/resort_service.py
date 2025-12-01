"""
Resort service - handles resort query and filtering logic.
"""
from typing import Dict, Optional
from cachetools import TTLCache, cached
from cachetools.keys import hashkey

from ..models import Resort, ResortSummary, ResortList
from ..config import get_settings


class ResortService:
    """Service for resort-related operations."""
    
    def __init__(self, resorts_db: Dict[str, Resort]):
        self._db = resorts_db
        settings = get_settings()
        self._cache = TTLCache(maxsize=settings.cache_maxsize, ttl=settings.cache_ttl)
    
    def get_by_id(self, resort_id: str) -> Optional[Resort]:
        """Get a single resort by ID."""
        return self._db.get(resort_id)
    
    def exists(self, resort_id: str) -> bool:
        """Check if resort exists."""
        return resort_id in self._db
    
    def count(self) -> int:
        """Get total resort count."""
        return len(self._db)
    
    def list_resorts(
        self,
        region: Optional[str] = None,
        country_code: Optional[str] = None,
        q: Optional[str] = None,
        amenities: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> ResortList:
        """List resorts with filtering and pagination."""
        cache_key = hashkey(region, country_code, q, amenities, limit, offset)
        
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        result = self._query_resorts(region, country_code, q, amenities, limit, offset)
        self._cache[cache_key] = result
        return result
    
    def _query_resorts(
        self,
        region: Optional[str],
        country_code: Optional[str],
        q: Optional[str],
        amenities: Optional[str],
        limit: int,
        offset: int
    ) -> ResortList:
        """Core query logic."""
        results = list(self._db.values())
        
        # Apply filters
        if region:
            results = [r for r in results if r.region and region.lower() in r.region.lower()]
        
        if country_code:
            results = [r for r in results if r.country_code and r.country_code.upper() == country_code.upper()]
        
        if amenities:
            required = {a.strip().lower() for a in amenities.split(',') if a.strip()}
            results = [r for r in results if r.amenities and required.issubset(set(a.lower() for a in r.amenities))]
        
        if q:
            results = self._text_search(results, q.lower())
        
        # Pagination
        total = len(results)
        paginated = results[offset:offset + limit]
        
        # Convert to summaries
        summaries = [
            ResortSummary(
                resort_id=r.resort_id,
                names=r.names,
                region=r.region,
                country_code=r.country_code,
                tagline=r.description.tagline if r.description else None
            )
            for r in paginated
        ]
        
        return ResortList(total=total, limit=limit, offset=offset, items=summaries)
    
    def _text_search(self, resorts: list[Resort], query: str) -> list[Resort]:
        """Full-text search on names and tagline."""
        results = []
        for r in resorts:
            if self._matches_query(r, query):
                results.append(r)
        return results
    
    def _matches_query(self, resort: Resort, query: str) -> bool:
        """Check if resort matches search query."""
        if resort.names.en and query in resort.names.en.lower():
            return True
        if resort.names.ja and query in resort.names.ja.lower():
            return True
        if resort.names.zh and query in resort.names.zh.lower():
            return True
        if resort.description and resort.description.tagline:
            if query in resort.description.tagline.lower():
                return True
        return False
