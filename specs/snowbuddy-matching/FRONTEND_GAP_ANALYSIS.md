# Snowbuddy 前後端功能缺口分析

## 現狀總結

### ✅ 後端已實作（snowbuddy-matching）

#### 1. 智慧媒合 API
**Endpoint**: `POST /matching/searches`

**功能**:
- 基於用戶偏好進行智慧媒合
- 計算配對分數（技能、地點、時間、角色、知識）
- 智慧候選人過濾
- 後台異步執行

**請求範例**:
```json
{
  "preferred_resorts": ["niseko", "hakuba"],
  "date_range": {
    "start": "2025-01-15",
    "end": "2025-01-20"
  },
  "skill_level_range": [5, 8],
  "preferred_role": "buddy"
}
```

**回應**:
```json
{
  "search_id": "uuid-123"
}
```

#### 2. 查詢媒合結果
**Endpoint**: `GET /matching/searches/{search_id}`

**回應範例**:
```json
{
  "status": "completed",
  "matches": [
    {
      "user_id": "user-456",
      "score": 0.85,
      "breakdown": {
        "skill_score": 0.9,
        "location_score": 1.0,
        "time_score": 0.8,
        "role_score": 1.0,
        "knowledge_score": 0.7
      }
    }
  ]
}
```

#### 3. 媒合請求管理
**Endpoints**:
- `POST /requests` - 發送媒合請求
- `PUT /requests/{request_id}` - 接受/拒絕請求

### ❌ 前端缺少（ski-platform）

#### 1. 沒有 snowbuddyApi.ts
**問題**: 前端沒有調用 snowbuddy-matching 服務的 API 層

**需要創建**:
```typescript
// src/shared/api/snowbuddyApi.ts
export const snowbuddyApi = {
  // 發起智慧媒合搜尋
  startSearch: async (preferences: MatchingPreference) => {
    const response = await fetch(`${SNOWBUDDY_API_URL}/matching/searches`, {
      method: 'POST',
      body: JSON.stringify(preferences)
    });
    return response.json(); // { search_id }
  },
  
  // 查詢媒合結果
  getSearchResults: async (searchId: string) => {
    const response = await fetch(`${SNOWBUDDY_API_URL}/matching/searches/${searchId}`);
    return response.json(); // { status, matches }
  },
  
  // 發送媒合請求
  sendMatchRequest: async (targetUserId: string) => {
    const response = await fetch(`${SNOWBUDDY_API_URL}/requests`, {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId })
    });
    return response.json();
  },
  
  // 回應媒合請求
  respondToRequest: async (requestId: string, action: 'accept' | 'decline') => {
    const response = await fetch(`${SNOWBUDDY_API_URL}/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ action })
    });
    return response.json();
  }
};
```

#### 2. 沒有智慧媒合 UI
**問題**: SnowbuddyBoard 只顯示公開行程列表，沒有基於偏好的智慧媒合功能

**目前實作**:
```typescript
// SnowbuddyBoard.tsx
const publicTrips = await tripPlanningApi.getPublicTrips(); // ❌ 只顯示所有公開行程
```

**應該實作**:
```typescript
// 智慧媒合流程
1. 用戶設定偏好（雪場、日期、技能範圍）
2. 調用 snowbuddyApi.startSearch(preferences)
3. 輪詢 snowbuddyApi.getSearchResults(searchId)
4. 顯示配對分數最高的用戶/行程
```

**需要的 UI 組件**:
- `MatchingPreferenceForm` - 偏好設定表單
- `MatchingResultsList` - 媒合結果列表（顯示配對分數）
- `MatchScoreBreakdown` - 分數細節（技能、地點、時間等）

#### 3. 沒有媒合請求管理
**問題**: 無法發送/管理媒合請求

**需要的功能**:
- 向媒合結果中的用戶發送請求
- 查看收到的媒合請求
- 接受/拒絕請求
- 請求狀態通知

**需要的 UI 組件**:
- `MatchRequestButton` - 發送請求按鈕
- `MatchRequestsList` - 請求列表（收到的/發出的）
- `MatchRequestCard` - 請求卡片（顯示對方資訊、接受/拒絕按鈕）

## 功能對比表

| 功能 | 後端 (snowbuddy-matching) | 前端 (ski-platform) | 狀態 |
|------|---------------------------|---------------------|------|
| 智慧媒合搜尋 | ✅ POST /matching/searches | ❌ 無 API 調用 | 缺口 |
| 查詢媒合結果 | ✅ GET /matching/searches/{id} | ❌ 無 API 調用 | 缺口 |
| 配對分數計算 | ✅ 5 維度評分 | ❌ 無顯示 | 缺口 |
| 發送媒合請求 | ✅ POST /requests | ❌ 無 API 調用 | 缺口 |
| 回應媒合請求 | ✅ PUT /requests/{id} | ❌ 無 API 調用 | 缺口 |
| 公開行程列表 | ✅ 從 trip-planning | ✅ 已實作 | 完成 |
| 申請加入行程 | ✅ trip-planning API | ✅ 已實作 | 完成 |

## 架構問題

### 目前架構
```
前端 SnowbuddyBoard
  ↓
只調用 trip-planning API
  ↓
顯示所有公開行程（無智慧排序）
```

### 應有架構
```
前端 SnowbuddyBoard
  ↓
1. 用戶設定偏好
  ↓
2. 調用 snowbuddy-matching API
  ↓
3. 獲取智慧媒合結果（含配對分數）
  ↓
4. 顯示最匹配的用戶/行程
  ↓
5. 發送媒合請求
```

## 為什麼會有這個缺口？

### 可能原因
1. **開發順序問題**: 後端先完成，前端還沒跟上
2. **API 文檔不足**: 前端不知道有這些 API
3. **需求變更**: 原本只要公開行程列表，後來才加入智慧媒合
4. **服務隔離**: snowbuddy-matching 是獨立服務，前端可能不知道它的存在

### 影響
- ❌ 用戶無法使用智慧媒合功能
- ❌ 配對分數計算邏輯無用武之地
- ❌ CASI 技能分析的結果沒有被利用
- ❌ 用戶體驗差：需要手動瀏覽所有公開行程

## 建議實作順序

### Phase 1: API 層（1-2 小時）
1. 創建 `src/shared/api/snowbuddyApi.ts`
2. 實作 4 個 API 方法
3. 添加 TypeScript 類型定義

### Phase 2: 智慧媒合 UI（3-4 小時）
1. 創建 `MatchingPreferenceForm` 組件
2. 修改 `SnowbuddyBoard` 添加媒合搜尋功能
3. 創建 `MatchingResultsList` 顯示結果
4. 添加配對分數顯示

### Phase 3: 請求管理 UI（2-3 小時）
1. 創建 `MatchRequestButton` 組件
2. 創建 `MatchRequestsList` 頁面
3. 添加請求通知功能

### Phase 4: 整合測試（1-2 小時）
1. 端到端測試智慧媒合流程
2. 驗證配對分數計算
3. 測試請求發送/接受流程

**總預估時間**: 7-11 小時

## 相關文件

- [Snowbuddy Matching 架構](./ARCHITECTURE.md)
- [Snowbuddy Matching 功能](./FEATURES.md)
- [CASI 技能同步](../user-core/CASI_SKILL_SYNC.md)
- [前端 SnowbuddyBoard](../../platform/frontend/ski-platform/src/features/snowbuddy/pages/SnowbuddyBoard.tsx)

---

**創建時間**: 2025-12-02  
**狀態**: 待實作  
**優先級**: High  
**影響範圍**: 用戶體驗、智慧媒合功能
