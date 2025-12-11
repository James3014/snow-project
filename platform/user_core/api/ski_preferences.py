"""API endpoints for ski preference synchronization."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from services import db
from services import ski_preference_service
from schemas.ski_preference import SkiPreferenceCreate, SkiPreferenceResponse

router = APIRouter()


@router.post(
    "",
    response_model=SkiPreferenceResponse,
    summary="Upsert user's ski resort preferences",
    status_code=201
)
def upsert_ski_preference(
    user_id: UUID,
    payload: SkiPreferenceCreate,
    db_session: Session = Depends(db.get_db)
):
    """
    Create or update the list of ski resorts a user is actively planning for.

    This endpoint is used by Trip Planner等內部服務，在建立/更新行程時
    同步該行程所涉及的雪場資訊。
    """
    if not payload.resort_ids:
        raise HTTPException(status_code=400, detail="resort_ids must not be empty")

    return ski_preference_service.upsert_preference(
        db=db_session,
        user_id=user_id,
        payload=payload
    )
