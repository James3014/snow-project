"""
Authentication endpoint for user-core service.

This provides token validation for other services.
"""
from fastapi import APIRouter, Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Dict
import uuid

from services import db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/validate")
async def validate_token(
    authorization: str = Header(...),
    db: Session = Depends(db.get_db)
) -> Dict[str, str]:
    """
    Validate a bearer token and return user information.

    In a full implementation, this would:
    1. Verify JWT signature
    2. Check token expiration
    3. Lookup user in database
    4. Return user info

    For now, this is a simplified version that extracts user_id from token.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )

    token = authorization.replace("Bearer ", "")

    # TODO: Implement proper JWT validation
    # For now, we'll treat the token as the user_id (development mode)
    try:
        user_id = str(uuid.UUID(token))
        return {"user_id": user_id, "status": "valid"}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )


@router.post("/login")
async def login(
    user_id: str,
    db: Session = Depends(db.get_db)
) -> Dict[str, str]:
    """
    Simple login endpoint that returns a token.

    In production, this would:
    1. Verify credentials (username/password or OAuth)
    2. Generate a signed JWT token
    3. Return the token with expiration

    For development, this just returns the user_id as the token.
    """
    # Verify user exists
    from services import user_profile_service
    user = user_profile_service.get_user(db, uuid.UUID(user_id))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # In development, return user_id as token
    # In production, generate a proper JWT
    return {
        "access_token": str(user.user_id),
        "token_type": "bearer",
        "user_id": str(user.user_id)
    }
