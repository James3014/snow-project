"""
AI Configuration Management API
管理員 AI 配置 API
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from .auth import require_admin
from ..services.ai.config import AIProviderType

router = APIRouter(prefix="/admin/ai-config", tags=["Admin - AI Configuration"])


class AIConfigUpdate(BaseModel):
    """AI 配置更新"""
    provider: AIProviderType
    model: str
    api_key: str
    temperature: Optional[float] = 0.7
    fallback_provider: Optional[AIProviderType] = None
    fallback_model: Optional[str] = None
    fallback_api_key: Optional[str] = None


class AIConfigResponse(BaseModel):
    """AI 配置回應（不包含完整 API Key）"""
    provider: str
    model: str
    api_key_preview: str  # 只顯示前幾位
    temperature: float
    is_active: bool
    fallback_provider: Optional[str] = None
    fallback_model: Optional[str] = None


@router.get("/current", response_model=AIConfigResponse)
async def get_current_ai_config(
    admin_user = Depends(require_admin)
):
    """
    獲取當前 AI 配置

    只有管理員可以查看
    """
    # TODO: 從資料庫讀取
    from ..services.ai.config import get_ai_config

    config = get_ai_config()

    return AIConfigResponse(
        provider=config.provider,
        model=config.model,
        api_key_preview=config.api_key[:8] + "..." if config.api_key else "",
        temperature=config.temperature,
        is_active=True,
    )


@router.post("/update")
async def update_ai_config(
    config: AIConfigUpdate,
    admin_user = Depends(require_admin)
):
    """
    更新 AI 配置

    只有管理員可以修改
    """
    try:
        # TODO: 保存到資料庫
        # 1. 加密 API Key
        # 2. 驗證配置是否有效（測試調用）
        # 3. 保存到資料庫
        # 4. 重新加載服務

        return {
            "message": "AI 配置已更新",
            "provider": config.provider,
            "model": config.model,
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"更新 AI 配置失敗：{str(e)}"
        )


@router.post("/test")
async def test_ai_config(
    config: AIConfigUpdate,
    admin_user = Depends(require_admin)
):
    """
    測試 AI 配置是否有效

    在保存前測試連接
    """
    try:
        # 創建臨時 provider 並測試
        from ..services.ai.config import create_ai_provider, AIConfig

        test_config = AIConfig(
            provider=config.provider,
            model=config.model,
            api_key=config.api_key,
            temperature=config.temperature,
        )

        provider = create_ai_provider(test_config)

        # 發送測試請求
        from ..services.ai.base import Message
        response = await provider.chat(
            messages=[
                Message(role="user", content="Hello, this is a test.")
            ]
        )

        return {
            "success": True,
            "message": "AI 配置測試成功",
            "test_response": response.content[:100] + "..." if len(response.content) > 100 else response.content
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"AI 配置測試失敗：{str(e)}"
        )


@router.get("/providers")
async def list_available_providers(
    admin_user = Depends(require_admin)
):
    """
    列出所有可用的 AI 提供商和模型
    """
    return {
        "providers": [
            {
                "id": "openai",
                "name": "OpenAI",
                "models": [
                    {"id": "gpt-4o", "name": "GPT-4 Optimized"},
                    {"id": "gpt-4o-mini", "name": "GPT-4 Optimized Mini"},
                    {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"},
                ],
                "pricing": {
                    "input": "$2.5 / 1M tokens",
                    "output": "$10 / 1M tokens"
                }
            },
            {
                "id": "anthropic",
                "name": "Anthropic Claude",
                "models": [
                    {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet"},
                    {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus"},
                    {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku"},
                ],
                "pricing": {
                    "input": "$3 / 1M tokens",
                    "output": "$15 / 1M tokens"
                }
            },
            {
                "id": "gemini",
                "name": "Google Gemini",
                "models": [
                    {"id": "gemini-2.0-flash-exp", "name": "Gemini 2.0 Flash (Experimental)"},
                    {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro"},
                    {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash"},
                ],
                "pricing": {
                    "input": "免費 (有配額限制)",
                    "output": "免費 (有配額限制)"
                }
            }
        ]
    }
