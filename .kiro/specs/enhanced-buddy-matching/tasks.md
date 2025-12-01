# 實作計畫 - 加強雪伴匹配功能

本文件將設計轉換為可執行的開發任務。每個任務都是獨立的、可測試的實作步驟。

## 整合策略

本實作計畫採用**合併方向**，整合以下兩個核心功能：

1. **行程匹配**（基於 requirements.md 和 design.md）
   - 時間相容性匹配
   - 地點相容性匹配
   - 社交連結匹配

2. **學習數據匹配**（基於 SNOWBOARD_TEACHING_INTEGRATION.md）
   - 技能等級匹配（從 user-core 獲取）
   - 學習進度匹配（從練習事件分析）
   - 練習評分匹配（從評分數據計算）
   - 學習興趣匹配（從搜尋和收藏分析）
   - CASI 技能相似度
   - 學習焦點相似度

### 實施階段

**Phase 1: 基礎設施** (Tasks 1-4)
- 資料庫 Schema
- User Core API 客戶端
- CASI 技能分析器
- 學習焦點追蹤器整合

**Phase 2: 核心匹配** (Tasks 5-9)
- 候選人過濾
- 多維度計分（行程 + 學習數據）
- 匹配快取
- 核心匹配服務

**Phase 3: 業務邏輯** (Tasks 10-16)
- 自動觸發
- 雪伴請求管理
- 公開行程探索
- 匹配結果 API
- 非同步處理

**Phase 4: 前端與優化** (Tasks 17-24)
- 前端整合
- 效能優化
- 監控與日誌
- 文檔與部署

## 任務列表

- [x] 1. 資料庫 Schema 擴展
  - 新增 casi_skill_profiles 表儲存使用者的 CASI 技能掌握度
  - 新增 match_search_cache 表儲存匹配搜尋快取
  - 為 users 表新增 skill_level 欄位
  - 建立必要的索引以優化查詢效能
  - _Requirements: 10.1, 7.4_

- [x] 1.1 撰寫資料庫遷移測試
  - 測試 Schema 創建成功
  - 測試約束條件正確（如技能值範圍 0-1）
  - 測試索引存在
  - _Requirements: 10.1_

- [x] 2. 實作 User Core API 客戶端打
  - 建立 UserCoreClient 類別
  - 實作 get_user_events() 方法查詢學習事件
  - 實作 get_user_profile() 方法獲取使用者資料
  - 實作 get_users() 方法批次查詢使用者
  - 添加錯誤處理和重試邏輯
  - _Requirements: 10.1, 11.1_

- [x] 2.1 撰寫 User Core Client 的單元測試
  - 測試 API 調用成功情況
  - 測試錯誤處理（網路錯誤、API 錯誤）
  - 測試重試邏輯
  - _Requirements: 10.1_

- [x] 3. 實作 CASI 技能分析器
  - 建立 CASISkillAnalyzer 類別
  - 實作 get_skill_profile() 方法（從資料庫或事件獲取）
  - 實作 update_skill_profile_from_events() 從練習事件推斷技能
  - 實作 calculate_skill_similarity() 方法計算相似度
  - 實作課程到技能的映射邏輯
  - _Requirements: 10.1, 10.2_

- [x] 3.1 撰寫 CASI 技能分析器的屬性測試
  - **Property 14: CASI 技能記錄**
  - **Validates: Requirements 10.1**
  - 測試從事件推斷技能掌握度
  - 測試技能值始終在 0-1 範圍內

- [x] 3.2 撰寫技能相似度計算的屬性測試
  - **Property 15: CASI 技能相似度加分**
  - **Validates: Requirements 10.3**
  - 測試相似度計算的對稱性
  - 測試相同技能檔案的相似度為 1.0

- [x] 4. 整合學習焦點追蹤器與 User Core
  - 更新 LearningFocusTracker 使用 UserCoreClient
  - 實作 _get_recent_practice_lessons() 從 API 獲取練習記錄
  - 實作 _get_favorite_lessons() 從 API 獲取收藏
  - 實作 _analyze_skill_trend() 從評分趨勢分析技能發展
  - 實作課程到技能的映射
  - _Requirements: 11.1, 11.3_

- [x] 4.1 撰寫學習焦點整合的單元測試
  - 測試從 API 事件正確提取學習焦點
  - 測試課程映射邏輯
  - 測試技能趨勢分析
  - _Requirements: 11.1_

- [x] 5. 實作候選人過濾邏輯
  - 建立 filter_candidates() 函式
  - 實作封鎖過濾（排除已封鎖或被封鎖的使用者）
  - 實作技能等級過濾（只包含範圍內的使用者）
  - 實作地點過濾（至少有一個重疊的偏好雪場）
  - 實作時間過濾（可用時間與搜尋者日期重疊）
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5.1 撰寫候選人過濾的屬性測試
  - **Property 2: 候選人過濾完整性**
  - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
  - 測試過濾後的候選人滿足所有條件
  - 測試封鎖使用者被正確排除

