# ResortMatcher 數據說明

## 📁 文件列表

1. **resorts_for_matcher.json** - 43個雪場的完整數據（ResortMatcher格式）
2. **matcher_input_example.json** - 輸入範例

## 📊 數據結構

### 雪場數據欄位

每個雪場包含以下欄位：

```json
{
  "id": "hokkaido_niseko_moiwa",
  "name": "二世谷Moiwa滑雪場",
  "name_en": "Niseko Moiwa Ski Resort",
  "name_ja": "ニセコモイワスキー場",
  "country": "JP",
  "region": "Hokkaido",
  "open_months": [11, 12, 1, 2, 3],
  "skill_mix": ["beginner", "intermediate", "advanced"],
  "night_skiing": false,
  "lifts": 3,
  "courses_total": 8,
  "longest_run": 2.0,
  "vertical_drop": 450,
  "beginner_ratio": 0.3,
  "intermediate_ratio": 0.4,
  "advanced_ratio": 0.3,
  "powder_bias": "high",
  "budget_level": 4,
  "family_kids": false,
  "apres_non_ski": true,
  "crowd_level": 2,
  "highlights": ["粉雪", "人潮稀少", "私人感", "樹林滑雪"],
  "tagline": "享受ニセコ的優質粉雪，體驗私人般的滑雪時光。",
  "pass": [],
  "lessons_languages": []
}
```

### 欄位說明

#### 完整欄位（已自動填充）

- **id**: 雪場唯一識別碼
- **name**: 中文名稱
- **name_en**: 英文名稱
- **name_ja**: 日文名稱
- **country**: 國家代碼（JP）
- **region**: 地區（如 Hokkaido, Nagano等）
- **open_months**: 開放月份陣列（1-12）
- **skill_mix**: 技能等級組合 `["beginner", "intermediate", "advanced"]`
- **night_skiing**: 是否有夜滑（布林值）
- **lifts**: 纜車數量
- **courses_total**: 雪道總數
- **longest_run**: 最長雪道（公里）
- **vertical_drop**: 垂直落差（米）
- **beginner_ratio**: 初級雪道比例（0-1）
- **intermediate_ratio**: 中級雪道比例（0-1）
- **advanced_ratio**: 高級雪道比例（0-1）
- **powder_bias**: 粉雪偏好 `"low"|"medium"|"high"`
- **budget_level**: 預算等級（1=最省，5=最貴）
- **family_kids**: 是否家庭友善（布林值）
- **apres_non_ski**: 是否有溫泉/餐飲設施（布林值）
- **crowd_level**: 人潮等級（1=少，5=多）
- **highlights**: 特色亮點（字串陣列）
- **tagline**: 一句話描述

#### 需要手動補充的欄位

- **pass**: 通行證 `["Ikon", "Epic"]` 等（目前為空陣列 `[]`）
- **lessons_languages**: 教學語言 `["Japanese", "English", "Chinese"]` 等（目前為空陣列 `[]`）

## 🔧 自動估算邏輯

### powder_bias（粉雪偏好）
- 檢查描述中的關鍵字：「粉雪」、「powder」、「champagne」
- 北海道地區預設為 `"high"`
- 其他地區預設為 `"medium"`

### budget_level（預算等級）
根據1日券價格：
- < 4000日圓 → 2
- 4000-6000日圓 → 3
- 6000-8000日圓 → 4
- > 8000日圓 → 5

### family_kids（家庭友善）
檢查設施和描述中的關鍵字：
- 「kids」、「family」、「children」、「家庭」、「親子」

### apres_non_ski（溫泉/餐飲）
檢查設施中是否包含：
- 「onsen」、「溫泉」、「restaurant」

### crowd_level（人潮等級）
- 描述中有「人潮稀少」、「私人」→ 2
- 描述中有「熱門」、「知名」→ 4
- 知名雪場（Niseko, Hakuba, Rusutsu等）→ 4
- 其他 → 3（預設）

## 📝 使用方式

### 1. 準備輸入數據

```json
{
  "resorts": [
    /* 從 resorts_for_matcher.json 複製雪場陣列 */
  ],
  "user_query": "想去北海道，2月出發，家庭友善，預算中高",
  "top_k": 3,
  "output_lang": "zh-Hant",
  "score_threshold": 55
}
```

### 2. 可選：使用結構化偏好

也可以直接提供結構化的偏好（不用自由文字）：

```json
{
  "resorts": [...],
  "user_query": "",
  "recognized_preferences": {
    "region": "Hokkaido",
    "trip_months": [2],
    "family_kids": true,
    "budget_level": [4, 5],
    "powder_bias": "high",
    "night_skiing": true,
    "REQUIRED": ["region", "trip_months"]
  },
  "top_k": 3,
  "output_lang": "zh-Hant",
  "score_threshold": 55
}
```

### 3. 必須條件（REQUIRED）

如果某些條件是必須的（不符合就拒絕），可以設定 `REQUIRED`：

```json
{
  "recognized_preferences": {
    "region": "Hokkaido",
    "pass_required": ["Ikon"],
    "REQUIRED": ["region", "pass_required"]
  }
}
```

## 🎯 預期輸出格式

ResortMatcher 會返回一個 JSON 物件：

```json
{
  "locale": "zh-Hant",
  "query_lang": "zh-Hant",
  "recognized_preferences": {
    "region": "Hokkaido",
    "trip_months": 2,
    "family_kids": true,
    "budget_level": [3, 4],
    "powder_bias": "high"
  },
  "weights_used": {
    "travel_time": 0.22,
    "budget_level": 0.14,
    "skill_fit": 0.16,
    "snow_quality": 0.12,
    "season_timing": 0.08,
    "family_kids": 0.07,
    "night_skiing": 0.03
  },
  "no_match": false,
  "results": [
    {
      "id": "hokkaido_niseko_moiwa",
      "name": "二世谷Moiwa滑雪場",
      "score": 88.5,
      "reasons": ["粉雪機率高", "家庭友善", "預算符合"],
      "matched": ["region", "powder_bias", "family_kids"],
      "unmet": [],
      "unknown": ["pass", "lessons_languages"]
    }
  ],
  "rejected": [],
  "checks": [
    {"rule": "results_in_provided_list", "status": "passed"},
    {"rule": "schema_valid", "status": "passed"}
  ],
  "notes": "僅依提供欄位評估；pass 和 lessons_languages 缺資料。"
}
```

## 🔄 重新生成數據

如果需要更新數據，執行：

```bash
python3 scripts/export_resorts_for_matcher.py
```

## 📌 注意事項

1. **通行證資訊（pass）**：目前所有雪場的 `pass` 欄位都是空陣列 `[]`，需要手動補充
2. **教學語言（lessons_languages）**：目前所有雪場的 `lessons_languages` 欄位都是空陣列 `[]`，需要手動補充
3. 其他欄位都已自動從原始數據轉換和估算

## 📊 數據統計

- **總雪場數**: 43
- **涵蓋地區**:
  - Hokkaido（北海道）: 5個
  - Nagano（長野）: 13個
  - Niigata（新潟）: 16個
  - Yamagata（山形）: 1個
  - Fukushima（福島）: 2個
  - Gunma（群馬）: 4個
  - Iwate（岩手）: 2個
  - Tochigi（栃木）: 2個

- **粉雪等級分佈**:
  - high: ~20個（主要是北海道和部分長野雪場）
  - medium: ~23個

- **預算等級分佈**:
  - 等級2: ~0個
  - 等級3: ~25個
  - 等級4: ~15個
  - 等級5: ~3個

- **夜滑**:
  - 有夜滑: ~15個
  - 無夜滑: ~28個
