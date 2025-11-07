# 🔧 修復 User-Core PostgreSQL 連接問題

## 問題症狀
- ✅ PostgreSQL 服務已創建
- ❌ user-core 服務還在使用 SQLite
- ❌ 用戶帳號在重新部署後消失
- ❌ 錯誤：`'UserProfile' object has no attribute 'default_post_visibility'`

## 根本原因
1. **user-core 沒有連接到 PostgreSQL**
   - DATABASE_URL 環境變數不存在或是 SQLite
   - Service Binding 沒有正確設置

2. **數據庫架構不同步**
   - UserProfile 模型缺少 `default_post_visibility` 字段
   - 已在最新代碼中修復 ✅

---

## 🎯 解決步驟（5 分鐘）

### 步驟 1: 確認 PostgreSQL 服務狀態

1. 登入 Zeabur Dashboard: https://dash.zeabur.com/
2. 進入你的專案
3. 確認 **postgresql** 服務狀態為 **Running（綠色）**

**如果沒有看到 PostgreSQL 服務：**
- 點擊 "Create Service" 或 "+"
- 選擇 "Prebuilt" → "PostgreSQL"
- 等待服務啟動（約 1-2 分鐘）

### 步驟 2: 連接 PostgreSQL 到 user-core

#### 方法 A: 使用 Service Bindings（推薦）

1. 點擊 **user-core** 服務（不是 user-core-api，名稱可能略有不同）
2. 找到 **"Service Bindings"** 或 **"Connections"** 或 **"Network"** 標籤
3. 點擊 **"Add Service Binding"** 或 **"Connect Service"**
4. 選擇 **postgresql** 服務
5. 點擊確認

**Zeabur 會自動：**
- 注入 `DATABASE_URL` 環境變數
- 格式：`postgresql://username:password@host:5432/database`

#### 方法 B: 手動設置環境變數（備用）

如果找不到 Service Bindings：

1. 點擊 **postgresql** 服務
2. 進入 **"Connect"** 或 **"Connection"** 標籤
3. 複製 **Database URL** 或 **Connection String**
   ```
   postgresql://username:password@host.zeabur.app:5432/database
   ```
4. 回到 **user-core** 服務
5. 進入 **"Variables"** 或 **"Environment Variables"** 標籤
6. 添加新變數：
   - **Key:** `DATABASE_URL`
   - **Value:** 貼上剛才複製的連接字串

### 步驟 3: 重新部署 user-core

1. 在 user-core 服務頁面
2. 點擊 **"Redeploy"** 或 **"Restart"** 按鈕
3. 等待部署完成（約 1-3 分鐘）

### 步驟 4: 驗證連接成功

部署完成後，查看啟動日誌：

1. 進入 user-core 服務的 **"Logs"** 標籤
2. 查看最新的部署日誌

**成功的標誌：**
```
✅ INFO: Application startup complete
✅ INFO: Uvicorn running on http://0.0.0.0:8080
```

**沒有錯誤訊息如：**
- ❌ `Failed to create feed item: 'UserProfile' object has no attribute 'default_post_visibility'`
- ❌ `connection refused`
- ❌ `database not found`

### 步驟 5: 測試帳號持久性

1. **清除瀏覽器緩存**
   ```javascript
   // 在瀏覽器控制台執行
   localStorage.clear()
   location.reload()
   ```

2. **註冊新帳號**
   - 前往 https://ski-platform.zeabur.app/register
   - 註冊一個測試帳號
   - 記下 email 和 password

3. **測試重啟**
   - 回到 Zeabur Dashboard
   - 手動重啟 user-core 服務
   - 等待重啟完成

4. **驗證數據持久化**
   - 使用相同的 email/password 登入
   - ✅ 能成功登入 → PostgreSQL 正常工作！
   - ❌ 登入失敗 → 繼續排查

---

## 🔍 排查指南

### 檢查清單

**A. 環境變數檢查**

進入 user-core 服務 → Variables 標籤：

```
✅ DATABASE_URL 存在
✅ DATABASE_URL 開頭是 postgresql://
❌ DATABASE_URL 不存在 → 回到步驟 2
❌ DATABASE_URL 是 sqlite:// → 刪除此變數，讓 Zeabur 自動注入
```

**B. 服務連接檢查**

在 user-core 服務頁面：

