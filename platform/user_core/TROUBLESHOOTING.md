# 資料庫問題排查指南

## 問題：部署後用戶資料消失

### 症狀
- 註冊的帳號在重新部署後消失
- 登入時顯示「帳號或密碼錯誤」
- 需要重新註冊才能使用

### 可能原因
1. **還在使用 SQLite**（容器重啟會清空）
2. **DATABASE_URL 未正確注入**
3. **PostgreSQL 服務未啟動**
4. **連線失敗但程序沒報錯**

---

## 診斷步驟

### 步驟 1: 檢查 Zeabur PostgreSQL 服務狀態

1. 登入 Zeabur Dashboard: https://dash.zeabur.com/
2. 進入你的專案
3. 確認 **PostgreSQL 服務存在且狀態為 Running**
   - ✅ 如果看到綠色的 "Running" 狀態 → 繼續步驟 2
   - ❌ 如果沒有 PostgreSQL 服務 → 需要創建（參考 ZEABUR_SETUP.md）
   - ⚠️ 如果狀態是 "Error" 或 "Stopped" → 點擊查看錯誤日誌

### 步驟 2: 確認 DATABASE_URL 環境變數

1. 點擊 **user-core-api** 服務
2. 進入 **"Variables"** 或 **"Environment Variables"** 標籤
3. 檢查是否有 `DATABASE_URL` 變數：

**正確的配置：**
```
DATABASE_URL = postgresql://username:password@host:5432/dbname
```

**如果看到：**
- ❌ `DATABASE_URL` 不存在 → PostgreSQL 沒有正確連結
- ❌ `DATABASE_URL = sqlite:///./user_core.db` → 還在用 SQLite

**解決方法：**
1. 刪除手動設定的 `DATABASE_URL`（如果有）
2. Zeabur 會自動從 PostgreSQL 服務注入正確的值
3. 重新部署服務

### 步驟 3: 檢查服務連結（Service Binding）

1. 在 user-core-api 服務頁面
2. 找到 **"Service Bindings"** 或類似選項
3. 確認 PostgreSQL 已連結到 user-core-api

**如果未連結：**
1. 點擊 "Add Service Binding"
2. 選擇 PostgreSQL 服務
3. Zeabur 會自動注入 `DATABASE_URL`
4. 重新部署

### 步驟 4: 檢查部署日誌

1. 點擊 user-core-api 服務
2. 進入 **"Logs"** 或 **"Deployments"** 標籤
3. 查看最新部署的啟動日誌

**正常情況應該看到：**
```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
✅ Loaded 20 achievement definitions
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

**如果看到錯誤：**
```
# PostgreSQL 連線錯誤
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) FATAL: password authentication failed
```
→ 重新連結 PostgreSQL 服務

```
# 找不到 psycopg2
ModuleNotFoundError: No module named 'psycopg2'
```
→ 檢查 requirements.txt 是否包含 `psycopg2-binary==2.9.11`

### 步驟 5: 驗證資料庫連線

1. 進入 user-core-api 服務的終端機（如果有提供）
2. 或查看啟動日誌中的環境變數輸出

**測試命令（在本地）：**
```bash
python3 << 'EOF'
from config import settings
print(f"Database URL: {settings.USER_CORE_DB_URL[:30]}...")  # 只顯示前30字符
if "postgresql" in settings.USER_CORE_DB_URL:
    print("✅ 使用 PostgreSQL")
elif "sqlite" in settings.USER_CORE_DB_URL:
    print("❌ 還在使用 SQLite")
else:
    print("⚠️ 未知的資料庫類型")
EOF
```

---

## 常見問題 FAQ

### Q1: 我已經添加了 PostgreSQL，為什麼還是用 SQLite？

**A:** 可能的原因：
1. **沒有重新部署** - 環境變數更新需要重新部署才會生效
2. **手動設定了 DATABASE_URL** - 刪除手動設定，讓 Zeabur 自動注入
3. **zeabur.json 沒有推送** - 確認最新的 zeabur.json 已經部署

**解決方法：**
```bash
# 確認 zeabur.json 包含 PostgreSQL 設定
cat platform/user_core/zeabur.json
# 應該看到:
# "services": {
#   "database": {
#     "type": "postgresql"
#   }
# }

