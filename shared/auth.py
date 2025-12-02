"""
Shared authentication utilities for all SnowTrace services.

This module provides a unified authentication mechanism using JWT tokens
that are validated against the user-core service.
"""
from fastapi import Header, HTTPException, status
from typing import Optional
import httpx
import os


USER_CORE_API_URL = os.getenv("USER_CORE_API_URL", "http://localhost:8001")


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

    In a full implementation, this would:
    1. Call user-core's /auth/validate endpoint
    2. Verify the token signature
    3. Check token expiration
    4. Return the user_id from the token payload

    For now, this is a placeholder that demonstrates the pattern.
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
