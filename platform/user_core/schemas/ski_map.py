"""
Pydantic schemas for ski map feature.
"""
from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Optional
from uuid import UUID


class ResortInfo(BaseModel):
    """Basic resort information for map display."""
    id: str
    name_zh: Optional[str] = None
    name_en: Optional[str] = None
    visited: bool = False


class RegionStats(BaseModel):
    """Statistics for a region."""
    total: int
    visited: int
    completion_percentage: float
    resorts: List[ResortInfo]


class SkiMapData(BaseModel):
    """Complete ski map data for a user."""
    user_id: UUID
    visited_resort_ids: List[str]
    total_resorts: int
    total_visited: int
    completion_percentage: float
    region_stats: Dict[str, RegionStats]
