from datetime import datetime, UTC
from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from models.ski_preference import SkiPreference
from schemas.ski_preference import SkiPreferenceCreate, SkiPreferenceResponse


def upsert_preference(
    db: Session,
    user_id: UUID,
    payload: SkiPreferenceCreate
) -> SkiPreferenceResponse:
    """Create or update a user's ski preference record."""
    resort_ids = _deduplicate(payload.resort_ids)
    now = datetime.now(UTC)

    pref = db.query(SkiPreference).filter(SkiPreference.user_id == user_id).first()

    if pref:
        pref.resort_ids = resort_ids
        pref.source = payload.source
        pref.last_trip_id = payload.last_trip_id
        pref.last_synced_at = now
    else:
        pref = SkiPreference(
            user_id=user_id,
            resort_ids=resort_ids,
            source=payload.source,
            last_trip_id=payload.last_trip_id,
            last_synced_at=now,
        )
        db.add(pref)

    db.commit()
    db.refresh(pref)
    return SkiPreferenceResponse.model_validate(pref)


def _deduplicate(resort_ids: List[str]) -> List[str]:
    seen = set()
    ordered: List[str] = []
    for rid in resort_ids:
        if not rid:
            continue
        if rid not in seen:
            ordered.append(rid)
            seen.add(rid)
    return ordered
