# 釐清問題

規格敘述有 `toggle`，但資料模型為 `status`（opt-in/opt-out/paused）。是否統一為 `status`？或保留 `toggle` 作為布林並如何對應？

# 定位

ERM：Entity `NotificationPreference` 的屬性 `status` vs 規格 `toggle`

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 統一使用 `status`，移除 `toggle` 描述 |
| B | 同時保留，`toggle=true` 對應 `opt-in`，`false` 對應 `opt-out`（`paused` 時如何表達？） |
| C | 僅使用 `toggle` + `paused` 旗標（雙欄位） |
| Short | 其他（<=5 字） |

# 影響範圍

- API 輸入/輸出一致性
- 前端設定介面與文案
- 既有事件與稽核紀錄欄位命名

# 優先級

High

---
# 解決記錄

- **回答**：A - 完全統一為 `status`（`opt-in`/`opt-out`/`paused`）
- **更新的規格檔**：spec/spec.md（Key Entities）
- **變更內容**：將 `NotificationPreference` 的 `toggle` 敘述改為 `status`，並註明允許值集合
