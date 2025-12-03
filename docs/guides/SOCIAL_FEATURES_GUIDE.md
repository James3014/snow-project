# 社交功能實施指南

## 📦 已完成功能

### 1. 社交動態牆（方案 4）
- ✅ 用戶關注/取消關注功能
- ✅ 動態牆（三種模式：所有/關注/熱門）
- ✅ 隱私控制（公開/僅關注者/私密）
- ✅ 點讚系統
- ✅ 評論系統
- ✅ 自動生成動態（課程訪問、成就解鎖）
- ✅ 輪詢刷新（每 30 秒）

### 2. 滑雪地圖（方案 5）
- ✅ SVG 區域地圖展示
- ✅ 已訪問/未訪問雪場標記
- ✅ 按地區統計完成度
- ✅ 總體進度追蹤

## 🚀 快速開始

### 後端部署

1. **運行數據庫遷移**
```bash
cd platform/user_core
python scripts/run_migrations.py
```

2. **啟動服務**
```bash
# 開發模式
python -m uvicorn api.main:app --reload --port 8001

# 或使用 Docker
docker-compose up user_core
```

3. **測試 API**
```bash
# 運行測試腳本
python scripts/test_social_api.py

# 或訪問 Swagger 文檔
open http://localhost:8001/docs
```

### 前端部署

1. **安裝依賴**（如需要）
```bash
cd platform/frontend/ski-platform
npm install
```

2. **啟動開發服務器**
```bash
npm run dev
```

3. **訪問新功能**
- 動態牆：`http://localhost:5173/feed`
- 滑雪地圖：`http://localhost:5173/ski-map`

## 📂 新增文件清單

### 後端文件 (user_core)

**數據庫遷移**
- `alembic/versions/l5m6n7o8p9q0_add_display_name_to_users.py`
- `alembic/versions/m1n2o3p4q5r6_add_social_features.py`

**數據模型**
- `models/social.py` - 社交功能模型
- `models/user_profile.py` - 已更新（display_name, avatar_url）

**服務層**
- `services/auth_service.py` - 統一認證服務
- `services/social_service.py` - 社交功能業務邏輯
- `services/ski_map_service.py` - 滑雪地圖服務
- `services/redis_cache.py` - Redis 緩存服務
- `services/course_tracking_service.py` - 已更新（自動生成動態）

**API 端點**
- `api/social.py` - 社交功能 REST API
- `api/ski_map.py` - 滑雪地圖 REST API
- `api/main.py` - 已更新（註冊新路由）

**Schemas**
- `schemas/social.py` - 社交功能請求/響應模式
- `schemas/ski_map.py` - 滑雪地圖數據模式

**測試腳本**
- `scripts/run_migrations.py` - 手動運行遷移
- `scripts/test_social_api.py` - API 測試腳本

### 前端文件 (ski-platform)

**動態牆功能**
- `src/features/activity-feed/types/feed.types.ts`
- `src/features/activity-feed/api/activityFeedApi.ts`
- `src/features/activity-feed/hooks/useActivityFeed.ts`
- `src/features/activity-feed/hooks/useFeedPolling.ts`
- `src/features/activity-feed/components/FeedItem.tsx`
- `src/features/activity-feed/components/FeedList.tsx`
- `src/features/activity-feed/pages/FeedPage.tsx`

**滑雪地圖功能**
- `src/features/ski-map/types/map.types.ts`
- `src/features/ski-map/api/skiMapApi.ts`
- `src/features/ski-map/hooks/useSkiMap.ts`
- `src/features/ski-map/components/JapanSkiRegionsMap.tsx`
- `src/features/ski-map/pages/SkiMapPage.tsx`

## 🔌 API 端點

### 社交功能 (/social)

**關注功能**
- `POST /social/users/{user_id}/follow` - 關注用戶
- `DELETE /social/users/{user_id}/follow` - 取消關注
- `GET /social/users/{user_id}/followers` - 獲取粉絲列表
- `GET /social/users/{user_id}/following` - 獲取關注列表
- `GET /social/users/{user_id}/follow-stats` - 獲取關注統計

**動態牆功能**
- `GET /social/feed?feed_type={all|following|popular}` - 獲取動態牆
- `GET /social/users/{user_id}/feed` - 獲取用戶動態
- `POST /social/feed` - 手動創建動態

**點讚功能**
- `POST /social/feed/{activity_id}/like` - 點讚
- `DELETE /social/feed/{activity_id}/like` - 取消點讚

