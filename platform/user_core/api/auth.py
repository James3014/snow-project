"""
Authentication endpoints for user-core service.

Provides:
- User registration
- User login (email + password)
- Token validation
"""
import time
from collections import defaultdict
from typing import Dict, Any
from fastapi import APIRouter, Header, HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
import uuid
import os

from services import db
from models.user_profile import UserProfile
from services import password_service
from services.bot_protection import verify_captcha
from services.auth_service import create_access_token, verify_token
from config.settings import settings

try:
    import redis
    _redis = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    _redis_available = True
except Exception:
    _redis = None
    _redis_available = False

router = APIRouter(prefix="/auth", tags=["Authentication"])
_REQUEST_HISTORY = defaultdict(list)
AUTH_RL_WINDOW = 60  # seconds
AUTH_RL_MAX = 15


def _rate_limit(key: str) -> None:
    """Apply a simple sliding window rate limit."""
    if _redis_available:
        now_ms = int(time.time() * 1000)
        window_ms = AUTH_RL_WINDOW * 1000
        key_name = f"auth:rl:{key}"
        try:
            pipeline = _redis.pipeline()
            pipeline.zremrangebyscore(key_name, 0, now_ms - window_ms)
            pipeline.zcard(key_name)
            pipeline.zadd(key_name, {str(now_ms): now_ms})
            pipeline.expire(key_name, AUTH_RL_WINDOW)
            _, count, _, _ = pipeline.execute()
            if count >= AUTH_RL_MAX:
                raise HTTPException(status_code=429, detail="Too many requests")
            return
        except Exception:
            pass

    now = time.time()
    window_start = now - AUTH_RL_WINDOW
    recent = _REQUEST_HISTORY[key]
    while recent and recent[0] < window_start:
        recent.pop(0)
    if len(recent) >= AUTH_RL_MAX:
        raise HTTPException(status_code=429, detail="Too many requests")
    recent.append(now)


# ==================== Schemas ====================

class RegisterRequest(BaseModel):
    """User registration request."""
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    display_name: str = Field(..., min_length=2, max_length=100)
    preferred_language: str = Field(default="zh-TW")
    experience_level: str = Field(default="beginner")
    captcha_token: str | None = Field(default=None, description="Turnstile/reCAPTCHA token")


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str
    captcha_token: str | None = Field(default=None, description="Turnstile/reCAPTCHA token")


class AuthResponse(BaseModel):
    """Authentication response."""
    access_token: str
    token_type: str
    user_id: str
    display_name: str
    email: str


# ==================== Endpoints ====================

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    http_request: Request,
    db_session: Session = Depends(db.get_db)
) -> AuthResponse:
    """
    Register a new user.

    Creates a new user account with email and password.
    Returns access token for immediate login.

    Raises:
        400: Email already registered
    """
    _rate_limit(f"register:{http_request.client.host if http_request.client else 'unknown'}")
    await verify_captcha(request.captcha_token, client_ip=http_request.client.host if http_request.client else None)

    # Check if email already exists
    existing_user = db_session.query(UserProfile).filter(
        UserProfile.email == request.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = password_service.hash_password(request.password)

    # Create new user
    new_user = UserProfile(
        email=request.email,
        hashed_password=hashed_password,
        display_name=request.display_name,
        preferred_language=request.preferred_language,
        experience_level=request.experience_level,
        roles=["user"],  # Default role
        legacy_ids=None,
        coach_cert_level=None,
        bio=None,
        preferred_resorts=None,
        teaching_languages=None,
        legal_consent=None,
        audit_log=None
    )

    db_session.add(new_user)
    db_session.commit()
    db_session.refresh(new_user)

    access_token = create_access_token(new_user.user_id)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=str(new_user.user_id),
        display_name=new_user.display_name,
        email=new_user.email
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    http_request: Request,
    db_session: Session = Depends(db.get_db)
) -> AuthResponse:
    """
    Login with email and password.

    Returns:
        AuthResponse with access token

    Raises:
        401: Invalid credentials
    """
    _rate_limit(f"login:{http_request.client.host if http_request.client else 'unknown'}")
    await verify_captcha(request.captcha_token, client_ip=http_request.client.host if http_request.client else None)

    # Find user by email
    user = db_session.query(UserProfile).filter(
        UserProfile.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not password_service.verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(user.user_id)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=str(user.user_id),
        display_name=user.display_name or user.email.split('@')[0],
        email=user.email
    )


@router.get("/validate")
async def validate_token(
    authorization: str = Header(...),
    db_session: Session = Depends(db.get_db)
) -> Dict[str, str]:
    """
    Validate a bearer token and return user information.

    Returns:
        Dict with user_id and status

    Raises:
        401: Invalid token
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )

    token = authorization.replace("Bearer ", "")

    try:
        user_id = verify_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc)
        )

    user = db_session.query(UserProfile).filter(
        UserProfile.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return {
        "user_id": str(user.user_id),
        "email": user.email,
        "display_name": user.display_name or user.email.split('@')[0],
        "status": "valid"
    }


@router.get("/me")
async def get_current_user(
    authorization: str = Header(...),
    db_session: Session = Depends(db.get_db)
) -> Dict[str, Any]:
    """
    Get current user's profile information.

    Requires:
        Authorization: Bearer <token> header

    Returns:
        User profile data

    Raises:
        401: Invalid/missing token
    """
    # Validate token first
    validation = await validate_token(authorization, db_session)
    user_id = uuid.UUID(validation["user_id"])

    # Get full user profile
    user = db_session.query(UserProfile).filter(
        UserProfile.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {
        "user_id": str(user.user_id),
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "preferred_language": user.preferred_language,
        "experience_level": user.experience_level,
        "roles": user.roles,
        "bio": user.bio,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }
