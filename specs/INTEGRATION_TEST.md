# 完整數據流程測試

## 流程概覽

```
單板教學 App
  ↓ 用戶完成練習
trackEvent('practice_complete', lesson_id, { rating: 4 })
  ↓ 批次同步（每 5 秒或 10 個事件）
user-core POST /behavior-events
  ↓ 寫入 behavior_events 表
  ↓ 觸發後台任務（非阻塞）
CASI Skill Analyzer
  ↓ 查詢最近 500 個練習事件
  ↓ 計算 5 項 CASI 技能 (0.0-1.0)
  ↓ 更新 casi_skill_profiles 表
  ↓ 計算平均分數 → skill_level (1-10)
  ↓ 更新 user_profiles.skill_level
snowbuddy-matching
  ↓ 用戶發起智慧媒合
  ↓ 查詢 user_profiles.skill_level
  ↓ 查詢 casi_skill_profiles
  ↓ 計算配對分數
  ↓ 返回媒合結果
```

---

## 測試步驟

### Step 1: 單板教學 - 完成練習

**操作**: 在單板教學 App 完成一個練習

**預期行為**:
```javascript
// 前端調用
trackEvent('practice_complete', 'H001_basic_stance', {
  rating: 4,
  duration: 300,
  notes: '今天練習很順利'
});

// 批次同步到 user-core
queueEventSync(userId, 'snowboard.practice.completed', {
  lesson_id: 'H001_basic_stance',
  rating: 4,
  duration: 300,
  notes: '今天練習很順利',
  original_event_type: 'practice_complete'
});
```

**驗證**:
```bash
# 檢查瀏覽器控制台
# 應該看到: [UserCoreSync] Event synced: snowboard.practice.completed
```

---

### Step 2: user-core - 接收事件

**API**: `POST https://user-core.zeabur.app/behavior-events`

**請求**:
```json
{
  "user_id": "test-user-123",
  "source_project": "snowboard-teaching",
  "event_type": "snowboard.practice.completed",
  "occurred_at": "2025-12-02T09:00:00Z",
  "payload": {
    "lesson_id": "H001_basic_stance",
    "rating": 4,
    "original_event_type": "practice_complete"
  }
}
```

**測試命令**:
```bash
curl -X POST https://user-core.zeabur.app/behavior-events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "test-user-123",
    "source_project": "snowboard-teaching",
    "event_type": "snowboard.practice.completed",
    "occurred_at": "2025-12-02T09:00:00Z",
    "payload": {
      "lesson_id": "H001_basic_stance",
      "rating": 4
    }
  }'
```

**預期回應**:
```json
{
  "event_id": "uuid-456",
  "user_id": "test-user-123",
  "event_type": "snowboard.practice.completed",
  "occurred_at": "2025-12-02T09:00:00Z"
}
```

**驗證**:
```bash
# 檢查 user-core 日誌
# 應該看到: [CASI Sync] Updated skill profile for user test-user-123
```

---

### Step 3: CASI Skill Analyzer - 自動觸發

**觸發條件**:
- ✅ source_project == "snowboard-teaching"
- ✅ event_type == "snowboard.practice.completed"

**執行流程**:
1. 查詢最近 500 個練習事件
2. 過濾 `lesson_completed`, `practice_session`, `drill_completed`
3. 根據 LESSON_SKILL_MAPPING 計算技能分數
4. 更新 `casi_skill_profiles` 表
5. 計算平均分數並更新 `user_profiles.skill_level`

**驗證 - 查詢 CASI 技能檔案**:
```bash
curl https://user-core.zeabur.app/buddy-matching/casi-profile/test-user-123
```

**預期回應**:
```json
{
  "user_id": "test-user-123",
  "stance_balance": 0.65,
  "rotation": 0.50,
  "edging": 0.60,
  "pressure": 0.55,
  "timing_coordination": 0.58,
  "updated_at": "2025-12-02T09:00:05Z"
}
```

**驗證 - 查詢 skill_level**:
```bash
curl https://user-core.zeabur.app/users/test-user-123
```

**預期回應**:
```json
{
  "user_id": "test-user-123",
  "display_name": "測試用戶",
  "skill_level": 6,  // (0.65+0.50+0.60+0.55+0.58)/5 * 10 = 5.76 → 6
  "preferred_resorts": ["niseko", "hakuba"]
}
```

---

### Step 4: snowbuddy-matching - 智慧媒合

**API**: `POST https://snowbuddy-matching.zeabur.app/matching/searches`

**請求**:
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

**測試命令**:
```bash
# 1. 發起搜尋
SEARCH_ID=$(curl -X POST https://snowbuddy-matching.zeabur.app/matching/searches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "preferred_resorts": ["niseko", "hakuba"],
    "date_range": {
      "start": "2025-01-15",
      "end": "2025-01-20"
    },
    "skill_level_range": [5, 8],
    "preferred_role": "buddy"
  }' | jq -r '.search_id')

echo "Search ID: $SEARCH_ID"

# 2. 查詢結果（等待 2 秒）
sleep 2
curl https://snowbuddy-matching.zeabur.app/matching/searches/$SEARCH_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**預期回應**:
```json
{
  "status": "completed",
  "matches": [
    {
      "user_id": "user-789",
      "score": 0.85,
      "breakdown": {
        "skill_score": 0.90,
        "location_score": 1.0,
        "time_score": 0.80,
        "role_score": 1.0,
        "knowledge_score": 0.70
      }
    }
  ]
}
```

---

## 完整測試腳本

```bash
#!/bin/bash
# 完整流程測試腳本

set -e

echo "🧪 開始完整流程測試..."
echo ""

