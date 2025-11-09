"""
Anthropic Claude Adapter
"""
import anthropic
from typing import List, Optional, Any
from .base import AIProvider, Message, AIResponse, ToolCall, ToolDefinition


class AnthropicAdapter(AIProvider):
    """Anthropic Claude 適配器"""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        super().__init__(api_key, model)
        self.client = anthropic.Anthropic(api_key=api_key)

    async def chat(
        self,
        messages: List[Message],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.7,
    ) -> AIResponse:
        """發送聊天請求到 Claude"""

        # 轉換訊息格式
        claude_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
            if msg.role != "system"
        ]

        # 提取系統訊息
        system_message = next(
            (msg.content for msg in messages if msg.role == "system"),
            None
        )

        # 轉換工具定義
        claude_tools = None
        if tools:
            claude_tools = [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": tool.parameters,
                }
                for tool in tools
            ]

        # 調用 Claude API
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            temperature=temperature,
            system=system_message,
            messages=claude_messages,
            tools=claude_tools,
        )

        # 解析回應
        content = ""
        tool_calls = []

        for block in response.content:
            if block.type == "text":
                content += block.text
            elif block.type == "tool_use":
                tool_calls.append(
                    ToolCall(
                        id=block.id,
                        name=block.name,
                        arguments=block.input,
                    )
                )

        return AIResponse(
            content=content,
            tool_calls=tool_calls if tool_calls else None,
            finish_reason="tool_calls" if tool_calls else "stop",
        )

    def format_tool_result(self, tool_call_id: str, result: Any) -> Message:
        """格式化工具執行結果"""
        return Message(
            role="user",
            content=[
                {
                    "type": "tool_result",
                    "tool_use_id": tool_call_id,
                    "content": str(result),
                }
            ],
        )
