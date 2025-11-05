from sqlalchemy import Column, String, DateTime, JSON, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, UTC

from .user_profile import Base

class ChangeFeed(Base):
    __tablename__ = 'change_feed'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    change_type = Column(String, nullable=False)
    payload = Column(JSON)
    published_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
