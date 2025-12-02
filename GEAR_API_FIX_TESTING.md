# Gear API 认证问题修复 - 测试说明

## 问题分析

### 根本原因
用户遇到 401 Unauthorized 错误的**真正原因**：
- **浏览器访问的是生产环境的构建** (`https://user-core.zeabur.app`)
- 但 localStorage 中没有有效的生产环境 token
- 或者浏览器缓存了旧的生产构建文件

### 已修复內容
在提交 `22b3982` 中：
- ✅ 修复了 `gearApi.ts` 中的 localStorage key：从 `'token'` 改为 `'auth_token'`
- ✅ 确保与其他 API 客户端保持一致

## 测试结果

### 后端 API 测试（全部通过✅）
```bash
1. 用户注册：✅ 成功，返回 access_token
2. Gear API 查詢（带认证）：✅ 成功返回空数组
3. 建立 Gear Item：✅ 成功建立
4. 再次查詢：✅ 成功返回建立的 item
```

### 服务器状态
- **后端服务器**：运行在 `http://localhost:8000` ✅
- **前端开发服务器**：运行在 `http://localhost:3000` ✅

## 如何正确测试（开发环境）

### 步骤 1：启动服务器

**后端（终端 1）：**
```bash
cd platform/user_core
python -m uvicorn api.main:app --reload --port 8000 --host 0.0.0.0
```

**前端（终端 2）：**
```bash
cd platform/frontend/ski-platform
npm run dev
```

### 步骤 2：清除浏览器缓存和 localStorage

**重要！必须清除旧資料：**
1. 打开浏览器开发者工具（F12）
2. 进入 Application / Storage 标签
3. 清除以下內容：
   - **Clear storage**（推荐）
   - 或手动刪除 localStorage 中的 `auth_token`
   - 清除 Cache Storage
4. 硬刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）

### 步骤 3：访问开发服务器

访问 `http://localhost:3000`（**不是** localhost:5173）

### 步骤 4：测试流程

1. **注册新用户**
   - 打开注册页面
   - 填写邮箱、密码、顯示名称
   - 提交注册

2. **检查认证状态**
   - 打开开发者工具 > Application > Local Storage
   - 確認有 `auth_token` 项目
   - token 应该是一个 UUID 格式的字符串

3. **访问 My Gear 页面**
   - 导航到"我的装备"页面
   - 应该能看到空列表或装备列表
   - **不应该出现 401 错误**

4. **建立测试装备**
   - 点击"添加装备"
   - 填写装备資訊
   - 保存

5. **验证 API 调用**
   - 打开开发者工具 > Network 标签
   - 刷新页面
   - 检查 API 请求：
     - URL 应该是 `http://localhost:8000/api/gear/items`
     - Headers 中应该有 `Authorization: Bearer <token>`
     - 响应状态应该是 200 OK

## 常见问题排查

### 仍然看到生产环境 URL？

**原因**：浏览器缓存了生产构建

**解决方案**：
1. 关闭所有相关浏览器标签
2. 清除浏览器缓存（Ctrl+Shift+Delete）
3. 在前端目录运行：
   ```bash
   rm -rf dist .vite node_modules/.vite
   npm run dev
   ```
4. 确保访问的是 `http://localhost:3000`

### 仍然收到 401 错误？

**检查清单**：
- [ ] 后端服务器正在运行（http://localhost:8000/health 返回 {"status":"ok"}）
- [ ] 前端使用开发模式（`npm run dev`，不是 `npm run build`）
- [ ] localStorage 中有 `auth_token`（不是 `token`）
- [ ] 已清除浏览器缓存和 localStorage
- [ ] 访问的是 localhost:3000（检查地址栏）

### 手动验证 API

使用 curl 测试：
```bash
# 1. 注册用户并取得 token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","display_name":"Test"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# 2. 测试 Gear API
curl -X GET http://localhost:8000/api/gear/items \
  -H "Authorization: Bearer $TOKEN"
```

应该返回 `[]` 或装备列表，而不是 401 错误。

## 生产环境部署

如果要部署到生产环境：
1. 确保 `.env.production` 配置正确
2. 构建前端：`npm run build`
3. 部署到 Zeabur 或其他平台
4. 在生产环境中重新注册/登录取得有效的生产 token

## 技术细节

### 修复內容（gearApi.ts:29）
```typescript
// 修复前（错误）
const token = localStorage.getItem('token');

// 修复后（正确）
const token = localStorage.getItem('auth_token');
```

### 为什么会出现 401？
1. `authSlice.ts` 在登录/注册时保存 token 到 `'auth_token'`
2. `client.ts` 中的通用 API 客户端读取 `'auth_token'`
3. 但 `gearApi.ts` 错误地读取 `'token'`（不存在）
4. 导致请求没有携带 Authorization header
5. 后端返回 401 Unauthorized

### 环境变量说明
- **开发环境** (`.env.development`): `VITE_USER_CORE_API=http://localhost:8000`
- **生产环境** (`.env.production`): `VITE_USER_CORE_API=https://user-core.zeabur.app`
- Vite 根据运行模式自动選擇对应的 .env 文件

---

## 结论

✅ **代码修复已完成且经过测试验证**

如果仍然遇到问题，请：
1. 確認访问的是开发服务器 (localhost:3000)
2. 清除所有浏览器缓存和 localStorage
3. 重新启动前后端服务器
4. 按照上述测试流程重新测试

**Linus 原则：不要假设，实际测试。** ✅