- [x] 5.2 撰寫封鎖過濾的屬性測試
  - **Property 10: 封鎖過濾**
  - **Validates: Requirements 2.2, 8.3**
  - 測試封鎖關係的雙向過濾

- [x] 6. 實作多維度計分系統（基礎）
  - 擴展現有的 calculate_match_score() 函式
  - 實作 calculate_time_score() - 時間相容性計分（最高 40 分）
  - 實作 calculate_location_score() - 地點相容性計分（最高 30 分）
  - 實作 calculate_skill_score() - 技能等級計分（最高 20 分）
  - 實作 calculate_social_score() - 社交連結計分（最高 10 分）
  - 實作分數組合邏輯和原因生成
  - _Requirements: 3.1, 3.5, 3.6_

- [x] 6.1 撰寫匹配分數範圍的屬性測試
  - **Property 3: 匹配分數組成**
  - **Validates: Requirements 3.1, 3.5**
  - 測試總分始終在 0-100 範圍內
  - 測試總分等於各維度分數之和

- [x] 6.2 撰寫完全匹配的屬性測試
  - **Property 4: 完全匹配最高分**
  - **Validates: Requirements 3.2**
  - 測試相同日期和雪場獲得最高分

- [x] 6.3 撰寫重疊天數計分的屬性測試
  - **Property 5: 重疊天數比例計分**
  - **Validates: Requirements 3.3**
  - 測試時間分數與重疊天數成正比

- [x] 6.4 撰寫技能相似度計分的屬性測試
  - **Property 13: 技能相似度計分**
  - **Validates: Requirements 9.3, 9.4**
  - 測試技能等級差距越小分數越高

- [x] 6.5 撰寫社交加分的屬性測試
  - **Property 11: 社交加分**
  - **Validates: Requirements 8.2**
  - 測試互相追蹤的使用者獲得社交加分

- [ ] 7. 實作學習數據匹配維度
  - 實作 calculate_learning_progress_score() - 學習進度匹配
  - 實作 calculate_practice_rating_score() - 練習評分匹配
  - 實作 calculate_learning_interest_score() - 學習興趣匹配
  - 整合 CASI 技能相似度到計分
  - 整合學習焦點相似度到計分
  - _Requirements: 10.2, 10.3, 11.2_

- [ ] 7.1 撰寫學習數據匹配的單元測試
  - 測試學習進度相似度計算
  - 測試練習評分相似度計算
  - 測試學習興趣重疊度計算
  - _Requirements: 10.2, 11.2_

- [ ] 8. 實作匹配快取服務
  - 建立 MatchCacheService 類別
  - 實作 get_cached_results() 方法獲取快取結果
  - 實作 cache_results() 方法儲存匹配結果
  - 實作 invalidate_cache() 方法使快取失效
  - 實作自動清理過期快取的背景任務
  - _Requirements: 7.4, 7.5_

- [ ] 8.1 撰寫快取失效的屬性測試
  - **Property 17: 快取失效**
  - **Validates: Requirements 7.5**
  - 測試行程更新後快取被正確失效

- [ ] 9. 實作核心匹配服務
  - 建立 BuddyMatchingService 類別
  - 實作 find_buddies_for_trip() 方法整合過濾和計分
  - 整合行程匹配（時間、地點）和學習數據匹配
  - 實作結果排序（按匹配分數降序）
  - 實作結果限制（預設最多 20 個候選人）
  - 整合 CASI 技能分析和學習焦點追蹤
  - _Requirements: 1.3, 3.1, 10.2, 11.2_

- [ ] 9.1 撰寫完整匹配流程的整合測試
  - 測試從行程到匹配結果的完整流程
  - 測試結果按分數正確排序
  - 測試結果數量限制
  - 測試學習數據正確整合到匹配結果
  - _Requirements: 1.3, 10.5, 11.5_

- [ ] 10. 實作自動觸發機制
  - 在 create_trip() 中新增匹配觸發邏輯
  - 檢查行程可見性和 max_buddies
  - 非同步執行匹配搜尋
  - 儲存搜尋結果到快取
  - _Requirements: 1.1, 1.2_

- [ ] 10.1 撰寫自動觸發的屬性測試
  - **Property 1: 自動觸發匹配搜尋**
  - **Validates: Requirements 1.1, 1.2**
  - 測試符合條件的行程自動觸發匹配
  - 測試私密行程不觸發匹配

- [ ] 11. 實作行程更新觸發
  - 在 update_trip() 中新增快取失效邏輯
  - 當日期或雪場更新時觸發新的匹配搜尋
  - _Requirements: 1.5, 7.5_

- [ ] 12. 實作雪伴請求管理
  - 擴展 request_to_join_trip() 方法
  - 新增重複請求檢查
  - 新增容量檢查
  - 發送行為事件到 user-core
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 12.1 撰寫請求唯一性的屬性測試
  - **Property 6: 請求唯一性**
  - **Validates: Requirements 4.4**
  - 測試重複請求被正確拒絕

- [ ] 12.2 撰寫容量限制的屬性測試
  - **Property 7: 容量限制檢查**
  - **Validates: Requirements 4.5**
  - 測試滿額行程拒絕新請求

