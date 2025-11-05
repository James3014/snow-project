from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, UUID4, Field, AliasChoices
import enum

from models.enums import LocaleVerificationStatus


class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    merged = "merged"


class LegalConsent(BaseModel):
    privacy_version: Optional[str] = None
    marketing_opt_in: bool = False
    consented_at: Optional[datetime] = None


class LocaleProfile(BaseModel):
    country_code: str = Field(min_length=2, max_length=2)
    local_identifier: Optional[str] = None
    verification_status: LocaleVerificationStatus = LocaleVerificationStatus.unverified
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        validation_alias=AliasChoices("metadata", "metadata_json"),
        serialization_alias="metadata",
    )
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True, "populate_by_name": True}


class UserProfileBase(BaseModel):
    preferred_language: Optional[str] = None
    experience_level: Optional[str] = None
    roles: Optional[List[str]] = []
    coach_cert_level: Optional[str] = None
    bio: Optional[str] = None
    preferred_resorts: Optional[List[Dict[str, Any]]] = None
    teaching_languages: Optional[List[Dict[str, Any]]] = None
    legal_consent: Optional[LegalConsent] = None
    audit_log: Optional[Dict[str, Any]] = None
    locale_profiles: Optional[List[LocaleProfile]] = None
    status: UserStatus = UserStatus.active


class UserProfileCreate(UserProfileBase):
    legacy_ids: Optional[Dict[str, Any]] = None


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileInDB(UserProfileBase):
    user_id: UUID4
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserProfile(UserProfileInDB):
    pass


class UserMergeRequest(BaseModel):
    duplicate_user_id: UUID4
