# User Core - AI 導讀

## 專案概述
SnowTrace 平台的核心使用者服務，提供統一認證、使用者資料管理、行為事件紀錄和共享 Calendar 基礎設施。

## 核心功能
- **統一認證**: `/auth/login`, `/auth/validate` 
- **使用者管理**: CRUD + 偏好設定
- **行為事件**: 跨服務事件紀錄系統
- **Calendar 系統**: 共享行事曆基礎設施 (EventType: TRIP, GEAR, MATCHING)
- **通知系統**: 跨平台通知管理

## 關鍵檔案
```
services/
├── calendar_service.py          # Calendar 核心服務
├── gear_service.py             # 裝備-Calendar 整合服務
├── interfaces/
│   ├── calendar_service_interface.py
│   └── gear_service_interface.py
domain/calendar/
├── enums.py                    # EventType 定義
├── models.py                   # CalendarEvent 模型
repositories/
├── calendar_repository.py      # Calendar 資料存取
models/
├── user.py                     # 使用者模型
├── behavior_event.py           # 行為事件模型
```

## 專案關係圖
```
                    User Core (核心服務)
                         ↑
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   Ski Platform    Tour (Trip Planner)  Snowbuddy
   (主前端)         (行程規劃)           (雪伴媒合)
        ↓                ↓                ↓
        └────────────────┼────────────────┘
                         ↓
                  Resort Services
                   (雪場資料)
```

### 依賴關係
- **被依賴**: 所有服務都依賴 User Core 的認證和資料
- **Calendar 中心**: 提供統一 Calendar 基礎設施
- **BehaviorEvent 中心**: 收集所有服務的使用者行為
- **通知中心**: 跨服務通知管理

### 服務整合詳情
1. **Ski Platform** → User Core
   - 認證: `/auth/login`, `/auth/validate`
   - 使用者資料: `/users/{user_id}`
   - 行為紀錄: `/behavior-events`

2. **Tour** → User Core  
   - Calendar 整合: Calendar API
   - 偏好同步: `/users/{user_id}/ski-preferences`
   - 行程事件: EventType.TRIP

3. **Snowbuddy** → User Core
   - 媒合行為: EventType.MATCHING  
   - 參與者 Calendar: Calendar API
   - 申請紀錄: BehaviorEvent

4. **Resort Services** → User Core
   - 滑雪足跡: BehaviorEvent 回寫
   - 無需認證 (公開資料)

## API 端點
- `POST /auth/login` - 使用者登入
- `GET /auth/validate` - Token 驗證
- `GET /users/{user_id}` - 使用者資料
- `POST /behavior-events` - 行為事件紀錄
- Calendar API 透過服務層提供

## 測試覆蓋
- 65+ 單元測試
- Calendar-Gear 整合: 15 個測試 (100% 通過)
- 認證系統完整測試

## 技術棧
- FastAPI + SQLAlchemy + PostgreSQL
- Redis (快取/非同步任務)
- Pydantic (資料驗證)
- 統一認證架構

## 最近更新
- 2025-12-11: 完成 Gear-Calendar 整合擴展功能
- Calendar 系統支援 GEAR 事件類型
- GearService 實現智能檢查提醒和交易約定
