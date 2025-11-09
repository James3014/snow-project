"""
AI Provider Base Class
所有 AI 提供商的抽象基類
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class Message(BaseModel):
    """對話訊息"""
    role: str  # "user" | "assistant" | "system"
    content: str


class ToolCall(BaseModel):
    """工具調用"""
    id: str
    name: str
    arguments: Dict[str, Any]


class AIResponse(BaseModel):
    """AI 回應"""
    content: str
    tool_calls: Optional[List[ToolCall]] = None
    finish_reason: str  # "stop" | "tool_calls"


class ToolDefinition(BaseModel):
    """工具定義"""
    name: str
    description: str
    parameters: Dict[str, Any]


class AIProvider(ABC):
    """AI 提供商抽象基類"""

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    @abstractmethod
    async def chat(
        self,
        messages: List[Message],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.7,
    ) -> AIResponse:
        """
        發送聊天請求

        Args:
            messages: 對話歷史
            tools: 可用工具列表
            temperature: 溫度參數

        Returns:
            AI 回應
        """
        pass

    @abstractmethod
    def format_tool_result(self, tool_call_id: str, result: Any) -> Message:
        """
        格式化工具執行結果為訊息

        Args:
            tool_call_id: 工具調用 ID
            result: 工具執行結果

        Returns:
            格式化後的訊息
        """
        pass
