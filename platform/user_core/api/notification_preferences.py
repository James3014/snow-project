from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
import uuid
from typing import List

from services import notification_preference_service, db
from schemas import notification_preference as pref_schema

router = APIRouter()

@router.get("", response_model=List[pref_schema.NotificationPreference])
def read_preferences_for_user(user_id: uuid.UUID, db: Session = Depends(db.get_db)):
    return notification_preference_service.get_preferences_by_user(db, user_id=user_id)

@router.put("", response_model=pref_schema.NotificationPreference)
def upsert_preference_for_user(
    user_id: uuid.UUID,
    pref: pref_schema.NotificationPreferenceCreate,
    db: Session = Depends(db.get_db),
    actor_id: str = Header(default="system", alias="X-Actor-Id"),
):
    return notification_preference_service.upsert_preference(
        db, user_id=user_id, pref=pref, actor_id=actor_id
    )
