# SkiDIY Platform

SkiDIY 是一個全面性的滑雪運動愛好者平台，採用微服務架構，旨在幫助滑雪愛好者找到滑雪夥伴、記錄滑雪足跡、管理滑雪裝備，以及提升滑雪知識和技能。

## 架構概覽

本平台由多個相互關聯的服務組成：

- **user-core**：使用者身份和核心資料服務，作為所有使用者資料的單一真實來源
- **resort-services**：雪場資訊服務，管理 43 個滑雪場的詳細資料
- **snowbuddy-matching**：智慧雪伴匹配引擎，幫助使用者找到最適合的滑雪夥伴

## 功能特性

- 使用者身份管理與個人資料
- 雪場資訊查詢與滑雪足跡記錄
- 智慧雪伴匹配系統
- 基於技能和地點偏好的配對算法
- 行為事件記錄與分析

## 技術架構

- **微服務架構**：採用 Python + FastAPI 開發
- **容器化**：使用 Docker 和 Docker Compose 進行部署
- **資料庫**：PostgreSQL 用於使用者資料，Redis 用於快取和非同步任務
- **API 標準**：開放 API 規範，提供完整的 REST API

## 快速開始

### 前置需求

- Docker
- Docker Compose

### 部署步驟

1. 克隆此儲存庫：
   ```bash
   git clone https://github.com/James3014/snow-project.git
   cd snow-project
   ```

2. 啟動服務：
   ```bash
   docker-compose up --build
   ```

3. 服務將在以下端點運行：
   - **User Core API**: http://localhost:8001
   - **Resort API**: http://localhost:8000
   - **Snowbuddy Matching API**: http://localhost:8002
   - **API 文件**: http://localhost:8000/docs (Resort API)

## 服務說明

### User Core Service (`user-core`)
- 處理所有使用者身份和個人資料
- 管理使用者行為事件記錄
- 提供其他服務所需的使用者資料

### Resort Services API (`resort-api`)
- 提供雪場資訊查詢
- 管理 43 個滑雪場的靜態資料
- 處理滑雪足跡記錄

### Snowbuddy Matching Service (`snowbuddy-matching`)
- 實現非同步雪伴搜尋功能
- 執行基於技能、地點和時間偏好的匹配算法
- 處理雪伴邀請和接受流程

## 開發進度

- ✅ **user-core**: 核心功能完整 (95%) - 含完整測試套件
- ✅ **resort-services**: 功能完整 (100%) - API完整實作
- ✅ **snowbuddy-matching**: 功能完整 (100%) - 智能匹配引擎完成
- 🟡 **coach-scheduling**: 規劃完成，待實作
- 🔵 **gear-ops**: 規劃階段
- 🔵 **knowledge-engagement**: 規劃階段

## 最新更新 (2025-11-05)

### ✅ 新增功能
- **80+ 測試**: 完整的單元、契約、整合測試
- **遷移工具**: user-core legacy data migration script
- **Makefile**: 開發便利工具
- **完整文檔**: 所有服務都有 spec, plan, tasks

### 📊 測試覆蓋率
- user-core: 65 tests ✅
- resort-services: 5+ tests ✅
- snowbuddy-matching: 10+ tests ✅

詳見 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## 貢獻

歡迎提交 Issues 和 Pull Requests 來改善此專案。

## 授權

此專案採用 MIT 授權。