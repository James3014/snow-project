# 🎯 Dify 多後端整合服務規劃

**優先級**: P1-P3  
**預估時間**: 6-9 週  
**ROI**: ⭐⭐⭐⭐

---

## 📋 概述

基於 SnowTrace 現有的微服務架構，設計 **11 個創新的前端服務**，每個服務整合 2-4 個後端，並由 Dify AI 提供智能決策層。

### 核心價值

將「死資料整合」轉化為「智能建議」：

```
原方案：多個後端 → 前端顯示資料 → 用戶自己判斷
+ Dify：多個後端 → Dify AI 分析 → 智能建議 → 用戶直接行動
```

---

## 📊 服務總覽

| # | 服務名稱 | 整合後端數 | 核心價值 | 優先級 | ROI |
|---|---------|-----------|---------|--------|-----|
| 1 | Trip Prep Lab | 3 | 推薦課程 → 完整學習計畫 | P1 | ⭐⭐⭐⭐⭐ |
| 2 | Buddy Skill Card | 3 | 資料展示 → 匹配分析 + 破冰建議 | P1 | ⭐⭐⭐⭐ |
| 3 | Coach Dayboard | 3 | 學生列表 → 個人化教案 + 分組建議 | P1 | ⭐⭐⭐⭐⭐ |
| 4 | Gear Readiness | 3 | 保養提醒 → 照片分析 + 店家推薦 | P2 | ⭐⭐⭐⭐ |
| 5 | Season Storyboard | 4 | 資料統計 → 個人化故事 + 成長建議 | P2 | ⭐⭐⭐ |
| 6 | Pro Growth Console | 4 | 資料視覺化 → 智能分析 + 改善建議 | P3 | ⭐⭐⭐⭐ |
| 7 | Skill-Based Trip Optimizer | 3 | 技能弱項 → 雪場推薦 + 訓練計畫 | P1 | ⭐⭐⭐⭐⭐ |
| 8 | Post-Trip Learning Report | 3 | 滑行數據 → 成長故事 + 下次建議 | P1 | ⭐⭐⭐⭐⭐ |
| 9 | Gear-Trip Compatibility | 3 | 裝備清單 → 適配分析 + 保養建議 | P2 | ⭐⭐⭐⭐ |
| 10 | Season Goal Tracker | 4 | 目標設定 → 進度追蹤 + 智能提醒 | P2 | ⭐⭐⭐⭐ |
| 11 | Buddy Skill Gap Analyzer | 3 | 雙人資料 → 互補分析 + 教學建議 | P2 | ⭐⭐⭐ |

---

## 🚀 服務詳細設計

### 1️⃣ Trip Prep Lab（AI 行前教練）

**優先級**: P1 ⭐⭐⭐⭐⭐  
**開發時間**: 5 天

#### 整合服務
- resort-services（雪場資訊）
- 單板教學（學習紀錄）
- user-core（用戶歷史）

#### 核心概念
```
出發前，一頁幫你把「要去哪＋會滑到什麼＋該練什麼」都準備好
```

#### 原方案 vs Dify 增強

**原方案（純資料整合）**:
```
resort-services: 二世谷有粉雪、樹林、陡坡
單板教學: 你完成了 15 堂初級課程
user-core: 你去過 3 個雪場

→ 前端顯示：推薦課程 lesson-45, lesson-67（規則匹配）
```

**+ Dify 後（智能分析）**:
```
Dify Agent 分析：
├── 輸入：行程（二世谷 4 天）+ 用戶歷史 + 213 堂課程
├── RAG 檢索：粉雪相關課程
├── LLM 分析：
│   「你去過的雪場都是壓雪道，二世谷粉雪多，
│    建議先練『速度控制』和『浮板技巧』。
│    第一天先在壓雪道熱身，第二天再挑戰粉雪區。」
└── 輸出：
    ├── 行前必練：lesson-45（速度控制）、lesson-67（浮板入門）
    ├── 現場建議：Day 1 藍道熱身 → Day 2 粉雪初體驗
    └── 裝備提醒：粉雪板建議寬度 > 260mm

→ 不只推薦課程，還給出「為什麼」和「怎麼安排」
```

