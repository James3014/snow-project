# Snowbuddy Matching 重構任務清單

基於 Clean Code 原則和 Linus Torvalds 風格（切小、模組化、解耦、關注點分離）

## 任務狀態說明
- [ ] 待處理
- [x] 已完成

---

## 高優先級（架構層面）

### T1. 抽離配置到獨立模組
- [x] T1.1 建立 `config.py` - 集中管理 Redis URL、外部服務 URL

### T2. 抽離業務邏輯到 Service 層
- [x] T2.1 建立 `services/matching_service.py` - 將 `run_matching_process` 移出 main.py
- [x] T2.2 建立 `services/redis_repository.py` - 抽象 Redis 操作

### T3. 統一錯誤處理
- [x] T3.1 建立 `exceptions.py` - 自定義例外類別
- [x] T3.2 建立全域例外處理器

---

## 中優先級（程式碼品質）

### T4. 路由模組化
- [x] T4.1 建立 `routers/search_router.py` - 搜尋相關路由
- [x] T4.2 建立 `routers/health_router.py` - 健康檢查路由
- [x] T4.3 簡化 `main.py` 為應用程式入口（從 100 行簡化為 20 行）

### T5. 拆分 matching_logic.py
- [x] T5.1 建立 `core/scorers.py` - 各評分函數
- [x] T5.2 建立 `core/filters.py` - 過濾邏輯
- [x] T5.3 簡化 `matching_logic.py` 為協調器

---

## 低優先級（維護性）

### T6. 補充文件
- [x] T6.1 建立 ARCHITECTURE.md 說明新架構

---

## 重構後結構

```
snowbuddy_matching/
├── app/
│   ├── __init__.py
│   ├── main.py              # 簡化為入口點 (20行)
│   ├── config.py            # [新] 配置集中
│   ├── exceptions.py        # [新] 例外處理
│   ├── auth_utils.py
│   ├── routers/             # [新] 路由模組
│   │   ├── __init__.py
│   │   ├── search_router.py
│   │   ├── requests_router.py
│   │   └── health_router.py
│   ├── services/            # [新] 業務邏輯層
│   │   ├── __init__.py
│   │   ├── matching_service.py
│   │   └── redis_repository.py
│   ├── core/                # [重組] 演算法模組
│   │   ├── __init__.py
│   │   ├── matching_logic.py (協調器)
│   │   ├── scorers.py       # [新] 評分函數
│   │   └── filters.py       # [新] 過濾函數
│   ├── models/
│   │   └── matching.py
│   └── clients/             # [更新] 使用 config
│       ├── __init__.py
│       ├── user_core_client.py
│       ├── resort_services_client.py
│       └── knowledge_engagement_client.py
└── tests/
```

---

## 執行紀錄

| 任務 | 完成時間 | 備註 |
|------|----------|------|
| T1.1 | 2024-12-02 | 建立 config.py |
| T3.1 | 2024-12-02 | 建立 exceptions.py |
| T3.2 | 2024-12-02 | 註冊全域例外處理器 |
| T2.1 | 2024-12-02 | 建立 matching_service.py |
| T2.2 | 2024-12-02 | 建立 redis_repository.py |
| T4.1 | 2024-12-02 | 建立 search_router.py |
| T4.2 | 2024-12-02 | 建立 health_router.py |
| T4.3 | 2024-12-02 | main.py 從 100 行簡化為 20 行 |
| T5.1 | 2024-12-02 | 建立 scorers.py (5 個評分函數) |
| T5.2 | 2024-12-02 | 建立 filters.py |
| T5.3 | 2024-12-02 | matching_logic.py 簡化為協調器 |
| T6.1 | 2024-12-02 | 建立 ARCHITECTURE.md |

---

## 驗證結果

- ✅ 所有 Python 語法檢查通過
- ✅ 所有 import 正常運作
- ✅ FastAPI 應用程式初始化成功
- ✅ 17/17 測試全部通過
- ✅ API 端點保持不變（向後相容）
