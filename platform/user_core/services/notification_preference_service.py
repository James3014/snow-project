from datetime import datetime, UTC
from time import perf_counter
from typing import List, Optional
import uuid

from sqlalchemy.orm import Session

from models import notification_preference as pref_model
from schemas import notification_preference as pref_schema
from services import change_feed_service
from telemetry import metrics


def get_preferences_by_user(db: Session, user_id: uuid.UUID) -> List[pref_model.NotificationPreference]:
    """Return all notification preferences for a given user."""
    start_time = perf_counter()
    results = (
        db.query(pref_model.NotificationPreference)
        .filter(pref_model.NotificationPreference.user_id == user_id)
        .all()
    )
    metrics.record_timing(
        "user_core.get_notification_preferences",
        perf_counter() - start_time,
        threshold_seconds=0.2,
    )
    return results


def upsert_preference(
    db: Session,
    user_id: uuid.UUID,
    pref: pref_schema.NotificationPreferenceCreate,
    *,
    actor_id: Optional[str] = None,
) -> pref_model.NotificationPreference:
    """Create or update a notification preference and emit a change feed event."""
    start_time = perf_counter()
    db_pref = (
        db.query(pref_model.NotificationPreference)
        .filter(
            pref_model.NotificationPreference.user_id == user_id,
            pref_model.NotificationPreference.channel == pref.channel,
            pref_model.NotificationPreference.topic == pref.topic,
        )
        .first()
    )

    update_data = pref.model_dump(exclude_unset=True)
    change_type = "updated"
    before_snapshot = (
        pref_schema.NotificationPreference.model_validate(db_pref).model_dump(mode="json")
        if db_pref
        else None
    )

    if db_pref:
        for key, value in update_data.items():
            setattr(db_pref, key, value)
        db_pref.last_updated_at = datetime.now(UTC)
    else:
        if update_data.get("consent_source") and not update_data.get("consent_recorded_at"):
            update_data["consent_recorded_at"] = datetime.now(UTC)
        db_pref = pref_model.NotificationPreference(user_id=user_id, **update_data)
        db.add(db_pref)
        change_type = "created"

    db.flush()

    after_snapshot = pref_schema.NotificationPreference.model_validate(db_pref).model_dump(mode="json")
    change_payload = change_feed_service.build_payload(
        actor_id=actor_id,
        before=before_snapshot,
        after=after_snapshot,
    )
    change_event = change_feed_service.create_change_event(
        db=db,
        entity_type="notification_preference",
        entity_id=user_id,
        change_type=change_type,
        payload=change_payload,
    )

    db.commit()
    db.refresh(db_pref)
    db.refresh(change_event)
    change_feed_service.publish_change_event(change_event)

    metrics.record_timing(
        "user_core.upsert_notification_preference",
        perf_counter() - start_time,
        threshold_seconds=0.5,
    )
    return db_pref