**評論功能**
- `GET /social/feed/{activity_id}/comments` - 獲取評論
- `POST /social/feed/{activity_id}/comments` - 發表評論
- `DELETE /social/feed/comments/{comment_id}` - 刪除評論

### 滑雪地圖 (/ski-map)

- `GET /ski-map/users/{user_id}/ski-map` - 獲取地圖數據
- `GET /ski-map/users/{user_id}/ski-map/regions/{region}` - 獲取區域詳情

## 🗄️ 數據庫表

### 新增表

1. **user_follows** - 關注關係
   - follower_id, following_id
   - 索引：follower_id, following_id

2. **activity_feed_items** - 動態內容
   - user_id, activity_type, content_json, visibility
   - likes_count, comments_count（預計算）
   - 索引：user_id, created_at, visibility

3. **activity_likes** - 點讚紀錄
   - activity_id, user_id
   - 唯一約束：(activity_id, user_id)

4. **activity_comments** - 評論
   - activity_id, user_id, content
   - parent_comment_id（支持回復）

### 更新的表

**user_profiles** 新增字段：
- `display_name` VARCHAR(100) - 顯示名稱
- `avatar_url` VARCHAR(500) - 頭像 URL
- `default_post_visibility` VARCHAR(20) - 默認動態可見性

## ⚙️ 環境變數

在 `.env` 文件中添加：

```env
# 必需
RESORT_API_URL=http://localhost:8000

# Redis 緩存（可選，提升性能）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# 認證模式
ENV=development
```

## 🧪 測試

### 自動化測試
```bash
# 運行 API 測試
cd platform/user_core
python scripts/test_social_api.py
```

### 手動測試

**測試關注功能**
```bash
# 用戶 A 關注用戶 B
curl -X POST "http://localhost:8001/social/users/USER-B-ID/follow" \
  -H "X-User-Id: USER-A-ID"
```

**測試動態牆**
```bash
# 獲取所有動態
curl "http://localhost:8001/social/feed?feed_type=all" \
  -H "X-User-Id: USER-ID"
```

**測試滑雪地圖**
```bash
# 獲取地圖數據
curl "http://localhost:8001/ski-map/users/USER-ID/ski-map" \
  -H "X-User-Id: USER-ID"
```

## 🎯 性能優化

### 已實現
- ✅ Cursor-based 分頁（支持 10,000+ 用戶）
- ✅ 數據庫索引優化
- ✅ likes_count/comments_count 預計算
- ✅ Redis 緩存服務（可選啟用）

### 推薦配置

**2000-5000 用戶**
- 當前配置即可
- 考慮啟用 Redis 緩存關注列表

**5000-10000 用戶**
- 必須啟用 Redis 緩存
- 增加數據庫連接池

**10000+ 用戶**
- 考慮升級到 WebSocket 實時推送
- 添加 CDN 緩存靜態資源
- 考慮讀寫分離

## 📊 架構圖

```
┌─────────────────┐
│  React Frontend │
│   (Vite + TS)   │
└────────┬────────┘
         │
         │ REST API
         ▼
┌─────────────────┐     ┌──────────────┐
│   FastAPI       │────▶│  PostgreSQL  │
│   user_core     │     │   Database   │
└────────┬────────┘     └──────────────┘
         │
         │ (可選)
         ▼
    ┌────────┐
    │ Redis  │
    │ Cache  │
    └────────┘
```

## 🐛 常見問題

### 1. 數據庫遷移失敗
```bash
# 檢查數據庫連接
python -c "from services import db; db.engine.connect()"

# 手動創建表
python scripts/run_migrations.py
```

### 2. Redis 連接失敗
沒關係！系統會自動降級，不使用緩存。如果需要 Redis：
```bash
# 使用 Docker 啟動 Redis
docker run -d -p 6379:6379 redis:alpine
```

### 3. 前端 API 調用失敗
檢查 CORS 配置（已在 main.py 中配置）：
```python
allow_origins=["http://localhost:5173", ...]
```

## 📝 後續優化建議

### 短期（1-2 週）
- [ ] 添加評論回復功能
- [ ] 添加用戶個人主頁
- [ ] 添加圖片上傳（頭像）

### 中期（1 個月）
- [ ] WebSocket 實時推送
- [ ] 滑雪地圖分享功能
- [ ] 推薦算法優化

### 長期（2-3 個月）
- [ ] 社交推薦系統
- [ ] 動態牆內容審核
- [ ] 性能監控和分析

## 🆘 支持

如有問題，請查看：
- Swagger 文檔：http://localhost:8001/docs
- 測試腳本：`scripts/test_social_api.py`
- 這份文檔：`SOCIAL_FEATURES_GUIDE.md`
