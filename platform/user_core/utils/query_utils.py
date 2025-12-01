"""Query optimization utilities."""
from typing import List, TypeVar, Callable, Any
from sqlalchemy.orm import Session, joinedload, selectinload

T = TypeVar('T')


def batch_load(
    db: Session,
    ids: List[Any],
    loader: Callable[[Session, List[Any]], List[T]],
    batch_size: int = 100
) -> List[T]:
    """
    Load entities in batches to avoid N+1 queries.
    
    Args:
        db: Database session
        ids: List of IDs to load
        loader: Function that loads entities by IDs
        batch_size: Number of entities per batch
        
    Returns:
        List of loaded entities
    """
    results = []
    for i in range(0, len(ids), batch_size):
        batch_ids = ids[i:i + batch_size]
        batch_results = loader(db, batch_ids)
        results.extend(batch_results)
    return results


def eager_load_options(*relationships: str):
    """
    Create eager loading options for relationships.
    
    Args:
        relationships: Names of relationships to eager load
        
    Returns:
        List of SQLAlchemy loading options
    """
    return [joinedload(rel) for rel in relationships]


def chunked(items: List[T], size: int) -> List[List[T]]:
    """
    Split a list into chunks.
    
    Args:
        items: List to split
        size: Chunk size
        
    Returns:
        List of chunks
    """
    return [items[i:i + size] for i in range(0, len(items), size)]


def deduplicate(items: List[T], key: Callable[[T], Any] = None) -> List[T]:
    """
    Remove duplicates from a list while preserving order.
    
    Args:
        items: List with potential duplicates
        key: Optional function to extract comparison key
        
    Returns:
        List without duplicates
    """
    seen = set()
    result = []
    for item in items:
        k = key(item) if key else item
        if k not in seen:
            seen.add(k)
            result.append(item)
    return result
