# SnowTrace 專案總覽

## 🎿 專案簡介
SnowTrace 是一個全面性的滑雪運動愛好者平台，採用微服務架構，幫助滑雪愛好者規劃行程、找到滑雪夥伴、紀錄滑雪足跡、管理滑雪裝備、追蹤滑雪成就。

## 🏗️ 系統架構
### 後端服務
- **user-core**: 統一認證、使用者資料管理、行為事件紀錄、共享 Calendar 基礎設施
- **resort-services**: 43個日本雪場資訊服務
- **snowbuddy-matching**: 智慧雪伴匹配引擎
- **tour (trip-planner)**: Next.js Route Handlers + Prisma 行程規劃 API

### 前端應用
- **ski-platform**: React + TypeScript 主前端應用
- **tour**: Next.js 15 + Tailwind 行程規劃器

## 🎯 核心功能
### 已完成功能
- ✅ 統一認證系統 (user-core)
- ✅ 43個日本雪場資料庫
- ✅ 智慧行程規劃 (AI 對話助手)
- ✅ 雪伴媒合系統 (多維度匹配算法)
- ✅ 裝備管理 (CRUD + 提醒系統)
- ✅ 成就系統和社交動態
- ✅ 滑雪征服地圖
- ✅ 共享 Calendar 基礎設施

### 最新完成
- ✅ Phase 1 前端行事曆整合 (2025-12-12)
  - Trip Planning: 行程建立時自動創建行事曆事件
  - Gear Management: 新增提醒事項標籤頁
  - Snowbuddy: 媒合成功後可安排約定時間

## 📊 技術棧
### 後端
- Python + FastAPI
- PostgreSQL + Redis
- Docker + Docker Compose
- 統一認證架構

### 前端
- React 18 + TypeScript
- Redux Toolkit
- Tailwind CSS
- Vite

### 部署
- Zeabur 雲端部署
- GitHub Actions CI/CD
- 微服務容器化

## 🔗 重要連結
- **生產環境**: https://ski-platform.zeabur.app
- **API 文檔**: https://user-core.zeabur.app/docs
- **GitHub**: https://github.com/James3014/snow-project

## 📈 專案規模
- **70+ Clean Code 重構任務完成**
- **146+ 測試，100% 通過率**
- **企業級微服務架構**
- **43個日本雪場資料**
- **多維度雪伴匹配算法**
