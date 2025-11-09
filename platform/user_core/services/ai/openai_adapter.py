"""
OpenAI Adapter
"""
import openai
import json
from typing import List, Optional, Any
from .base import AIProvider, Message, AIResponse, ToolCall, ToolDefinition


class OpenAIAdapter(AIProvider):
    """OpenAI 適配器"""

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        super().__init__(api_key, model)
        self.client = openai.OpenAI(api_key=api_key)

    async def chat(
        self,
        messages: List[Message],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.7,
    ) -> AIResponse:
        """發送聊天請求到 OpenAI"""

        # 轉換訊息格式
        openai_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

        # 轉換工具定義
        openai_tools = None
        if tools:
            openai_tools = [
                {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.parameters,
                    },
                }
                for tool in tools
            ]

        # 調用 OpenAI API
        response = self.client.chat.completions.create(
            model=self.model,
            messages=openai_messages,
            tools=openai_tools,
            temperature=temperature,
        )

        # 解析回應
        message = response.choices[0].message
        content = message.content or ""
        tool_calls = []

        if message.tool_calls:
            for tc in message.tool_calls:
                tool_calls.append(
                    ToolCall(
                        id=tc.id,
                        name=tc.function.name,
                        arguments=json.loads(tc.function.arguments),
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
            role="tool",
            content=str(result),
            tool_call_id=tool_call_id,
        )
