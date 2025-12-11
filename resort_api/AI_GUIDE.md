# Resort Services - AI 導讀

## 專案概述
SnowTrace 平台的雪場資訊權威來源，管理 43 個日本滑雪場的詳細資料，支援滑雪足跡紀錄。

## 核心功能
- **雪場資料庫**: 43 個日本雪場完整資訊
- **雪場查詢 API**: 搜尋、篩選、分頁
- **滑雪足跡紀錄**: 與 user-core 整合
- **分享圖卡生成**: 社群分享功能

## 關鍵檔案
```
app/
├── main.py                     # FastAPI 應用入口
├── routers/
│   ├── resorts.py             # 雪場查詢 API
│   └── history.py             # 滑雪足跡 API
├── services/
│   ├── resort_service.py      # 雪場業務邏輯
│   └── history_service.py     # 足跡紀錄服務
├── models/
│   ├── resort.py              # 雪場資料模型
│   └── history.py             # 足跡紀錄模型
data/                          # YAML 雪場資料
├── hokkaido/                  # 北海道雪場
├── nagano/                    # 長野雪場
└── niigata/                   # 新潟雪場
```

## API 端點
- `GET /resorts` - 雪場列表 (支援篩選、搜尋、分頁)
- `GET /resorts/{resort_id}` - 雪場詳情
- `POST /users/{user_id}/ski-history` - 紀錄滑雪足跡
- `GET /resorts/{resort_id}/share-card` - 生成分享圖卡

## 資料結構
- **43 個雪場**: 涵蓋北海道、本州主要滑雪區域
- **YAML 格式**: 結構化資料管理
- **多維度資訊**: 雪道、設施、交通、票價

## 整合狀態
- ✅ **User Core**: 滑雪足跡 → BehaviorEvent
- ✅ **Snowbuddy Matching**: 提供雪場資料
- ✅ **Trip Planning**: 提供雪場資訊
- ❌ **Calendar**: 無需整合 (純資料服務)

## 前端 UI
- Next.js 15 雪場展示網站
- Alpine Velocity 設計系統
- 響應式雪場卡片設計

## 技術棧
- FastAPI + Pydantic
- YAML 資料存儲
- httpx (外部服務調用)
- 無資料庫 (檔案系統)

## 專案關係與角色
```
Resort Services (雪場資料權威來源)
    ↑ 被依賴
┌───┼───┼───┼───┐
↓   ↓   ↓   ↓   ↓
Ski  Tour Snow- Know- 單板
Platform  buddy ledge 教學
```

### 服務角色定位
- **資料提供者**: 為所有服務提供權威雪場資料
- **無狀態服務**: 不依賴其他服務，純資料查詢
- **BehaviorEvent 回寫**: 唯一對外寫入，紀錄滑雪足跡

### 被依賴關係詳情
1. **Ski Platform** ← Resort Services
   - 雪場列表: 首頁雪場展示
   - 雪場詳情: 行程規劃時選擇雪場
   - 滑雪足跡: 紀錄使用者去過的雪場
   - 征服地圖: 視覺化滑雪足跡

2. **Tour** ← Resort Services  
   - 雪場驗證: Trip 建立時驗證 resort_id
   - 雪場資訊: 豐富 Trip 顯示資訊
   - 偏好同步: 基於 Trip 更新使用者雪場偏好

3. **Snowbuddy** ← Resort Services
   - 地點匹配: 媒合算法中的地點相似度計算
   - 雪場資訊: 媒合結果中顯示雪場詳情

4. **Knowledge Engagement** ← Resort Services
   - 課程地點: 教學課程關聯雪場資訊
   - 學習場景: 基於雪場特色推薦課程

5. **單板教學** ← Resort Services
   - 雪場課程: 特定雪場的教學內容
   - 場地特色: 不同雪場的教學重點

### 資料流向
```
YAML 雪場資料 (43 個雪場)
    ↓
FastAPI 服務層
    ↓
┌─────────────────────────────┐
│ GET /resorts (公開)          │
│ GET /resorts/{id} (公開)     │  
│ POST /users/{id}/ski-history │ → User Core BehaviorEvent
└─────────────────────────────┘
    ↓
各服務消費雪場資料
```
