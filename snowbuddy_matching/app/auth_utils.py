"""
Authentication utilities for snowbuddy-matching service.
Self-contained authentication logic to avoid shared module dependencies.
"""
from fastapi import Header, HTTPException, status
from typing import Optional
import httpx
import os
from jose import JWTError, jwt


USER_CORE_API_URL = os.getenv("USER_CORE_API_URL", "http://localhost:8001")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "user_core")


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> str:
    """Extract and validate user_id from request headers."""
    
    # Method 1: X-User-Id header (for service-to-service calls)
    if x_user_id:
        return x_user_id
    
    # Method 2: JWT token validation
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    # Local JWT validation if secret is available
    if JWT_SECRET_KEY:
        try:
            payload = jwt.decode(
                token, 
                JWT_SECRET_KEY, 
                algorithms=[JWT_ALGORITHM],
                audience=JWT_AUDIENCE
            )
            return str(payload.get("sub"))
        except JWTError:
            pass  # Fall back to user-core validation
    
    # Fallback: validate with user-core service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{USER_CORE_API_URL}/auth/validate",
                headers={"Authorization": authorization}
            )
            if response.status_code == 200:
                data = response.json()
                return str(data["user_id"])
    except Exception:
        pass
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token"
    )


async def get_optional_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> Optional[str]:
    """Optional user authentication - returns None if not authenticated."""
    try:
        return await get_current_user_id(authorization, x_user_id)
    except HTTPException:
        return None
