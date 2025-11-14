"""
Gear Inspections API

檢查記錄 API，自动根据檢查结果建立提醒
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timedelta

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models import GearItem, GearInspection, GearReminder
from schemas import (
    GearInspectionCreate, GearInspectionRead,
    INSPECTION_STATUS_GOOD, INSPECTION_STATUS_NEEDS_ATTENTION, INSPECTION_STATUS_UNSAFE,
    REMINDER_TYPE_INSPECTION
)
from services.db import get_db
from services.auth import get_current_user_id

router = APIRouter(prefix="/inspections", tags=["gear_inspections"])


def _create_reminder_for_inspection(
    db: Session,
    gear_item_id: UUID,
    next_inspection_date: datetime
):
    """建立檢查提醒（内部函数）"""
    reminder = GearReminder(
        gear_item_id=gear_item_id,
        reminder_type=REMINDER_TYPE_INSPECTION,
        scheduled_at=next_inspection_date,
        message="Time for your gear inspection"
    )
    db.add(reminder)


@router.post("/items/{item_id}/inspections", response_model=GearInspectionRead, status_code=status.HTTP_201_CREATED)
def create_inspection(
    item_id: UUID,
    inspection_data: GearInspectionCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    建立檢查記錄

    自动逻辑：
    - good → next_inspection_date = +90 days
    - needs_attention → next_inspection_date = +30 days
    - unsafe → 不设置（需要维修后才能再檢查）
    """
    # 验证裝備属于当前用户
    gear_item = db.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.user_id == current_user_id
    ).first()

    if not gear_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    # 计算下一次檢查日期
    next_inspection_date = None
    if inspection_data.overall_status == INSPECTION_STATUS_GOOD:
        next_inspection_date = datetime.now() + timedelta(days=90)
    elif inspection_data.overall_status == INSPECTION_STATUS_NEEDS_ATTENTION:
        next_inspection_date = datetime.now() + timedelta(days=30)
    # unsafe 不设置

    # 建立檢查記錄
    inspection = GearInspection(
        gear_item_id=item_id,
        inspector_user_id=current_user_id,
        checklist=inspection_data.checklist,
        overall_status=inspection_data.overall_status,
        notes=inspection_data.notes,
        next_inspection_date=next_inspection_date.date() if next_inspection_date else None
    )
    db.add(inspection)

    # 如果有 next_inspection_date，自动建立提醒
    if next_inspection_date:
        _create_reminder_for_inspection(db, item_id, next_inspection_date)

    db.commit()
    db.refresh(inspection)
    return inspection


@router.get("/items/{item_id}/inspections", response_model=List[GearInspectionRead])
def list_inspections_for_item(
    item_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """取得该裝備的檢查歷史"""
    # 验证裝備属于当前用户
    gear_item = db.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.user_id == current_user_id
    ).first()

    if not gear_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    inspections = db.query(GearInspection).filter(
        GearInspection.gear_item_id == item_id
    ).order_by(GearInspection.inspection_date.desc()).all()

    return inspections


@router.get("/{inspection_id}", response_model=GearInspectionRead)
def get_inspection(
    inspection_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """取得单个檢查記錄详情"""
    inspection = db.query(GearInspection).filter(
        GearInspection.id == inspection_id
    ).first()

    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )

    # 验证裝備属于当前用户
    gear_item = db.query(GearItem).filter(
        GearItem.id == inspection.gear_item_id,
        GearItem.user_id == current_user_id
    ).first()

    if not gear_item:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return inspection
