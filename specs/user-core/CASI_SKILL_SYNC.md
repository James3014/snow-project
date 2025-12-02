# CASI Skill Profile 自動同步機制

## 概述

本文檔說明 CASI（Canadian Association of Snowboard Instructors）技能檔案如何從單板教學的練習事件自動同步更新。

## 工作原理

```
單板教學 App
  ↓ 用戶完成練習
trackEvent('practice_complete', lesson_id, { rating: 4 })
  ↓ 批次同步
user-core BehaviorEvent API
  ↓ 寫入事件到資料庫
POST /behavior-events
  ↓ 觸發後台任務（非阻塞）
update_casi_profile_task(user_id)
  ↓ 分析最近 500 個練習事件
CASI Skill Analyzer
  ↓ 計算 5 項技能掌握度
casi_skill_profiles 表更新
  ↓ 同步更新 skill_level (1-10)
user_profiles.skill_level 更新
  ↓ 用於配對計算
snowbuddy-matching 查詢技能檔案
```

## skill_level 同步

CASI Skill Analyzer 在更新技能檔案時，會自動同步更新 `user_profiles.skill_level`：

### 計算邏輯

```python
# 1. 計算 5 項 CASI 技能的平均分數 (0.0-1.0)
avg_skill = (stance_balance + rotation + edging + pressure + timing_coordination) / 5

# 2. 轉換為 1-10 等級
skill_level = int(avg_skill * 10)  # 範圍: 1-10
```

### 範例

假設用戶的 CASI 技能分數：
- stance_balance: 0.61
- rotation: 0.80
- edging: 0.59
- pressure: 0.55
- timing_coordination: 0.65

計算：
```
avg_skill = (0.61 + 0.80 + 0.59 + 0.55 + 0.65) / 5 = 0.64
skill_level = int(0.64 * 10) = 6
```

用戶的 `skill_level` 會被更新為 **6**（中級）。

### 等級對照

| skill_level | 等級 | CASI 平均分數 |
|-------------|------|---------------|
| 1-3 | 初級 | 0.0-0.3 |
| 4-6 | 中級 | 0.4-0.6 |
| 7-9 | 高級 | 0.7-0.9 |
| 10 | 專家 | 1.0 |

## 觸發條件

後台任務只在以下條件**同時滿足**時觸發：

1. **來源專案**: `source_project == "snowboard-teaching"`
2. **事件類型**: `event_type == "snowboard.practice.completed"`

其他事件（如 `lesson.viewed`、`search.performed`）不會觸發 CASI 分析。

## 節流策略

為避免頻繁計算，實施了節流機制：

- **最小更新間隔**: 30 分鐘
- **邏輯**: 如果距離上次更新不足 30 分鐘，跳過本次更新
- **日誌**: `Skipping CASI update for user {user_id}, last updated {seconds}s ago`

### 為什麼需要節流？

假設用戶在 10 分鐘內完成 5 個練習：
- **無節流**: 觸發 5 次計算，每次查詢 500 個事件 → 浪費資源
- **有節流**: 只計算第 1 次，後 4 次跳過 → 節省 80% 計算

## CASI 五項核心技能

| 技能 | 英文 | 說明 |
|------|------|------|
| 站姿與平衡 | Stance & Balance | 基礎站姿、重心控制 |
| 旋轉 | Rotation | 上下身旋轉、換刃動作 |
| 用刃 | Edging | 刃角控制、刻滑技術 |
| 壓力 | Pressure | 板面壓力分配 |
| 時機與協調性 | Timing & Coordination | 動作流暢度、節奏感 |

每項技能的掌握度範圍：**0.0（完全不會）到 1.0（完全掌握）**

## 課程到技能的映射

分析器使用**關鍵字匹配**來推斷課程對應的 CASI 技能：

### 關鍵字映射表

| 關鍵字 | 主要技能 | 次要技能 |
|--------|---------|---------|
| 站姿、平衡、居中、重心 | stance_balance | timing_coordination, pressure |
| 換刃、轉彎、旋轉、反擰 | rotation | edging, timing_coordination |
| 刃、刻滑、走刃、立刃、滾刃 | edging | pressure, timing_coordination |
| 壓、折疊、傾倒、施壓、蓄力 | pressure | edging, timing_coordination |
| 時機、節奏、流暢、連貫、起伏 | timing_coordination | rotation, pressure |

### 範例

```python
# 課程: "01_滾刃快換刃"
# 匹配關鍵字: "滾刃" + "換刃"
{
  "edging": 0.9,           # 從"滾刃"
  "rotation": 0.8,         # 從"換刃"
  "timing_coordination": 0.7,
  "pressure": 0.6
}

# 課程: "03_站姿開閉"
# 匹配關鍵字: "站姿"
{
  "stance_balance": 1.0,
  "timing_coordination": 0.3
}
```

### 優點
- ✅ 自動支援所有 213 個 sam_cleaned 課程
- ✅ 不需要手動維護映射表
- ✅ 新課程自動獲得合理的技能權重
- ✅ 未知課程使用默認值（所有技能 0.5）

### 計算邏輯

