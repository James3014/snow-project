# 釐清問題

UserProfile 的角色（學生、教練、雙重身份）應以 JSON 陣列儲存，或改為正規化（獨立關聯表）？

# 定位

ERM：Entity `UserProfile` 的屬性 `roles`

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 維持 JSON 陣列（快速、彈性，但缺少約束與查詢效能） |
| B | 正規化為 `user_roles(user_id, role)` 關聯表（具唯一性與查詢優勢） |
| C | 使用 ENUM 陣列（限制可用值，但仍在同表中） |
| Short | 其他（<=5 字） |

# 影響範圍

- 查詢效能與索引策略（依角色篩選）
- 角色變更的稽核與事件發布
- 與 `coach_cert_level` 欄位的完整性（僅 coach 需要）

# 優先級

High

---
# 解決紀錄

- **回答**：B - 正規化為 `user_roles(user_id, role)` 關聯表
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：自 `user_profiles` 移除 `roles json`，新增 `user_roles(user_id, role)` 並加上 (user_id, role) 唯一索引與外鍵關聯
