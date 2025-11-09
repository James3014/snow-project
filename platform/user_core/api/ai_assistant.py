"""
AI Assistant API Endpoints
AI 助手 API 端點（簡化版 - 避免部署問題）
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import os

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])


class ChatMessage(BaseModel):
    """聊天訊息"""
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    """聊天請求"""
    messages: List[ChatMessage]
    max_iterations: int = 5


class ChatResponse(BaseModel):
    """聊天回應"""
    message: str
    tool_results: List[Dict[str, Any]]
    finish_reason: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI 助手對話（需要配置）

    需要在環境變數中配置：
    - AI_PROVIDER: openai | anthropic | gemini
    - 對應的 API Key
    """
    ai_provider = os.getenv("AI_PROVIDER")

    if not ai_provider:
        raise HTTPException(
            status_code=503,
            detail="AI Assistant not configured. Please set AI_PROVIDER and API key in environment variables or admin panel."
        )

    # Full implementation requires AI services to be properly initialized
    # This is a placeholder that should be replaced with actual implementation
    raise HTTPException(
        status_code=501,
        detail=f"AI Assistant ({ai_provider}) is configured but chat endpoint needs full implementation. Use /admin/ai-config to test configuration."
    )


@router.get("/tools")
async def list_tools():
    """列出所有可用工具"""
    return {
        "tools": [
            {
                "name": "create_multiple_trips",
                "description": "批次創建滑雪行程",
                "status": "available"
            },
            {
                "name": "get_my_trips",
                "description": "查詢用戶的行程列表",
                "status": "available"
            },
            {
                "name": "record_multiple_courses",
                "description": "批次記錄雪道訪問",
                "status": "planned"
            },
        ]
    }


@router.get("/status")
async def get_status():
    """獲取 AI 助手狀態"""
    ai_provider = os.getenv("AI_PROVIDER", "not_configured")
    ai_model = os.getenv("AI_MODEL", "not_configured")

    # 檢查對應的 API Key 是否配置
    api_key_configured = False
    if ai_provider == "openai":
        api_key_configured = bool(os.getenv("OPENAI_API_KEY"))
    elif ai_provider == "anthropic":
        api_key_configured = bool(os.getenv("ANTHROPIC_API_KEY"))
    elif ai_provider == "gemini":
        api_key_configured = bool(os.getenv("GOOGLE_API_KEY"))

    return {
        "provider": ai_provider,
        "model": ai_model,
        "temperature": float(os.getenv("AI_TEMPERATURE", "0.7")),
        "available_tools": 3,
        "configured": ai_provider != "not_configured" and api_key_configured,
        "api_key_set": api_key_configured,
        "status": "ready" if (ai_provider != "not_configured" and api_key_configured) else "not_configured",
        "message": "AI Assistant is ready to use" if (ai_provider != "not_configured" and api_key_configured) else "Please configure AI provider in admin panel at /admin/ai-config"
    }