#### Dify Workflow 設計

```yaml
名稱: AI 行前教練

輸入變數:
  - trip_id: 行程 ID
  - user_id: 用戶 ID

節點流程:
  1. [數據聚合節點]
     - HTTP 請求 1: GET resort-services/trips/{trip_id}
     - HTTP 請求 2: GET user-core/users/{user_id}/history
     - HTTP 請求 3: GET 單板教學/api/practice-logs?user_id={user_id}
  
  2. [知識庫檢索節點]
     - 知識庫: 單板教學 213 堂課程
     - 查詢: "{{resort.snow_conditions}} {{resort.terrain_features}} 相關課程"
     - Top K: 20
     - Rerank: 啟用
  
  3. [LLM 分析節點]
     - 模型: Claude 3.5 Sonnet
     - Temperature: 0.7
     - Prompt: 分析用戶行程並給出專業建議（詳見完整 Prompt）
  
  4. [條件分支節點]
     - IF 用戶是新手 AND 雪場是進階 → 添加額外警告
     - IF 用戶去過類似雪場 → 簡化建議
  
  5. [代碼節點]
     - 格式化輸出為 JSON

輸出變數:
  - recommendations: 完整建議（JSON 字串）
```

#### 前端頁面結構

```tsx
<TripPrepLab>
  <AICoachSummary />        {/* AI 教練總結 */}
  <MustPracticeLessons />   {/* 行前必練（3 堂課）*/}
  <DailyPlan />             {/* 現場滑行建議（每日）*/}
  <GearChecklist />         {/* 裝備檢查清單 */}
  <SafetyNotes />           {/* 安全注意事項 */}
  <PersonalizedTips />      {/* 個人化建議 */}
  <ActionButtons />         {/* 加入行事曆/分享/重新生成 */}
</TripPrepLab>
```

#### 價值提升對比

| 項目 | 無 Dify | + Dify | 提升 |
|------|---------|--------|------|
| 推薦深度 | 課程列表 | 完整學習計畫 + 每日安排 | ⭐⭐⭐⭐⭐ |
| 個人化 | 基於程度匹配 | 理解用戶困擾和歷史 | ⭐⭐⭐⭐⭐ |
| 可行動性 | 「看這些課程」 | 「Day 1 做什麼、Day 2 做什麼」 | ⭐⭐⭐⭐⭐ |
| 安全性 | 無 | 雪場特定安全提醒 | ⭐⭐⭐⭐ |

---

### 2️⃣ Buddy Skill Card（雪伴技能卡片）

**優先級**: P1 ⭐⭐⭐⭐  
**開發時間**: 3 天

#### 整合服務
- snowbuddy-matching（媒合資料）
- 單板教學（學習紀錄）
- user-core（用戶歷史）

#### 核心概念
```
媒合成功後，一張卡片展示：
「你們的技能互補分析 + 破冰建議」
```

#### 使用場景

```
A 和 B 媒合成功
↓
系統自動生成技能卡片：
├── 單板教學: A 後刃強（4.5/5）、換刃弱（2.5/5）
│              B 後刃弱（2.8/5）、換刃強（4.2/5）
├── user-core: A 去過 8 個雪場、B 去過 3 個雪場
├── snowbuddy-matching: 兩人都想去二世谷
↓
AI 生成卡片：
「🤝 技能互補分析
 
 A 可以教 B：
 - 後刃控制技巧（A 擅長）
 - 雪場經驗分享（A 去過更多雪場）
 
 B 可以教 A：
 - 換刃技巧（B 擅長）
 
 破冰話題：
 - 聊聊二世谷的粉雪體驗
 - 分享最喜歡的雪道
 
 第一次見面建議：
 - 先在藍道熱身，互相觀察
 - 下午各自練習弱項，互相指導」
```

#### Dify Workflow

