# CASI Skill Profile 自動同步機制

## 背景

單板教學 App 的練習事件已經同步到 user-core 的 `behavior_events` 表，但 CASI Skill Analyzer 目前只在被動調用時才會分析事件並更新技能檔案。這導致 snowbuddy-matching 在搜尋雪伴時，無法即時獲取最新的技能資料進行配對。

## 問題

當用戶 A 搜尋雪伴時：
1. 系統找到 B、C、D 都有發佈找伴行程
2. 需要計算 A 與 B、C、D 的配對分數（包含 skill similarity）
3. **問題**：B、C、D 的 CASI skill profile 可能不存在或過期
4. 如果即時計算 4 個人的技能檔案 → 太慢，用戶體驗差

## 解決方案：事件觸發自動更新

當單板教學的 `practice_complete` 事件寫入 user-core 時，**異步觸發** CASI Analyzer 更新該用戶的技能檔案。

### 優點
- ✅ 技能檔案始終保持最新
- ✅ 搜尋時不需要即時計算，速度快
- ✅ 異步執行，不阻塞事件寫入

### 缺點
- ⚠️ 每次練習完成都會觸發計算（可加節流機制）

## 實作任務

### Task 1: 修改 behavior_events API 添加後台任務觸發

**文件**: `platform/user_core/api/behavior_events.py`

**修改內容**:
```python
from fastapi import BackgroundTasks

@router.post("/", response_model=behavior_event_schema.BehaviorEvent)
def create_event_for_user(
    event: behavior_event_schema.BehaviorEventCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(db.get_db)
):
    try:
        db_event = behavior_event_service.create_event(db=db, event=event)
        
        # 如果是單板教學的練習完成事件，觸發 CASI 分析
        if (event.source_project == "snowboard-teaching" and 
            event.event_type == "snowboard.practice.completed"):
            background_tasks.add_task(
                update_casi_profile_task,
                event.user_id
            )
        
        return db_event
    except behavior_event_service.BehaviorEventValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
```

### Task 2: 創建後台任務函數

**文件**: `platform/user_core/services/casi_skill_analyzer.py`

**新增函數**:
```python
def update_casi_profile_task(user_id: uuid.UUID) -> None:
    """後台任務：更新用戶的 CASI 技能檔案
    
    這個函數會在後台異步執行，不阻塞主流程。
    如果發生錯誤，只紀錄日誌，不影響事件寫入。
    """
    try:
        from services.db import get_db
        
        db = next(get_db())
        analyzer = CASISkillAnalyzer()
        
        # 更新技能檔案
        profile = analyzer.update_skill_profile_from_events(db, user_id)
        
        logger.info(f"[CASI Sync] Updated skill profile for user {user_id}")
        logger.debug(f"[CASI Sync] Profile: {profile}")
        
    except Exception as e:
        logger.error(f"[CASI Sync] Failed to update profile for user {user_id}: {e}")
        # 靜默失敗，不影響主流程
    finally:
        db.close()
```

### Task 3: 添加節流機制（可選優化）

為避免頻繁計算，可以添加節流：只有距離上次更新超過 N 分鐘才重新計算。

**修改**: `update_casi_profile_from_events()` 方法

```python
def update_skill_profile_from_events(
    self,
    db: Session,
    user_id: uuid.UUID,
    days: int = 90,
    min_update_interval_minutes: int = 30  # 最小更新間隔
) -> CASISkillProfileSchema:
    # 檢查上次更新時間
    stmt = select(CASISkillProfile).where(CASISkillProfile.user_id == user_id)
    result = db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if profile:
        time_since_update = datetime.now(UTC) - profile.updated_at
        if time_since_update.total_seconds() < min_update_interval_minutes * 60:
            logger.debug(f"Skipping update for user {user_id}, last updated {time_since_update.total_seconds():.0f}s ago")
            return CASISkillProfileSchema.model_validate(profile)
    
    # 繼續原有的更新邏輯...
```

### Task 4: 添加單元測試

**文件**: `tests/unit/user_core/test_casi_skill_analyzer.py`

