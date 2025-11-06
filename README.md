# SkiDIY Platform

SkiDIY 是一個全面性的滑雪運動愛好者平台，採用微服務架構，旨在幫助滑雪愛好者找到滑雪夥伴、記錄滑雪足跡、管理滑雪裝備，以及提升滑雪知識和技能。

## 架構概覽

本平台由多個相互關聯的服務組成：

- **user-core**：使用者身份和核心資料服務，作為所有使用者資料的單一真實來源
- **resort-services**：雪場資訊服務，管理 43 個滑雪場的詳細資料
- **snowbuddy-matching**：智慧雪伴匹配引擎，幫助使用者找到最適合的滑雪夥伴

## 功能特性

- **統一認證系統**：所有服務使用 user-core 的集中式認證
- 使用者身份管理與個人資料
- 雪場資訊查詢與滑雪足跡記錄
- 智慧雪伴匹配系統
- 基於技能和地點偏好的配對算法
- 行為事件記錄與分析
- 安全的 API 端點保護（Bearer Token / X-User-Id）

## 技術架構

- **微服務架構**：採用 Python + FastAPI 開發
- **統一認證**：共享認證模組，環境感知的安全機制
- **容器化**：使用 Docker 和 Docker Compose 進行部署
- **資料庫**：PostgreSQL 用於使用者資料，Redis 用於快取和非同步任務
- **API 標準**：開放 API 規範，提供完整的 REST API
- **測試驅動開發**：95+ 測試涵蓋所有核心功能

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
- **提供認證 API** (`/auth/login`, `/auth/validate`)
- 管理使用者行為事件記錄
- 提供其他服務所需的使用者資料

### Resort Services API (`resort-api`)
- 提供雪場資訊查詢（公開端點）
- 管理 43 個滑雪場的靜態資料
- **受保護**：滑雪足跡記錄需要認證

### Snowbuddy Matching Service (`snowbuddy-matching`)
- **全部需要認證**：所有匹配和配對端點
- 實現非同步雪伴搜尋功能
- 執行基於技能、地點和時間偏好的匹配算法
- 處理雪伴邀請和接受流程

## 開發進度

- ✅ **user-core**: 功能完整 (100%) - 含認證 API 和完整測試套件
- ✅ **resort-services**: 功能完整 (100%) - API 完整實作含認證
- ✅ **snowbuddy-matching**: 功能完整 (100%) - 智能匹配引擎含認證
- ✅ **統一認證架構**: 完整 (100%) - 所有服務使用集中式認證
- 🟡 **coach-scheduling**: 規劃完成，待實作
- 🔵 **gear-ops**: 規劃階段
- 🔵 **knowledge-engagement**: 規劃階段

## 最新更新 (2025-11-05)

### ✅ 新增功能
- **🔐 統一認證架構**: 完整的認證系統跨所有服務
  - User-core 認證 API (`/auth/login`, `/auth/validate`)
  - 共享認證模組 (`shared/auth.py`)
  - 環境感知安全機制（開發/生產模式）
  - Bearer Token 和 X-User-Id 支援
- **95+ 測試**: 完整的單元、契約、整合、認證測試
- **遷移工具**: user-core legacy data migration script
- **Makefile**: 開發便利工具
- **完整文檔**: 所有服務都有 spec, plan, tasks + 認證指南

### 📊 測試覆蓋率
- user-core: 65 tests ✅
- resort-services: 9 tests (含 4 個認證測試) ✅
- snowbuddy-matching: 14 tests (含 6 個認證測試) ✅
- **總計**: 95+ tests 全部通過 ✅

### 📚 文檔
- [實作總結](./IMPLEMENTATION_SUMMARY.md) - 完整的實作細節
- [認證架構指南](./docs/AUTHENTICATION.md) - 統一認證說明

## 貢獻

歡迎提交 Issues 和 Pull Requests 來改善此專案。

## 授權

此專案採用 MIT 授權。