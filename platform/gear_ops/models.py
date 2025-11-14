"""
Gear Operations ORM Models

Linus 原則：
1. 只有3个表，覆盖所有核心需求
2. 用字段状态而非独立表（status='for_sale', overall_status='unsafe'）
3. JSONB 提供灵活性但不失约束
"""
from sqlalchemy import Column, String, DateTime, Date, Numeric, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class GearItem(Base):
    """裝備主档"""
    __tablename__ = 'gear_items'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50))  # board, binding, boots, poles, helmet, etc.
    brand = Column(String(50))
    purchase_date = Column(Date)

    # 状态：active, retired, for_sale, deleted
    status = Column(String(20), nullable=False, default='active', index=True)

    # 角色：personal, teaching
    role = Column(String(20), default='personal')

    # 买卖欄位（不需要独立的 GearListing 表）
    sale_price = Column(Numeric(10, 2))
    sale_currency = Column(String(3), default='TWD')

    # 元数据
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<GearItem(id={self.id}, name={self.name}, status={self.status})>"


class GearInspection(Base):
    """裝備檢查記錄"""
    __tablename__ = 'gear_inspections'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gear_item_id = Column(UUID(as_uuid=True), ForeignKey('gear_items.id', ondelete='CASCADE'), nullable=False)
    inspector_user_id = Column(UUID(as_uuid=True), nullable=False)
    inspection_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # checklist: 灵活的 JSONB，例如 {"edge": "good", "bindings": "worn", "base": "scratched"}
    checklist = Column(JSONB, nullable=False)

    # overall_status: good, needs_attention, unsafe
    # unsafe 就是安全标记，不需要独立的 GearSafetyFlag 表
    overall_status = Column(String(20), nullable=False)

    notes = Column(Text)
    next_inspection_date = Column(Date)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<GearInspection(id={self.id}, gear_item_id={self.gear_item_id}, status={self.overall_status})>"


# 建立复合索引
Index('idx_gear_inspections_item', GearInspection.gear_item_id)
Index('idx_gear_inspections_date', GearInspection.inspection_date)


class GearReminder(Base):
    """裝備提醒"""
    __tablename__ = 'gear_reminders'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gear_item_id = Column(UUID(as_uuid=True), ForeignKey('gear_items.id', ondelete='CASCADE'), nullable=False)

    # reminder_type: inspection, maintenance, general
    reminder_type = Column(String(50), nullable=False)

    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    sent_at = Column(DateTime(timezone=True))

    # status: pending, sent, cancelled
    status = Column(String(20), nullable=False, default='pending')

    message = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<GearReminder(id={self.id}, gear_item_id={self.gear_item_id}, status={self.status})>"


# 建立复合索引用于查询待发送的提醒
Index('idx_gear_reminders_schedule', GearReminder.scheduled_at, GearReminder.status)
