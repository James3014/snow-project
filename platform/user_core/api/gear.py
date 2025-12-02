"""
Gear Operations API

Linus 原則：簡單的 CRUD，不要過度設計
整合所有裝備相關功能：裝備管理、檢查紀錄、提醒、二手市場
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from services import db
from services.auth_service import get_current_user_id
from models import GearItem, GearInspection, GearReminder
from schemas.gear import (
    GearItemCreate, GearItemUpdate, GearItemRead,
    GearInspectionCreate, GearInspectionRead,
    GearReminderCreate, GearReminderRead,
    GEAR_STATUS_DELETED, GEAR_STATUS_FOR_SALE,
    INSPECTION_STATUS_GOOD, INSPECTION_STATUS_NEEDS_ATTENTION,
    REMINDER_TYPE_INSPECTION, REMINDER_STATUS_CANCELLED
)

router = APIRouter(prefix="/gear", tags=["gear"])


# ==================== 裝備管理 API ====================

@router.post("/items", response_model=GearItemRead, status_code=status.HTTP_201_CREATED)
def create_gear_item(
    item_data: GearItemCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """建立裝備"""
    gear_item = GearItem(
        user_id=current_user_id,
        **item_data.model_dump()
    )
    db_session.add(gear_item)
    db_session.commit()
    db_session.refresh(gear_item)
    return gear_item


@router.get("/items", response_model=List[GearItemRead])
def list_gear_items(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    role: Optional[str] = Query(None, description="Filter by role"),
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """列出我的裝備"""
    query = db_session.query(GearItem).filter(
        GearItem.user_id == current_user_id,
        GearItem.status != GEAR_STATUS_DELETED  # 不顯示已刪除的
    )

    if status_filter:
        query = query.filter(GearItem.status == status_filter)

    if role:
        query = query.filter(GearItem.role == role)

    items = query.order_by(GearItem.created_at.desc()).all()
    return items


@router.get("/items/{item_id}", response_model=GearItemRead)
def get_gear_item(
    item_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """取得單個裝備詳情"""
    item = db_session.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.user_id == current_user_id  # 只能查看自己的
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    return item


@router.patch("/items/{item_id}", response_model=GearItemRead)
def update_gear_item(
    item_id: UUID,
    update_data: GearItemUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """更新裝備"""
    item = db_session.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.user_id == current_user_id  # 只能更新自己的
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    # 只更新提供的字段
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(item, field, value)

    db_session.commit()
    db_session.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gear_item(
    item_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """刪除裝備（軟刪除）"""
    item = db_session.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.user_id == current_user_id  # 只能刪除自己的
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    # 軟刪除：更新狀態而非物理刪除
    item.status = GEAR_STATUS_DELETED
    db_session.commit()
    return None


# ==================== 檢查紀錄 API ====================

def _create_reminder_for_inspection(
    db_session: Session,
    gear_item_id: UUID,
    next_inspection_date: datetime
):
    """建立檢查提醒（內部函數）"""
    reminder = GearReminder(
        gear_item_id=gear_item_id,
        reminder_type=REMINDER_TYPE_INSPECTION,
        scheduled_at=next_inspection_date,
        message="Time for your gear inspection"
    )
    db_session.add(reminder)


@router.post("/items/{item_id}/inspections", response_model=GearInspectionRead, status_code=status.HTTP_201_CREATED)
def create_inspection(
    item_id: UUID,
    inspection_data: GearInspectionCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """
    建立檢查紀錄

    自動邏輯：
    - good → next_inspection_date = +90 days
    - needs_attention → next_inspection_date = +30 days
    - unsafe → 不設置（需要維修後才能再檢查）
    """
    # 驗證裝備屬於當前用戶
    gear_item = db_session.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.user_id == current_user_id
    ).first()

    if not gear_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    # 計算下一次檢查日期
    next_inspection_date = None
    if inspection_data.overall_status == INSPECTION_STATUS_GOOD:
        next_inspection_date = datetime.now() + timedelta(days=90)
    elif inspection_data.overall_status == INSPECTION_STATUS_NEEDS_ATTENTION:
        next_inspection_date = datetime.now() + timedelta(days=30)
    # unsafe 不設置

    # 建立檢查紀錄
    inspection = GearInspection(
        gear_item_id=item_id,
        inspector_user_id=current_user_id,
        checklist=inspection_data.checklist,
        overall_status=inspection_data.overall_status,
        notes=inspection_data.notes,
        next_inspection_date=next_inspection_date.date() if next_inspection_date else None
    )
    db_session.add(inspection)

    # 如果有 next_inspection_date，自動建立提醒
    if next_inspection_date:
        _create_reminder_for_inspection(db_session, item_id, next_inspection_date)

    db_session.commit()
    db_session.refresh(inspection)
    return inspection


@router.get("/items/{item_id}/inspections", response_model=List[GearInspectionRead])
def list_inspections_for_item(
    item_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """取得該裝備的檢查歷史"""
    # 驗證裝備屬於當前用戶
    gear_item = db_session.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.user_id == current_user_id
    ).first()

    if not gear_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    inspections = db_session.query(GearInspection).filter(
        GearInspection.gear_item_id == item_id
    ).order_by(GearInspection.inspection_date.desc()).all()

    return inspections


@router.get("/inspections/{inspection_id}", response_model=GearInspectionRead)
def get_inspection(
    inspection_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """取得單個檢查紀錄詳情"""
    inspection = db_session.query(GearInspection).filter(
        GearInspection.id == inspection_id
    ).first()

    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )

    # 驗證裝備屬於當前用戶
    gear_item = db_session.query(GearItem).filter(
        GearItem.id == inspection.gear_item_id,
        GearItem.user_id == current_user_id
    ).first()

    if not gear_item:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return inspection


# ==================== 提醒管理 API ====================

@router.get("/reminders", response_model=List[GearReminderRead])
def list_my_reminders(
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """列出我的所有提醒（按scheduled_at排序）"""
    # 查找屬於當前用戶的所有裝備的提醒
    reminders = db_session.query(GearReminder).join(
        GearItem, GearReminder.gear_item_id == GearItem.id
    ).filter(
        GearItem.user_id == current_user_id
    ).order_by(GearReminder.scheduled_at.asc()).all()

    return reminders


@router.post("/reminders", response_model=GearReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(
    reminder_data: GearReminderCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """手動建立提醒"""
    # 驗證裝備屬於當前用戶
    gear_item = db_session.query(GearItem).filter(
        GearItem.id == reminder_data.gear_item_id,
        GearItem.user_id == current_user_id
    ).first()

    if not gear_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    reminder = GearReminder(**reminder_data.model_dump())
    db_session.add(reminder)
    db_session.commit()
    db_session.refresh(reminder)
    return reminder


@router.patch("/reminders/{reminder_id}/cancel", response_model=GearReminderRead)
def cancel_reminder(
    reminder_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """取消提醒"""
    # 查找提醒並驗證權限
    reminder = db_session.query(GearReminder).join(
        GearItem, GearReminder.gear_item_id == GearItem.id
    ).filter(
        and_(
            GearReminder.id == reminder_id,
            GearItem.user_id == current_user_id
        )
    ).first()

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    # 更新狀態為 cancelled
    reminder.status = REMINDER_STATUS_CANCELLED
    db_session.commit()
    db_session.refresh(reminder)
    return reminder


# ==================== 二手市場 API ====================

@router.get("/marketplace", response_model=List[GearItemRead])
def search_marketplace(
    category: Optional[str] = Query(None, description="Filter by category"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db_session: Session = Depends(db.get_db)
):
    """搜尋二手市場（所有用戶的待售裝備）"""
    query = db_session.query(GearItem).filter(
        GearItem.status == GEAR_STATUS_FOR_SALE
    )

    if category:
        query = query.filter(GearItem.category == category)

    if max_price is not None:
        query = query.filter(GearItem.sale_price <= max_price)

    items = query.order_by(GearItem.created_at.desc()).offset(skip).limit(limit).all()
    return items


@router.post("/marketplace/items/{item_id}/contact-seller")
def contact_seller(
    item_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """聯繫賣家（簡化版本）"""
    item = db_session.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.status == GEAR_STATUS_FOR_SALE
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not for sale"
        )

    # 簡化版本：只返回賣家ID
    # 實際應該發送通知或建立對話
    return {
        "seller_user_id": str(item.user_id),
        "message": "Seller contact info retrieved successfully"
    }
