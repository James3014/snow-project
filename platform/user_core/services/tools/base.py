"""
Tool Base Class
工具抽象基類
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
from pydantic import BaseModel


class ToolResult(BaseModel):
    """工具執行結果"""
    success: bool
    message: str
    data: Any = None


class Tool(ABC):
    """工具抽象基類"""

    @property
    @abstractmethod
    def name(self) -> str:
        """工具名稱"""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """工具描述"""
        pass

    @property
    @abstractmethod
    def parameters(self) -> Dict[str, Any]:
        """工具參數 schema (JSON Schema 格式)"""
        pass

    @abstractmethod
    async def execute(self, user_id: str, **kwargs) -> ToolResult:
        """
        執行工具

        Args:
            user_id: 用戶 ID
            **kwargs: 工具參數

        Returns:
            執行結果
        """
        pass

    def to_definition(self) -> Dict[str, Any]:
        """轉換為工具定義"""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
        }
