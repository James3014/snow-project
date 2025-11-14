"""
Pydantic Schemas for Gear Operations

Linus 原则：models 和 schemas 是一对一关系，放在一起避免重复
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal


# Enums as constants (简单直接)
GEAR_STATUS_ACTIVE = 'active'
GEAR_STATUS_RETIRED = 'retired'
GEAR_STATUS_FOR_SALE = 'for_sale'
GEAR_STATUS_DELETED = 'deleted'

GEAR_ROLE_PERSONAL = 'personal'
GEAR_ROLE_TEACHING = 'teaching'

INSPECTION_STATUS_GOOD = 'good'
INSPECTION_STATUS_NEEDS_ATTENTION = 'needs_attention'
INSPECTION_STATUS_UNSAFE = 'unsafe'

REMINDER_TYPE_INSPECTION = 'inspection'
REMINDER_TYPE_MAINTENANCE = 'maintenance'
REMINDER_TYPE_GENERAL = 'general'

REMINDER_STATUS_PENDING = 'pending'
REMINDER_STATUS_SENT = 'sent'
REMINDER_STATUS_CANCELLED = 'cancelled'


# ===== GearItem Schemas =====

class GearItemCreate(BaseModel):
    """创建装备"""
    name: str = Field(..., max_length=100, description="装备名称")
    category: Optional[str] = Field(None, max_length=50, description="类别：board, binding, boots, etc.")
    brand: Optional[str] = Field(None, max_length=50, description="品牌")
    purchase_date: Optional[date] = None
    role: str = Field(default=GEAR_ROLE_PERSONAL, description="角色：personal 或 teaching")

    @validator('role')
    def validate_role(cls, v):
        if v not in [GEAR_ROLE_PERSONAL, GEAR_ROLE_TEACHING]:
            raise ValueError(f'role must be {GEAR_ROLE_PERSONAL} or {GEAR_ROLE_TEACHING}')
        return v


class GearItemUpdate(BaseModel):
    """更新装备"""
    name: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    brand: Optional[str] = Field(None, max_length=50)
    purchase_date: Optional[date] = None
    status: Optional[str] = None
    role: Optional[str] = None
    sale_price: Optional[Decimal] = None
    sale_currency: Optional[str] = Field(None, max_length=3)

    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            valid_statuses = [GEAR_STATUS_ACTIVE, GEAR_STATUS_RETIRED, GEAR_STATUS_FOR_SALE, GEAR_STATUS_DELETED]
            if v not in valid_statuses:
                raise ValueError(f'status must be one of {valid_statuses}')
        return v

    @validator('role')
    def validate_role(cls, v):
        if v is not None and v not in [GEAR_ROLE_PERSONAL, GEAR_ROLE_TEACHING]:
            raise ValueError(f'role must be {GEAR_ROLE_PERSONAL} or {GEAR_ROLE_TEACHING}')
        return v


class GearItemRead(BaseModel):
    """读取装备"""
    id: UUID
    user_id: UUID
    name: str
    category: Optional[str]
    brand: Optional[str]
    purchase_date: Optional[date]
    status: str
    role: str
    sale_price: Optional[Decimal]
    sale_currency: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== GearInspection Schemas =====

class GearInspectionCreate(BaseModel):
    """创建检查记录"""
    checklist: Dict[str, Any] = Field(..., description="检查清单，例如 {'edge': 'good', 'bindings': 'worn'}")
    overall_status: str = Field(..., description="总体状态：good, needs_attention, unsafe")
    notes: Optional[str] = None

    @validator('overall_status')
    def validate_overall_status(cls, v):
        valid_statuses = [INSPECTION_STATUS_GOOD, INSPECTION_STATUS_NEEDS_ATTENTION, INSPECTION_STATUS_UNSAFE]
        if v not in valid_statuses:
            raise ValueError(f'overall_status must be one of {valid_statuses}')
        return v


class GearInspectionRead(BaseModel):
    """读取检查记录"""
    id: UUID
    gear_item_id: UUID
    inspector_user_id: UUID
    inspection_date: datetime
    checklist: Dict[str, Any]
    overall_status: str
    notes: Optional[str]
    next_inspection_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


# ===== GearReminder Schemas =====

class GearReminderCreate(BaseModel):
    """创建提醒"""
    gear_item_id: UUID
    reminder_type: str = Field(..., description="提醒类型：inspection, maintenance, general")
    scheduled_at: datetime
    message: Optional[str] = None

    @validator('reminder_type')
    def validate_reminder_type(cls, v):
        valid_types = [REMINDER_TYPE_INSPECTION, REMINDER_TYPE_MAINTENANCE, REMINDER_TYPE_GENERAL]
        if v not in valid_types:
            raise ValueError(f'reminder_type must be one of {valid_types}')
        return v


class GearReminderRead(BaseModel):
    """读取提醒"""
    id: UUID
    gear_item_id: UUID
    reminder_type: str
    scheduled_at: datetime
    sent_at: Optional[datetime]
    status: str
    message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Marketplace Schemas =====

class MarketplaceSearchParams(BaseModel):
    """搜索二手装备的参数"""
    category: Optional[str] = None
    price_min: Optional[Decimal] = None
    price_max: Optional[Decimal] = None
    currency: Optional[str] = 'TWD'
    limit: int = Field(default=20, le=100)
    offset: int = Field(default=0, ge=0)
