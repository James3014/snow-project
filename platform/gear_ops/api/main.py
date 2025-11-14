"""
Gear Operations FastAPI Application

簡單直接的 API 应用，不過度設計
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.items import router as items_router
from api.inspections import router as inspections_router
from api.reminders import router as reminders_router
from api.marketplace import router as marketplace_router
from config import settings

app = FastAPI(
    title="Gear Operations API",
    description="裝備管理与維護系統",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生產環境應該限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "gear_ops"}

# Mount routers
app.include_router(items_router, prefix=settings.api_prefix)
app.include_router(inspections_router, prefix=settings.api_prefix)
app.include_router(reminders_router, prefix=settings.api_prefix)
app.include_router(marketplace_router, prefix=settings.api_prefix)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
