"""
Google Gemini Adapter
"""
import google.generativeai as genai
import json
from typing import List, Optional, Any
from .base import AIProvider, Message, AIResponse, ToolCall, ToolDefinition


class GeminiAdapter(AIProvider):
    """Google Gemini 適配器"""

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash-exp"):
        super().__init__(api_key, model)
        genai.configure(api_key=api_key)
        self.client = genai.GenerativeModel(model)

    async def chat(
        self,
        messages: List[Message],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.7,
    ) -> AIResponse:
        """發送聊天請求到 Gemini"""

        # 轉換訊息格式
        # Gemini 使用 parts 和 role
        gemini_messages = []
        system_instruction = None

        for msg in messages:
            if msg.role == "system":
                system_instruction = msg.content
            elif msg.role == "user":
                gemini_messages.append({
                    "role": "user",
                    "parts": [msg.content]
                })
            elif msg.role == "assistant":
                gemini_messages.append({
                    "role": "model",
                    "parts": [msg.content]
                })

        # 轉換工具定義
        gemini_tools = None
        if tools:
            gemini_tools = []
            for tool in tools:
                gemini_tools.append({
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.parameters,
                })

        # 創建配置
        generation_config = {
            "temperature": temperature,
            "max_output_tokens": 4096,
        }

        # 重新創建 model 以包含 system instruction
        if system_instruction:
            model = genai.GenerativeModel(
                self.model,
                system_instruction=system_instruction,
                tools=gemini_tools if gemini_tools else None,
                generation_config=generation_config,
            )
        else:
            model = genai.GenerativeModel(
                self.model,
                tools=gemini_tools if gemini_tools else None,
                generation_config=generation_config,
            )

        # 調用 Gemini API
        chat = model.start_chat(history=gemini_messages[:-1] if len(gemini_messages) > 1 else [])
        response = chat.send_message(gemini_messages[-1]["parts"][0] if gemini_messages else "")

        # 解析回應
        content = ""
        tool_calls = []

        # Gemini 的回應格式
        for part in response.parts:
            if hasattr(part, 'text'):
                content += part.text
            elif hasattr(part, 'function_call'):
                tool_calls.append(
                    ToolCall(
                        id=f"call_{len(tool_calls)}",
                        name=part.function_call.name,
                        arguments=dict(part.function_call.args),
                    )
                )

        return AIResponse(
            content=content,
            tool_calls=tool_calls if tool_calls else None,
            finish_reason="tool_calls" if tool_calls else "stop",
        )

    def format_tool_result(self, tool_call_id: str, result: Any) -> Message:
        """格式化工具執行結果"""
        # Gemini 使用 function_response
        return Message(
            role="user",
            content=str(result),
        )
