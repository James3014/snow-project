"""
Authentication service with support for both simple tokens and JWT.

This provides a unified authentication interface that can be easily upgraded
from development mode (user_id as token) to production mode (proper JWT).
"""
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import os

from services import db


class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass


def get_current_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> uuid.UUID:
    """
    Extract and validate user ID from request headers.

    Supports two authentication modes:
    1. Development mode: X-User-Id header (for testing)
    2. Production mode: Authorization: Bearer <token> header

    In development, the token is just the user_id.
    In production, this should validate a proper JWT token.

    Args:
        authorization: Authorization header (Bearer token)
        x_user_id: Direct user ID header (dev mode only)

    Returns:
        UUID: Validated user ID

    Raises:
        HTTPException: If authentication fails
    """
    # Mode 1: Development mode with X-User-Id header
    if x_user_id:
        if os.getenv("ENV") != "production":
            try:
                return uuid.UUID(x_user_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid X-User-Id header format"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="X-User-Id header not allowed in production"
            )

    # Mode 2: Authorization Bearer token
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use: Bearer <token>"
        )

    token = authorization.replace("Bearer ", "")

    # TODO: Replace this with proper JWT validation in production
    # For now, treat token as user_id (development mode)
    try:
        user_id = uuid.UUID(token)
        return user_id
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )


def get_current_user_id_optional(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> Optional[uuid.UUID]:
    """
    Optional authentication - returns None if no credentials provided.

    Useful for endpoints that work both for authenticated and anonymous users.
    """
    if not authorization and not x_user_id:
        return None

    try:
        return get_current_user_id(authorization, x_user_id)
    except HTTPException:
        return None


# ==================== Future JWT Implementation ====================
#
# When ready to upgrade to JWT, replace the token validation logic above
# with the following (requires `python-jose` package):
#
# ```python
# from jose import JWTError, jwt
# from datetime import datetime, timedelta
#
# SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30
#
# def create_access_token(user_id: uuid.UUID, expires_delta: Optional[timedelta] = None):
#     """Generate a JWT access token."""
#     to_encode = {"sub": str(user_id)}
#
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt
#
#
# def verify_token(token: str) -> uuid.UUID:
#     """Verify and decode JWT token."""
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         user_id_str: str = payload.get("sub")
#
#         if user_id_str is None:
#             raise AuthenticationError("Invalid token payload")
#
#         return uuid.UUID(user_id_str)
#
#     except JWTError:
#         raise AuthenticationError("Could not validate credentials")
# ```
#
# Then update `get_current_user_id()` to call `verify_token(token)` instead.
