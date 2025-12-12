"""
T1.12-T1.13: Gear Service 測試 (使用真實實作)
"""
import pytest
import uuid
from datetime import datetime
import sys
from pathlib import Path

GEAR_SERVICE_ROOT = Path(__file__).resolve().parents[2] / "services" / "gear-service"
sys.path.insert(0, str(GEAR_SERVICE_ROOT))

from gear_service import Gear, GearServiceInterface, GearCategory, GearStatus, GearRole, create_gear_service

@pytest.fixture
def gear_service():
    return create_gear_service()

@pytest.fixture
def sample_gear():
    return Gear(
        user_id=str(uuid.uuid4()),
        name="Test Snowboard",
        brand="Burton",
        category=GearCategory.SNOWBOARD,
        status=GearStatus.IN_USE,
        role=GearRole.PERSONAL
    )

class TestGearServiceInterface:
    @pytest.mark.asyncio
    async def test_create_gear(self, gear_service: GearServiceInterface, sample_gear: Gear):
        created_gear = await gear_service.create_gear(sample_gear)
        
        assert created_gear.id is not None
        assert created_gear.name == sample_gear.name
        assert created_gear.brand == sample_gear.brand
        assert created_gear.category == sample_gear.category
        assert created_gear.created_at is not None
    
    @pytest.mark.asyncio
    async def test_get_user_gear(self, gear_service: GearServiceInterface, sample_gear: Gear):
        created_gear = await gear_service.create_gear(sample_gear)
        
        gear_list = await gear_service.get_user_gear(sample_gear.user_id)
        
        assert len(gear_list) == 1
        assert gear_list[0].id == created_gear.id
    
    @pytest.mark.asyncio
    async def test_price_validation(self, gear_service: GearServiceInterface):
        with pytest.raises(ValueError, match="Price cannot be negative"):
            Gear(
                user_id=str(uuid.uuid4()),
                name="Invalid Price Gear",
                category=GearCategory.SNOWBOARD,
                price=-100.0
            )

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
