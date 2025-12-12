import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from fastapi import FastAPI, HTTPException
from social_service import SocialServiceInterface, Activity, Follow, create_social_service
from services.shared.config_service import get_config_service
from services.shared.service_discovery import get_service_registry, setup_service_discovery, cleanup_service_discovery
from typing import List
import uvicorn

# 獲取配置
config_service = get_config_service()
service_config = config_service.get_service_config("social-service")

app = FastAPI(
    title="Social Service", 
    version="1.0.0",
    description=f"獨立社交功能服務 - {service_config.environment.value}"
)
social_service: SocialServiceInterface = create_social_service()

@app.on_event("startup")
async def startup_event():
    """服務啟動時註冊到服務發現"""
    await setup_service_discovery()
    registry = get_service_registry()
    await registry.register_current_service(
        name="social-service",
        host=service_config.host,
        port=service_config.port,
        metadata={"version": "1.0.0", "type": "social"}
    )

@app.on_event("shutdown")
async def shutdown_event():
    """服務關閉時清理註冊"""
    await cleanup_service_discovery()

@app.post("/activities", response_model=Activity)
async def create_activity(activity: Activity):
    return await social_service.create_activity(activity)

@app.get("/users/{user_id}/feed", response_model=List[Activity])
async def get_user_feed(user_id: str, limit: int = 20):
    return await social_service.get_user_feed(user_id, limit)

@app.post("/follows", response_model=Follow)
async def follow_user(follow: Follow):
    try:
        return await social_service.follow_user(follow.follower_id, follow.following_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/follows")
async def unfollow_user(follower_id: str, following_id: str):
    success = await social_service.unfollow_user(follower_id, following_id)
    if not success:
        raise HTTPException(status_code=404, detail="Follow relationship not found")
    return {"success": True}

@app.get("/users/{user_id}/followers", response_model=List[Follow])
async def get_followers(user_id: str):
    return await social_service.get_followers(user_id)

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
