# AI 助手整合指南

## 📋 概述

這個 AI 助手系統允許用戶通過自然語言快速執行行程管理、雪道紀錄等操作。系統支援切換不同的 AI 模型（OpenAI、Claude、Gemini）。

---

## 🏗️ 系統架構

```
用戶輸入（語音/文字）
    ↓
前端 AI 聊天組件
    ↓
後端 AI Assistant API
    ↓
AI Provider Adapter（可切換）
    ↓
Tool Executor（執行工具）
    ↓
現有業務邏輯 API
```

---

## ⚙️ 後端配置

### 1. 安裝依賴

```bash
cd platform/user_core
pip install anthropic openai google-generativeai
```

### 2. 環境變數配置

在 `.env` 文件中添加：

```bash
# AI 提供商選擇（openai | anthropic | gemini）
AI_PROVIDER=anthropic

# AI 模型名稱
AI_MODEL=claude-3-5-sonnet-20241022

# API Keys（根據選擇的提供商配置）
ANTHROPIC_API_KEY=sk-ant-xxx...
OPENAI_API_KEY=sk-xxx...
GOOGLE_API_KEY=xxx...

# 可選：溫度參數
AI_TEMPERATURE=0.7
```

### 3. 註冊 API 路由

在 `platform/user_core/api/main.py` 中：

```python
from .ai_assistant import router as ai_assistant_router

app.include_router(ai_assistant_router)
```

### 4. 注入服務依賴

在 `platform/user_core/api/ai_assistant.py` 中：

```python
# TODO: 修改這裡，注入實際的 service 實例
from ..services.trip_planning import trip_planning_service
from ..services.resort import resort_service
```

---

## 🎨 前端配置

### 1. 添加 AI 按鈕到主佈局

在 `src/shell/RootLayout.tsx` 中：

```tsx
import FloatingAIButton from '@/shared/components/FloatingAIButton';

export default function RootLayout() {
  return (
    <div>
      {/* ... 其他內容 */}

      {/* 添加浮動 AI 按鈕 */}
      <FloatingAIButton />
    </div>
  );
}
```

### 2. 確保 API 端點正確

在 `.env` 中確認：

```bash
VITE_USER_CORE_API=https://user-core.zeabur.app
```

---

## 🔧 切換 AI 模型

### 方法 1：環境變數（推薦）

直接修改環境變數：

```bash
# 切換到 OpenAI
AI_PROVIDER=openai
AI_MODEL=gpt-4o
OPENAI_API_KEY=sk-xxx...

# 切換到 Claude
AI_PROVIDER=anthropic
AI_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-xxx...

# 切換到 Gemini
AI_PROVIDER=gemini
AI_MODEL=gemini-2.0-flash-exp
GOOGLE_API_KEY=xxx...
```

### 方法 2：管理介面（未來開發）

可以在管理後台添加 AI 配置頁面，允許管理員動態切換模型。

---

## 🛠️ 添加新工具

### 1. 創建工具類

在 `platform/user_core/services/tools/` 中創建新工具：

```python
from .base import Tool, ToolResult

class RecordMultipleCoursesTool(Tool):
    """批次紀錄雪道工具"""

    @property
    def name(self) -> str:
        return "record_multiple_courses"

    @property
    def description(self) -> str:
        return "批次紀錄滑過的雪道"

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "resort": {"type": "string"},
                "courses": {"type": "array", "items": {"type": "string"}},
                # ...
            }
        }

    async def execute(self, user_id: str, **kwargs) -> ToolResult:
        # 實作邏輯
        pass
```

### 2. 註冊工具

在 `platform/user_core/api/ai_assistant.py` 中：

```python
from ..services.tools.course_tools import RecordMultipleCoursesTool

tools = [
    CreateMultipleTripsTool(...),
    GetMyTripsTool(...),
    RecordMultipleCoursesTool(...),  # 添加新工具
]
```

---

## 📱 使用範例

### 範例 1：批次創建行程

**用戶輸入**：
> "幫我規劃這個雪季的行程，12月去二世谷5天，1月去白馬3天"

**AI 執行流程**：
1. 理解用戶意圖
2. 調用 `create_multiple_trips` 工具
3. 解析雪場名稱（二世谷 → niseko，白馬 → hakuba）
4. 解析日期（12月 → 2024-12-01）
5. 創建行程
6. 返回確認訊息

**回應**：
> 成功創建 2 個行程：
> ✓ 二世谷 Niseko (2024-12-01 ~ 2024-12-05)
> ✓ 白馬 Hakuba (2025-01-10 ~ 2025-01-12)

### 範例 2：查詢行程

**用戶輸入**：
> "我下個月有什麼行程？"

**AI 執行流程**：
1. 理解「下個月」= 未來行程
2. 調用 `get_my_trips` 工具，參數：`time_range: "upcoming"`
3. 返回結果

---

## 🔍 監控與除錯

### 查看 AI 狀態

```bash
curl https://user-core.zeabur.app/ai-assistant/status
```

回應：
```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "temperature": 0.7,
  "available_tools": 2
}
```

### 查看可用工具

```bash
curl https://user-core.zeabur.app/ai-assistant/tools
```

### 日誌監控

AI 助手的所有工具執行都會紀錄在日誌中：

```bash
tail -f /var/log/user_core/ai_assistant.log
```

---

## 🚀 未來擴展

### 已規劃功能

1. **語音輸入**：整合 Web Speech API
2. **更多工具**：
   - 紀錄雪道
   - 查詢統計
   - 搜尋雪場
   - 推薦雪場
3. **上下文記憶**：保存對話歷史
4. **多語言支援**：英文、日文
5. **管理介面**：動態配置 AI 模型

---

## 📊 成本估算

### Claude (Anthropic)

- 模型：claude-3-5-sonnet-20241022
- 輸入：$3 / 1M tokens
- 輸出：$15 / 1M tokens
- 估算：每次對話約 2000 tokens → $0.03

### OpenAI

- 模型：gpt-4o
- 輸入：$2.5 / 1M tokens
- 輸出：$10 / 1M tokens
- 估算：每次對話約 2000 tokens → $0.025

### 建議

- 生產環境使用 Claude（更準確的工具調用）
- 測試環境可用 GPT-4o（成本稍低）

---

## 🐛 常見問題

### Q: 如何切換 AI 模型？

A: 修改環境變數 `AI_PROVIDER` 和對應的 API Key，重啟服務即可。

### Q: 工具執行失敗怎麼辦？

A: 檢查日誌，確認：
1. Service 依賴是否正確注入
2. 用戶是否有權限
3. 參數是否正確解析

### Q: 如何限制使用量？

A: 可以在 API 層添加 rate limiting 或用戶級別的配額控制。

---

## 📞 技術支援

如有問題，請查看：
- 後端日誌：`/var/log/user_core/ai_assistant.log`
- 前端控制台：開發者工具 Console
- API 文檔：`https://user-core.zeabur.app/docs`
