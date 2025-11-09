"""
AI Assistant Service
AI 助手服務主邏輯
"""
from typing import List, Dict, Any, Optional
from .ai.base import Message, ToolDefinition
from .ai.config import create_ai_provider
from .tools.base import Tool


class AIAssistantService:
    """AI 助手服務"""

    def __init__(self, tools: List[Tool]):
        """
        初始化 AI 助手服務

        Args:
            tools: 可用工具列表
        """
        self.ai_provider = create_ai_provider()
        self.tools = {tool.name: tool for tool in tools}
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        """構建系統提示詞"""
        return """你是 SkiDIY 平台的 AI 助手，專門幫助滑雪愛好者管理行程和記錄雪道。

你的主要職責：
1. 幫助用戶快速創建和管理滑雪行程
2. 記錄用戶滑過的雪道和體驗
3. 查詢用戶的滑雪進度和統計
4. 回答關於雪場和滑雪的問題

重要指南：
- 使用繁體中文與用戶交流
- 理解自然語言的日期表達（如「下週五」、「12月25日」）
- 識別中英文雪場名稱（如「二世谷」、「Niseko」）
- 當用戶描述不清楚時，主動詢問必要資訊
- 完成操作後提供清晰的確認訊息

你可以使用以下工具來幫助用戶：
""" + "\n".join([f"- {tool.name}: {tool.description}" for tool in self.tools.values()])

    async def chat(
        self,
        user_id: str,
        messages: List[Dict[str, str]],
        max_iterations: int = 5
    ) -> Dict[str, Any]:
        """
        處理對話

        Args:
            user_id: 用戶 ID
            messages: 對話歷史 [{"role": "user", "content": "..."}]
            max_iterations: 最大迭代次數（防止無限循環）

        Returns:
            AI 回應和執行結果
        """
        # 添加系統提示詞
        conversation = [
            Message(role="system", content=self.system_prompt)
        ] + [Message(**msg) for msg in messages]

        # 準備工具定義
        tool_definitions = [
            ToolDefinition(**tool.to_definition())
            for tool in self.tools.values()
        ]

        iterations = 0
        tool_results = []

        while iterations < max_iterations:
            iterations += 1

            # 調用 AI
            response = await self.ai_provider.chat(
                messages=conversation,
                tools=tool_definitions,
            )

            # 如果 AI 想使用工具
            if response.tool_calls:
                for tool_call in response.tool_calls:
                    # 執行工具
                    tool = self.tools.get(tool_call.name)
                    if tool:
                        try:
                            result = await tool.execute(
                                user_id=user_id,
                                **tool_call.arguments
                            )
                            tool_results.append({
                                "tool": tool_call.name,
                                "arguments": tool_call.arguments,
                                "result": result.dict()
                            })

                            # 將工具結果加入對話
                            tool_result_msg = self.ai_provider.format_tool_result(
                                tool_call.id,
                                result.message
                            )
                            conversation.append(tool_result_msg)

                        except Exception as e:
                            error_msg = f"執行工具 {tool_call.name} 失敗：{str(e)}"
                            tool_results.append({
                                "tool": tool_call.name,
                                "arguments": tool_call.arguments,
                                "result": {"success": False, "message": error_msg}
                            })
                            conversation.append(
                                Message(role="user", content=error_msg)
                            )

                # 繼續對話，讓 AI 總結結果
                continue

            # 沒有工具調用，對話結束
            return {
                "message": response.content,
                "tool_results": tool_results,
                "finish_reason": response.finish_reason,
            }

        # 超過最大迭代次數
        return {
            "message": "抱歉，處理您的請求時遇到問題，請重新描述您的需求。",
            "tool_results": tool_results,
            "finish_reason": "max_iterations",
        }