```yaml
名稱: 雪伴技能卡片生成器

輸入:
  - user_a_id: 用戶 A
  - user_b_id: 用戶 B
  - match_id: 媒合 ID

節點:
  1. [數據聚合]
     - 查詢兩人學習紀錄（單板教學）
     - 查詢兩人歷史（user-core）
     - 查詢媒合資料（snowbuddy-matching）
  
  2. [LLM 分析]
     - 分析技能互補性
     - 生成破冰話題
     - 推薦第一次見面安排
  
  3. [輸出]
     - 技能雷達圖數據
     - 互補分析文字
     - 破冰建議
```

#### 前端頁面結構

```tsx
<BuddySkillCard>
  <SkillRadarComparison />  {/* 技能雷達圖對比 */}
  <ComplementaryAnalysis /> {/* 互補分析 */}
  <IceBreakers />           {/* 破冰話題 */}
  <FirstMeetingPlan />      {/* 第一次見面建議 */}
  <ContactButton />         {/* 聯絡按鈕 */}
</BuddySkillCard>
```

---

### 3️⃣ Coach Dayboard（教練日誌板）

**優先級**: P1 ⭐⭐⭐⭐⭐  
**開發時間**: 5 天

#### 整合服務
- user-core（學生列表）
- 單板教學（學習紀錄）
- knowledge-engagement（測驗結果）

#### 核心概念
```
教練每天看一個儀表板：
「今天要教誰？每個人該練什麼？如何分組？」
```

#### 使用場景

```
教練登入 → 看到今天的學生列表
↓
系統自動分析：
├── user-core: 今天有 8 個學生
├── 單板教學: 每個人的練習紀錄
├── knowledge-engagement: 最近測驗結果
↓
AI 生成教練日誌：
「📋 今天的教學計畫（2025-12-06）
 
 學生分組建議：
 
 【初級組】3 人
 - 小明（後刃弱 2.5/5）
 - 小華（換刃弱 2.8/5）
 - 小美（平衡弱 2.3/5）
 
 建議課程：lesson-03「站姿與平衡」
 教學重點：重心控制、膝蓋彎曲
 預計時間：1.5 小時
 
 【中級組】3 人
 - 阿強（想學粉雪）
 - 阿明（想學跳躍）
 - 阿華（想學刻滑）
 
 建議：分開教學（需求差異大）
 
 ⚠️ 特別注意：
 - 小明上次摔倒，今天多關注信心建立
 - 阿強新買裝備，檢查固定器設定」
```

#### Dify Workflow

```yaml
名稱: 教練日誌板生成器

輸入:
  - coach_id: 教練 ID
  - date: 日期

節點:
  1. [數據聚合]
     - 查詢今天的學生列表（user-core）
     - 查詢每個學生的練習紀錄（單板教學）
     - 查詢測驗結果（knowledge-engagement）
  
  2. [LLM 分析]
     - 分析學生程度和需求
     - 生成分組建議
     - 推薦教學課程
     - 識別特殊注意事項
  
  3. [輸出]
     - 分組建議
     - 每組教學計畫
     - 個人化注意事項
```

#### 前端頁面結構

```tsx
<CoachDayboard>
  <DateSelector />          {/* 日期選擇 */}
  <StudentOverview />       {/* 學生總覽 */}
  <GroupingSuggestions />   {/* 分組建議 */}
  <TeachingPlans />         {/* 教學計畫 */}
  <SpecialNotes />          {/* 特別注意 */}
  <QuickActions />          {/* 快速操作 */}
</CoachDayboard>
```

---

## 📅 實作優先順序

### Phase 1（立即，1-2 週）

**目標**: 快速上線高 ROI 功能

| 服務 | 時間 | 理由 |
|------|------|------|
| Trip Prep Lab | 5 天 | 直接解決「不知道該練什麼」痛點 |
| Buddy Skill Card | 3 天 | 提升媒合成功率 |
| Skill-Based Trip Optimizer | 5 天 | 技能導向推薦，用戶需求強 |
| Post-Trip Learning Report | 5 天 | 提升用戶黏性 |

**預期成果**:
- 行前計畫生成率 > 60%
- 媒合成功率 +30%
- 用戶滿意度 +40%

### Phase 2（1 個月後，2-3 週）

