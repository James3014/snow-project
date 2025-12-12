"""
Gear Service 適配器
"""
import sys
from pathlib import Path
from typing import List, Optional
from datetime import date

GEAR_SERVICE_ROOT = Path(__file__).resolve().parents[3] / "services" / "gear-service"
sys.path.insert(0, str(GEAR_SERVICE_ROOT))

from gear_service import create_gear_service, Gear, GearCategory, GearStatus, GearRole

class GearServiceAdapter:
    def __init__(self):
        self._gear_service = create_gear_service()
    
    async def create_gear(self, user_id: str, name: str, category: str, **kwargs) -> dict:
        gear = Gear(
            user_id=user_id,
            name=name,
            category=GearCategory(category),
            brand=kwargs.get("brand"),
            status=GearStatus(kwargs.get("status", "in_use")),
            role=GearRole(kwargs.get("role", "personal")),
            price=kwargs.get("price"),
            currency=kwargs.get("currency", "TWD"),
            notes=kwargs.get("notes")
        )
        
        created_gear = await self._gear_service.create_gear(gear)
        
        return {
            "id": created_gear.id,
            "user_id": created_gear.user_id,
            "name": created_gear.name,
            "brand": created_gear.brand,
            "category": created_gear.category.value,
            "status": created_gear.status.value,
            "role": created_gear.role.value,
            "price": created_gear.price,
            "currency": created_gear.currency,
            "notes": created_gear.notes,
            "created_at": created_gear.created_at.isoformat() if created_gear.created_at else None,
            "updated_at": created_gear.updated_at.isoformat() if created_gear.updated_at else None
        }
    
    async def get_user_gear(self, user_id: str, status: Optional[str] = None) -> List[dict]:
        gear_status = GearStatus(status) if status else None
        gear_list = await self._gear_service.get_user_gear(user_id, gear_status)
        
        return [
            {
                "id": gear.id,
                "user_id": gear.user_id,
                "name": gear.name,
                "brand": gear.brand,
                "category": gear.category.value,
                "status": gear.status.value,
                "role": gear.role.value,
                "price": gear.price,
                "currency": gear.currency,
                "notes": gear.notes,
                "created_at": gear.created_at.isoformat() if gear.created_at else None,
                "updated_at": gear.updated_at.isoformat() if gear.updated_at else None
            }
            for gear in gear_list
        ]
    
    async def delete_gear(self, gear_id: str, user_id: str) -> bool:
        return await self._gear_service.delete_gear(gear_id, user_id)

_gear_adapter = None

def get_gear_service() -> GearServiceAdapter:
    global _gear_adapter
    if _gear_adapter is None:
        _gear_adapter = GearServiceAdapter()
    return _gear_adapter
