"""
Integration Tests for Gear Operations

测试3个核心流程：
1. 完整装备生命周期
2. 安全情境（unsafe装备）
3. 多用户隔离
"""
import pytest
from datetime import datetime, timedelta, date
from uuid import uuid4
from decimal import Decimal

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../platform/gear_ops')))

from models import GearItem, GearInspection, GearReminder, Base
from schemas import (
    GEAR_STATUS_ACTIVE, GEAR_STATUS_FOR_SALE,
    GEAR_ROLE_PERSONAL,
    INSPECTION_STATUS_GOOD, INSPECTION_STATUS_UNSAFE,
    REMINDER_STATUS_PENDING, REMINDER_STATUS_SENT,
    REMINDER_TYPE_INSPECTION
)
from services.db import engine, SessionLocal
from sqlalchemy import create_engine
from sqlalchemy.orm import Session


@pytest.fixture(scope="function")
def db_session():
    """为每个测试建立独立的資料库 session"""
    # 使用内存資料库进行测试
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(test_engine)

    TestSessionLocal = SessionLocal
    TestSessionLocal.configure(bind=test_engine)

    session = TestSessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
        Base.metadata.drop_all(test_engine)


class TestCompleteGearLifecycle:
    """测试1：完整装备生命周期"""

    def test_full_gear_lifecycle(self, db_session: Session):
        """
        流程：建立装备 → 检查 → 收到提醒 → 标记出售
        """
        user_id = uuid4()

        # Step 1: 建立装备
        gear_item = GearItem(
            user_id=user_id,
            name="Burton Custom 158",
            category="board",
            brand="Burton",
            purchase_date=date(2024, 1, 15),
            status=GEAR_STATUS_ACTIVE,
            role=GEAR_ROLE_PERSONAL
        )
        db_session.add(gear_item)
        db_session.commit()
        db_session.refresh(gear_item)

        assert gear_item.id is not None
        assert gear_item.status == GEAR_STATUS_ACTIVE

        # Step 2: 建立检查记录
        inspection = GearInspection(
            gear_item_id=gear_item.id,
            inspector_user_id=user_id,
            checklist={"edge": "good", "bindings": "good", "base": "good"},
            overall_status=INSPECTION_STATUS_GOOD,
            notes="Ready for the season",
            next_inspection_date=(datetime.now() + timedelta(days=90)).date()
        )
        db_session.add(inspection)
        db_session.commit()
        db_session.refresh(inspection)

        assert inspection.id is not None
        assert inspection.overall_status == INSPECTION_STATUS_GOOD
        assert inspection.next_inspection_date is not None

        # Step 3: 建立提醒
        reminder = GearReminder(
            gear_item_id=gear_item.id,
            reminder_type=REMINDER_TYPE_INSPECTION,
            scheduled_at=datetime.now() + timedelta(days=90),
            status=REMINDER_STATUS_PENDING,
            message="Time for your board inspection"
        )
        db_session.add(reminder)
        db_session.commit()
        db_session.refresh(reminder)

        assert reminder.id is not None
        assert reminder.status == REMINDER_STATUS_PENDING

        # Step 4: 模拟傳送提醒
        reminder.status = REMINDER_STATUS_SENT
        reminder.sent_at = datetime.now()
        db_session.commit()

        assert reminder.status == REMINDER_STATUS_SENT
        assert reminder.sent_at is not None

        # Step 5: 标记为出售
        gear_item.status = GEAR_STATUS_FOR_SALE
        gear_item.sale_price = Decimal("1500.00")
        gear_item.sale_currency = "TWD"
        db_session.commit()

        assert gear_item.status == GEAR_STATUS_FOR_SALE
        assert gear_item.sale_price == Decimal("1500.00")

        print("✅ Test 1 passed: Complete gear lifecycle")


