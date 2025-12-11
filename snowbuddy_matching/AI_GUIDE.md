# Snowbuddy Matching - AI 導讀

## 專案概述
智慧雪伴媒合引擎，基於多維度算法匹配滑雪夥伴，支援 buddy/student/coach 角色媒合。

## 核心功能
- **智慧媒合**: 5 維度評分算法 (技能 30% + 地點 25% + 時間 20% + 角色 15% + 知識 10%)
- **Trip 參與者 Calendar 同步**: 加入 Trip 自動建立 Calendar 事件 ✅
- **候選人過濾**: 技能等級、地點偏好、開放狀態
- **媒合生命週期**: 請求 → 通知 → 接受/拒絕 → 確認
- **知識整合**: 與 knowledge-engagement 服務整合

## 關鍵檔案
```
app/
├── main.py                     # 媒合流程主邏輯
├── routers/
│   ├── search_router.py       # 搜尋 API
│   └── requests_router.py     # 請求管理 API
├── core/
│   └── matching_logic.py      # 核心媒合算法
├── services/
│   ├── matching_service.py    # 媒合業務邏輯
│   ├── matching_notifications.py # 通知服務
│   ├── trip_integration.py    # Trip Calendar 整合服務 ✅
│   └── behavior_event_service.py # 行為事件服務 ✅
├── clients/
│   ├── user_core_client.py    # User Core 客戶端
│   ├── resort_client.py       # Resort 客戶端
│   └── knowledge_engagement_client.py # 知識服務客戶端
├── models/
│   ├── matching.py            # 媒合資料模型
│   └── trip_participant.py    # Trip 參與者模型 ✅
```

## API 端點
- `POST /searches` - 發起智慧媒合搜尋
- `GET /searches/{search_id}` - 獲取媒合結果
- `POST /requests` - 發送媒合請求
- `PUT /requests/{request_id}` - 接受/拒絕請求

## 媒合算法
```python
# 5 維度評分權重
WEIGHT_SKILL = 0.3        # 技能相似度
WEIGHT_LOCATION = 0.25    # 地點匹配
WEIGHT_AVAILABILITY = 0.2 # 時間重疊
WEIGHT_ROLE = 0.15        # 角色匹配
WEIGHT_KNOWLEDGE = 0.1    # 知識相似度
```

## 整合狀態
- ✅ **User Core**: 使用者資料、BehaviorEvent 回寫
- ✅ **Resort Services**: 雪場資料查詢
- ✅ **Knowledge Engagement**: 技能檔案整合
- ✅ **Calendar**: Trip 參與者 Calendar 事件同步 ✅

## 前端整合
- ✅ 智慧媒合頁面 (SmartMatchingPage)
- ✅ 媒合請求管理 (MatchRequestsPage)
- ✅ 5 維度分數視覺化
- ✅ 極地冰川設計系統

## 進階功能
- **單板教學整合**: 基於學習行為的進階媒合
- **候選人過濾**: 提升媒合效率
- **知識分數**: 可選的技能相似度評估
- **異步處理**: 非阻塞媒合流程

## 技術棧
- FastAPI + Pydantic
- httpx (異步 HTTP 客戶端)
- 多服務整合架構

## 專案關係與整合
```
Snowbuddy Matching (智慧媒合引擎)
    ↓ 依賴
User Core (使用者資料 + Calendar + BehaviorEvent)
    ↓ 依賴
Resort Services (雪場資料)
    ↓ 整合
Knowledge Engagement (技能檔案)
    ↓ 協作
Tour (Trip 參與者 Calendar 同步)
    ↓ 前端
Ski Platform (媒合 UI)
```

### 跨服務協作流程
1. **智慧媒合流程**
   ```
   使用者發起媒合 → Snowbuddy 算法
       ↓
   User Core: 獲取使用者檔案
       ↓  
   Resort Services: 獲取雪場資料
       ↓
   Knowledge Engagement: 獲取技能分數 (可選)
       ↓
   返回媒合結果 + 5 維度評分
   ```

2. **Trip 參與 + Calendar 同步**
   ```
   使用者申請加入 Trip (Ski Platform)
       ↓
   Snowbuddy: 處理申請接受
       ↓
   TripIntegrationService: 
   - 從 Tour 獲取 Trip 資訊
   - 從 User Core 獲取原 Calendar 事件
   - 為參與者建立新 Calendar 事件
       ↓
   統一行事曆檢視 (發佈者 + 參與者)
   ```

### 資料依賴關係
- **User Core**: 使用者檔案、技能等級、地點偏好、Calendar API
- **Resort Services**: 雪場名稱、位置、設施資訊
- **Knowledge Engagement**: 學習行為、課程進度、技能評分
- **Tour**: Trip 資訊、Calendar 事件查詢
- **Ski Platform**: 媒合 UI、申請管理、通知顯示

## 測試覆蓋
- 核心媒合邏輯: 100% 測試覆蓋
- 驗證測試: 所有功能通過
- 整合測試: 多服務協作驗證