**目標**: 深化功能，服務教練和進階用戶

| 服務 | 時間 | 理由 |
|------|------|------|
| Coach Dayboard | 5 天 | 提升教練效率 |
| Gear Readiness | 4 天 | 差異化功能（Vision Agent）|
| Gear-Trip Compatibility | 4 天 | 裝備適配分析 |
| Season Goal Tracker | 5 天 | 全季追蹤，提升留存 |

**預期成果**:
- 教練採用率 > 70%
- 裝備保養響應率 > 50%
- 用戶留存率 +25%

### Phase 3（3 個月後，3-4 週）

**目標**: 長期價值和社交功能

| 服務 | 時間 | 理由 |
|------|------|------|
| Season Storyboard | 1 週 | 雪季總結，分享傳播 |
| Pro Growth Console | 2 週 | 服務高價值用戶 |
| Buddy Skill Gap Analyzer | 1 週 | 深化社交功能 |

**預期成果**:
- 分享率 > 40%
- 進階用戶滿意度 +40%
- 整體留存率 +35%

---

## 💰 成本與效益

### 開發成本

| Phase | 服務數量 | 時間 | 人力 |
|-------|---------|------|------|
| Phase 1 | 4 個 | 1-2 週 | 1 人 |
| Phase 2 | 4 個 | 2-3 週 | 1 人 |
| Phase 3 | 3 個 | 3-4 週 | 1 人 |
| **總計** | **11 個** | **6-9 週** | **1 人** |

### 月運營成本

| 項目 | 成本 | 說明 |
|------|------|------|
| Dify 自部署（Zeabur） | $5/月 | 日本節點 |
| Claude API（1000 用戶） | $50-100/月 | Haiku + Sonnet |
| GPT-4V（Vision 功能） | $30-50/月 | 裝備照片分析 |
| **總計** | **$85-155/月** | 視使用量 |

### ROI 預估

| 指標 | 改善 | 說明 |
|------|------|------|
| 用戶滿意度 | +50% | 從資料展示 → 智能建議 |
| Engagement | +60% | AI 生成內容更吸引人 |
| 媒合成功率 | +40% | Buddy Skill Card 提升匹配度 |
| 教練效率 | +30% | Coach Dayboard 自動分組 |
| 用戶留存 | +35% | Season Storyboard 提升黏性 |

**投入**: 6-9 週開發 + $85-155/月  
**產出**: 11 個差異化功能 + 用戶體驗大幅提升  
**結論**: **非常值得投資** 🚀

---

**文檔版本**: v2.0  
**最後更新**: 2025-12-06  
**下一步**: 查看完整的 11 個服務詳細設計（繼續閱讀）

---

### 4️⃣ Gear Readiness（裝備就緒檢查）

**優先級**: P2 ⭐⭐⭐⭐  
**開發時間**: 4 天

#### 整合服務
- gear-ops（裝備資訊）
- resort-services（雪場條件）
- user-core（用戶程度）

#### 核心概念
```
出發前 3 天自動提醒：
「你的裝備準備好了嗎？需要保養嗎？」
```

#### 使用場景
```
用戶規劃：二世谷 4 天（3 天後出發）
↓
系統自動檢查：
├── gear-ops: 你有 2 塊板，上次使用 30 天前，邊刃需打磨
├── resort-services: 二世谷粉雪 60%、壓雪道 40%
├── user-core: 你的程度（中級）
↓
AI 生成檢查清單：
「🎒 裝備就緒檢查
 
 ✅ 雪板選擇：
 - 主力：Freeride 板（適合粉雪）
 - 備用：All-Mountain 板（Day 1 熱身）
 
 ⚠️ 保養提醒：
 - 邊刃需要打磨
 - 建議打蠟（粉雪專用蠟）
 
 📍 附近店家：
 - 板橋滑雪店（2.3km）
 - 營業時間：10:00-20:00
 - 服務：打磨 $300、打蠟 $200」
```

