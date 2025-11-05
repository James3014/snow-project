from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
import uuid
from typing import List

from services import user_profile_service, db
from schemas import user_profile as user_profile_schema
router = APIRouter()

@router.get("/", response_model=List[user_profile_schema.UserProfile])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(db.get_db)):
    return user_profile_service.get_users(db, skip=skip, limit=limit)

@router.post("/", response_model=user_profile_schema.UserProfile)
def create_user(
    user: user_profile_schema.UserProfileCreate,
    db: Session = Depends(db.get_db),
    actor_id: str = Header(default="system", alias="X-Actor-Id"),
):
    try:
        return user_profile_service.create_user(db=db, user=user, actor_id=actor_id)
    except user_profile_service.DuplicateUserError as exc:
        raise HTTPException(
            status_code=409,
            detail={
                "message": str(exc),
                "existing_user_id": str(exc.existing_user_id),
                "merge_hint": "Use the existing user profile or merge data before creating a new record.",
            },
        ) from exc

@router.get("/{user_id}", response_model=user_profile_schema.UserProfile)
def read_user(user_id: uuid.UUID, db: Session = Depends(db.get_db)):
    db_user = user_profile_service.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=user_profile_schema.UserProfile)
def update_user_profile(
    user_id: uuid.UUID,
    user_update: user_profile_schema.UserProfileUpdate,
    db: Session = Depends(db.get_db),
    actor_id: str = Header(default="system", alias="X-Actor-Id"),
):
    db_user = user_profile_service.update_user(
        db, user_id=user_id, user_update=user_update, actor_id=actor_id
    )
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.delete("/{user_id}", response_model=user_profile_schema.UserProfile)
def deactivate_user_profile(
    user_id: uuid.UUID,
    db: Session = Depends(db.get_db),
    actor_id: str = Header(default="system", alias="X-Actor-Id"),
):
    db_user = user_profile_service.deactivate_user(db, user_id=user_id, actor_id=actor_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.post("/{user_id}/merge", response_model=user_profile_schema.UserProfile)
def merge_user_profile(
    user_id: uuid.UUID,
    request: user_profile_schema.UserMergeRequest,
    db: Session = Depends(db.get_db),
    actor_id: str = Header(default="system", alias="X-Actor-Id"),
):
    try:
        return user_profile_service.merge_users(
            db,
            target_user_id=user_id,
            duplicate_user_id=request.duplicate_user_id,
            actor_id=actor_id,
        )
    except user_profile_service.MergeValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
