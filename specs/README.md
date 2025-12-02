# SnowTrace Platform Specs

此資料夾收納各子專案的規格、計畫與任務產出。每個子目錄對應 `PROJECTS.md` 的專案 key，並含以下建議檔案：

- `spec.md`：`/speckit.specify` 產物
- `plan.md`：`/speckit.plan` 產物
- `tasks.md`：`/speckit.tasks` 產物
- 其他補充文件（如問答、分析）

建立檔案時請遵守 `.specify/memory/constitution.md` 的原則與 `PROJECTS.md` 紀錄的依賴關係。

---

## 📋 最近更新 (2025-12)

### 🏂 單板教學系統整合完成
**位置**: `specs/單板教學/`

**Phase 3 完成** (2025-12-02)
- ✅ User Core 整合：錯誤監控、配置管理、性能追蹤
- ✅ Alpine Velocity 美學系統：手機優先 UI、雪場優化設計
- ✅ 生產環境部署：Zeabur + Supabase 完整配置
- ✅ CASI 教學框架：完整技能同步機制

**技術棧**: Next.js 15 + React 19 + Supabase + Tailwind CSS

詳見: `單板教學/README.md`, `單板教學/PHASE3_COMPLETE.md`

### 🎨 SnowTrace 平台視覺系統升級

**Glacial Futurism 設計系統** (2025-12-02)
- ✅ 品牌重塑：SnowTrace 繁體中文化
- ✅ 雪場 Logo 系統：43 個日本雪場 logo 完整整合
- ✅ 視覺優化：白色背景容器、圓角設計、陰影效果
- ✅ 響應式設計：ResortList、ResortDetail、ResortCard 組件優化

**Logo 規格**: 1024x1024 統一尺寸，路徑 `/resort-logos/${resortId}_logo.jpeg`

### 🔧 系統架構重構

**服務模組化** (2025-12-02)
- ✅ `trip_planning_service` 拆分為專注模組
- ✅ TypeScript 類型錯誤修復
- ✅ 錯誤邊界和重試機制
- ✅ Lazy loading 路由優化

### 📦 近期 Git 提交
```
63c13bf - feat: add final 5 resort logos (完成全部 43 個雪場)
cea4a24 - feat: Enhanced resort logo display with Glacial Futurism design
6926305 - style: improve resort logo display with white background container
5d86bc5 - feat: add resort logos and update frontend to display them
1c98724 - refactor: split trip_planning_service into focused modules
2078656 - refactor: rebrand to SnowTrace and convert to Traditional Chinese
```

---

## 📂 專案結構

### 核心服務
- `user-core/` - 用戶核心服務與 CASI 技能同步
- `resort-services/` - 雪場資訊服務與前端整合
- `gear-ops/` - 裝備管理系統
- `coach-scheduling/` - 教練排程系統
- `snowbuddy-matching/` - 雪友配對系統
- `knowledge-engagement/` - 知識互動系統

### 獨立應用
- `單板教學/` - 滑雪板教學內容管理系統 (已完成整合)