#### 前端頁面結構
```tsx
<GearReadiness>
  <TripCountdown />         {/* 出發倒數 */}
  <GearCompatibility />     {/* 裝備適配度 */}
  <MaintenanceAlerts />     {/* 保養提醒 */}
  <NearbyShops />           {/* 附近店家 */}
  <PackingChecklist />      {/* 打包清單 */}
  <PhotoUpload />           {/* 上傳裝備照片 */}
</GearReadiness>
```

---

### 5️⃣ Season Storyboard（雪季故事板）

**優先級**: P2 ⭐⭐⭐  
**開發時間**: 1 週

#### 整合服務
- user-core（行為事件）
- 單板教學（學習進度）
- resort-services（雪場目標）
- gear-ops（裝備變化）

#### 核心概念
```
雪季結束時自動生成：
「你的雪季故事 + 成長軌跡 + 下季建議」
```

#### 使用場景
```
雪季結束（2024-25）
↓
AI 生成故事：
「🎿 你的 2024-25 雪季故事
 
 📊 數據總覽：
 - 滑行天數：15 天
 - 雪場數量：5 個
 - 垂直落差：50,000m（相當於 5.5 座玉山！）
 
 🎯 技能成長：
 - 後刃控制：2.5/5 → 4.2/5（+68%）⭐
 - 粉雪滑行：0/5 → 2.5/5（新技能解鎖！）🎉
 
 🏔️ 雪場探索：
 - 最愛：白馬（去了 3 次）
 - 最難忘：二世谷粉雪初體驗
 
 💡 下季建議：
 - 繼續加強粉雪技巧（目標 4/5）
 - 挑戰更多黑道
 - 推薦雪場：野澤溫泉」
```

#### 前端頁面結構
```tsx
<SeasonStoryboard>
  <SeasonHeader />          {/* 雪季標題 */}
  <StatsOverview />         {/* 數據總覽 */}
  <SkillGrowthChart />      {/* 技能成長曲線 */}
  <ResortMap />             {/* 雪場地圖 */}
  <Highlights />            {/* 精彩時刻 */}
  <Achievements />          {/* 成就徽章 */}
  <NextSeasonGoals />       {/* 下季目標 */}
  <ShareButton />           {/* 分享按鈕 */}
</SeasonStoryboard>
```

---

### 6️⃣ Pro Growth Console（專業成長控制台）

**優先級**: P3 ⭐⭐⭐⭐  
**開發時間**: 2 週

#### 整合服務
- user-core（行為事件）
- 單板教學（學習紀錄）
- knowledge-engagement（測驗結果）
- resort-services（雪場經驗）

#### 核心概念
```
給進階玩家的深度分析儀表板：
「數據視覺化 + AI 智能分析 + 改善建議」
```

#### 使用場景
```
進階玩家登入 → 看到專業儀表板
↓
AI 生成分析報告：
「📊 專業成長控制台
 
 🎯 整體評估：
 - 綜合程度：進階（8.2/10）
 - 強項：後刃控制、陡坡滑行
 - 弱項：公園跳台、樹林穿梭
 - 成長速度：+15%（過去 3 個月）
 
 📈 技能雷達圖：
 - 站姿與平衡：9/10 ⭐⭐⭐⭐⭐
 - 旋轉：7/10 ⭐⭐⭐⭐
 - 用刃：8/10 ⭐⭐⭐⭐
 
 💡 AI 改善建議：
 
 1. 短期目標（1 個月）：
    - 完成公園跳台課程
    - 目標：跳台技能 3/10 → 6/10
 
 2. 長期目標（1 年）：
    - 準備 CASI Level 2 認證
    - 五項技能均達 8/10」
```

#### 前端頁面結構
```tsx
<ProGrowthConsole>
  <OverallAssessment />     {/* 整體評估 */}
  <SkillRadarChart />       {/* 技能雷達圖 */}
  <GrowthTrendChart />      {/* 成長趨勢圖 */}
  <DeepAnalysis />          {/* 深度分析 */}
  <ImprovementPlan />       {/* 改善建議 */}
  <TrainingSchedule />      {/* 訓練計畫 */}
  <MilestoneTracker />      {/* 里程碑追蹤 */}
</ProGrowthConsole>
```

