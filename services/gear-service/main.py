import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from fastapi import FastAPI, HTTPException
from gear_service import GearServiceInterface, Gear, GearStatus, create_gear_service
from services.shared.config_service import get_config_service
from services.shared.service_discovery import get_service_registry, setup_service_discovery, cleanup_service_discovery
from typing import List, Optional
import uvicorn

# 獲取配置
config_service = get_config_service()
service_config = config_service.get_service_config("gear-service")

app = FastAPI(
    title="Gear Service", 
    version="1.0.0",
    description=f"獨立裝備管理服務 - {service_config.environment.value}"
)
gear_service: GearServiceInterface = create_gear_service()

@app.on_event("startup")
async def startup_event():
    """服務啟動時註冊到服務發現"""
    await setup_service_discovery()
    registry = get_service_registry()
    await registry.register_current_service(
        name="gear-service",
        host=service_config.host,
        port=service_config.port,
        metadata={"version": "1.0.0", "type": "gear"}
    )

@app.on_event("shutdown")
async def shutdown_event():
    """服務關閉時清理註冊"""
    await cleanup_service_discovery()

@app.post("/gear", response_model=Gear)
async def create_gear(gear: Gear):
    return await gear_service.create_gear(gear)

@app.get("/users/{user_id}/gear", response_model=List[Gear])
async def get_user_gear(user_id: str, status: Optional[GearStatus] = None):
    return await gear_service.get_user_gear(user_id, status)

@app.put("/gear/{gear_id}", response_model=Gear)
async def update_gear(gear_id: str, gear: Gear):
    try:
        return await gear_service.update_gear(gear_id, gear)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.delete("/gear/{gear_id}")
async def delete_gear(gear_id: str, user_id: str):
    success = await gear_service.delete_gear(gear_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Gear not found")
    return {"success": True}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": service_config.name,
        "environment": service_config.environment.value,
        "dependencies": service_config.dependencies
    }

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=service_config.port,
        log_level="info"
    )
