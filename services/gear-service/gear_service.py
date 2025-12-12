"""
T1.13: Gear Service 最小實作 (TDD Green Phase)
"""
import uuid
from datetime import datetime, date
from typing import List, Optional, Dict
from pydantic import BaseModel, field_validator
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
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        if v is not None and v < 0:
            raise ValueError('Price cannot be negative')
        return v

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

class InMemoryGearService(GearServiceInterface):
    def __init__(self):
        self.gear: Dict[str, Gear] = {}
    
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
        
        return sorted(user_gear, key=lambda x: x.created_at or datetime.min)
    
    async def update_gear(self, gear_id: str, gear: Gear) -> Gear:
        if gear_id not in self.gear:
            raise ValueError(f"Gear {gear_id} not found")
        
        original_gear = self.gear[gear_id]
        gear.id = gear_id
        gear.created_at = original_gear.created_at
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

def create_gear_service() -> GearServiceInterface:
    return InMemoryGearService()
