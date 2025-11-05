# Phase 0 Research: Unified Rider Identity Core

**Date**: 2025-10-14  
**Inputs**: `mindmap.md`, `LINUS_GUIDE.md`, `.specify/memory/constitution.md`, `PROJECTS.md`

## 1. Current State Assessment

- **Data Sources**  
  - `members-*.csv`, `student_orders_final_with_details*.csv`（位於根目錄）包含學員基本資料、課程紀錄與聯絡資訊。  
  - `orders*.csv/json/sql` 系列檔案存放課程訂單，可能是 user-core 的歷史來源之一。  
  - `mail/`, `已分析mail/` 及 `04_郵件系統與客戶數據` 底下報表，提供過去推播或通知資訊。  
  - `skidiy.db` / `skidiy_orders*.sql`：現行 SQLite 版本的資料庫，需確認是否存在唯一使用者表。
- **Identity Handling**  
  - 目前可能依據 email、手機或姓名組合辨識使用者，缺乏統一 `User ID`。  
  - mindmap 顯示需要支援教練/學生雙重身份，但現行資料尚未確認是否已有此欄位。
- **Event Logging**  
  - 各 Python 腳本 (`process_crm_data.py`, `generate_*_report.py` 等) 自行處理不同事件，缺乏統一 schema。  
  - `consecutive_winter_emails.md`, `cross_system_analysis.py` 等檔案顯示需求分散，未有中央事件管道。
- **Notification Preferences**  
  - 尚未發現正式的偏好設定表，推播多半以 ad-hoc 腳本發送；稍後需確認 `mailbyp` 相關資料夾。

## 2. Stakeholders & Dependencies

- **Primary Stakeholders**:  
  - 營運/客服人員：需要快速查詢使用者主檔。  
  - 教練團隊：需要確保排課與身份資訊同步。  
  - Data/報表團隊：依賴統一事件記錄產生報表。  
  - 其他子專案負責人：`coach-scheduling`, `snowbuddy-matching`, `gear-ops`, `resort-services`, `knowledge-engagement`。
- **Upstream Dependencies**:  
  - 現有資料匯入流程（CSV/DB）。  
  - 既有腳本的識別邏輯（需要盤點當前判定唯一使用者的欄位）。
- **Downstream Consumers**:  
  - 所有專案需以 `User ID` 作為主鍵，並透過 API 或資料匯出取得主檔、事件、偏好。  
  - 推播系統需能訂閱主檔/偏好變更。

## 3. Risks & Unknowns

- **資料整合風險**：不同來源對使用者欄位命名、格式可能不一致，合併時需制定清洗規則。  
- **重複帳號**：缺乏唯一識別時，合併流程尚不明確。  
- **跨國身分合規**：不同國家（台灣/香港/中國/日本/國際）對個資保存與遮罩規範不同，需要定義 UserLocaleProfile 的儲存策略。  
- **遷移策略**：必須在不中斷既有腳本的情況下導入新 `User ID`；需考慮雙寫或軟啟動。  
- **隱私與授權**：推播偏好需要符合使用者授權記錄；現有資料是否有同意紀錄需確認。  
- **技術棧決策**：尚未決定最終實作語言與框架，須確認與現有基礎設施兼容。

## 4. Open Questions

1. 現有資料是否已有「會員編號」可作為 `User ID` 轉換基礎？  
2. 既有系統是否允許暫時雙寫（老資料與 user-core 同步）？  
3. 推播偏好目前如何紀錄（若無，需要新增 consent 資料來源）？  
4. 行為事件預期支援哪些類型？是否需要事件型錄（event catalog）？  
5. 各國身份資訊（TW/HK/CN/JP/International）需保留哪些欄位與遮罩規範？  
6. 部署環境與 CI/CD 流程如何安排（容器、伺服器或雲服務）？

## 5. Next Research Actions

- 盤點 `members-*.csv` 與 `skidiy.db` 的欄位，確認可用作 `User ID` 的欄位與重複情況。  
- 記錄既有腳本對使用者資料的存取方式，確定遷移時需調整的接觸點。  
- 收集任何推播相關檔案或 API 存在與否，確定偏好管理需求的初始資料。  
- 設計初版事件類別與 schema 草案，供各子專案討論。
