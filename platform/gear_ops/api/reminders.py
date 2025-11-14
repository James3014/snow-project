"""
Gear Reminders API

提醒管理 API：查询、建立、取消
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from uuid import UUID

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models import GearItem, GearReminder
from schemas import GearReminderCreate, GearReminderRead, REMINDER_STATUS_CANCELLED
from services.db import get_db
from services.auth import get_current_user_id

router = APIRouter(prefix="/reminders", tags=["gear_reminders"])


@router.get("", response_model=List[GearReminderRead])
def list_my_reminders(
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """列出我的所有提醒（按scheduled_at排序）"""
    # 查找属于当前用户的所有裝備的提醒
    reminders = db.query(GearReminder).join(
        GearItem, GearReminder.gear_item_id == GearItem.id
    ).filter(
        GearItem.user_id == current_user_id
    ).order_by(GearReminder.scheduled_at.asc()).all()

    return reminders


@router.post("", response_model=GearReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(
    reminder_data: GearReminderCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """手动建立提醒"""
    # 验证裝備属于当前用户
    gear_item = db.query(GearItem).filter(
        GearItem.id == reminder_data.gear_item_id,
        GearItem.user_id == current_user_id
    ).first()

    if not gear_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    reminder = GearReminder(**reminder_data.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.patch("/{reminder_id}/cancel", response_model=GearReminderRead)
def cancel_reminder(
    reminder_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """取消提醒"""
    # 查找提醒并验证权限
    reminder = db.query(GearReminder).join(
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

    # 更新状态为 cancelled
    reminder.status = REMINDER_STATUS_CANCELLED
    db.commit()
    db.refresh(reminder)
    return reminder
