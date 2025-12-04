# Zeabur 部署 - LDF Workflow 集成更新指南

本指南针对**已有 Zeabur 部署**的情况,说明如何添加 LDF (Lambda Durable Functions) workflow 集成所需的环境变量。

---

## 📋 现有部署情况

根据 `.env.production` 文件,你目前在 Zeabur 上部署了以下服务:

| 服务 | Zeabur URL | 状态 |
|------|-----------|------|
| User Core API | https://user-core.zeabur.app | ✅ 运行中 |
| Resort API | https://resort-api.zeabur.app | ✅ 运行中 |
| Snowbuddy Matching | https://snowbuddy-matching.zeabur.app | ✅ 运行中 |
| Ski Platform (前端) | https://ski-platform.zeabur.app | ✅ 运行中 |

---

## 🎯 需要更新的服务

### 1. Snowbuddy Matching Service ⚠️ 需要更新

**服务名称**: `snowbuddy-matching` (假设这是 Zeabur 项目中的服务名)
**现有 URL**: https://snowbuddy-matching.zeabur.app

#### 需要添加的环境变量

由于 LDF workflow 层尚未部署到 AWS,目前可以先配置为**空值**或**不配置**,系统会自动使用本地 Redis 模式。

前往 Zeabur Dashboard → `snowbuddy-matching` 服务 → Variables,添加:

```bash
# === LDF Workflow 配置 (暂时留空,使用 Redis fallback) ===
MATCHING_WORKFLOW_URL=
MATCHING_WORKFLOW_AUTH_MODE=api_key
MATCHING_WORKFLOW_API_KEY=
MATCHING_WORKFLOW_CALLBACK_URL=https://snowbuddy-matching.zeabur.app/webhooks/matching
MATCHING_WORKFLOW_TIMEOUT_SECONDS=3600
MATCHING_NOTIFICATION_WEBHOOK_URL=

# === AWS 认证 (暂时留空) ===
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

**说明**:
- ✅ 留空时,系统会使用现有的 Redis BackgroundTasks 模式
- ✅ 不会影响现有功能
- ✅ 未来部署 AWS Lambda 后,只需填入这些变量即可启用 workflow

---

### 2. User Core Service ⚠️ 需要更新

**服务名称**: `user-core` (假设这是 Zeabur 项目中的服务名)
**现有 URL**: https://user-core.zeabur.app

#### 需要添加的环境变量

前往 Zeabur Dashboard → `user-core` 服务 → Variables,添加:

```bash
# === CASI Skill Sync Workflow (暂时留空) ===
CASI_WORKFLOW_URL=
CASI_WORKFLOW_API_KEY=

# === TripBuddy Request Workflow (暂时留空) ===
TRIPBUDDY_WORKFLOW_URL=
TRIPBUDDY_WORKFLOW_API_KEY=

# === Course Recommendation Workflow (暂时留空) ===
COURSE_RECOMMENDATION_WORKFLOW_URL=
COURSE_RECOMMENDATION_WORKFLOW_API_KEY=

# === Gear Reminder Workflow (暂时留空) ===
GEAR_REMINDER_WORKFLOW_URL=
GEAR_REMINDER_WORKFLOW_API_KEY=
```

**说明**:
- ✅ 留空时,CASI 会使用本地 `update_casi_profile_task`
- ✅ 其他 workflow 会直接跳过远程调用
- ✅ 不会影响现有功能

---

## 🚀 部署步骤 (Zeabur)

### Step 1: 更新代码

如果尚未推送到 Git:

```bash
cd /Users/jameschen/Downloads/diyski/project

# 检查修改的文件
git status

