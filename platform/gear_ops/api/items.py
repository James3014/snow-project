"""
Gear Items API

Linus 原則：簡單的 CRUD，不要過度設計
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models import GearItem
from schemas import GearItemCreate, GearItemUpdate, GearItemRead, GEAR_STATUS_DELETED
from services.db import get_db
from services.auth import get_current_user_id

router = APIRouter(prefix="/items", tags=["gear_items"])


@router.post("", response_model=GearItemRead, status_code=status.HTTP_201_CREATED)
def create_gear_item(
    item_data: GearItemCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """建立裝備"""
    gear_item = GearItem(
        user_id=current_user_id,
        **item_data.model_dump()
    )
    db.add(gear_item)
    db.commit()
    db.refresh(gear_item)
    return gear_item


@router.get("", response_model=List[GearItemRead])
def list_gear_items(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    role: Optional[str] = Query(None, description="Filter by role"),
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """列出我的裝備"""
    query = db.query(GearItem).filter(
        GearItem.user_id == current_user_id,
        GearItem.status != GEAR_STATUS_DELETED  # 不显示已刪除的
    )

    if status_filter:
        query = query.filter(GearItem.status == status_filter)

    if role:
        query = query.filter(GearItem.role == role)

    items = query.order_by(GearItem.created_at.desc()).all()
    return items


@router.get("/{item_id}", response_model=GearItemRead)
def get_gear_item(
    item_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """取得单个裝備详情"""
    item = db.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.user_id == current_user_id  # 只能查看自己的
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    return item


@router.patch("/{item_id}", response_model=GearItemRead)
def update_gear_item(
    item_id: UUID,
    update_data: GearItemUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """更新裝備"""
    item = db.query(GearItem).filter(
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

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gear_item(
    item_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """刪除裝備（软刪除）"""
    item = db.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.user_id == current_user_id  # 只能刪除自己的
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gear item not found"
        )

    # 软刪除：更新状态而非物理刪除
    item.status = GEAR_STATUS_DELETED
    db.commit()
    return None
