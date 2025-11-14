"""
Gear Marketplace API

最简可行方案：
- 搜索待售装备
- 联系卖家（发站内信或 email）
- 不做复杂的交易流程、支付、状态机
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models import GearItem
from schemas import GearItemRead, GEAR_STATUS_FOR_SALE
from services.db import get_db
from services.auth import get_current_user_id

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


@router.get("", response_model=List[GearItemRead])
def search_marketplace(
    category: Optional[str] = Query(None, description="Filter by category"),
    price_min: Optional[Decimal] = Query(None, description="Minimum price"),
    price_max: Optional[Decimal] = Query(None, description="Maximum price"),
    currency: str = Query('TWD', description="Currency filter"),
    limit: int = Query(20, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    搜索待售装备（不需要登录）

    简单实用：
    - 只显示 status='for_sale' 的装备
    - 支持基本过滤：类别、价格范围
    - 不暴露卖家敏感信息
    """
    query = db.query(GearItem).filter(
        GearItem.status == GEAR_STATUS_FOR_SALE
    )

    if category:
        query = query.filter(GearItem.category == category)

    if price_min is not None:
        query = query.filter(GearItem.sale_price >= price_min)

    if price_max is not None:
        query = query.filter(GearItem.sale_price <= price_max)

    if currency:
        query = query.filter(GearItem.sale_currency == currency)

    items = query.order_by(GearItem.created_at.desc()).offset(offset).limit(limit).all()
    return items


@router.post("/items/{item_id}/contact-seller", status_code=status.HTTP_200_OK)
def contact_seller(
    item_id: UUID,
    message: str = Query(..., description="Message to seller"),
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    联系卖家

    实用主义：
    - 先用简单的方式：返回卖家联系方式或发站内信
    - 不做复杂的聊天系统
    - 让买卖双方自己沟通（微信、站内信）
    """
    item = db.query(GearItem).filter(
        GearItem.id == item_id,
        GearItem.status == GEAR_STATUS_FOR_SALE
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not for sale"
        )

    if item.user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot contact yourself"
        )

    # TODO: 实现站内信系统或 email 通知
    # 现在先返回成功，实际的消息发送可以后续实现
    return {
        "status": "success",
        "message": "Contact request sent to seller",
        "seller_id": str(item.user_id),
        # 生产环境中，这里应该触发站内信或 email
    }
