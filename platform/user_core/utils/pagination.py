"""Pagination utilities."""
from typing import TypeVar, Generic, List
from pydantic import BaseModel
from sqlalchemy.orm import Query

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response model."""
    items: List[T]
    total: int
    skip: int
    limit: int
    has_more: bool


def paginate(query: Query, skip: int = 0, limit: int = 100) -> tuple:
    """
    Apply pagination to a query.
    
    Args:
        query: SQLAlchemy query
        skip: Number of items to skip
        limit: Maximum items to return
        
    Returns:
        Tuple of (items, total_count)
    """
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return items, total


def create_paginated_response(
    items: List[T], 
    total: int, 
    skip: int, 
    limit: int
) -> dict:
    """
    Create a paginated response dict.
    
    Args:
        items: List of items
        total: Total count
        skip: Items skipped
        limit: Limit used
        
    Returns:
        Dict with pagination info
    """
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": skip + len(items) < total
    }
