"""
Authentication service with JWT issuance and verification.
"""
from datetime import datetime, timedelta, timezone
from fastapi import Header, HTTPException, status
from typing import Optional
import uuid
import os

from jose import JWTError, jwt

from config.settings import settings


class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass


def create_access_token(user_id: uuid.UUID, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT for the given user."""
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.jwt_expire_minutes))
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iss": settings.app_name,
        "aud": "user_core",
    }
    try:
        return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    except Exception as exc:  # pragma: no cover
        raise AuthenticationError(f"Failed to create token: {exc}")


def verify_token(token: str) -> uuid.UUID:
    """Verify and decode JWT token with optional fallback secret for rotation."""
    secrets_to_try = [settings.jwt_secret_key]
    if settings.jwt_fallback_secret:
        secrets_to_try.append(settings.jwt_fallback_secret)

    last_error: Optional[Exception] = None
    for secret in secrets_to_try:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=[settings.jwt_algorithm],
                audience="user_core",
                options={"verify_aud": True},
                issuer=settings.app_name,
            )
            user_id_str: str = payload.get("sub")
            if not user_id_str:
                raise AuthenticationError("Invalid token payload")
            return uuid.UUID(user_id_str)
        except Exception as exc:
            last_error = exc
            continue

    raise AuthenticationError(f"Could not validate credentials: {last_error}")


def _allow_dev_header() -> bool:
    return os.getenv("ENV") != "production"


def get_current_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> uuid.UUID:
    """
    Extract and validate user ID from headers using JWT.
    In non-production, X-User-Id is allowed for convenience.
    """
    # Dev-mode direct header
    if x_user_id and _allow_dev_header():
        try:
            return uuid.UUID(x_user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid X-User-Id header format"
            )
    elif x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Id header not allowed in production"
        )

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = authorization.replace("Bearer ", "")
    try:
        return verify_token(token)
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc)
        )


def get_current_user_id_optional(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> Optional[uuid.UUID]:
    """Optional authentication - returns None if not provided/invalid."""
    if not authorization and not x_user_id:
        return None
    try:
        return get_current_user_id(authorization, x_user_id)
    except HTTPException:
        return None
