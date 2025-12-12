import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from fastapi import FastAPI, HTTPException
from calendar_service import CalendarServiceInterface, CalendarEvent, create_calendar_service
from services.shared.config_service import get_config_service
from services.shared.service_discovery import get_service_registry, setup_service_discovery, cleanup_service_discovery
from typing import List, Optional
from datetime import date
import uvicorn

# 獲取配置
config_service = get_config_service()
service_config = config_service.get_service_config("calendar-service")

app = FastAPI(
    title="Calendar Service", 
    version="1.0.0",
    description=f"獨立行事曆服務 - {service_config.environment.value}"
)
calendar_service: CalendarServiceInterface = create_calendar_service()

@app.on_event("startup")
async def startup_event():
    """服務啟動時註冊到服務發現"""
    await setup_service_discovery()
    registry = get_service_registry()
    await registry.register_current_service(
        name="calendar-service",
        host=service_config.host,
        port=service_config.port,
        metadata={"version": "1.0.0", "type": "calendar"}
    )

@app.on_event("shutdown")
async def shutdown_event():
    """服務關閉時清理註冊"""
    await cleanup_service_discovery()

@app.post("/events", response_model=CalendarEvent)
async def create_event(event: CalendarEvent):
    return await calendar_service.create_event(event)

@app.get("/users/{user_id}/events", response_model=List[CalendarEvent])
async def get_events(user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None):
    return await calendar_service.get_events(user_id, start_date, end_date)

@app.put("/events/{event_id}", response_model=CalendarEvent)
async def update_event(event_id: str, event: CalendarEvent):
    try:
        return await calendar_service.update_event(event_id, event)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.delete("/events/{event_id}")
async def delete_event(event_id: str, user_id: str):
    success = await calendar_service.delete_event(event_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
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