1. 查詢用戶最近 500 個練習事件
2. 過濾出 `lesson_completed`、`practice_session`、`drill_completed` 類型
3. 對每個事件：
   - 提取 `lesson_id` 和 `rating`（0-5 分）
   - 查找課程的技能映射
   - 累積加權分數：`skill_score += (rating / 5.0) * weight`
4. 計算每項技能的平均分數
5. 正規化到 [0.0, 1.0] 範圍

### 範例

用戶完成了以下練習：
- `basic_stance` (rating: 4) → stance_balance += 0.8
- `falling_leaf` (rating: 3) → edging += 0.48, stance_balance += 0.42
- `j_turn` (rating: 5) → rotation += 0.8, edging += 0.7

最終技能分數：
- `stance_balance`: (0.8 + 0.42) / 2 = 0.61
- `rotation`: 0.8 / 1 = 0.80
- `edging`: (0.48 + 0.7) / 2 = 0.59

## 監控方法

### 日誌級別

| 級別 | 訊息 | 說明 |
|------|------|------|
| INFO | `[CASI Sync] Updated skill profile for user {id}` | 成功更新 |
| DEBUG | `[CASI Sync] Profile: stance=0.61, rotation=0.80...` | 詳細分數 |
| DEBUG | `Skipping CASI update for user {id}...` | 節流跳過 |
| ERROR | `[CASI Sync] Failed to update profile...` | 更新失敗 |

### 查詢技能檔案

```bash
# 查詢特定用戶的技能檔案
curl "https://user-core.zeabur.app/buddy-matching/casi-profile/{user_id}"

# 查詢資料庫
psql -c "SELECT * FROM casi_skill_profiles WHERE user_id = '{user_id}';"
```

### 監控指標

建議監控以下指標：

1. **觸發頻率**: 每小時觸發的 CASI 更新次數
2. **成功率**: 成功更新 / 總觸發次數
3. **平均耗時**: 從觸發到完成的時間
4. **節流率**: 被節流跳過的次數 / 總觸發次數

## 故障排除

### 問題 1: 技能檔案沒有更新

**症狀**: 用戶完成練習後，技能分數沒有變化

**排查步驟**:
1. 檢查事件是否成功寫入：
   ```bash
   curl "https://user-core.zeabur.app/behavior-events/by-user/{user_id}?sort_by=occurred_at&limit=10"
   ```
2. 檢查事件類型是否正確：
   - `source_project` 應為 `snowboard-teaching`
   - `event_type` 應為 `snowboard.practice.completed`
3. 檢查日誌是否有錯誤：
   ```bash
   grep "CASI Sync" /var/log/user-core.log
   ```
4. 檢查是否被節流：
   - 如果距離上次更新不足 30 分鐘，會被跳過

### 問題 2: 後台任務執行失敗

**症狀**: 日誌顯示 `[CASI Sync] Failed to update profile`

**可能原因**:
1. 資料庫連接失敗
2. user_core_client 無法獲取事件
3. 課程 ID 映射錯誤

**解決方法**:
1. 檢查資料庫連接
2. 檢查 user_core_client 配置
3. 添加新的課程映射到 `LESSON_SKILL_MAPPING`

### 問題 3: 技能分數不合理

**症狀**: 技能分數全部為 0.0 或異常高

**排查步驟**:
1. 檢查練習事件的 `rating` 欄位是否正確（應為 0-5）
2. 檢查課程 ID 是否在映射表中
3. 手動觸發更新並查看日誌：
   ```python
   from services.casi_skill_analyzer import update_casi_profile_task
   update_casi_profile_task(user_id)
   ```

## 性能考量

### 資料庫查詢

每次更新會執行以下查詢：
1. 查詢現有技能檔案（檢查節流）
2. 查詢最近 500 個練習事件
3. 更新或插入技能檔案

**優化建議**:
- 在 `behavior_events` 表的 `user_id` 和 `occurred_at` 欄位建立索引
- 在 `casi_skill_profiles` 表的 `user_id` 欄位建立唯一索引

### 後台任務

- **非阻塞**: 使用 FastAPI 的 `BackgroundTasks`，不影響事件寫入速度
- **隔離**: 後台任務失敗不會導致 API 返回錯誤
- **超時**: 如果計算超過 30 秒，會被自動終止（FastAPI 預設）

## 未來優化

### 1. 批次更新

目前每個事件觸發一次更新。可以改為：
- 收集 5 分鐘內的所有事件
- 批次更新所有受影響的用戶

### 2. 增量更新

目前每次都重新計算所有 500 個事件。可以改為：
- 只計算新增的事件
- 增量更新技能分數

### 3. 機器學習模型

目前使用固定的權重映射。可以改為：
- 訓練 ML 模型預測技能掌握度
- 基於用戶的實際滑雪表現調整權重

## 相關文件

- [CASI Skill Analyzer 源碼](../../platform/user_core/services/casi_skill_analyzer.py)
- [BehaviorEvent API](../../platform/user_core/api/behavior_events.py)
- [單板教學整合文檔](../單板教學/docs/USER_CORE_INTEGRATION.md)
- [事件映射表](../單板教學/docs/EVENT_MAPPING.md)
- [Snowbuddy Matching 架構](../snowbuddy-matching/ARCHITECTURE.md)

---

**創建時間**: 2025-12-02  
**最後更新**: 2025-12-02  
**維護者**: Platform Team