# 配置
USER_CORE_URL="https://user-core.zeabur.app"
SNOWBUDDY_URL="https://snowbuddy-matching.zeabur.app"
TEST_USER_ID="test-user-$(date +%s)"
TOKEN="YOUR_TOKEN_HERE"

echo "📝 測試用戶: $TEST_USER_ID"
echo ""

# Step 1: 發送練習完成事件
echo "Step 1: 發送練習完成事件..."
curl -X POST $USER_CORE_URL/behavior-events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"user_id\": \"$TEST_USER_ID\",
    \"source_project\": \"snowboard-teaching\",
    \"event_type\": \"snowboard.practice.completed\",
    \"occurred_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"payload\": {
      \"lesson_id\": \"H001_basic_stance\",
      \"rating\": 4
    }
  }"
echo ""
echo "✅ 事件已發送"
echo ""

# Step 2: 等待 CASI 分析完成
echo "Step 2: 等待 CASI 分析（5 秒）..."
sleep 5
echo ""

# Step 3: 查詢 CASI 技能檔案
echo "Step 3: 查詢 CASI 技能檔案..."
CASI_PROFILE=$(curl -s $USER_CORE_URL/buddy-matching/casi-profile/$TEST_USER_ID \
  -H "Authorization: Bearer $TOKEN")
echo "$CASI_PROFILE" | jq '.'
echo ""

# Step 4: 查詢 skill_level
echo "Step 4: 查詢 skill_level..."
USER_PROFILE=$(curl -s $USER_CORE_URL/users/$TEST_USER_ID \
  -H "Authorization: Bearer $TOKEN")
SKILL_LEVEL=$(echo "$USER_PROFILE" | jq -r '.skill_level')
echo "Skill Level: $SKILL_LEVEL"
echo ""

# Step 5: 發起智慧媒合
echo "Step 5: 發起智慧媒合..."
SEARCH_RESPONSE=$(curl -s -X POST $SNOWBUDDY_URL/matching/searches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "preferred_resorts": ["niseko"],
    "date_range": {
      "start": "2025-01-15",
      "end": "2025-01-20"
    },
    "skill_level_range": [1, 10],
    "preferred_role": "buddy"
  }')
SEARCH_ID=$(echo "$SEARCH_RESPONSE" | jq -r '.search_id')
echo "Search ID: $SEARCH_ID"
echo ""

# Step 6: 查詢媒合結果
echo "Step 6: 查詢媒合結果（等待 3 秒）..."
sleep 3
MATCH_RESULTS=$(curl -s $SNOWBUDDY_URL/matching/searches/$SEARCH_ID \
  -H "Authorization: Bearer $TOKEN")
echo "$MATCH_RESULTS" | jq '.'
echo ""

echo "✅ 測試完成！"
```

---

## 潛在問題檢查

### 問題 1: 事件沒有觸發 CASI 分析

**檢查**:
```bash
# 查詢事件是否寫入
curl https://user-core.zeabur.app/behavior-events/by-user/$USER_ID?sort_by=occurred_at&limit=10

# 檢查事件類型
# 必須是: source_project="snowboard-teaching" AND event_type="snowboard.practice.completed"
```

**可能原因**:
- ❌ event_type 拼寫錯誤
- ❌ source_project 不是 "snowboard-teaching"
- ❌ 後台任務執行失敗

**解決**:
```bash
# 檢查 user-core 日誌
grep "CASI Sync" /var/log/user-core.log
```

---

### 問題 2: CASI 技能檔案沒有更新

**檢查**:
```sql
-- 查詢 casi_skill_profiles 表
SELECT * FROM casi_skill_profiles WHERE user_id = 'test-user-123';

-- 查詢最近更新時間
SELECT user_id, updated_at FROM casi_skill_profiles 
WHERE user_id = 'test-user-123';
```

**可能原因**:
- ❌ 節流機制（30 分鐘內不重複更新）
- ❌ 沒有足夠的練習事件（需要至少 1 個）
- ❌ lesson_id 不在 LESSON_SKILL_MAPPING 中

**解決**:
```python
# 手動觸發更新
from services.casi_skill_analyzer import update_casi_profile_task
update_casi_profile_task('test-user-123')
```

---

### 問題 3: skill_level 沒有同步

**檢查**:
```sql
-- 查詢 user_profiles.skill_level
SELECT user_id, skill_level FROM user_profiles 
WHERE user_id = 'test-user-123';
```

**可能原因**:
- ❌ skill_level 還是 String 類型（migration 沒執行）
- ❌ CASI 分析器沒有更新 user_profiles

**解決**:
```bash
# 執行 migration
cd platform/user_core
alembic upgrade head
```

---

### 問題 4: snowbuddy-matching 查詢不到資料

**檢查**:
```bash
# 測試 user-core 連接
curl https://user-core.zeabur.app/users/test-user-123

# 測試 snowbuddy-matching 健康檢查
curl https://snowbuddy-matching.zeabur.app/health
```

**可能原因**:
- ❌ snowbuddy-matching 服務沒有部署
- ❌ user-core 連接失敗
- ❌ 沒有符合條件的用戶

---

## 驗收標準

- [ ] 單板教學事件成功發送到 user-core
- [ ] user-core 成功寫入 behavior_events 表
- [ ] CASI Skill Analyzer 自動觸發
- [ ] casi_skill_profiles 表成功更新
- [ ] user_profiles.skill_level 成功更新（Integer 類型）
- [ ] snowbuddy-matching 可以查詢到 skill_level
- [ ] 智慧媒合返回正確的配對分數

---

**創建時間**: 2025-12-02  
**測試環境**: 開發/生產
