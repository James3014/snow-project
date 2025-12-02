# Snowbuddy Matching - 功能說明

## 新功能：知識媒合 (Knowledge-based Matching)

### 概述
系統現在支援基於知識測驗分數的媒合，讓使用者可以找到技能水平相近的雪伴。

### 使用方式

#### 1. 啟用知識媒合

在發起媒合搜尋時，設定 `include_knowledge_score` 為 `true`：

```json
POST /matching/searches
{
  "skill_level_min": 3,
  "skill_level_max": 7,
  "preferred_resorts": ["resort1", "resort2"],
  "seeking_role": "buddy",
  "include_knowledge_score": true
}
```

#### 2. 不啟用知識媒合（預設）

如果不需要知識分數，可以省略該欄位或設為 `false`：

```json
POST /matching/searches
{
  "skill_level_min": 3,
  "skill_level_max": 7,
  "preferred_resorts": ["resort1", "resort2"],
  "seeking_role": "buddy"
}
```

### 計分邏輯

#### 啟用知識分數時
總分 = 技能分數 × 0.3 + 地點分數 × 0.25 + 時間分數 × 0.2 + 角色分數 × 0.15 + **知識分數 × 0.1**

#### 未啟用知識分數時
總分 = 技能分數 × 0.325 + 地點分數 × 0.275 + 時間分數 × 0.225 + 角色分數 × 0.175

（知識權重 0.1 平均分配到其他維度）

### 知識分數計算

知識分數基於雙方在 knowledge-engagement 服務中的 `overall_score`：

- **相似度計算**: `1.0 - (|分數差異| / 100)`
- **範例**:
  - 你: 80 分, 候選人: 85 分 → 知識分數 0.95 (高度相似)
  - 你: 80 分, 候選人: 50 分 → 知識分數 0.70 (中度相似)
  - 你: 80 分, 候選人: 20 分 → 知識分數 0.40 (低度相似)

### 資料缺失處理

- 如果你或候選人沒有知識測驗分數，該候選人的知識分數為 0.5（中性）
- 不會因為缺少知識分數而排除候選人

---

## 優化功能：智慧候選人過濾

### 概述
系統現在會在計分前先過濾候選人，大幅提升效能。

### 過濾條件

系統會自動排除以下候選人：
1. 搜尋者本人
2. 設定為不願被媒合的使用者 (`open_to_matching: false`)
3. 技能等級不在指定範圍內
4. 地點偏好完全不重疊（如果有指定地點偏好）

### 效能提升

**範例場景:**
- 資料庫中有 1000 個使用者
- 你的技能範圍: 3-7 級
- 你的偏好雪場: 苗場、白馬

**過濾結果:**
- 排除 800 個技能不符的使用者
- 排除 150 個地點不符的使用者
- 只對 50 個符合條件的候選人進行詳細計分

**效能提升: ~95% 的計算量減少**

---

## API 變更

### MatchingPreference 模型

新增欄位:
```python
include_knowledge_score: bool = False  # 是否包含知識分數
```

### 向後兼容性

✅ 所有現有 API 呼叫都能正常運作  
✅ 不需要修改現有程式碼  
✅ 新功能為選擇性啟用

---

## 環境變數

新增環境變數用於配置 knowledge-engagement 服務：

```bash
KNOWLEDGE_ENGAGEMENT_API_URL=http://localhost:8003
```

預設值: `http://localhost:8003`

---

## 使用建議

### 何時啟用知識分數？

**建議啟用:**
- 尋找教練或學生時
- 希望找到理論知識相近的雪伴
- 重視學習進度的一致性

**建議不啟用:**
- 只是想找人一起滑雪
- 更重視地點和時間的配合
- 候選人可能沒有完成知識測驗

### 最佳實踐

1. **首次搜尋**: 不啟用知識分數，獲得更多候選人
2. **精確搜尋**: 啟用知識分數，找到最匹配的雪伴
3. **混合策略**: 先用寬鬆條件搜尋，再用嚴格條件篩選

---

## 範例場景

### 場景 1: 尋找教練

```json
POST /matching/searches
{
  "skill_level_min": 7,
  "skill_level_max": 10,
  "preferred_resorts": ["niseko"],
  "seeking_role": "coach",
  "include_knowledge_score": true
}
```

**結果**: 找到技能高、知識豐富、在 Niseko 的教練

### 場景 2: 尋找同級雪伴

```json
POST /matching/searches
{
  "skill_level_min": 4,
  "skill_level_max": 6,
  "preferred_regions": ["hokkaido"],
  "availability": ["2025-01-15", "2025-01-16"],
  "seeking_role": "buddy",
  "include_knowledge_score": false
}
```

**結果**: 找到中級、在北海道、時間配合的雪伴（不考慮知識分數）

### 場景 3: 學習小組

```json
POST /matching/searches
{
  "skill_level_min": 3,
  "skill_level_max": 5,
  "seeking_role": "student",
  "include_knowledge_score": true
}
```

**結果**: 找到初中級、知識水平相近的學習夥伴

---

## 監控與除錯

### 日誌訊息

系統會紀錄以下資訊：
- 過濾前後的候選人數量
- 知識服務呼叫失敗（如果有）
- 無效的候選人資料

### 常見問題

**Q: 為什麼沒有候選人？**
A: 檢查過濾條件是否太嚴格，嘗試放寬技能範圍或地點限制

**Q: 知識分數都是 0.5？**
A: 候選人可能沒有完成知識測驗，考慮不啟用知識分數

**Q: 搜尋很慢？**
A: 檢查是否有大量候選人，系統會自動過濾但仍需時間處理

---

## 未來規劃

- [ ] 批次知識查詢 API
- [ ] 知識分數快取
- [ ] 自訂權重配置
- [ ] 機器學習優化
- [ ] 即時推薦通知

---

## 技術支援

如有問題，請查看：
- `COMPLETION_REPORT.md` - 詳細技術文件
- `tasks.md` - 任務追蹤
- `plan.md` - 架構設計

或聯繫開發團隊。
