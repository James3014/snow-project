"""
T1.12: Gear Service 獨立測試 (TDD Red Phase)
"""
import pytest
import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel
from abc import ABC, abstractmethod
from enum import Enum

class GearCategory(str, Enum):
    SNOWBOARD = "snowboard"
    BINDINGS = "bindings"
    BOOTS = "boots"
    HELMET = "helmet"
    GOGGLES = "goggles"
    OTHER = "other"

class GearStatus(str, Enum):
    IN_USE = "in_use"
    FOR_SALE = "for_sale"
    SOLD = "sold"
    MAINTENANCE = "maintenance"

class GearRole(str, Enum):
    PERSONAL = "personal"
    TEACHING = "teaching"

class Gear(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    brand: Optional[str] = None
    category: GearCategory
    status: GearStatus = GearStatus.IN_USE
    role: GearRole = GearRole.PERSONAL
    purchase_date: Optional[date] = None
    price: Optional[float] = None
    currency: str = "TWD"
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class GearServiceInterface(ABC):
    @abstractmethod
    async def create_gear(self, gear: Gear) -> Gear:
        pass
    
    @abstractmethod
    async def get_user_gear(self, user_id: str, status: Optional[GearStatus] = None) -> List[Gear]:
        pass
    
    @abstractmethod
    async def update_gear(self, gear_id: str, gear: Gear) -> Gear:
        pass
    
    @abstractmethod
    async def delete_gear(self, gear_id: str, user_id: str) -> bool:
        pass

class MockGearService(GearServiceInterface):
    def __init__(self):
        self.gear = {}
    
    async def create_gear(self, gear: Gear) -> Gear:
        gear.id = str(uuid.uuid4())
        gear.created_at = datetime.now()
        gear.updated_at = datetime.now()
        self.gear[gear.id] = gear
        return gear
    
    async def get_user_gear(self, user_id: str, status: Optional[GearStatus] = None) -> List[Gear]:
        user_gear = [g for g in self.gear.values() if g.user_id == user_id]
        if status:
            user_gear = [g for g in user_gear if g.status == status]
        return user_gear
    
    async def update_gear(self, gear_id: str, gear: Gear) -> Gear:
        if gear_id not in self.gear:
            raise ValueError(f"Gear {gear_id} not found")
        gear.id = gear_id
        gear.updated_at = datetime.now()
        self.gear[gear_id] = gear
        return gear
    
    async def delete_gear(self, gear_id: str, user_id: str) -> bool:
        if gear_id not in self.gear:
            return False
        if self.gear[gear_id].user_id != user_id:
            return False
        del self.gear[gear_id]
        return True

@pytest.fixture
def gear_service():
    return MockGearService()

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
    async def test_get_gear_by_status(self, gear_service: GearServiceInterface):
        user_id = str(uuid.uuid4())
        
        gear1 = Gear(user_id=user_id, name="Board 1", category=GearCategory.SNOWBOARD, status=GearStatus.IN_USE)
        gear2 = Gear(user_id=user_id, name="Board 2", category=GearCategory.SNOWBOARD, status=GearStatus.FOR_SALE)
        
        await gear_service.create_gear(gear1)
        await gear_service.create_gear(gear2)
        
        in_use_gear = await gear_service.get_user_gear(user_id, GearStatus.IN_USE)
        for_sale_gear = await gear_service.get_user_gear(user_id, GearStatus.FOR_SALE)
        
        assert len(in_use_gear) == 1
        assert len(for_sale_gear) == 1
        assert in_use_gear[0].name == "Board 1"
        assert for_sale_gear[0].name == "Board 2"
    
    @pytest.mark.asyncio
    async def test_update_gear(self, gear_service: GearServiceInterface, sample_gear: Gear):
        created_gear = await gear_service.create_gear(sample_gear)
        
        updated_data = Gear(
            user_id=sample_gear.user_id,
            name="Updated Board",
            brand="Updated Brand",
            category=GearCategory.SNOWBOARD,
            status=GearStatus.FOR_SALE
        )
        
        updated_gear = await gear_service.update_gear(created_gear.id, updated_data)
        
        assert updated_gear.name == "Updated Board"
        assert updated_gear.brand == "Updated Brand"
        assert updated_gear.status == GearStatus.FOR_SALE
    
    @pytest.mark.asyncio
    async def test_delete_gear(self, gear_service: GearServiceInterface, sample_gear: Gear):
        created_gear = await gear_service.create_gear(sample_gear)
        
        deleted = await gear_service.delete_gear(created_gear.id, sample_gear.user_id)
        
        assert deleted is True
        
        gear_list = await gear_service.get_user_gear(sample_gear.user_id)
        assert len(gear_list) == 0
    
    @pytest.mark.asyncio
    async def test_user_isolation(self, gear_service: GearServiceInterface):
        user1_id = str(uuid.uuid4())
        user2_id = str(uuid.uuid4())
        
        gear1 = Gear(user_id=user1_id, name="User 1 Board", category=GearCategory.SNOWBOARD)
        gear2 = Gear(user_id=user2_id, name="User 2 Board", category=GearCategory.SNOWBOARD)
        
        await gear_service.create_gear(gear1)
        await gear_service.create_gear(gear2)
        
        user1_gear = await gear_service.get_user_gear(user1_id)
        user2_gear = await gear_service.get_user_gear(user2_id)
        
        assert len(user1_gear) == 1
        assert len(user2_gear) == 1
        assert user1_gear[0].name == "User 1 Board"
        assert user2_gear[0].name == "User 2 Board"

class TestGearBusinessLogic:
    @pytest.mark.asyncio
    async def test_price_validation(self, gear_service: GearServiceInterface):
        # 這個測試預期會失敗 - TDD Red 階段
        with pytest.raises(ValueError, match="Price cannot be negative"):
            Gear(
                user_id=str(uuid.uuid4()),
                name="Invalid Price Gear",
                category=GearCategory.SNOWBOARD,
                price=-100.0
            )

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
