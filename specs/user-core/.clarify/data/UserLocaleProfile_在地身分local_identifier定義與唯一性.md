# 釐清問題

`local_identifier` 的格式與唯一性規則為何（例：台灣身分證、香港身份證、護照）？是否需依 `country_code` 驗證、遮罩與唯一性索引？

# 定位

ERM：Entity `UserLocaleProfile` 的屬性 `local_identifier` 與 `(user_id, country_code)` 主鍵

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 僅儲存原始字串，不做驗證與唯一性 |
| B | 依 `country_code` 驗證格式並遮罩保存（PII 安全） |
| C | 依 `country_code` + `local_identifier_hash` 建唯一索引（避免重複） |
| Short | 其他（<=5 字） |

# 影響範圍

- 去重與合併流程（FR-007）
- 隱私合規（加密/遮罩、訪問控制）
- 匯入/同步流程的衝突處理

# 優先級

High

---
# 解決記錄

- **回答**：C - 依 `country_code` 驗證 + `local_identifier_hash` 唯一索引
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：於 `user_locale_profiles` 新增 `local_identifier_hash`，建立 `(country_code, local_identifier_hash)` 唯一索引；`local_identifier` 僅存遮罩