---

### 7️⃣ Skill-Based Trip Optimizer（技能導向行程優化器）

**優先級**: P1 ⭐⭐⭐⭐⭐  
**開發時間**: 5 天

#### 整合服務
- 單板教學（學習紀錄）
- resort-services（雪場資訊）
- user-core（用戶歷史）

#### 核心概念
```
根據想練的技能，推薦最適合的雪場和行程
```

#### 使用場景
```
用戶輸入：「我想加強後刃控制」
↓
Dify 分析：
├── 從單板教學讀取：用戶後刃評分 2.5/5（弱項）
├── 從 user-core 讀取：去過的雪場都是短道
├── 從 resort-services 搜尋：有長藍道的雪場
↓
推薦：
「建議去志賀高原（有 5km 長藍道，適合練後刃）
 
 行程安排：
 - Day 1: 短道熱身 + 複習 lesson-03
 - Day 2-3: 長道練習，專注後刃控制
 - Day 4: 驗收成果
 
 必練課程：
 - lesson-03「後刃控制」
 - lesson-27「後刃開髖護膝」」
```

#### 前端頁面結構
```tsx
<SkillBasedTripOptimizer>
  <SkillSelector />        {/* 選擇想練的技能 */}
  <AIAnalysis />           {/* AI 分析結果 */}
  <RecommendedResorts />   {/* 推薦雪場 */}
  <DailyPlan />            {/* 每日計畫 */}
  <RecommendedLessons />   {/* 必練課程 */}
  <CreateTripButton />     {/* 一鍵建立行程 */}
</SkillBasedTripOptimizer>
```

---

### 8️⃣ Post-Trip Learning Report（行程後學習報告）

**優先級**: P1 ⭐⭐⭐⭐⭐  
**開發時間**: 5 天

#### 整合服務
- user-core（滑行紀錄）
- 單板教學（學習紀錄）
- resort-services（雪場特色）

#### 核心概念
```
行程結束後，自動生成：
「這次去了哪、滑了什麼、學到什麼、下次該練什麼」
```

#### 使用場景
```
行程結束：白馬 3 天
↓
AI 生成報告：
「🎿 白馬 3 天總結
 
 滑行成就：
 - 首次挑戰黑道（Happo-One 主道）
 - 完成 15 條雪道，累計 8000m 垂直落差
 
 技能進步：
 - 陡坡控速有改善（lesson-45 評分 4/5）
 - 樹林穿梭還需練習（lesson-67 評分 3/5）
 
 下次建議：
 - 繼續練習樹林技巧（推薦去野澤溫泉）
 - 可以挑戰更陡的黑道（推薦志賀高原）」
```

#### 前端頁面結構
```tsx
<PostTripReport>
  <TripSummary />          {/* 行程摘要 */}
  <SkiingStats />          {/* 滑行統計 */}
  <SkillProgress />        {/* 技能進步 */}
  <Highlights />           {/* 精彩時刻 */}
  <NextSteps />            {/* 下次建議 */}
  <ShareButton />          {/* 分享按鈕 */}
</PostTripReport>
```

---

### 9️⃣ Gear-Trip Compatibility Checker（裝備行程適配檢查器）

**優先級**: P2 ⭐⭐⭐⭐  
**開發時間**: 4 天

#### 整合服務
- gear-ops（裝備資訊）
- resort-services（雪場條件）
- user-core（用戶程度）

#### 核心概念
```
出發前自動檢查：「你的裝備適合這次行程嗎？」
```

#### 使用場景
```
用戶規劃：二世谷 4 天（粉雪為主）
↓
AI 建議：
「✅ Freeride 板更適合（寬度 268mm，適合粉雪）
 ⚠️ All-Mountain 板邊刃磨損（建議保養）
 
 💡 建議攜帶：
 - 主力：Freeride 板（Day 2-4 粉雪）
 - 備用：All-Mountain 板（Day 1 壓雪道熱身）」
```