```
✅ Service Bindings 中有 postgresql
✅ Connection Status 是 Connected
❌ 沒有 Service Bindings → 回到步驟 2 方法 A
❌ 狀態是 Disconnected → 重新連接
```

**C. 日誌檢查**

查看 user-core 最新部署的日誌：

```
✅ 沒有 PostgreSQL 連接錯誤
✅ 沒有 'UserProfile' 字段錯誤
✅ 啟動成功訊息
❌ 出現錯誤 → 複製錯誤訊息，查看下方常見錯誤
```

### 常見錯誤與解決方案

#### 錯誤 1: `connection refused`
```
psycopg2.OperationalError: connection refused
```

**原因：** DATABASE_URL 中的主機地址錯誤

**解決方案：**
1. 檢查 PostgreSQL 服務是否正在運行
2. 重新複製 PostgreSQL 的連接字串
3. 確保沒有手動修改連接字串

#### 錯誤 2: `password authentication failed`
```
psycopg2.OperationalError: FATAL: password authentication failed
```

**原因：** 連接字串中的密碼不正確

**解決方案：**
1. 刪除手動設置的 DATABASE_URL
2. 使用 Service Bindings 讓 Zeabur 自動注入
3. PostgreSQL 服務重啟後密碼可能會變更

#### 錯誤 3: `database "xxx" does not exist`
```
psycopg2.OperationalError: database "xxx" does not exist
```

**原因：** 資料庫名稱錯誤

**解決方案：**
1. 從 PostgreSQL 服務複製正確的連接字串
2. 確保連接字串完整包含資料庫名稱

#### 錯誤 4: `'UserProfile' object has no attribute 'default_post_visibility'`

**原因：** 資料庫架構與代碼不同步（已修復）

**解決方案：**
1. 拉取最新代碼（已包含修復）
2. 重新部署 user-core
3. 如果仍有問題，刪除 PostgreSQL 並重新創建

---

## 📊 驗證成功

所有步驟完成後，你應該看到：

### Zeabur Dashboard

```
✅ postgresql 服務: Running
✅ user-core 服務: Running
✅ DATABASE_URL 環境變數: postgresql://...
✅ Service Binding: postgresql → user-core (Connected)
```

### 啟動日誌

```
INFO:     Application startup complete.
✅ Loaded 20 achievement definitions
INFO:     Uvicorn running on http://0.0.0.0:8080
```

### 功能測試

```
✅ 能夠註冊新帳號
✅ 能夠登入
✅ 重啟服務後能繼續登入（帳號不消失）
✅ 沒有 console 錯誤
```

---

## 🚨 緊急救援

如果以上步驟都試過還是不行：

### 選項 1: 完全重置 PostgreSQL

```bash
# 在 Zeabur Dashboard:
1. 刪除現有的 postgresql 服務
2. 刪除 user-core 服務中的 DATABASE_URL 變數（如果有手動設置）
3. 重新創建 postgresql 服務
4. 使用 Service Bindings 連接到 user-core
5. 重新部署 user-core
```

### 選項 2: 檢查 Zeabur 平台狀態

訪問 https://status.zeabur.com/ 確認沒有平台級別的問題

### 選項 3: 聯繫支援

- Zeabur Discord: https://discord.gg/zeabur
- 提供以下資訊：
  - user-core 啟動日誌
  - DATABASE_URL 環境變數的前 30 個字符
  - PostgreSQL 服務狀態截圖

---

## 📝 最佳實踐

### 開發環境

```bash
# 本地開發使用 SQLite（無需安裝 PostgreSQL）
cd platform/user_core
uvicorn api.main:app --reload --port 8001
```

### 生產環境（Zeabur）

```
✅ 使用 PostgreSQL（持久化儲存）
✅ 使用 Service Bindings（自動管理連接）
✅ 定期備份資料庫
✅ 監控服務狀態
```

### 部署前檢查

```bash
# 確認最新代碼
git pull origin main

# 確認包含修復
grep "default_post_visibility" platform/user_core/models/user_profile.py

# 應該看到這一行:
# default_post_visibility = Column(String(20), nullable=True, default='public')
```

---

## 🎉 完成！

完成所有步驟後：
1. ✅ user-core 連接到 PostgreSQL
2. ✅ 用戶帳號會持久保存
3. ✅ 沒有字段錯誤
4. ✅ 功能正常運行

現在你可以放心使用行程規劃功能了！🎿
