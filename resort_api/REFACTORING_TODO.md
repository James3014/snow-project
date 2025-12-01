# Resort API 重構任務清單

基於 Clean Code 原則和 Linus Torvalds 風格（切小、模組化、解耦、關注點分離）

## 任務狀態說明
- [ ] 待處理
- [x] 已完成

---

## 高優先級（架構層面）

### T1. 抽離業務邏輯到 Service 層
- [x] T1.1 建立 `services/resort_service.py` - 雪場查詢、過濾邏輯
- [x] T1.2 建立 `services/history_service.py` - 滑雪歷史記錄邏輯
- [x] T1.3 將 `_get_cached_resorts()` 移至 service 層

### T2. 抽離配置到獨立模組
- [x] T2.1 建立 `config.py` - 集中管理所有配置（CORS、API URL、快取設定）

### T3. 統一錯誤處理
- [x] T3.1 建立 `exceptions.py` - 自定義例外類別
- [x] T3.2 建立全域例外處理器

---

## 中優先級（程式碼品質）

### T4. 路由模組化
- [x] T4.1 建立 `routers/resort_router.py` - 雪場相關路由
- [x] T4.2 建立 `routers/history_router.py` - 歷史記錄路由
- [x] T4.3 建立 `routers/health_router.py` - 健康檢查路由
- [x] T4.4 簡化 `main.py` 為應用程式入口

### T5. 改善 card_generator 可測試性
- [x] T5.1 抽象圖片生成介面（CardRenderer 類別）
- [x] T5.2 分離字型載入邏輯（FontLoader 類別）

---

## 低優先級（維護性）

### T6. 整理 models.py
- [x] T6.1 將模型按領域分檔（models/resort.py, models/history.py）

### T7. 補充文件
- [x] T7.1 建立 ARCHITECTURE.md 說明新架構

---

## 重構後結構

```
resort_api/
├── app/
│   ├── __init__.py
│   ├── main.py              # 簡化為入口點 (35行)
│   ├── config.py            # [新] 配置集中
│   ├── exceptions.py        # [新] 例外處理
│   ├── routers/             # [新] 路由模組
│   │   ├── __init__.py
│   │   ├── resort_router.py
│   │   ├── history_router.py
│   │   └── health_router.py
│   ├── services/            # [新] 業務邏輯層
│   │   ├── __init__.py
│   │   ├── resort_service.py
│   │   └── history_service.py
│   ├── models/              # [重組] 模型分類
│   │   ├── __init__.py
│   │   ├── resort.py
│   │   └── history.py
│   ├── db.py
│   ├── data_loader.py
│   ├── card_generator.py   # [重構] 使用 CardRenderer 類別
│   └── auth_utils.py
└── tests/
```

---

## 執行紀錄

| 任務 | 完成時間 | 備註 |
|------|----------|------|
| T2.1 | 2024-12-02 | 建立 config.py，使用 dataclass |
| T3.1 | 2024-12-02 | 建立 exceptions.py |
| T3.2 | 2024-12-02 | 註冊全域例外處理器 |
| T1.1 | 2024-12-02 | 建立 resort_service.py |
| T1.2 | 2024-12-02 | 建立 history_service.py |
| T1.3 | 2024-12-02 | 快取邏輯移至 ResortService |
| T4.1 | 2024-12-02 | 建立 resort_router.py |
| T4.2 | 2024-12-02 | 建立 history_router.py |
| T4.3 | 2024-12-02 | 建立 health_router.py |
| T4.4 | 2024-12-02 | main.py 從 215 行簡化為 35 行 |
| T5.1 | 2024-12-02 | 建立 CardRenderer 類別 |
| T5.2 | 2024-12-02 | 建立 FontLoader 類別 |
| T6.1 | 2024-12-02 | 分離 resort.py 和 history.py |
| T7.1 | 2024-12-02 | 建立 ARCHITECTURE.md |

---

## 驗證結果

- ✅ 所有 Python 語法檢查通過
- ✅ 所有 import 正常運作
- ✅ FastAPI 應用程式初始化成功
- ✅ 20/20 測試全部通過
