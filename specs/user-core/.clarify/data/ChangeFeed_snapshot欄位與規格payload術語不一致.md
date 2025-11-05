# 釐清問題

ChangeFeed 模型使用 `snapshot`，但規格 Key Entities 使用 `payload`。是否應統一為 `snapshot` 或 `payload`？

# 定位

ERM：Entity `ChangeFeed` 的屬性命名（`snapshot`）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 統一使用 `snapshot`（表示變更後快照） |
| B | 統一使用 `payload`（沿用事件術語） |
| C | `payload` = 差異，`snapshot` = 完整狀態（雙欄位並存） |
| Short | 其他（<=5 字） |

# 影響範圍

- 發布/訂閱方的欄位解讀
- 事件契約版本化策略
- 文件與測試案例的欄位名稱

# 優先級

Medium

---
# 解決記錄

- **回答**：B - 統一使用 `payload`
- **更新的規格檔**：spec/erm.dbml（`change_feed.snapshot` → `payload`）
- **變更內容**：以通用事件術語 `payload` 代表變更承載資料，與其他事件欄位一致