- [ ] 13. 實作請求回應邏輯
  - 擴展 respond_to_buddy_request() 方法
  - 實作接受邏輯（更新狀態、增加計數）
  - 實作拒絕邏輯（更新狀態、記錄訊息）
  - 發送行為事件和通知
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 13.1 撰寫狀態更新一致性的屬性測試
  - **Property 8: 狀態更新一致性**
  - **Validates: Requirements 5.2**
  - 測試接受請求後狀態和計數正確更新

- [ ] 13.2 撰寫事件記錄的屬性測試
  - **Property 9: 事件記錄完整性**
  - **Validates: Requirements 4.3, 5.4**
  - 測試所有請求操作都發送事件

- [ ] 14. 實作公開行程探索 API
  - 新增 GET /trip-planning/explore-trips 端點
  - 實作多條件過濾（日期、雪場、技能等級）
  - 實作匿名化處理（隱藏敏感資訊）
  - 排除已滿額的行程
  - 標示使用者已請求的行程
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14.1 撰寫探索 API 的整合測試
  - 測試過濾條件正確應用
  - 測試匿名化處理
  - 測試滿額行程被排除
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 15. 實作匹配結果 API
  - 新增 GET /trip-planning/trips/{trip_id}/match-results 端點
  - 回傳匹配結果列表（含分數、原因、CASI 技能、學習焦點）
  - 支援分頁
  - 檢查快取，若存在則直接回傳
  - 整合學習數據到回傳結果
  - _Requirements: 1.3, 10.5, 10.6, 11.5_

- [ ] 15.1 撰寫匹配結果 API 的整合測試
  - 測試回傳正確的資料結構
  - 測試快取命中
  - 測試分頁功能
  - 測試學習數據正確顯示
  - _Requirements: 1.3, 10.5, 11.5_

- [ ] 16. 實作非同步處理
  - 使用 FastAPI BackgroundTasks 執行匹配搜尋
  - 確保多個搜尋不會互相阻塞
  - 新增任務狀態追蹤（可選）
  - _Requirements: 7.3_

- [ ] 16.1 撰寫非同步處理的屬性測試
  - **Property 18: 非同步處理**
  - **Validates: Requirements 7.3**
  - 測試多個同時搜尋不阻塞

- [ ] 17. 前端整合 - 行程詳情頁
  - 在行程詳情頁新增「推薦雪伴」區塊
  - 顯示匹配結果列表（頭像、姓名、匹配分數）
  - 顯示匹配原因（時間、地點、技能、學習數據）
  - 顯示候選人的 CASI 技能和學習焦點
  - 新增「發送雪伴請求」按鈕
  - _Requirements: 1.3, 10.5, 11.5_

- [ ] 18. 前端整合 - 雪伴請求管理
  - 新增「雪伴請求」頁面
  - 顯示收到的請求列表
  - 顯示請求者資訊和匹配分數
  - 顯示請求者的學習數據
  - 新增接受/拒絕按鈕
  - _Requirements: 5.1_

- [ ] 19. 前端整合 - 公開行程探索
  - 新增「探索行程」頁面
  - 實作篩選器（日期、雪場、技能等級）
  - 顯示行程列表（含可用名額）
  - 新增「申請加入」按鈕
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 20. 前端整合 - CASI 技能展示
  - 在使用者個人資料頁新增「技能雷達圖」
  - 顯示五項 CASI 技能的掌握度
  - 在匹配結果中顯示候選人的技能強項/弱項
  - 顯示共同可練習的課程建議
  - 顯示學習焦點和最近練習的課程
  - _Requirements: 10.5, 10.6, 11.5_

- [ ] 21. 效能優化
  - 新增資料庫索引（users.skill_level, trips.start_date, trips.resort_id）
  - 實作批次查詢減少資料庫往返
  - 實作並行計分（使用 asyncio）
  - 實作 user-core API 調用的快取
  - 新增查詢結果限制避免過載
  - _Requirements: 7.1, 7.2_

- [ ] 22. 監控與日誌
  - 新增匹配搜尋次數指標
  - 新增平均匹配時間指標
  - 新增快取命中率指標
  - 新增 user-core API 調用次數和延遲指標
  - 新增詳細的日誌記錄（搜尋、過濾、計分、API 調用）
  - 設定告警閾值（匹配時間 > 10 秒）
  - _Requirements: 7.1, 7.2_

- [ ] 23. 文檔與部署
  - 更新 API 文檔（OpenAPI/Swagger）
  - 撰寫使用者指南（如何使用雪伴匹配功能）
  - 撰寫整合文檔（單板教學數據如何影響匹配）
  - 更新部署文檔（環境變數、資料庫遷移、API 配置）
  - 準備 Rollout 計畫（灰度發布策略）

- [ ] 24. 最終檢查點
  - 確保所有測試通過（包括整合測試）
  - 確認效能指標符合需求（過濾 < 2 秒，計分 < 5 秒）
  - 驗證快取機制正常運作
  - 驗證 user-core 整合正常運作
  - 檢查日誌和監控正常
  - 進行使用者驗收測試
