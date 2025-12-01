"""Base repository with common CRUD operations."""
from typing import TypeVar, Generic, Type, List, Optional
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import desc

T = TypeVar('T')


class BaseRepository(Generic[T]):
    """Base repository providing common database operations."""
    
    def __init__(self, model: Type[T], db: Session):
        self.model = model
        self.db = db
    
    def get_by_id(self, id: uuid.UUID) -> Optional[T]:
        """Get entity by ID."""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Get all entities with pagination."""
        return self.db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, entity: T) -> T:
        """Create a new entity."""
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity
    
    def update(self, entity: T) -> T:
        """Update an existing entity."""
        self.db.commit()
        self.db.refresh(entity)
        return entity
    
    def delete(self, entity: T) -> bool:
        """Delete an entity."""
        self.db.delete(entity)
        self.db.commit()
        return True
    
    def count(self) -> int:
        """Count all entities."""
        return self.db.query(self.model).count()
