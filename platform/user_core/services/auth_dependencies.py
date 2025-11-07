"""
Authentication Dependencies
用於 API 端點的認證和權限檢查依賴
"""
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Dict
import uuid

from services import db
from models.user_profile import UserProfile


async def get_current_user(
    authorization: str = Header(...),
    db_session: Session = Depends(db.get_db)
) -> UserProfile:
    """
    從 Authorization header 獲取當前用戶

    Args:
        authorization: Bearer token
        db_session: 資料庫 session

    Returns:
        UserProfile: 當前用戶

    Raises:
        401: 無效的 token 或用戶不存在
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )

    token = authorization.replace("Bearer ", "")

    # TODO: Implement proper JWT validation in production
    # For now, validate token as user_id
    try:
        user_id = uuid.UUID(token)

        # Verify user exists
        user = db_session.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return user

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )


async def get_current_admin_user(
    current_user: UserProfile = Depends(get_current_user)
) -> UserProfile:
    """
    檢查當前用戶是否為管理員

    Args:
        current_user: 當前用戶（來自 get_current_user）

    Returns:
        UserProfile: 管理員用戶

    Raises:
        403: 用戶不是管理員
    """
    if not current_user.roles or 'admin' not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user