# 推送最新代碼並重新部署
git push origin main
```

### Q2: PostgreSQL 已連接，但帳號還是消失

**A:** 檢查以下情況：
1. **PostgreSQL 服務重啟了** - 如果使用免費方案，資料可能會被清除
2. **連到不同的資料庫** - 每次重新連結可能會創建新的資料庫
3. **資料表沒有創建** - 檢查日誌確認表格是否成功創建

**檢查資料表：**
在 Zeabur PostgreSQL 服務中找到連線資訊，使用 SQL 客戶端連線後執行：
```sql
-- 列出所有表格
\dt

-- 應該看到:
-- seasons
-- trips
-- trip_buddies
-- trip_shares
-- user_profiles
-- ...
```

### Q3: 如何確認用戶資料真的保存了？

**A:** 測試方法：
1. 註冊一個新帳號
2. 記下 email 和 password
3. 手動重啟 user-core-api 服務：
   - Zeabur Dashboard → user-core-api → "Restart"
4. 等待服務重新啟動
5. 嘗試用同樣的 email/password 登入
6. ✅ 如果能成功登入 → PostgreSQL 正常工作
7. ❌ 如果顯示帳號錯誤 → 還在使用 SQLite

### Q4: 本地開發時如何測試 PostgreSQL？

**A:** 有兩種方式：

**方式 1: 使用本地 SQLite（推薦）**
```bash
# 不需要安裝 PostgreSQL
cd platform/user_core
uvicorn api.main:app --reload --port 8001
```

**方式 2: 連接到 Zeabur PostgreSQL**
```bash
# 設定環境變數
export DATABASE_URL="postgresql://user:pass@host:5432/db"
uvicorn api.main:app --reload --port 8001
```

### Q5: 免費的 PostgreSQL 有什麼限制？

**A:** Zeabur 免費方案限制（可能變動）：
- 儲存空間：通常 100MB - 1GB
- 連線數：有限制
- 資料保留：可能會定期清理
- 性能：共享資源

**建議：**
- 開發/測試：使用免費方案
- 生產環境：考慮升級付費方案
- 查看最新限制：https://zeabur.com/pricing

---

## 檢查清單

部署前確認：
- [ ] zeabur.json 包含 PostgreSQL 設定
- [ ] requirements.txt 包含 psycopg2-binary
- [ ] config.py 使用環境變數 DATABASE_URL
- [ ] 代碼已推送到 Git

部署後確認：
- [ ] PostgreSQL 服務狀態為 Running
- [ ] DATABASE_URL 環境變數存在且為 postgresql://...
- [ ] user-core-api 成功啟動（查看日誌）
- [ ] 能夠註冊新用戶
- [ ] 重啟服務後用戶資料仍然存在

---

## 緊急救援

如果以上都試過還是不行：

1. **完全重新創建 PostgreSQL**
   - 刪除舊的 PostgreSQL 服務
   - 重新創建新的 PostgreSQL 服務
   - 確認 DATABASE_URL 已注入
   - 重新部署 user-core-api

2. **檢查 Zeabur 服務狀態**
   - 訪問 https://status.zeabur.com/
   - 確認沒有平台級別的問題

3. **聯繫支援**
   - Zeabur Discord: https://discord.gg/zeabur
   - 提供服務日誌和錯誤訊息

---

## 參考資源

- [Zeabur PostgreSQL 文件](https://zeabur.com/docs/marketplace/postgresql)
- [Zeabur Environment Variables](https://zeabur.com/docs/deploy/environment-variables)
- [SQLAlchemy Database URLs](https://docs.sqlalchemy.org/en/20/core/engines.html#database-urls)