**新增測試**:
```python
def test_update_casi_profile_task():
    """測試後台任務能正確更新技能檔案"""
    # 創建測試用戶和事件
    # 調用 update_casi_profile_task
    # 驗證技能檔案已更新

def test_casi_sync_throttling():
    """測試節流機制：短時間內不重複更新"""
    # 第一次更新
    # 立即再次更新
    # 驗證第二次被跳過
```

### Task 5: 更新文檔

**文件**: `specs/user-core/CASI_SKILL_SYNC.md`（新建）

紀錄：
- 同步機制的工作原理
- 觸發條件
- 節流策略
- 監控方法
- 故障排除

## 驗證步驟

1. **單元測試**: 運行 `pytest tests/unit/user_core/test_casi_skill_analyzer.py`
2. **集成測試**: 
   - 在單板教學完成一個練習
   - 檢查 user-core 日誌，應該看到 `[CASI Sync] Updated skill profile`
   - 查詢 `casi_skill_profiles` 表，驗證技能分數已更新
3. **性能測試**:
   - 模擬 100 個用戶同時完成練習
   - 驗證事件寫入不受影響（< 100ms）
   - 驗證後台任務正常執行

## 部署計劃

1. **開發環境**: 先在本地測試
2. **測試環境**: 部署到 Zeabur 測試環境
3. **生產環境**: 
   - 監控日誌確認無錯誤
   - 觀察資料庫負載
   - 如有問題可快速回滾

## 監控指標

- 每小時觸發的 CASI 更新次數
- 更新成功率
- 平均更新耗時
- 節流跳過的次數

## 相關文件

- `platform/user_core/services/casi_skill_analyzer.py` - CASI 分析器
- `platform/user_core/api/behavior_events.py` - 事件 API
- `specs/單板教學/docs/USER_CORE_INTEGRATION.md` - 單板教學整合文檔
- `specs/單板教學/docs/EVENT_MAPPING.md` - 事件映射表

---

**創建時間**: 2025-12-02  
**狀態**: ✅ COMPLETED  
**優先級**: High  
**完成時間**: 2025-12-02

## 完成清單

- ✅ Task 1: 修改 behavior_events API 添加後台任務觸發
- ✅ Task 2: 創建後台任務函數 `update_casi_profile_task()`
- ✅ Task 3: 添加節流機制（30 分鐘最小間隔）
- ✅ Task 4: 同步更新 `user_profiles.skill_level` (1-10)
- ✅ Task 5: 創建 migration 將 skill_level 改為 Integer
- ✅ 更新文檔 `CASI_SKILL_SYNC.md`
- ✅ **修正單板教學傳送 rating 到 user-core**

## 額外完成

- ✅ 添加詳細日誌紀錄
- ✅ skill_level 自動從 CASI 平均分數計算
- ✅ 等級對照表（1-3 初級，4-6 中級，7-9 高級，10 專家）
- ✅ **修正 practice.ts 傳送 rating 欄位**

## 🔧 修正紀錄

### 2025-12-02 09:50 - 修正 rating 傳送

**問題**: 單板教學的 `trackEvent('practice_complete', lessonId)` 沒有傳送 rating

**修正**: 
```typescript
// specs/單板教學/web/src/lib/practice.ts
trackEvent('practice_complete', lessonId, {
  rating: avgRating || 3,
  note: note,
})
```

**影響**: CASI Analyzer 現在可以使用實際評分計算技能掌握度

---

### 2025-12-02 09:58 - 改用關鍵字映射

**問題**: 原本只有 6 個固定課程映射，無法支援 213 個 sam_cleaned 課程

**修正**: 
```python
# platform/user_core/services/casi_skill_analyzer.py
# 使用關鍵字匹配（站姿、換刃、刻滑、壓、時機等）
# 自動推斷課程對應的 CASI 技能
```

**優點**:
- ✅ 自動支援所有 213 個課程
- ✅ 不需要手動維護映射表
- ✅ 新課程自動獲得合理權重

**測試結果**:
```
01_滾刃快換刃 → edging: 0.9, rotation: 0.8
03_站姿開閉 → stance_balance: 1.0
20_五步前刃貼地刻 → edging: 0.9, pressure: 0.6
```

---
