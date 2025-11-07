"""
Admin API endpoints for user-core service.

Provides admin-only endpoints for:
- User management (list, view, update, delete)
- User status management (activate/deactivate)
- Role management
- Statistics
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict
from datetime import datetime, UTC, timedelta
import uuid

from services import db
from models.user_profile import UserProfile
from models.enums import UserStatus
from services.auth_dependencies import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"])


# ==================== Schemas ====================

class UserListItem(BaseModel):
    """用戶列表項目"""
    user_id: str
    email: str
    display_name: Optional[str]
    roles: List[str]
    status: str
    experience_level: Optional[str]
    created_at: str
    updated_at: str


class UserListResponse(BaseModel):
    """用戶列表回應"""
    users: List[UserListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserDetailResponse(BaseModel):
    """用戶詳細資料"""
    user_id: str
    email: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    preferred_language: Optional[str]
    experience_level: Optional[str]
    roles: List[str]
    status: str
    bio: Optional[str]
    coach_cert_level: Optional[str]
    preferred_resorts: Optional[List]
    teaching_languages: Optional[List]
    created_at: str
    updated_at: str


class UpdateUserRequest(BaseModel):
    """更新用戶請求"""
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_language: Optional[str] = None
    experience_level: Optional[str] = None
    bio: Optional[str] = None
    coach_cert_level: Optional[str] = None


class UpdateUserRolesRequest(BaseModel):
    """更新用戶角色請求"""
    roles: List[str] = Field(..., description="New roles for the user")


class UpdateUserStatusRequest(BaseModel):
    """更新用戶狀態請求"""
    status: str = Field(..., description="New status (active/inactive)")


class StatisticsResponse(BaseModel):
    """統計資訊回應"""
    total_users: int
    active_users: int
    inactive_users: int
    new_users_last_7_days: int
    new_users_last_30_days: int
    users_by_experience_level: Dict[str, int]
    users_by_role: Dict[str, int]


# ==================== Endpoints ====================

@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by email or display name"),
    status_filter: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    role_filter: Optional[str] = Query(None, description="Filter by role"),
    db_session: Session = Depends(db.get_db),
    _admin: UserProfile = Depends(get_current_admin_user)
):
    """
    獲取所有用戶列表（分頁、搜尋、篩選）

    需要管理員權限
    """
    # Build query
    query = db_session.query(UserProfile)

    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                UserProfile.email.ilike(search_pattern),
                UserProfile.display_name.ilike(search_pattern)
            )
        )

    if status_filter:
        try:
            status_enum = UserStatus(status_filter)
            query = query.filter(UserProfile.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}"
            )

    if role_filter:
        # Filter by role using JSON contains
        query = query.filter(UserProfile.roles.contains([role_filter]))

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    users = query.order_by(UserProfile.created_at.desc()).offset(offset).limit(page_size).all()

    # Convert to response
    user_items = [
        UserListItem(
            user_id=str(user.user_id),
            email=user.email,
            display_name=user.display_name,
            roles=user.roles or [],
            status=user.status.value if user.status else "active",
            experience_level=user.experience_level,
            created_at=user.created_at.isoformat() if user.created_at else "",
            updated_at=user.updated_at.isoformat() if user.updated_at else ""
        )
        for user in users
    ]

    total_pages = (total + page_size - 1) // page_size

    return UserListResponse(
        users=user_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: str,
    db_session: Session = Depends(db.get_db),
    _admin: UserProfile = Depends(get_current_admin_user)
):
    """
    獲取單個用戶詳細資料

    需要管理員權限
    """
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id format"
        )

    user = db_session.query(UserProfile).filter(
        UserProfile.user_id == uid
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserDetailResponse(
        user_id=str(user.user_id),
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        preferred_language=user.preferred_language,
        experience_level=user.experience_level,
        roles=user.roles or [],
        status=user.status.value if user.status else "active",
        bio=user.bio,
        coach_cert_level=user.coach_cert_level,
        preferred_resorts=user.preferred_resorts,
        teaching_languages=user.teaching_languages,
        created_at=user.created_at.isoformat() if user.created_at else "",
        updated_at=user.updated_at.isoformat() if user.updated_at else ""
    )


@router.patch("/users/{user_id}", response_model=UserDetailResponse)
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    db_session: Session = Depends(db.get_db),
    _admin: UserProfile = Depends(get_current_admin_user)
):
    """
    更新用戶資料

    需要管理員權限
    """
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id format"
        )

    user = db_session.query(UserProfile).filter(
        UserProfile.user_id == uid
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    user.updated_at = datetime.now(UTC)
    db_session.commit()
    db_session.refresh(user)

    return UserDetailResponse(
        user_id=str(user.user_id),
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        preferred_language=user.preferred_language,
        experience_level=user.experience_level,
        roles=user.roles or [],
        status=user.status.value if user.status else "active",
        bio=user.bio,
        coach_cert_level=user.coach_cert_level,
        preferred_resorts=user.preferred_resorts,
        teaching_languages=user.teaching_languages,
        created_at=user.created_at.isoformat() if user.created_at else "",
        updated_at=user.updated_at.isoformat() if user.updated_at else ""
    )


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    request: UpdateUserStatusRequest,
    db_session: Session = Depends(db.get_db),
    _admin: UserProfile = Depends(get_current_admin_user)
):
    """
    停用/啟用用戶帳號

    需要管理員權限
    """
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id format"
        )

    user = db_session.query(UserProfile).filter(
        UserProfile.user_id == uid
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Validate status
    try:
        new_status = UserStatus(request.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {request.status}"
        )

    user.status = new_status
    user.updated_at = datetime.now(UTC)
    db_session.commit()
    db_session.refresh(user)

    return {
        "message": f"User status updated to {new_status.value}",
        "user_id": str(user.user_id),
        "status": new_status.value
    }


@router.patch("/users/{user_id}/roles")
async def update_user_roles(
    user_id: str,
    request: UpdateUserRolesRequest,
    db_session: Session = Depends(db.get_db),
    _admin: UserProfile = Depends(get_current_admin_user)
):
    """
    更新用戶角色

    需要管理員權限
    """
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id format"
        )

    user = db_session.query(UserProfile).filter(
        UserProfile.user_id == uid
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.roles = request.roles
    user.updated_at = datetime.now(UTC)
    db_session.commit()
    db_session.refresh(user)

    return {
        "message": "User roles updated",
        "user_id": str(user.user_id),
        "roles": user.roles
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db_session: Session = Depends(db.get_db),
    admin: UserProfile = Depends(get_current_admin_user)
):
    """
    刪除用戶

    需要管理員權限
    """
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id format"
        )

    # Prevent admin from deleting themselves
    if str(admin.user_id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user = db_session.query(UserProfile).filter(
        UserProfile.user_id == uid
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    db_session.delete(user)
    db_session.commit()

    return {
        "message": "User deleted successfully",
        "user_id": user_id
    }


@router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics(
    db_session: Session = Depends(db.get_db),
    _admin: UserProfile = Depends(get_current_admin_user)
):
    """
    獲取統計資訊

    需要管理員權限
    """
    # Total users
    total_users = db_session.query(func.count(UserProfile.user_id)).scalar()

    # Active/Inactive users
    active_users = db_session.query(func.count(UserProfile.user_id)).filter(
        UserProfile.status == UserStatus.active
    ).scalar()

    inactive_users = db_session.query(func.count(UserProfile.user_id)).filter(
        UserProfile.status == UserStatus.inactive
    ).scalar()

    # New users in last 7 days
    seven_days_ago = datetime.now(UTC) - timedelta(days=7)
    new_users_7d = db_session.query(func.count(UserProfile.user_id)).filter(
        UserProfile.created_at >= seven_days_ago
    ).scalar()

    # New users in last 30 days
    thirty_days_ago = datetime.now(UTC) - timedelta(days=30)
    new_users_30d = db_session.query(func.count(UserProfile.user_id)).filter(
        UserProfile.created_at >= thirty_days_ago
    ).scalar()

    # Users by experience level
    experience_levels = db_session.query(
        UserProfile.experience_level,
        func.count(UserProfile.user_id)
    ).group_by(UserProfile.experience_level).all()

    users_by_experience = {
        level or "unknown": count
        for level, count in experience_levels
    }

    # Users by role (this is simplified - in reality roles is a JSON array)
    # For now, we'll just count admin vs non-admin
    admin_count = db_session.query(func.count(UserProfile.user_id)).filter(
        UserProfile.roles.contains(['admin'])
    ).scalar() or 0

    user_count = total_users - admin_count

    users_by_role = {
        "admin": admin_count,
        "user": user_count
    }

    return StatisticsResponse(
        total_users=total_users or 0,
        active_users=active_users or 0,
        inactive_users=inactive_users or 0,
        new_users_last_7_days=new_users_7d or 0,
        new_users_last_30_days=new_users_30d or 0,
        users_by_experience_level=users_by_experience,
        users_by_role=users_by_role
    )
