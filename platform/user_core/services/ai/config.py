"""
AI Configuration
AI 模型配置管理
"""
import os
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class AIProviderType(str, Enum):
    """AI 提供商類型"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"


class AIConfig(BaseModel):
    """AI 配置"""
    provider: AIProviderType
    model: str
    api_key: str
    temperature: float = 0.7


def get_ai_config() -> AIConfig:
    """
    獲取 AI 配置（從環境變數）

    環境變數：
    - AI_PROVIDER: openai | anthropic | gemini
    - AI_MODEL: 模型名稱
    - OPENAI_API_KEY: OpenAI API Key
    - ANTHROPIC_API_KEY: Anthropic API Key
    - GOOGLE_API_KEY: Google API Key
    """
    provider = os.getenv("AI_PROVIDER", "anthropic").lower()

    # 根據提供商設置預設模型和 API Key
    if provider == "openai":
        model = os.getenv("AI_MODEL", "gpt-4o")
        api_key = os.getenv("OPENAI_API_KEY")
    elif provider == "anthropic":
        model = os.getenv("AI_MODEL", "claude-3-5-sonnet-20241022")
        api_key = os.getenv("ANTHROPIC_API_KEY")
    elif provider == "gemini":
        model = os.getenv("AI_MODEL", "gemini-2.0-flash-exp")
        api_key = os.getenv("GOOGLE_API_KEY")
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")

    if not api_key:
        raise ValueError(f"API key not found for provider: {provider}")

    return AIConfig(
        provider=AIProviderType(provider),
        model=model,
        api_key=api_key,
        temperature=float(os.getenv("AI_TEMPERATURE", "0.7"))
    )


def create_ai_provider(config: Optional[AIConfig] = None):
    """
    創建 AI Provider 實例

    Args:
        config: AI 配置（可選，預設從環境變數讀取）

    Returns:
        AIProvider 實例
    """
    if config is None:
        config = get_ai_config()

    if config.provider == AIProviderType.OPENAI:
        from .openai_adapter import OpenAIAdapter
        return OpenAIAdapter(config.api_key, config.model)
    elif config.provider == AIProviderType.ANTHROPIC:
        from .anthropic_adapter import AnthropicAdapter
        return AnthropicAdapter(config.api_key, config.model)
    elif config.provider == AIProviderType.GEMINI:
        from .gemini_adapter import GeminiAdapter
        return GeminiAdapter(config.api_key, config.model)
    else:
        raise ValueError(f"Unknown provider: {config.provider}")
