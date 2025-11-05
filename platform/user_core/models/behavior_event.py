from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, UTC

from .user_profile import Base

class BehaviorEvent(Base):
    __tablename__ = 'behavior_events'

    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    source_project = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    occurred_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    recorded_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    payload = Column(JSON, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    schema_url = Column(String, nullable=True)

    user = relationship("UserProfile")
