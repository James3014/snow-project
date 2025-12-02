"""
Unit tests for Gear Operations models and schemas

测试資料结构的完整性和约束
"""
import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from uuid import uuid4
from pydantic import ValidationError

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../platform/gear_ops')))

from models import GearItem, GearInspection, GearReminder
from schemas import (
    GearItemCreate, GearItemUpdate, GearItemRead,
    GearInspectionCreate, GearInspectionRead,
    GearReminderCreate, GearReminderRead,
    GEAR_STATUS_ACTIVE, GEAR_STATUS_FOR_SALE,
    GEAR_ROLE_PERSONAL, GEAR_ROLE_TEACHING,
    INSPECTION_STATUS_GOOD, INSPECTION_STATUS_UNSAFE,
    REMINDER_TYPE_INSPECTION, REMINDER_STATUS_PENDING
)


class TestGearItemSchemas:
    """测试 GearItem 相关 schemas"""

    def test_gear_item_create_valid(self):
        """测试建立装备的有效資料"""
        data = {
            'name': 'Burton Custom 158',
            'category': 'board',
            'brand': 'Burton',
            'purchase_date': date(2024, 1, 15),
            'role': GEAR_ROLE_PERSONAL
        }
        item = GearItemCreate(**data)
        assert item.name == 'Burton Custom 158'
        assert item.category == 'board'
        assert item.role == GEAR_ROLE_PERSONAL

    def test_gear_item_create_minimal(self):
        """测试只提供必填字段"""
        data = {'name': 'My Snowboard'}
        item = GearItemCreate(**data)
        assert item.name == 'My Snowboard'
        assert item.role == GEAR_ROLE_PERSONAL  # 預設值

    def test_gear_item_create_invalid_role(self):
        """测试无效的 role"""
        data = {'name': 'Test', 'role': 'invalid'}
        with pytest.raises(ValidationError) as exc_info:
            GearItemCreate(**data)
        assert 'role must be' in str(exc_info.value)

    def test_gear_item_update_status(self):
        """测试更新装备状态"""
        data = {'status': GEAR_STATUS_FOR_SALE, 'sale_price': Decimal('1500.00')}
        update = GearItemUpdate(**data)
        assert update.status == GEAR_STATUS_FOR_SALE
        assert update.sale_price == Decimal('1500.00')

    def test_gear_item_update_invalid_status(self):
        """测试无效的 status"""
        data = {'status': 'invalid_status'}
        with pytest.raises(ValidationError) as exc_info:
            GearItemUpdate(**data)
        assert 'status must be' in str(exc_info.value)


class TestGearInspectionSchemas:
    """测试 GearInspection 相关 schemas"""

    def test_inspection_create_valid(self):
        """测试建立检查记录"""
        data = {
            'checklist': {'edge': 'good', 'bindings': 'worn', 'base': 'scratched'},
            'overall_status': INSPECTION_STATUS_GOOD,
            'notes': 'Ready for the season'
        }
        inspection = GearInspectionCreate(**data)
        assert inspection.checklist['edge'] == 'good'
        assert inspection.overall_status == INSPECTION_STATUS_GOOD

    def test_inspection_create_unsafe(self):
        """测试建立不安全装备的检查"""
        data = {
            'checklist': {'edge': 'damaged', 'bindings': 'broken'},
            'overall_status': INSPECTION_STATUS_UNSAFE,
            'notes': 'DO NOT USE - bindings broken'
        }
        inspection = GearInspectionCreate(**data)
        assert inspection.overall_status == INSPECTION_STATUS_UNSAFE

    def test_inspection_create_invalid_status(self):
        """测试无效的 overall_status"""
        data = {
            'checklist': {'edge': 'good'},
            'overall_status': 'invalid'
        }
        with pytest.raises(ValidationError) as exc_info:
            GearInspectionCreate(**data)
        assert 'overall_status must be' in str(exc_info.value)

    def test_inspection_checklist_flexible(self):
        """测试 checklist 的灵活性（可以有任意字段）"""
        data = {
            'checklist': {
                'edge': 'good',
                'bindings': 'worn',
                'custom_field': 'custom_value',
                'nested': {'level': 2}
            },
            'overall_status': INSPECTION_STATUS_GOOD
        }
        inspection = GearInspectionCreate(**data)
        assert inspection.checklist['custom_field'] == 'custom_value'
        assert inspection.checklist['nested']['level'] == 2


class TestGearReminderSchemas:
    """测试 GearReminder 相关 schemas"""

    def test_reminder_create_valid(self):
        """测试建立提醒"""
        gear_id = uuid4()
        scheduled = datetime.now() + timedelta(days=7)
        data = {
            'gear_item_id': gear_id,
            'reminder_type': REMINDER_TYPE_INSPECTION,
            'scheduled_at': scheduled,
            'message': 'Time for your board inspection'
        }
        reminder = GearReminderCreate(**data)
        assert reminder.gear_item_id == gear_id
        assert reminder.reminder_type == REMINDER_TYPE_INSPECTION

    def test_reminder_create_invalid_type(self):
        """测试无效的 reminder_type"""
        data = {
            'gear_item_id': uuid4(),
            'reminder_type': 'invalid',
            'scheduled_at': datetime.now()
        }
        with pytest.raises(ValidationError) as exc_info:
            GearReminderCreate(**data)
        assert 'reminder_type must be' in str(exc_info.value)


class TestModelsBasicProperties:
    """测试 ORM 模型的基本属性"""

    def test_gear_item_repr(self):
        """测试 GearItem 的 __repr__"""
        item = GearItem(
            id=uuid4(),
            user_id=uuid4(),
            name='Test Board',
            status=GEAR_STATUS_ACTIVE
        )
        repr_str = repr(item)
        assert 'GearItem' in repr_str
        assert 'Test Board' in repr_str

    def test_gear_inspection_repr(self):
        """测试 GearInspection 的 __repr__"""
        inspection = GearInspection(
            id=uuid4(),
            gear_item_id=uuid4(),
            inspector_user_id=uuid4(),
            checklist={'edge': 'good'},
            overall_status=INSPECTION_STATUS_GOOD
        )
        repr_str = repr(inspection)
        assert 'GearInspection' in repr_str
        assert INSPECTION_STATUS_GOOD in repr_str

    def test_gear_reminder_repr(self):
        """测试 GearReminder 的 __repr__"""
        reminder = GearReminder(
            id=uuid4(),
            gear_item_id=uuid4(),
            reminder_type=REMINDER_TYPE_INSPECTION,
            scheduled_at=datetime.now(),
            status=REMINDER_STATUS_PENDING
        )
        repr_str = repr(reminder)
        assert 'GearReminder' in repr_str
        assert REMINDER_STATUS_PENDING in repr_str


class TestEnumConstants:
    """测试枚举常量的正确性"""

    def test_gear_status_constants(self):
        """测试装备状态常量"""
        assert GEAR_STATUS_ACTIVE == 'active'
        assert GEAR_STATUS_FOR_SALE == 'for_sale'

    def test_inspection_status_constants(self):
        """测试检查状态常量"""
        assert INSPECTION_STATUS_GOOD == 'good'
        assert INSPECTION_STATUS_UNSAFE == 'unsafe'

    def test_reminder_type_constants(self):
        """测试提醒类型常量"""
        assert REMINDER_TYPE_INSPECTION == 'inspection'


# 运行测试
if __name__ == '__main__':
    pytest.main([__file__, '-v'])