# 提交新的 workflow 集成代码
git add .
git commit -m "feat: add LDF workflow integration with fallback support"
git push origin main
```

### Step 2: 在 Zeabur 更新环境变量

#### 方法 A: 通过 Zeabur Dashboard (推荐)

1. 登入 https://dash.zeabur.com/
2. 选择你的项目
3. 点击 **snowbuddy-matching** 服务
4. 进入 **Variables** 标签
5. 点击 **Edit Raw Variables** (编辑原始变量)
6. 粘贴上面的环境变量 (留空值)
7. 点击 **Save**
8. 服务会自动重新部署

重复以上步骤,为 **user-core** 服务添加环境变量。

#### 方法 B: 通过 Zeabur CLI (可选)

```bash
# 安装 Zeabur CLI (如果尚未安装)
npm install -g @zeabur/cli

# 登入
zeabur login

# 设置环境变量 (示例)
zeabur env set MATCHING_WORKFLOW_URL="" --service snowbuddy-matching
zeabur env set MATCHING_WORKFLOW_AUTH_MODE="api_key" --service snowbuddy-matching
# ... 继续添加其他变量
```

### Step 3: 验证部署

#### 3.1 检查服务状态

```bash
# 检查 Snowbuddy Matching 服务
curl https://snowbuddy-matching.zeabur.app/health

# 检查 User Core 服务
curl https://user-core.zeabur.app/health
```

#### 3.2 测试 workflow fallback 模式

```bash
# 测试匹配搜索 (应该使用 Redis fallback)
curl -X POST https://snowbuddy-matching.zeabur.app/matching/searches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "skill_level_min": 3,
    "skill_level_max": 7,
    "preferred_resorts": ["hokkaido_niseko_moiwa"],
    "seeking_role": "buddy"
  }'

# 返回应该包含 search_id
# {"search_id": "uuid-here"}
```

#### 3.3 检查日志

在 Zeabur Dashboard 中查看服务日志:
- 应该看到 "⚠️ MATCHING_WORKFLOW_URL not configured" 或类似信息
- 应该看到 "Will fallback to Redis background tasks"
- **没有错误**表示成功

---

## 🔮 未来:启用 AWS Lambda Workflow

当你准备好部署 AWS Lambda Durable Functions 时:

### 1. 部署 AWS 基础设施

```bash
# 在 AWS 上部署 Lambda + API Gateway + DynamoDB
# (需要单独的部署指南,可能使用 SAM/Terraform/Serverless Framework)
```

### 2. 获取 Workflow URL

部署完成后,你会得到类似这样的 URL:
- API Gateway: `https://xxxx.execute-api.us-east-2.amazonaws.com/prod`
- Lambda Function URL: `https://xxxx.lambda-url.us-east-2.on.aws`

### 3. 更新 Zeabur 环境变量

#### 选项 A: 使用 API Key 认证 (推荐用于 API Gateway)

```bash
MATCHING_WORKFLOW_URL=https://xxxx.execute-api.us-east-2.amazonaws.com/prod
MATCHING_WORKFLOW_AUTH_MODE=api_key
MATCHING_WORKFLOW_API_KEY=your-api-gateway-key
```

#### 选项 B: 使用 IAM SigV4 认证 (推荐用于 Lambda Function URL)

```bash
MATCHING_WORKFLOW_URL=https://xxxx.lambda-url.us-east-2.on.aws
MATCHING_WORKFLOW_AUTH_MODE=iam_sigv4
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxx
```

**重要**:AWS 凭证应该使用 Zeabur 的 **Secret** 功能存储,不要明文存储!

### 4. 测试远程 workflow

```bash
# 在本地测试 (使用生产环境变量)
cd snowbuddy_matching
export MATCHING_WORKFLOW_URL="https://xxxx.execute-api.us-east-2.amazonaws.com/prod"
export MATCHING_WORKFLOW_API_KEY="your-key"
python3 test_ldf_integration.py

# 应该看到:
# ✅ LDF Workflow Mode: PASS
```

---

## 📊 Zeabur 部署检查清单

在 Zeabur Dashboard 中,确认以下配置:

### Snowbuddy Matching 服务

