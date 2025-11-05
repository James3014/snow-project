from datetime import datetime, UTC
from time import perf_counter
from typing import Dict, Iterable, List, Optional, Set, Tuple
import uuid

from sqlalchemy.orm import Session

from models import user_profile as user_profile_model
from models.enums import LocaleVerificationStatus
from models.user_profile import UserLocaleProfile, LegacyMapping
from schemas import user_profile as user_profile_schema
from services import change_feed_service
from telemetry import metrics


class DuplicateUserError(Exception):
    """Raised when attempting to create a user with existing legacy identity."""

    def __init__(self, existing_user_id: uuid.UUID, legacy_system: str, legacy_key: str):
        self.existing_user_id = existing_user_id
        self.legacy_system = legacy_system
        self.legacy_key = legacy_key
        message = (
            f"Legacy identity ({legacy_system}={legacy_key}) is already linked to user {existing_user_id}."
        )
        super().__init__(message)


class MergeValidationError(Exception):
    """Raised when user merge validation fails."""

def get_user(db: Session, user_id: uuid.UUID):
    return db.query(user_profile_model.UserProfile).filter(user_profile_model.UserProfile.user_id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[user_profile_model.UserProfile]:
    return db.query(user_profile_model.UserProfile).offset(skip).limit(limit).all()


def _iterate_legacy_pairs(legacy_ids: Dict[str, Iterable]) -> Iterable[Tuple[str, str]]:
    for system, values in legacy_ids.items():
        if values is None:
            continue
        if isinstance(values, (list, tuple, set)):
            iterable = values
        else:
            iterable = [values]
        for value in iterable:
            if value is None:
                continue
            yield system, str(value)


def _ensure_no_duplicate_legacy(db: Session, legacy_ids: Dict[str, Iterable]):
    if not legacy_ids:
        return
    for system, value in _iterate_legacy_pairs(legacy_ids):
        mapping = (
            db.query(LegacyMapping)
            .filter(
                LegacyMapping.legacy_system == system,
                LegacyMapping.legacy_key == value,
            )
            .first()
        )
        if mapping:
            raise DuplicateUserError(mapping.user_id, system, value)


def _persist_legacy_mappings(db: Session, user_id: uuid.UUID, legacy_ids: Dict[str, Iterable]):
    if not legacy_ids:
        return
    for system, value in _iterate_legacy_pairs(legacy_ids):
        mapping = LegacyMapping(
            legacy_system=system,
            legacy_key=value,
            user_id=user_id,
        )
        db.add(mapping)


def _merge_roles(target_roles: Optional[List[str]], source_roles: Optional[List[str]]) -> Optional[List[str]]:
    roles = []
    seen: Set[str] = set()
    for collection in (target_roles or [], source_roles or []):
        for item in collection or []:
            if item not in seen:
                seen.add(item)
                roles.append(item)
    return roles if roles else []


def _merge_legacy_ids(target_ids: Optional[Dict[str, object]], source_ids: Optional[Dict[str, object]]) -> Optional[Dict[str, object]]:
    if not source_ids:
        return target_ids
    result = dict(target_ids or {})
    changed = False
    for system, value in source_ids.items():
        incoming_values = value if isinstance(value, (list, tuple, set)) else [value]
        existing = result.get(system)
        if existing is None:
            result[system] = list(incoming_values) if len(incoming_values) > 1 else incoming_values[0]
            changed = True
            continue

        if not isinstance(existing, list):
            existing_values: List[object] = [existing]
        else:
            existing_values = existing

        existing_set = {str(item) for item in existing_values}
        appended = False
        for item in incoming_values:
            if str(item) not in existing_set:
                existing_values.append(item)
                existing_set.add(str(item))
                appended = True
        if appended:
            result[system] = existing_values
            changed = True
    return result if changed else target_ids


def _move_legacy_mappings(db: Session, source_user: user_profile_model.UserProfile, target_user: user_profile_model.UserProfile) -> bool:
    changed = False
    for mapping in list(source_user.legacy_mappings or []):
        existing = (
            db.query(LegacyMapping)
            .filter(
                LegacyMapping.legacy_system == mapping.legacy_system,
                LegacyMapping.legacy_key == mapping.legacy_key,
                LegacyMapping.user_id == target_user.user_id,
            )
            .first()
        )
        if existing:
            continue
        mapping.user_id = target_user.user_id
        changed = True
    return changed


def _normalize_legal_consent(legal_consent: Dict[str, object]) -> Dict[str, object]:
    if not legal_consent:
        return legal_consent
    consent = dict(legal_consent)
    if consent.get("marketing_opt_in") and not consent.get("consented_at"):
        consent["consented_at"] = datetime.now(UTC).isoformat()
    return consent


def _sync_locale_profiles(db_user: user_profile_model.UserProfile, locale_profiles: List[Dict[str, object]]):
    existing = {profile.country_code: profile for profile in db_user.locale_profiles}
    seen = set()
    for payload in locale_profiles or []:
        country = payload["country_code"].upper()
        seen.add(country)
        profile = existing.get(country)
        status_value = payload.get("verification_status", LocaleVerificationStatus.unverified)
        if isinstance(status_value, str):
            status_value = LocaleVerificationStatus(status_value)
        if profile:
            profile.local_identifier = payload.get("local_identifier")
            profile.verification_status = status_value
            profile.metadata_json = payload.get("metadata")
            profile.updated_at = datetime.now(UTC)
        else:
            db_user.locale_profiles.append(
                UserLocaleProfile(
                    user_id=db_user.user_id,
                    country_code=country,
                    local_identifier=payload.get("local_identifier"),
                    verification_status=status_value,
                    metadata_json=payload.get("metadata"),
                )
            )
    # Remove profiles not present anymore
    for country_code, profile in list(existing.items()):
        if country_code not in seen:
            db_user.locale_profiles.remove(profile)


def _prepare_user_payload(user: user_profile_schema.UserProfileCreate) -> Tuple[Dict[str, object], List[Dict[str, object]], Dict[str, Iterable]]:
    payload = user.model_dump(exclude={"locale_profiles"}, exclude_none=True)
    locale_profiles = user.locale_profiles or []
    legacy_ids = payload.get("legacy_ids")

    payload.setdefault("roles", [])
    payload.setdefault("preferred_resorts", [])
    payload.setdefault("teaching_languages", [])
    if payload.get("legal_consent"):
        payload["legal_consent"] = _normalize_legal_consent(payload["legal_consent"])

    return payload, [lp.model_dump() if hasattr(lp, "model_dump") else lp for lp in locale_profiles], legacy_ids or {}


def create_user(
    db: Session,
    user: user_profile_schema.UserProfileCreate,
    *,
    actor_id: Optional[str] = None,
) -> user_profile_model.UserProfile:
    start_time = perf_counter()
    user_payload, locale_profiles, legacy_ids = _prepare_user_payload(user)
    _ensure_no_duplicate_legacy(db, legacy_ids)

    db_user = user_profile_model.UserProfile(**user_payload)
    db.add(db_user)
    db.flush()

    if locale_profiles:
        _sync_locale_profiles(db_user, locale_profiles)
    _persist_legacy_mappings(db, db_user.user_id, legacy_ids)

    after_snapshot = user_profile_schema.UserProfile.model_validate(db_user).model_dump(mode="json")
    change_payload = change_feed_service.build_payload(
        actor_id=actor_id,
        before=None,
        after=after_snapshot,
    )
    change_event = change_feed_service.create_change_event(
        db=db,
        entity_type="user_profile",
        entity_id=db_user.user_id,
        change_type="created",
        payload=change_payload,
    )

    db.commit()
    db.refresh(db_user)

    db.refresh(change_event)
    change_feed_service.publish_change_event(change_event)

    metrics.record_timing(
        "user_core.create_user",
        perf_counter() - start_time,
        threshold_seconds=2.0,
    )
    return db_user


def update_user(
    db: Session,
    user_id: uuid.UUID,
    user_update: user_profile_schema.UserProfileUpdate,
    *,
    actor_id: Optional[str] = None,
) -> user_profile_model.UserProfile:
    start_time = perf_counter()
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    before_snapshot = user_profile_schema.UserProfile.model_validate(db_user).model_dump(mode="json")

    update_data = user_update.model_dump(exclude_unset=True, exclude={"locale_profiles"}, exclude_none=True)
    locale_profiles = user_update.locale_profiles

    if update_data.get("legal_consent"):
        update_data["legal_consent"] = _normalize_legal_consent(update_data["legal_consent"])

    for key, value in update_data.items():
        setattr(db_user, key, value)

    if locale_profiles is not None:
        _sync_locale_profiles(db_user, [lp.model_dump() if hasattr(lp, "model_dump") else lp for lp in locale_profiles])

    db.flush()

    after_snapshot = user_profile_schema.UserProfile.model_validate(db_user).model_dump(mode="json")
    change_payload = change_feed_service.build_payload(
        actor_id=actor_id,
        before=before_snapshot,
        after=after_snapshot,
    )
    change_event = change_feed_service.create_change_event(
        db=db,
        entity_type="user_profile",
        entity_id=db_user.user_id,
        change_type="updated",
        payload=change_payload,
    )

    db.commit()
    db.refresh(db_user)

    db.refresh(change_event)
    change_feed_service.publish_change_event(change_event)

    metrics.record_timing("user_core.update_user", perf_counter() - start_time)
    return db_user


def deactivate_user(
    db: Session,
    user_id: uuid.UUID,
    *,
    actor_id: Optional[str] = None,
) -> user_profile_model.UserProfile:
    start_time = perf_counter()
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    before_snapshot = user_profile_schema.UserProfile.model_validate(db_user).model_dump(mode="json")
    db_user.status = user_profile_model.UserStatus.inactive

    db.flush()
    after_snapshot = user_profile_schema.UserProfile.model_validate(db_user).model_dump(mode="json")
    change_payload = change_feed_service.build_payload(
        actor_id=actor_id,
        before=before_snapshot,
        after=after_snapshot,
    )
    change_event = change_feed_service.create_change_event(
        db=db,
        entity_type="user_profile",
        entity_id=db_user.user_id,
        change_type="deactivated",
        payload=change_payload,
    )

    db.commit()
    db.refresh(db_user)

    db.refresh(change_event)
    change_feed_service.publish_change_event(change_event)

    metrics.record_timing("user_core.deactivate_user", perf_counter() - start_time)
    return db_user


def merge_users(
    db: Session,
    *,
    target_user_id: uuid.UUID,
    duplicate_user_id: uuid.UUID,
    actor_id: Optional[str] = None,
) -> user_profile_model.UserProfile:
    if target_user_id == duplicate_user_id:
        raise MergeValidationError("Cannot merge a user with itself.")

    start_time = perf_counter()

    target_user = get_user(db, target_user_id)
    duplicate_user = get_user(db, duplicate_user_id)

    if not target_user or not duplicate_user:
        raise MergeValidationError("Both target and duplicate users must exist before merging.")

    before_target = user_profile_schema.UserProfile.model_validate(target_user).model_dump(mode="json")
    before_duplicate = user_profile_schema.UserProfile.model_validate(duplicate_user).model_dump(mode="json")

    merged_roles = _merge_roles(target_user.roles, duplicate_user.roles)
    if merged_roles != (target_user.roles or []):
        target_user.roles = merged_roles

    merged_legacy_ids = _merge_legacy_ids(target_user.legacy_ids, duplicate_user.legacy_ids)
    if merged_legacy_ids is not None and merged_legacy_ids != target_user.legacy_ids:
        target_user.legacy_ids = merged_legacy_ids

    _move_legacy_mappings(db, duplicate_user, target_user)

    duplicate_user.status = user_profile_model.UserStatus.merged

    db.flush()

    after_target = user_profile_schema.UserProfile.model_validate(target_user).model_dump(mode="json")
    after_duplicate = user_profile_schema.UserProfile.model_validate(duplicate_user).model_dump(mode="json")

    change_events = []
    if before_target != after_target:
        target_payload = change_feed_service.build_payload(
            actor_id=actor_id,
            before=before_target,
            after=after_target,
        )
        change_events.append(
            change_feed_service.create_change_event(
                db=db,
                entity_type="user_profile",
                entity_id=target_user.user_id,
                change_type="updated",
                payload=target_payload,
            )
        )

    duplicate_payload = change_feed_service.build_payload(
        actor_id=actor_id,
        before=before_duplicate,
        after=after_duplicate,
    )
    change_events.append(
        change_feed_service.create_change_event(
            db=db,
            entity_type="user_profile",
            entity_id=duplicate_user.user_id,
            change_type="merged",
            payload=duplicate_payload,
        )
    )

    db.commit()
    db.refresh(target_user)
    db.refresh(duplicate_user)

    for event in change_events:
        db.refresh(event)
        change_feed_service.publish_change_event(event)

    metrics.record_timing("user_core.merge_user", perf_counter() - start_time)
    return target_user
