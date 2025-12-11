# Snowbuddy Matching Calendar 整合 TODO (修正版)

> 建立日期：2025-12-11
> 狀態：**已完成** ✅
> 完成日期：2025-12-11
> 方法：TDD (Test-Driven Development)
> 依賴：Trip Planner Calendar 整合完成

## 🎯 整合範圍 (重新理解)

### 系統運作模式
```
1. 使用者在 Trip Planner 發佈 Trip → Calendar 事件 (發佈者)
2. 其他人在 Snowbuddy Board 看到 Trip
3. 申請加入 Trip → 媒合成功
4. 參與者也需要獲得相同的 Calendar 事件 ← **本次目標**
```

### 現有系統
- ✅ **Trip Planner** (發佈 Trip，但 Calendar 整合為 Mock)
- ✅ **Snowbuddy Board** (顯示公開 Trip，申請加入功能)
- ✅ **BehaviorEvent 整合** (申請/接受已回寫到 user-core)
- ✅ **共享 Calendar 基礎設施** (user-core 已完成)

### 待整合系統
- ❌ **Trip 參與者 Calendar 同步** (加入 Trip → Calendar 事件) ← **本次目標**

---

## 📋 待完成任務

### Phase 1: 確認依賴和前置條件
- ✅ **TODO-SNOWBUDDY-001**: 等待 Trip Planner Calendar 整合完成
  - 依賴 TODO-TOUR-001 到 TODO-TOUR-009 完成
  - 確保 Trip 發佈時已建立 Calendar 事件

- ✅ **TODO-SNOWBUDDY-002**: 檢查 EventType.MATCHING 支援
  - 確認 user-core 中 `EventType.MATCHING` 是否已存在
  - 測試跨服務 API 調用機制

### Phase 2: 建立參與者追蹤系統
- ✅ **TODO-SNOWBUDDY-003**: 新增 Trip 參與者模型
  - 建立 `TripParticipant` 模型
  - 包含 `trip_id`, `user_id`, `joined_at`, `calendar_event_id`

- ✅ **TODO-SNOWBUDDY-004**: 實現參與者 CRUD 操作
  - 新增/查詢/刪除參與者記錄
  - 與 Calendar 事件 ID 的關聯管理

### Phase 3: 實現跨服務整合
- ✅ **TODO-SNOWBUDDY-005**: 實現 Trip 資訊查詢服務
  - 從 Trip Planner 獲取 Trip 詳細資訊
  - 從 user-core 獲取 Trip 的 Calendar 事件

- ✅ **TODO-SNOWBUDDY-006**: 實現參與者 Calendar 事件建立
  - `join_trip_with_calendar()` 服務
  - 為參與者建立與原 Trip 相同的 Calendar 事件
  - 事件來源標記為 `snowbuddy-matching`

### Phase 4: 整合現有申請流程
- ✅ **TODO-SNOWBUDDY-007**: 修改申請接受邏輯
  - 接受 Trip 申請時自動建立 Calendar 事件
  - 錯誤處理：Calendar 失敗不影響申請接受

- ✅ **TODO-SNOWBUDDY-008**: 實現退出 Trip 功能
  - `leave_trip_with_calendar()` 服務
  - 退出時清理對應的 Calendar 事件

### Phase 5: 前端整合 (可選)
- ✅ **TODO-SNOWBUDDY-009**: 顯示參與者 Calendar 狀態
  - 在 TripBoardCard 中顯示 Calendar 同步狀態
  - 提供手動同步 Calendar 的選項

### Phase 6: 測試和驗證
- ✅ **TODO-SNOWBUDDY-010**: 建立完整測試覆蓋
  - 參與者 Calendar 整合單元測試
  - Trip 參與完整流程整合測試
  - 跨服務 API 調用測試

---

## 🧪 測試策略

### 單元測試
- `TripParticipant` 模型驗證
- 跨服務 API 調用函數測試
- Calendar 事件建立/刪除邏輯測試

### 整合測試
- Trip 申請接受 → Calendar 事件建立
- Trip 退出 → Calendar 事件清理
- 原 Trip Calendar 事件變更 → 參與者事件同步

### 端到端測試
- 完整流程：Trip 發佈 → 申請 → 接受 → Calendar 同步
- 多參與者 Trip 的 Calendar 管理
- Trip 取消時所有參與者的通知

---

## 🚀 執行順序

