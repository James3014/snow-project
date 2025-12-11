"""
Authentication utilities for snowbuddy-matching service.
Embedded auth logic to avoid shared module dependency issues.
"""
from fastapi import Header, HTTPException, status
from typing import Optional
import httpx
import os
import uuid
from jose import JWTError, jwt


USER_CORE_API_URL = os.getenv("USER_CORE_API_URL", "http://localhost:8001")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_SECRET")
JWT_FALLBACK_SECRET = os.getenv("JWT_FALLBACK_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "user_core")
JWT_ISSUER = os.getenv("JWT_ISSUER")  # optional


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> str:
    """
    Extract and validate user_id from request headers.

    Supports two authentication methods:
    1. Bearer token in Authorization header (validates with user-core)
    2. Direct X-User-Id header (for development/service-to-service)

    Returns:
        str: The authenticated user_id

    Raises:
        HTTPException: If authentication fails
    """
    # Prefer JWT local validation when secret is present
    if JWT_SECRET_KEY and authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        secrets_to_try = [JWT_SECRET_KEY] + ([JWT_FALLBACK_SECRET] if JWT_FALLBACK_SECRET else [])
        last_error: Exception | None = None
        for secret in secrets_to_try:
            try:
                claims = jwt.decode(
                    token,
                    secret,
                    algorithms=[JWT_ALGORITHM],
                    audience=JWT_AUDIENCE,
                    options={"verify_aud": True},
                    issuer=JWT_ISSUER if JWT_ISSUER else None,
                )
                user_id = claims.get("sub")
                if not user_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid token payload"
                    )
                return str(uuid.UUID(user_id))
            except (JWTError, ValueError) as exc:
                last_error = exc
                continue

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {last_error}"
        )

    # Method 1: Bearer token (production)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        return await validate_token_with_user_core(token)

    # Method 2: Direct X-User-Id (development/internal)
    if x_user_id:
        # In development, we trust the header
        # In production, this should be restricted to internal services only
        if os.getenv("ENVIRONMENT") == "production":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="X-User-Id header not allowed in production"
            )
        return x_user_id

    # No authentication provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide Authorization header or X-User-Id",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def validate_token_with_user_core(token: str) -> str:
    """
    Validate JWT token with user-core service and extract user_id.

    Used as a fallback when JWT_SECRET_KEY is not provided to this service.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{USER_CORE_API_URL}/auth/validate",
                headers={"Authorization": f"Bearer {token}"}
            )

            if response.status_code == 200:
                data = response.json()
                return data["user_id"]
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token"
                )

    except httpx.RequestError:
        # If user-core is unavailable, fail closed
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )


# Optional: For endpoints that optionally use authentication
async def get_optional_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> Optional[str]:
    """
    Same as get_current_user_id but returns None instead of raising exception
    if no authentication is provided.
    """
    try:
        return await get_current_user_id(authorization, x_user_id)
    except HTTPException:
        return None


__all__ = ['get_current_user_id', 'get_optional_user_id']
