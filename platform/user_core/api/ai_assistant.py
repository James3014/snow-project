"""
AI Assistant API Endpoints
AI 助手 API 端點
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from .auth import get_current_user_id
from ..services.ai_assistant_service import AIAssistantService
from ..services.tools.trip_tools import CreateMultipleTripsTool, GetMyTripsTool

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


# 初始化 AI 助手服務（單例）
_ai_assistant_service: AIAssistantService = None


def get_ai_assistant_service() -> AIAssistantService:
    """獲取 AI 助手服務實例"""
    global _ai_assistant_service

    if _ai_assistant_service is None:
        # 注入所有可用工具
        # TODO: 需要注入實際的 service 實例
        from ..services import trip_planning_service, resort_service

        tools = [
            CreateMultipleTripsTool(trip_planning_service, resort_service),
            GetMyTripsTool(trip_planning_service),
            # 可以繼續添加更多工具...
        ]

        _ai_assistant_service = AIAssistantService(tools)

    return _ai_assistant_service


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    service: AIAssistantService = Depends(get_ai_assistant_service)
):
    """
    AI 助手對話

    處理用戶的自然語言輸入，執行相應的操作

    範例輸入：
    - "幫我建立12月去二世谷和白馬的行程"
    - "查詢我的所有未來行程"
    - "今天在白馬滑了 Skyline 和 Happo-One"
    """
    try:
        # 轉換訊息格式
        messages = [msg.dict() for msg in request.messages]

        # 處理對話
        result = await service.chat(
            user_id=user_id,
            messages=messages,
            max_iterations=request.max_iterations
        )

        return ChatResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI 助手處理失敗：{str(e)}"
        )


@router.get("/tools")
async def list_tools(
    service: AIAssistantService = Depends(get_ai_assistant_service)
):
    """
    列出所有可用工具

    返回 AI 助手可以使用的所有工具及其描述
    """
    return {
        "tools": [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters,
            }
            for tool in service.tools.values()
        ]
    }


@router.get("/status")
async def get_status(
    service: AIAssistantService = Depends(get_ai_assistant_service)
):
    """
    獲取 AI 助手狀態

    返回當前使用的 AI 模型和配置資訊
    """
    from ..services.ai.config import get_ai_config

    config = get_ai_config()

    return {
        "provider": config.provider,
        "model": config.model,
        "temperature": config.temperature,
        "available_tools": len(service.tools),
    }
