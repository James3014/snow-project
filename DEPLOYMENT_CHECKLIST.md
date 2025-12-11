# 微服務架構清理 - 部署檢查清單

> 日期：2025-12-12
> 狀態：準備部署 🚀

## ✅ 已完成的清理工作

### 1. User Core 清理
- ✅ 移除重複的媒合邏輯 (`buddy_matching_service.py`, `buddy_service.py`)
- ✅ 保留 CASI 技能分析 (單板教學整合需要)
- ✅ 新增 CASI API 端點 (`/users/{id}/casi-skills`)
- ✅ 語法檢查通過

### 2. Snowbuddy Service 更新
- ✅ 新增 User Core CASI API 調用
- ✅ 更新媒合算法使用 CASI 技能資料
- ✅ 保持獨立部署架構
- ✅ 語法檢查通過

### 3. Calendar 整合
- ✅ 確認 Calendar 功能完全未受影響
- ✅ Tour → User Core Calendar 正常
- ✅ Snowbuddy → User Core Calendar 正常

## 📊 部署架構

### 服務列表
```
1. User Core (FastAPI) - :8001
   - 認證服務
   - CASI 技能分析 ✅ 新增 API
   - Calendar 基礎設施
   
2. Snowbuddy Matching (FastAPI) - :8002 ← 需要獨立部署
   - 媒合算法
   - 調用 User Core CASI API ✅ 新增
   
3. Resort Services (FastAPI) - :8000
   - 雪場資料
   
4. Tour (Next.js) - :3010
   - 行程規劃
   - Calendar 整合
   
5. Ski Platform (React) - :3000
   - 主前端
```

## 🔧 環境變數配置

### User Core
```env
# 現有配置保持不變
USER_CORE_DB_URL=postgresql://...
JWT_SECRET_KEY=...
```

### Snowbuddy Service
```env
USER_CORE_API_URL=https://user-core.zeabur.app  # 調用 CASI API
RESORT_SERVICES_API_URL=https://resort-api.zeabur.app
SERVICE_TOKEN=snowbuddy-service-token
```

## 📋 部署順序

### 1. User Core (優先部署)
```bash
# 包含新的 CASI API 端點
# Snowbuddy 依賴這個 API
```

### 2. Snowbuddy Service
```bash
# 更新後的媒合服務
# 會調用 User Core 的 CASI API
```

### 3. 其他服務
```bash
# Resort Services, Tour, Ski Platform
# 按原有順序部署
```

## 🧪 部署後測試

### 1. User Core 測試
```bash
# 健康檢查
curl https://user-core.zeabur.app/health

# CASI API 測試
curl https://user-core.zeabur.app/users/test-user/casi-skills/summary
```

### 2. Snowbuddy 測試
```bash
# 健康檢查
curl https://snowbuddy.zeabur.app/health

# 媒合功能測試 (會內部調用 CASI API)
curl -X POST https://snowbuddy.zeabur.app/searches
```

### 3. 整合測試
```bash
# 確認 Snowbuddy 能成功調用 User Core CASI API
# 確認媒合結果包含 CASI 技能評分
```

## ⚠️ 注意事項

### 1. 單板教學整合
- ✅ CASI 技能分析功能完全保留
- ✅ BehaviorEvent 處理未受影響
- ✅ 學習資料同步正常

### 2. Calendar 整合
- ✅ 所有 Calendar 功能正常
- ✅ Trip → Calendar 事件同步
- ✅ 參與者 Calendar 事件建立

### 3. 備份檔案
- 📁 重複代碼已備份為 `.backup` 檔案
- 📁 可以在需要時恢復

## 🎯 預期結果

部署後應該達成：
- ✅ 微服務架構更清晰
- ✅ 重複代碼已清理
- ✅ CASI 技能媒合更精確
- ✅ 所有現有功能正常
- ✅ 單板教學整合無影響

## 🚨 回滾計劃

如果部署出現問題：
```bash
# 1. 恢復備份檔案
mv services/buddy_matching_service.py.backup services/buddy_matching_service.py
mv services/buddy_service.py.backup services/buddy_service.py

# 2. 移除新增的 CASI API
rm api/casi_skills.py

# 3. 恢復 main.py 路由註冊
# (手動移除 casi_skills 相關行)
```

---

**準備部署！微服務架構清理完成** 🎿✨
