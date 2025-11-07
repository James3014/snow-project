from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, JSON, Enum as SQLAlchemyEnum, ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, UTC

from .enums import UserStatus, LocaleVerificationStatus

Base = declarative_base()

class UserProfile(Base):
    __tablename__ = 'user_profiles'

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    legacy_ids = Column(JSON)

    # Authentication fields
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    # Display information for social features
    display_name = Column(String(100), nullable=True)  # User's display name
    avatar_url = Column(String(500), nullable=True)    # Profile picture URL
    default_post_visibility = Column(String(20), nullable=True, default='public')  # Default visibility for posts

    preferred_language = Column(String(10))
    experience_level = Column(String(50))
    roles = Column(JSON) # Consider a dedicated roles table in a real app
    coach_cert_level = Column(String(100), nullable=True)
    bio = Column(String, nullable=True)
    preferred_resorts = Column(JSON, nullable=True)
    teaching_languages = Column(JSON, nullable=True)
    legal_consent = Column(JSON, nullable=True)
    audit_log = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)
    status = Column(SQLAlchemyEnum(UserStatus, native_enum=False), default=UserStatus.active, nullable=False)

    locale_profiles = relationship("UserLocaleProfile", cascade="all, delete-orphan", back_populates="user")

    def __repr__(self):
        return f"<UserProfile(user_id={self.user_id}, status={self.status})>"


class UserLocaleProfile(Base):
    __tablename__ = 'user_locale_profiles'

    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), primary_key=True)
    country_code = Column(String(2), primary_key=True)
    local_identifier = Column(String, nullable=True)
    verification_status = Column(SQLAlchemyEnum(LocaleVerificationStatus, native_enum=False), nullable=False, default=LocaleVerificationStatus.unverified)
    metadata_json = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    user = relationship("UserProfile", back_populates="locale_profiles")


class LegacyMapping(Base):
    __tablename__ = 'legacy_mappings'

    legacy_system = Column(String, primary_key=True)
    legacy_key = Column(String, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    user = relationship("UserProfile", backref="legacy_mappings")


def _get_locale_metadata(instance):
    return instance.metadata_json


def _set_locale_metadata(instance, value):
    instance.metadata_json = value


UserLocaleProfile.metadata = property(_get_locale_metadata, _set_locale_metadata)
