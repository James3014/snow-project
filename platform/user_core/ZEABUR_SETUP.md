# Zeabur 部署指引

## 問題說明

當前 `user-core` 服務使用 SQLite 資料庫，但在 Zeabur 容器化環境中：
- **容器是臨時的**：每次重新部署或重啟，容器檔案系統會被重置
- **資料會遺失**：SQLite 檔案會被刪除，所有註冊的用戶資料會消失

## 解決方案：使用 PostgreSQL

### 步驟 1：在 Zeabur 添加 PostgreSQL 服務

1. 登入 Zeabur Dashboard：https://dash.zeabur.com/
2. 進入你的專案
3. 點擊 **"Create Service"** 或 **"+"** 按鈕
4. 選擇 **"Prebuilt"** → **"PostgreSQL"**
5. 等待 PostgreSQL 服務啟動完成

### 步驟 2：連接 user-core 到 PostgreSQL

1. 進入 `user-core-api` 服務設定
2. 找到 **"Service Binding"** 或 **"Environment Variables"**
3. Zeabur 會自動注入 `DATABASE_URL` 環境變數，格式如：
   ```
   postgresql://user:password@host:5432/dbname
   ```

### 步驟 3：重新部署

1. 推送代碼到 Git（已包含最新的資料庫配置）
2. Zeabur 會自動偵測並重新部署
3. 或手動觸發重新部署

### 步驟 4：驗證

重新部署後：
1. 註冊新用戶
2. 重啟服務或重新部署
3. 嘗試登入 → 用戶資料應該保留 ✅

## 配置說明

### `config.py` 更新
```python
# 優先使用 DATABASE_URL（Zeabur PostgreSQL），否則使用本地 SQLite
USER_CORE_DB_URL: str = os.getenv("DATABASE_URL", "sqlite:///./user_core.db")
```

### `zeabur.json` 更新
```json
{
  "services": {
    "database": {
      "type": "postgresql"
    }
  }
}
```

## 本地開發

本地開發仍使用 SQLite（不需要安裝 PostgreSQL）：
```bash
cd platform/user_core
uvicorn api.main:app --reload --port 8001
```

## 常見問題

### Q: 舊資料會遺失嗎？
A: 是的，從 SQLite 轉到 PostgreSQL 時，舊資料不會自動遷移。需要重新註冊用戶。

### Q: 如何遷移現有資料？
A: 如果有重要資料需要保留，可以：
1. 導出 SQLite 資料 → CSV
2. 使用 PostgreSQL 導入工具或寫入腳本

### Q: PostgreSQL 費用如何？
A: Zeabur 提供免費的 PostgreSQL 方案，有儲存和連線數限制。詳見：https://zeabur.com/pricing

## 參考資源

- [Zeabur PostgreSQL 文件](https://zeabur.com/docs/marketplace/postgresql)
- [Zeabur Environment Variables](https://zeabur.com/docs/deploy/environment-variables)
- [SQLAlchemy Database URLs](https://docs.sqlalchemy.org/en/20/core/engines.html#database-urls)