### 前置條件 (必須先完成)
1. **TODO-TOUR-001 到 TODO-TOUR-009**: Trip Planner Calendar 整合
2. **TODO-SNOWBUDDY-001**: 確認 Trip Calendar 事件可查詢

### 立即執行 (Trip Planner 完成後)
3. **TODO-SNOWBUDDY-002**: 檢查 EventType.MATCHING 支援
4. **TODO-SNOWBUDDY-003**: 新增 Trip 參與者模型
5. **TODO-SNOWBUDDY-004**: 實現參與者 CRUD 操作

### 短期執行
6. **TODO-SNOWBUDDY-005**: 實現跨服務整合
7. **TODO-SNOWBUDDY-006**: 實現參與者 Calendar 事件建立
8. **TODO-SNOWBUDDY-007**: 修改申請接受邏輯

### 中期執行
9. **TODO-SNOWBUDDY-008**: 實現退出 Trip 功能
10. **TODO-SNOWBUDDY-009**: 前端整合 (可選)
11. **TODO-SNOWBUDDY-010**: 建立完整測試覆蓋

---

## 📊 成功指標

- ✅ Trip 發佈者有 Calendar 事件 (依賴 Trip Planner)
- ✅ Trip 參與者自動獲得相同的 Calendar 事件
- ✅ 參與者退出時自動清理 Calendar 事件
- ✅ 所有參與同一 Trip 的使用者在行事曆中看到相同事件
- ✅ 跨服務 API 調用穩定可靠
- ✅ 測試覆蓋率達到 90%+

---

## 🔧 技術細節

### 新增資料模型
```python
# snowbuddy_matching/app/models/trip_participant.py
class TripParticipant(BaseModel):
    trip_id: str
    user_id: str
    joined_at: datetime
    status: Literal["confirmed", "cancelled"]
    calendar_event_id: Optional[str] = None
```

### 跨服務 API 調用
```python
# 獲取 Trip 資訊
GET /api/trips/{trip_id}  # Trip Planner

# 獲取 Trip Calendar 事件
GET /calendar/events?source_app=tour&source_id={trip_id}  # user-core

# 建立參與者 Calendar 事件
POST /calendar/events  # user-core
{
  "user_id": "participant_user_id",
  "event_type": "MATCHING",
  "title": "參與行程 - {trip_title}",
  "start_date": "{original_start_date}",
  "end_date": "{original_end_date}",
  "source_app": "snowbuddy-matching",
  "source_id": "participant_{trip_id}_{user_id}",
  "related_trip_id": "{trip_id}"
}
```

### 環境變數
```env
TRIP_PLANNER_API_URL=http://localhost:3000
USER_CORE_API_URL=http://localhost:8001
SERVICE_AUTH_TOKEN=your_service_token
```

---

## 🎯 使用者流程

### Trip 參與 + Calendar 同步流程
```
1. 使用者 A 在 Trip Planner 發佈 Trip
   → Trip Planner 建立 Calendar 事件 (發佈者)
   ↓
2. 使用者 B 在 Snowbuddy Board 看到 Trip
   ↓
3. 使用者 B 申請加入 Trip
   ↓
4. 使用者 A 接受申請
   → Snowbuddy 系統處理：
     - 更新申請狀態為「已接受」
     - 獲取原 Trip 的 Calendar 事件資訊
     - 為使用者 B 建立相同的 Calendar 事件
     - 記錄參與者資訊和 Calendar 事件關聯
   ↓
5. 使用者 A 和 B 都在各自行事曆中看到相同的 Trip 事件
   - 發佈者事件來源：tour
   - 參與者事件來源：snowbuddy-matching
   - 事件內容相同：時間、地點、描述
```

---

## 🔗 依賴關係圖

```
Trip Planner Calendar 整合 (TODO-TOUR-*)
           ↓
    Trip 發佈 → Calendar 事件
           ↓
    Snowbuddy Board 顯示 Trip
           ↓
    申請加入 → 接受申請
           ↓
Snowbuddy Calendar 整合 (TODO-SNOWBUDDY-*)
           ↓
    參與者 Calendar 事件建立
           ↓
    統一行事曆檢視 (發佈者 + 參與者)
```

---

**🎯 核心目標：基於 Trip 發佈模式，實現 Trip 參與者的 Calendar 同步，讓所有參與同一個 Trip 的使用者都能在行事曆中看到相同的事件！**

*預估工時：12-18 小時 (包含跨服務整合)*  
*優先級：中等 (依賴 Trip Planner Calendar 整合完成)*