class TestUnsafeGearScenario:
    """测试2：安全情境（unsafe装备）"""

    def test_unsafe_gear_no_reminder(self, db_session: Session):
        """
        流程：检查发现 unsafe → 不产生提醒 → 维修后重新检查
        """
        user_id = uuid4()

        # Step 1: 建立装备
        gear_item = GearItem(
            user_id=user_id,
            name="Old Bindings",
            category="binding",
            status=GEAR_STATUS_ACTIVE
        )
        db_session.add(gear_item)
        db_session.commit()
        db_session.refresh(gear_item)

        # Step 2: 建立 unsafe 检查记录
        inspection = GearInspection(
            gear_item_id=gear_item.id,
            inspector_user_id=user_id,
            checklist={"bindings": "broken", "screws": "loose"},
            overall_status=INSPECTION_STATUS_UNSAFE,
            notes="DO NOT USE - bindings broken",
            next_inspection_date=None  # unsafe 不設定下一次检查
        )
        db_session.add(inspection)
        db_session.commit()

        # 验证：unsafe 装备不应该有 next_inspection_date
        assert inspection.overall_status == INSPECTION_STATUS_UNSAFE
        assert inspection.next_inspection_date is None

        # Step 3: 模拟维修后，建立新的检查
        repair_inspection = GearInspection(
            gear_item_id=gear_item.id,
            inspector_user_id=user_id,
            checklist={"bindings": "good", "screws": "tight"},
            overall_status=INSPECTION_STATUS_GOOD,
            notes="Repaired and tested",
            next_inspection_date=(datetime.now() + timedelta(days=90)).date()
        )
        db_session.add(repair_inspection)
        db_session.commit()

        assert repair_inspection.overall_status == INSPECTION_STATUS_GOOD
        assert repair_inspection.next_inspection_date is not None

        print("✅ Test 2 passed: Unsafe gear scenario")


class TestMultiUserIsolation:
    """测试3：多用户隔离"""

    def test_user_cannot_access_others_gear(self, db_session: Session):
        """
        验证：用户A不能看到用户B的装备
        """
        user_a_id = uuid4()
        user_b_id = uuid4()

        # 用户A的装备
        gear_a = GearItem(
            user_id=user_a_id,
            name="User A's Board",
            status=GEAR_STATUS_ACTIVE
        )
        db_session.add(gear_a)

        # 用户B的装备
        gear_b = GearItem(
            user_id=user_b_id,
            name="User B's Board",
            status=GEAR_STATUS_ACTIVE
        )
        db_session.add(gear_b)

        db_session.commit()

        # 验证：用户A只能查詢到自己的装备
        user_a_items = db_session.query(GearItem).filter(
            GearItem.user_id == user_a_id
        ).all()
        assert len(user_a_items) == 1
        assert user_a_items[0].name == "User A's Board"

        # 验证：用户B只能查詢到自己的装备
        user_b_items = db_session.query(GearItem).filter(
            GearItem.user_id == user_b_id
        ).all()
        assert len(user_b_items) == 1
        assert user_b_items[0].name == "User B's Board"

        # 验证：用户A不能通过user_id查詢到用户B的装备
        cross_query = db_session.query(GearItem).filter(
            GearItem.id == gear_b.id,
            GearItem.user_id == user_a_id  # 错误的 user_id
        ).first()
        assert cross_query is None

        print("✅ Test 3 passed: Multi-user isolation")


class TestMarketplaceFlow:
    """额外测试：买卖流程"""

    def test_marketplace_search(self, db_session: Session):
        """测试搜索待售装备"""
        user_id = uuid4()

        # 建立待售装备
        for_sale_item = GearItem(
            user_id=user_id,
            name="Burton Custom For Sale",
            category="board",
            status=GEAR_STATUS_FOR_SALE,
            sale_price=Decimal("1500.00"),
            sale_currency="TWD"
        )
        db_session.add(for_sale_item)

        # 建立非待售装备
        not_for_sale = GearItem(
            user_id=user_id,
            name="My Personal Board",
            category="board",
            status=GEAR_STATUS_ACTIVE
        )
        db_session.add(not_for_sale)

        db_session.commit()

        # 搜索待售装备
        for_sale_items = db_session.query(GearItem).filter(
            GearItem.status == GEAR_STATUS_FOR_SALE
        ).all()

        assert len(for_sale_items) == 1
        assert for_sale_items[0].name == "Burton Custom For Sale"
        assert for_sale_items[0].sale_price == Decimal("1500.00")

        print("✅ Test 4 passed: Marketplace search")


# 运行测试
if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
