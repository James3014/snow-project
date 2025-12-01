# User Core - 開發指南

## 快速開始

### 環境設置

```bash
# 1. 創建虛擬環境
python3 -m venv .venv
source .venv/bin/activate

# 2. 安裝依賴
pip install -r requirements.txt

# 3. 複製環境變數
cp .env.example .env

# 4. 運行服務
uvicorn api.main:app --reload --port 8001
```

### 環境變數

| 變數 | 說明 | 默認值 |
|------|------|--------|
| `DATABASE_URL` | 數據庫連接 | `sqlite:///./test.db` |
| `REDIS_URL` | Redis 連接 | `redis://localhost:6379` |
| `DEBUG` | 調試模式 | `false` |
| `JWT_SECRET_KEY` | JWT 密鑰 | - |

## 開發規範

### 代碼風格

- 使用 Python 3.11+
- 遵循 PEP 8
- 使用類型提示
- 函式長度 < 50 行

### 命名規範

```python
# 函式: snake_case
def get_user_profile():
    pass

# 類: PascalCase
class UserProfile:
    pass

# 常量: UPPER_SNAKE_CASE
MAX_RECOMMENDATIONS = 3

# 私有函式: 前綴下劃線
def _check_requirements():
    pass
```

### 異常處理

```python
from exceptions import UserNotFoundError

def get_user(user_id: str):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UserNotFoundError(user_id)
    return user
```

### 日誌記錄

```python
from logging import get_logger

logger = get_logger(__name__)

def process_data():
    logger.info("Processing started")
    try:
        # ...
        logger.info("Processing completed")
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        raise
```

## 測試

### 運行測試

```bash
# 所有測試
pytest

# 單元測試
pytest tests/unit/

# 集成測試
pytest tests/integration/

# 覆蓋率報告
pytest --cov=. --cov-report=html
```

### 測試結構

```
tests/
├── unit/
│   └── user_core/
│       ├── test_services.py
│       └── test_utils.py
├── integration/
│   └── user_core/
│       └── test_api.py
└── contract/
    └── user_core/
        └── test_schemas.py
```

## 數據庫遷移

```bash
# 創建遷移
alembic revision --autogenerate -m "description"

# 執行遷移
alembic upgrade head

# 回滾
alembic downgrade -1
```

## API 文檔

啟動服務後訪問:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## 常見問題

### Q: 如何添加新的 API 端點?

1. 在 `api/` 創建路由文件
2. 在 `config/router.py` 註冊路由
3. 重啟服務

### Q: 如何添加新的數據模型?

1. 在 `models/` 創建模型
2. 在 `config/database.py` 添加表創建
3. 創建 Alembic 遷移
4. 執行遷移

### Q: 如何處理錯誤?

使用 `exceptions/` 中定義的異常類，全局異常處理器會自動處理並返回標準化的錯誤響應。

## 部署

### Docker

```bash
docker build -t user-core .
docker run -p 8001:8001 user-core
```

### Zeabur

參考 `ZEABUR_SETUP.md` 進行部署配置。
