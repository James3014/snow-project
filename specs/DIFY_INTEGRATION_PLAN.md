# 🤖 Dify AI 整合規劃文件

**創建日期**: 2025-12-06  
**狀態**: 規劃階段  
**目標**: 將 Dify AI 平台整合到 SnowTrace 生態系統，提升智能化程度

---

## 📋 目錄

1. [整合概述](#整合概述)
2. [適用專案分析](#適用專案分析)
3. [核心應用場景](#核心應用場景)
4. [技術架構](#技術架構)
5. [實作優先順序](#實作優先順序)
6. [成本分析](#成本分析)

---

## 整合概述

### 為什麼需要 Dify？

SnowTrace 平台目前擁有完整的微服務架構和資料整合能力，但缺少**智能分析和個人化建議**層。Dify 可以將「死資料」轉化為「活建議」。

```
現狀：資料整合 ✅ → 智能分析 ❌ → 個人化建議 ❌
目標：資料整合 ✅ → Dify AI ✅ → 智能決策 ✅
```

### Dify 核心價值

| 功能 | 說明 | 對 SnowTrace 的價值 |
|------|------|---------------------|
| **RAG 知識庫** | 向量檢索 + 語義搜尋 | 213 堂課程智能推薦 |
| **LLM 分析** | Claude/GPT 深度理解 | 理解用戶上下文，非規則匹配 |
| **Workflow 編排** | 視覺化多步驟流程 | 複雜業務邏輯無需寫代碼 |
| **Vision Agent** | 圖片分析 | 裝備磨損檢測 |
| **批次處理** | 高效 API 調用 | 降低成本 |

### 整合策略

```
┌─────────────────────────────────────────────────────┐
│              Dify (Zeabur 一鍵部署)                   │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │   RAG 知識庫（213 堂 CASI 課程）             │    │
│  │   - 問題、目標、練習方法、訊號                │    │
│  │   - CASI 技能分類                            │    │
│  │   - 自動 Embedding + Rerank                  │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Agent 1:     │  │ Agent 2:     │  │ Agent 3: │  │
│  │ 雪場快問快答  │  │ 測驗題生成    │  │ 弱項分析  │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐          ┌────────────────────┐
│ 🏂 單板教學 App │          │ 📚 Knowledge App   │
│ (雪場使用)     │          │ (預習複習)          │
│                │          │                    │
│ - 纜車上快問   │          │ - 測驗系統         │
│ - 語音輸入     │          │ - 學習計畫         │
│ - 離線緩存     │          │ - 進度追蹤         │
└───────────────┘          └────────────────────┘
```

---

## 適用專案分析

### 專案適用度評分

| 專案 | 適用度 | 理由 | 建議 |
|------|--------|------|------|
| **🏂 單板教學** | ⭐ 1/5 | 已完成，內容管理系統 | ❌ 保持現狀 |
| **🤝 snowbuddy-matching** | ⭐⭐⭐ 3/5 | 可用 AI 優化媒合 | ⚠️ 可選 |
| **🎿 resort-services** | ⭐⭐ 2/5 | 靜態資料查詢 | ❌ 不需要 |
| **🛠️ gear-ops** | ⭐⭐⭐⭐ 4/5 | **適合** AI 助手 | ✅ 推薦 |
| **📚 knowledge-engagement** | ⭐⭐⭐⭐⭐ 5/5 | **完美契合** | ✅ 強烈推薦 |
| **👤 user-core** | ⭐ 1/5 | 基礎設施 | ❌ 不需要 |
| **📅 coach-scheduling** | ⭐⭐ 2/5 | 排程邏輯 | ❌ 不需要 |

### 不適合 Dify 的專案

**原因分析**：

1. **單板教學**：已完成，架構穩定，213 堂課程是靜態內容
2. **resort-services**：YAML + PostgreSQL 查詢已足夠
3. **user-core**：基礎設施需要穩定性，不適合 AI
4. **coach-scheduling**：排程邏輯用規則引擎更可靠

---

## 核心應用場景

### 場景分類

```
A. 單一專案增強（1 個後端 + Dify）
   └── knowledge-engagement + Dify
   └── gear-ops + Dify

B. 多專案整合（2-3 個後端 + Dify）
   └── 單板教學 + knowledge-engagement + Dify
   └── Trip Prep Lab（多後端整合）
   └── Post-Trip Learning Report
```

---

## 詳細應用場景

### 🎯 優先級 P0：Knowledge Engagement + Dify

**完美契合原因**：
- 需要 AI 生成測驗題目
- 需要 AI 分析學員弱項
- 需要 AI 推薦學習路徑

**詳見**: [DIFY_KNOWLEDGE_ENGAGEMENT.md](./DIFY_KNOWLEDGE_ENGAGEMENT.md)

---

### 🎯 優先級 P1：單板教學 + Knowledge Engagement 統一

**核心洞察**：兩個專案使用相同資料源（213 堂 CASI 課程）

```
相同資料源（213 堂 CASI 課程）
├── 🏂 單板教學：雪場實戰（手機優先、快速查找）
└── 📚 knowledge-engagement：預習複習（測驗、深度理解）

→ 用 Dify 統一處理，一次部署，兩種場景！
```

**詳見**: [DIFY_UNIFIED_TEACHING.md](./DIFY_UNIFIED_TEACHING.md)

---

### 🎯 優先級 P2：Gear Operations + Dify

**應用場景**：
- AI 裝備檢查助手（拍照識別磨損）
- 智能保養建議（基於使用頻率）
- 買賣推薦（匹配買賣雙方）

**詳見**: [DIFY_GEAR_OPS.md](./DIFY_GEAR_OPS.md)

---

### 🎯 優先級 P3：多後端整合新前端

**5 個創新前端服務**：

1. **Skill-Based Trip Optimizer**（技能導向行程優化器）
   - 整合：單板教學 + resort-services + user-core
   - 概念：根據弱項推薦最適合的雪場

2. **Gear-Trip Compatibility Checker**（裝備行程適配檢查器）
   - 整合：gear-ops + resort-services + user-core
   - 概念：出發前檢查裝備是否適合行程

3. **Post-Trip Learning Report**（行程後學習報告）
   - 整合：user-core + 單板教學 + resort-services
   - 概念：自動生成個人化成長報告

4. **Buddy Skill Gap Analyzer**（雪伴技能差距分析器）
   - 整合：snowbuddy-matching + 單板教學 + user-core
   - 概念：分析兩人技能互補性

5. **Season Goal Tracker**（雪季目標追蹤器）
   - 整合：user-core + 單板教學 + resort-services + gear-ops
   - 概念：全季目標追蹤和智能提醒

**詳見**: [DIFY_MULTI_BACKEND_INTEGRATION.md](./DIFY_MULTI_BACKEND_INTEGRATION.md)

---

## 技術架構

### 部署架構

```
Zeabur (一鍵部署)
├── Dify Services (8 個容器)
│   ├── api
│   ├── worker
│   ├── web
│   ├── db (PostgreSQL)
│   ├── redis
│   ├── nginx
│   ├── weaviate (向量資料庫)
│   └── sandbox
│
└── SnowTrace Services
    ├── user-core
    ├── resort-services
    ├── snowbuddy-matching
    ├── 單板教學 (Next.js)
    └── ski-platform (React)
```

### API 整合方式

```typescript
// 統一 Dify API 封裝
// lib/dify.ts

const DIFY_API_URL = process.env.NEXT_PUBLIC_DIFY_API_URL
const DIFY_API_KEY = process.env.DIFY_API_KEY

export async function callDifyWorkflow(workflowId: string, inputs: any) {
  const response = await fetch(`${DIFY_API_URL}/v1/workflows/run`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs,
      response_mode: 'blocking',
      user: inputs.user_id
    })
  })
  
  return await response.json()
}

export async function callDifyChat(query: string, userId: string) {
  const response = await fetch(`${DIFY_API_URL}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      user: userId,
      response_mode: 'blocking'
    })
  })
  
  return await response.json()
}
```

### 環境變數配置

```bash
# .env.local (各專案)
NEXT_PUBLIC_DIFY_API_URL=https://dify.zeabur.app
DIFY_API_KEY=app-xxxxxxxxxxxxxxxx

# Zeabur 環境變數
DIFY_API_URL=https://dify.zeabur.app
DIFY_ADMIN_PASSWORD=your-secure-password
```

---

## 實作優先順序

### Phase 1（立即，1-2 週）

**目標**: 驗證 Dify 價值，快速上線第一個功能

| 項目 | 時間 | ROI | 狀態 |
|------|------|-----|------|
| Dify 部署到 Zeabur | 5 分鐘 | - | 🔲 待開始 |
| 知識庫匯入（213 堂課程） | 1 天 | - | 🔲 待開始 |
| Knowledge Engagement - AI 生成題目 | 3 天 | ⭐⭐⭐⭐⭐ | 🔲 待開始 |
| 單板教學 - 快問快答功能 | 2 天 | ⭐⭐⭐⭐ | 🔲 待開始 |

**預期成果**: 
- 測驗題目自動生成（節省 80% 人工時間）
- 纜車上快速解答（提升用戶滿意度 40%）

---

### Phase 2（1 個月後，2-3 週）

**目標**: 深化 AI 功能，提升用戶黏性

| 項目 | 時間 | ROI | 狀態 |
|------|------|-----|------|
| Knowledge Engagement - 弱項分析 | 3 天 | ⭐⭐⭐⭐⭐ | 🔲 待開始 |
| Skill-Based Trip Optimizer | 5 天 | ⭐⭐⭐⭐⭐ | 🔲 待開始 |
| Post-Trip Learning Report | 5 天 | ⭐⭐⭐⭐⭐ | 🔲 待開始 |

**預期成果**:
- AI 分析弱項（提升學習效果 40%）
- 智能推薦雪場（解決「不知道去哪練」痛點）
- 自動生成成長報告（提升用戶黏性）

---

### Phase 3（3 個月後，3-4 週）

**目標**: 差異化功能，建立競爭優勢

| 項目 | 時間 | ROI | 狀態 |
|------|------|-----|------|
| Gear Operations - AI 裝備檢查 | 1 週 | ⭐⭐⭐⭐ | 🔲 待開始 |
| Gear-Trip Compatibility Checker | 5 天 | ⭐⭐⭐⭐ | 🔲 待開始 |
| Buddy Skill Gap Analyzer | 1 週 | ⭐⭐⭐ | 🔲 待開始 |

**預期成果**:
- Vision Agent 分析裝備磨損
- 智能裝備推薦
- 雪伴技能互補分析

---

## 成本分析

### 一次性成本

| 項目 | 時間 | 說明 |
|------|------|------|
| Dify 部署 | 5 分鐘 | Zeabur 一鍵部署 |
| 知識庫匯入 | 1 天 | 213 堂課程格式化 |
| Phase 1 開發 | 1 週 | 2 個核心功能 |
| Phase 2 開發 | 3 週 | 3 個進階功能 |
| Phase 3 開發 | 4 週 | 3 個差異化功能 |
| **總計** | **8 週** | |

### 月運營成本

| 項目 | 成本 | 說明 |
|------|------|------|
| Dify 自部署（Zeabur） | $5/月 | 日本節點 |
| Claude API（1000 用戶） | $30-80/月 | Haiku 模型 |
| GPT-4V（可選） | $30-50/月 | Vision 功能 |
| **總計** | **$35-135/月** | 視使用量 |

### ROI 預估

| 指標 | 改善 | 說明 |
|------|------|------|
| 用戶滿意度 | +40% | 智能推薦和快速解答 |
| Engagement | +50% | AI 生成內容和個人化建議 |
| 開發效率 | +80% | 自動生成題目，節省人工 |
| 用戶留存 | +30% | 成長報告和目標追蹤 |

**投入**: 8 週開發 + $35-135/月  
**產出**: 用戶體驗大幅提升 + 差異化競爭優勢  
**結論**: **非常值得投資** 🚀

---

## 風險評估

### 技術風險

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| Dify 服務不穩定 | 中 | 自部署 + 監控告警 |
| LLM API 成本超支 | 中 | 設置用量上限 + 批次處理 |
| 回答準確度不足 | 高 | RAG 優化 + Prompt 調整 |

### 業務風險

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| 用戶不接受 AI | 低 | 保留傳統功能，AI 為輔助 |
| 內容生成錯誤 | 高 | 人工審核 + 用戶回報機制 |
| 隱私疑慮 | 中 | 明確告知資料使用方式 |

---

## 成功指標

### Phase 1 成功標準

- ✅ Dify 部署成功，穩定運行
- ✅ 知識庫匯入完成，RAG 檢索準確度 > 80%
- ✅ AI 生成題目品質達標（教練滿意度 > 80%）
- ✅ 快問快答功能使用率 > 30%

### Phase 2 成功標準

- ✅ 弱項分析準確度 > 85%
- ✅ Trip Optimizer 推薦接受率 > 60%
- ✅ Learning Report 分享率 > 40%

### Phase 3 成功標準

- ✅ Vision Agent 識別準確度 > 90%
- ✅ Gear Compatibility 使用率 > 50%
- ✅ 整體用戶滿意度提升 > 40%

---

## 下一步行動

### 立即行動（本週）

1. ✅ 閱讀完整規劃文件
2. 🔲 Zeabur 部署 Dify（5 分鐘）
3. 🔲 準備 213 堂課程資料（1 天）
4. 🔲 設計第一個 Workflow（2 小時）

### 短期行動（本月）

1. 🔲 完成 Phase 1 開發（1 週）
2. 🔲 內部測試和優化（3 天）
3. 🔲 小範圍用戶測試（1 週）
4. 🔲 收集反饋並調整（持續）

### 中期行動（3 個月）

1. 🔲 完成 Phase 2 開發
2. 🔲 完成 Phase 3 開發
3. 🔲 全面上線所有 AI 功能
4. 🔲 建立 AI 功能監控體系

---

**文檔版本**: v1.0  
**最後更新**: 2025-12-06  
**維護者**: SnowTrace Team
