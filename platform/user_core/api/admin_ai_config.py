"""
AI Configuration Management API
管理員 AI 配置 API（簡化版）
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os

router = APIRouter(prefix="/admin/ai-config", tags=["Admin - AI Configuration"])


class AIConfigUpdate(BaseModel):
    """AI 配置更新"""
    provider: str  # openai | anthropic | gemini
    model: str
    api_key: str
    temperature: Optional[float] = 0.7


class AIConfigResponse(BaseModel):
    """AI 配置回應"""
    provider: str
    model: str
    api_key_preview: str
    temperature: float
    is_active: bool


@router.get("/current", response_model=AIConfigResponse)
async def get_current_ai_config():
    """
    獲取當前 AI 配置

    從環境變數讀取配置
    """
    provider = os.getenv("AI_PROVIDER", "not_configured")
    model = os.getenv("AI_MODEL", "not_configured")

    # 獲取 API Key 預覽
    api_key = ""
    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY", "")
    elif provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
    elif provider == "gemini":
        api_key = os.getenv("GOOGLE_API_KEY", "")

    api_key_preview = api_key[:8] + "..." if api_key else "not_set"

    return AIConfigResponse(
        provider=provider,
        model=model,
        api_key_preview=api_key_preview,
        temperature=float(os.getenv("AI_TEMPERATURE", "0.7")),
        is_active=bool(api_key),
    )


@router.post("/update")
async def update_ai_config(config: AIConfigUpdate):
    """
    更新 AI 配置

    注意：此端點僅用於測試。
    生產環境應通過環境變數配置。
    """
    raise HTTPException(
        status_code=501,
        detail="Configuration update via API is not implemented. Please set environment variables: AI_PROVIDER, AI_MODEL, and corresponding API key (OPENAI_API_KEY / ANTHROPIC_API_KEY / GOOGLE_API_KEY)"
    )


@router.post("/test")
async def test_ai_config(config: AIConfigUpdate):
    """
    測試 AI 配置是否有效

    嘗試連接到指定的 AI 提供商
    """
    try:
        if config.provider == "openai":
            import openai
            client = openai.OpenAI(api_key=config.api_key)
            response = client.chat.completions.create(
                model=config.model,
                messages=[{"role": "user", "content": "Hello, this is a test."}],
                max_tokens=10
            )
            test_response = response.choices[0].message.content or "OK"

        elif config.provider == "anthropic":
            import anthropic
            client = anthropic.Anthropic(api_key=config.api_key)
            response = client.messages.create(
                model=config.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "Hello, this is a test."}]
            )
            test_response = response.content[0].text if response.content else "OK"

        elif config.provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=config.api_key)
            model = genai.GenerativeModel(config.model)
            response = model.generate_content("Hello, this is a test.")
            test_response = response.text[:50] if hasattr(response, 'text') else "OK"

        else:
            raise ValueError(f"Unsupported provider: {config.provider}")

        return {
            "success": True,
            "message": "AI 配置測試成功！",
            "test_response": test_response,
            "provider": config.provider,
            "model": config.model,
        }

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Missing required package: {str(e)}. Please install: pip install {config.provider}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"AI 配置測試失敗：{str(e)}"
        )


@router.get("/providers")
async def list_available_providers():
    """列出所有可用的 AI 提供商和模型"""
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
