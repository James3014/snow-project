from sqlalchemy import Column, String, ForeignKey, Enum as SQLAlchemyEnum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, UTC

from .enums import NotificationStatus, NotificationFrequency
from .user_profile import Base

class NotificationPreference(Base):
    __tablename__ = 'notification_preferences'

    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), primary_key=True)
    channel = Column(String, primary_key=True)
    topic = Column(String, primary_key=True)
    status = Column(SQLAlchemyEnum(NotificationStatus, native_enum=False), nullable=False, default=NotificationStatus.opt_out)
    frequency = Column(SQLAlchemyEnum(NotificationFrequency, native_enum=False), nullable=False, default=NotificationFrequency.immediate)
    last_updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)
    audited_by = Column(String, nullable=True)
    consent_source = Column(String, nullable=True)
    consent_recorded_at = Column(DateTime, nullable=True)

    user = relationship("UserProfile")