- [ ] **Environment**: Production
- [ ] **Build Command**: `pip install -r requirements.txt` (自动)
- [ ] **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] **Variables**: 添加上述 workflow 相关变量 (可以留空)
- [ ] **Redis**: 确保有 Redis 实例连接 (`REDIS_URL` 已配置)
- [ ] **Networking**: 允许来自 `user-core` 和前端的请求

### User Core 服务

- [ ] **Environment**: Production
- [ ] **Variables**: 添加 4 个 workflow URL 变量 (可以留空)
- [ ] **Database**: PostgreSQL 或 SQLite 已配置
- [ ] **CORS**: 包含 `ski-platform.zeabur.app`

---

## 🛠️ 故障排除

### 问题 1: 部署后服务无法启动

**检查**:
- Zeabur Dashboard → Logs,查看启动错误
- 可能原因:缺少必要的依赖包 (应该不会,因为环境变量留空不影响启动)

**解决**:
```bash
# 确认 requirements.txt 包含所有依赖
cat snowbuddy_matching/requirements.txt | grep -E "httpx|botocore|redis"
```

### 问题 2: Workflow 相关功能报错

**检查**:
- 查看日志是否有 "workflow" 或 "dispatcher" 相关错误
- 确认环境变量格式正确 (留空 = 空字符串,不是 "null" 或 "undefined")

**解决**:
```bash
# 在 Zeabur Variables 中,确保格式为:
MATCHING_WORKFLOW_URL=
# 而不是:
MATCHING_WORKFLOW_URL=null
```

### 问题 3: Redis 连接失败

**检查**:
- Zeabur Dashboard → snowbuddy-matching → Services
- 确认 Redis 服务已启用并连接

**解决**:
- 在 Zeabur 中添加 Redis 服务
- 系统会自动注入 `REDIS_URL` 环境变量

---

## 📝 回滚计划

如果更新后出现问题:

### 方法 1: 回滚到上一个部署

在 Zeabur Dashboard:
1. 进入服务 → Deployments 标签
2. 找到上一个成功的部署
3. 点击 **Redeploy**

### 方法 2: 移除新环境变量

在 Zeabur Dashboard → Variables:
1. 删除所有新添加的 workflow 相关变量
2. 保存并重新部署

### 方法 3: Git 回滚

```bash
git revert HEAD
git push origin main
# Zeabur 会自动检测并重新部署
```

---

## 💰 成本影响

### Zeabur 成本
- ✅ **不增加成本**: 新代码只添加了回退逻辑,不会增加资源使用
- ✅ Redis 使用量不变 (继续使用现有模式)

### 未来 AWS 成本 (当启用 workflow 时)
- **Lambda**: 按调用次数计费 (免费额度: 100 万次/月)
- **DynamoDB**: 按读写量计费 (免费额度: 25GB + 25 读写单位)
- **API Gateway**: 按 API 调用计费 (免费额度: 100 万次/月前 12 个月)

预估成本 (低流量): $0-5/月

---

## 📚 相关文档

- [LDF 环境变量配置](./LDF_ENVIRONMENT.md)
- [完整测试报告](./LDF_TEST_REPORT.md)
- [Zeabur 文档](https://docs.zeabur.com)
- [原项目部署文档](../specs/單板教學/docs/PRODUCTION_DEPLOYMENT.md)

---

## ✅ 总结

**当前状态**: 代码已准备好,环境变量可留空
**部署影响**: ❌ 无 (使用 fallback 模式)
**用户影响**: ❌ 无 (功能不变)
**回滚风险**: ✅ 低 (随时可以移除环境变量)

**推荐做法**:
1. 先部署代码 + 空环境变量到 Zeabur
2. 验证功能正常 (使用 Redis fallback)
3. 未来有需要时再部署 AWS Lambda workflow 层
4. 填入 workflow URL 启用新功能

这样可以分阶段部署,降低风险! 🚀
