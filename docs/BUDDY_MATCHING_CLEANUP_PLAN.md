# Buddy Matching 清理計劃

> 日期：2025-12-12
> 目的：清理 User Core 中重複的 Buddy Matching 代碼，保持微服務架構
> ⚠️ **重要**：保護單板教學系統的現有整合

## 🚨 保護清單 - 不可刪除

### 1. CASI 技能分析系統 (單板教學整合)
**必須保留**：
- `models/buddy_matching.py` 中的 `CASISkillProfile` 模型
- `services/casi_skill_analyzer.py` - CASI 技能分析服務
- `services/learning_focus_tracker.py` - 學習焦點追蹤
- `schemas/buddy_matching.py` 中的 CASI 相關 schema

**原因**：單板教學系統依賴這些來分析使用者的 CASI 技能

### 2. BehaviorEvent 處理
**必須保留**：
- `api/behavior_events.py` 中的 `source_project="snowboard-teaching"` 處理
- 所有與 `snowboard-teaching` 相關的事件處理邏輯

**原因**：單板教學系統透過 BehaviorEvent 同步學習資料

### 3. 資料庫遷移
**必須保留**：
- `alembic/versions/q1r2s3t4u5v6_add_buddy_matching_tables.py`
- CASISkillProfile 相關的資料庫表結構

## ✅ 可以清理的部分

### 1. 純媒合邏輯 (移到獨立服務)
**可以刪除**：
- `services/buddy_matching_service.py` - 媒合算法邏輯
- `services/buddy_service.py` - 雪伴服務
- `models/buddy_matching.py` 中的媒合相關模型 (保留 CASI 部分)

### 2. 媒合相關 Schema
**可以刪除**：
- `schemas/buddy_matching.py` 中的媒合請求 schema (保留 CASI 部分)

### 3. Domain 模型
**可以刪除**：
- `domain/calendar/matching_request.py`
- `domain/calendar/trip_buddy.py`

## 🔧 清理步驟

### Phase 1: 分析依賴關係
1. ✅ 確認單板教學系統使用的 API 端點
2. ✅ 確認 CASI 技能分析的資料流
3. ✅ 確認 BehaviorEvent 的處理邏輯

### Phase 2: 保護性重構
1. **分離 CASI 功能**
   ```python
   # 保留在 User Core
   models/casi_skills.py          # 從 buddy_matching.py 分離
   services/casi_skill_analyzer.py # 保持不變
   schemas/casi_skills.py         # 從 buddy_matching.py 分離
   ```

2. **移除媒合功能**
   ```python
   # 刪除這些檔案
   services/buddy_matching_service.py
   services/buddy_service.py
   domain/calendar/matching_request.py
   domain/calendar/trip_buddy.py
   ```

### Phase 3: 測試驗證
1. **單板教學整合測試**
   ```bash
   # 測試 CASI 技能分析
   python test_e2e_casi.py
   
   # 測試 BehaviorEvent 處理
   curl -X POST /events -d '{
     "source_project": "snowboard-teaching",
     "event_type": "practice_complete"
   }'
   ```

2. **獨立 Snowbuddy 服務測試**
   ```bash
   # 測試媒合功能
   curl http://localhost:8002/searches
   ```

## 📊 清理前後對比

### 清理前 (重複架構)
```
User Core
├── 認證 ✅
├── 使用者資料 ✅
├── CASI 技能分析 ✅
├── Buddy Matching 邏輯 ❌ (重複)
└── Calendar ✅

Snowbuddy Service  
├── Buddy Matching 邏輯 ❌ (重複)
└── 媒合 API ✅
```

### 清理後 (微服務架構)
```
User Core
├── 認證 ✅
├── 使用者資料 ✅
├── CASI 技能分析 ✅ (單板教學需要)
└── Calendar ✅

Snowbuddy Service
├── Buddy Matching 邏輯 ✅ (唯一實現)
├── 媒合 API ✅
└── 調用 User Core CASI API ✅
```

## 🔗 API 邊界設計

### User Core 提供給 Snowbuddy
```python
# CASI 技能查詢 API (新增)
GET /users/{user_id}/casi-skills
{
  "stance_balance": 0.8,
  "rotation": 0.7,
  "edging": 0.9,
  "pressure": 0.6,
  "timing_coordination": 0.8
}

# 使用者基本資料 (現有)
GET /users/{user_id}
```

### Snowbuddy Service 獨立提供
```python
# 媒合搜尋 (現有)
POST /searches
GET /searches/{search_id}

# 媒合請求 (現有)  
POST /requests
PUT /requests/{request_id}
```

## ⚠️ 風險控制

### 1. 資料遷移風險
- **風險**：清理時誤刪 CASI 資料
- **控制**：先備份資料庫，分階段清理

### 2. API 中斷風險
- **風險**：單板教學系統 API 調用失敗
- **控制**：保持現有 API 端點不變

### 3. 功能回歸風險
- **風險**：CASI 技能分析功能失效
- **控制**：完整的回歸測試

## 📋 執行檢查清單

### 清理前檢查
- [ ] 備份 User Core 資料庫
- [ ] 確認單板教學系統運行正常
- [ ] 記錄現有 API 端點
- [ ] 執行完整測試套件

### 清理中檢查
- [ ] 逐步刪除檔案，每步測試
- [ ] 保持 CASI 相關功能完整
- [ ] 確認 BehaviorEvent 處理正常
- [ ] 測試獨立 Snowbuddy 服務

### 清理後檢查
- [ ] 單板教學系統功能正常
- [ ] CASI 技能分析正常
- [ ] Snowbuddy 媒合功能正常
- [ ] 所有測試通過

## 🎯 成功指標

1. ✅ 單板教學系統 CASI 整合無影響
2. ✅ User Core 不再有重複的媒合邏輯
3. ✅ Snowbuddy Service 成為媒合功能唯一實現
4. ✅ 微服務邊界清晰
5. ✅ 所有現有功能正常運作

**核心原則：保護單板教學整合，清理重複代碼，維持微服務架構** 🎿✨