#### 前端頁面結構
```tsx
<GearTripChecker>
  <TripSummary />          {/* 行程摘要 */}
  <GearCompatibility />    {/* 裝備適配度 */}
  <MaintenanceAlerts />    {/* 保養提醒 */}
  <PackingList />          {/* 打包清單 */}
  <NearbyShops />          {/* 附近店家 */}
</GearTripChecker>
```

---

### 🔟 Season Goal Tracker（雪季目標追蹤器）

**優先級**: P2 ⭐⭐⭐⭐  
**開發時間**: 5 天

#### 整合服務
- user-core（行為事件）
- 單板教學（學習進度）
- resort-services（雪場目標）
- gear-ops（裝備目標）

#### 核心概念
```
雪季開始時設定目標，全季追蹤進度
```

#### 使用場景
```
雪季目標：
├── 雪場目標：去 10 個新雪場
├── 技能目標：學會粉雪技巧
├── 裝備目標：換一塊 Freeride 板
↓
AI 分析（Week 12）：
「🎯 雪季進度報告
 
 雪場目標：1/10（進度慢，建議加快）
 - 推薦：下個月去志賀高原
 
 技能目標：20%（進度正常）
 - 下一步：lesson-68 粉雪進階
 
 裝備目標：✅ 完成」
```

#### 前端頁面結構
```tsx
<SeasonGoalTracker>
  <GoalSetting />          {/* 目標設定 */}
  <ProgressDashboard />    {/* 進度儀表板 */}
  <Timeline />             {/* 時間軸 */}
  <AIRecommendations />    {/* AI 建議 */}
  <Milestones />           {/* 里程碑 */}
</SeasonGoalTracker>
```

---

### 1️⃣1️⃣ Buddy Skill Gap Analyzer（雪伴技能差距分析器）

**優先級**: P2 ⭐⭐⭐  
**開發時間**: 1 週

#### 整合服務
- snowbuddy-matching（媒合資料）
- 單板教學（學習紀錄）
- user-core（用戶歷史）

#### 核心概念
```
媒合成功後，分析兩人的技能差距：
「你們適合一起練什麼？誰可以教誰？」
```

#### 使用場景
```
A 和 B 媒合成功
↓
AI 建議：
「🤝 技能互補分析
 
 A 可以教 B：
 - 後刃控制技巧（A 擅長）
 - 雪場經驗分享
 
 B 可以教 A：
 - 換刃技巧（B 擅長）
 
 一起練習：
 - 二世谷藍道（適合兩人程度）
 - 建議課程：lesson-15（連續轉彎）
 
 行程安排：
 - 上午：各自練習弱項
 - 下午：一起滑，互相指導」
```

#### 前端頁面結構
```tsx
<BuddySkillGapAnalyzer>
  <SkillRadarComparison />  {/* 技能雷達圖對比 */}
  <ComplementaryAnalysis /> {/* 互補分析 */}
  <JointTripPlan />         {/* 行程建議 */}
  <IceBreakers />           {/* 破冰話題 */}
</BuddySkillGapAnalyzer>
```

---

## 📋 開發檢查清單

### Phase 1（Week 1-2）
- [ ] Trip Prep Lab
- [ ] Buddy Skill Card
- [ ] Skill-Based Trip Optimizer
- [ ] Post-Trip Learning Report

### Phase 2（Week 3-5）
- [ ] Coach Dayboard
- [ ] Gear Readiness
- [ ] Gear-Trip Compatibility
- [ ] Season Goal Tracker

### Phase 3（Week 6-9）
- [ ] Season Storyboard
- [ ] Pro Growth Console
- [ ] Buddy Skill Gap Analyzer

---

## 🎯 成功指標

### Phase 1
- ✅ Trip Prep Lab 使用率 > 60%
- ✅ 媒合成功率 +30%
- ✅ 用戶滿意度 +40%

### Phase 2
- ✅ 教練採用率 > 70%
- ✅ 裝備保養響應率 > 50%
- ✅ 用戶留存率 +25%

### Phase 3
- ✅ 分享率 > 40%
- ✅ 進階用戶使用率 > 80%
- ✅ 整體留存率 +35%

---

**文檔版本**: v2.0  
**最後更新**: 2025-12-06
