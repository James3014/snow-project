# Zeabur 环境设定更新检查清单

**目标**: 为现有 Zeabur 部署添加 LDF workflow 支持
**预计时间**: 10-15 分钟
**风险等级**: 🟢 低 (使用 fallback 模式,不影响现有功能)

---

## ✅ 准备工作

### 1. 确认服务列表

请先在 Zeabur Dashboard 确认你有以下服务:

```bash
# 访问: https://dash.zeabur.com/
# 记录你的项目名称和服务名称
```

预期服务:
- [ ] `user-core` 或类似名称的后端服务
- [ ] `snowbuddy-matching` 或类似名称的匹配服务
- [ ] `ski-platform` 前端服务 (不需要修改)
- [ ] Redis 服务 (用于 fallback)

---

## 🔧 需要添加的环境变量

### 服务 1: User Core

**在 Zeabur Dashboard 中操作**:

1. 进入你的项目 → 选择 **user-core** 服务
2. 点击 **Variables** 标签
3. 点击 **Edit Raw Variables** 或 **Add Variable**
4. 复制粘贴以下内容:

```bash
# LDF Workflow URLs (暂时留空,使用本地执行模式)
CASI_WORKFLOW_URL=
CASI_WORKFLOW_API_KEY=
TRIPBUDDY_WORKFLOW_URL=
TRIPBUDDY_WORKFLOW_API_KEY=
COURSE_RECOMMENDATION_WORKFLOW_URL=
COURSE_RECOMMENDATION_WORKFLOW_API_KEY=
GEAR_REMINDER_WORKFLOW_URL=
GEAR_REMINDER_WORKFLOW_API_KEY=
```

5. 点击 **Save** 或 **Confirm**
6. 等待服务自动重新部署 (约 1-2 分钟)

---

### 服务 2: Snowbuddy Matching (如果有单独部署)

**在 Zeabur Dashboard 中操作**:

1. 进入你的项目 → 选择 **snowbuddy-matching** 服务
2. 点击 **Variables** 标签
3. 点击 **Edit Raw Variables** 或 **Add Variable**
4. 复制粘贴以下内容:

```bash
# LDF Workflow Configuration (暂时留空,使用 Redis fallback)
MATCHING_WORKFLOW_URL=
MATCHING_WORKFLOW_AUTH_MODE=api_key
MATCHING_WORKFLOW_API_KEY=
MATCHING_WORKFLOW_API_KEY_HEADER=X-API-Key
MATCHING_WORKFLOW_SIGV4_SERVICE=execute-api
MATCHING_WORKFLOW_CALLBACK_URL=
MATCHING_WORKFLOW_TIMEOUT_SECONDS=3600
MATCHING_NOTIFICATION_WEBHOOK_URL=

# AWS Credentials (暂时留空)
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
```

5. 点击 **Save** 或 **Confirm**
6. 等待服务自动重新部署

**如果 snowbuddy-matching 是集成在 user-core 内部**,则只需要更新 user-core 的环境变量。

---

## 📤 推送代码更新 (如果还没推送)

```bash
cd /Users/jameschen/Downloads/diyski/project

# 1. 查看待提交的文件
git status

# 2. 添加所有新文件
git add snowbuddy_matching/app/services/workflow_orchestrator.py
git add snowbuddy_matching/app/services/workflow_clients.py
git add snowbuddy_matching/app/clients/workflow_client.py
git add platform/user_core/services/workflow_dispatchers.py
git add docs/LDF_ENVIRONMENT.md
git add docs/LDF_TEST_REPORT.md
git add docs/ZEABUR_LDF_DEPLOYMENT.md

# 3. 提交
git commit -m "feat: add LDF workflow integration with fallback support

- Add MatchingWorkflowOrchestrator for Snowbuddy matching
- Add 4 workflow dispatchers for User Core (CASI, TripBuddy, Course, Gear)
- Support API Key and AWS SigV4 authentication
- Automatic fallback to Redis/BackgroundTasks when no workflow URL
- Add comprehensive documentation and test suite
"

# 4. 推送到远程
git push origin main
```

---

## ✅ 验证部署

### 1. 检查服务状态 (Zeabur Dashboard)

在 https://dash.zeabur.com/ 中:

- [ ] User Core 服务显示 **Running** 状态
- [ ] 没有 **Build Failed** 或 **Deployment Failed** 错误
- [ ] 查看 Logs,应该看到类似信息:
  ```
  INFO: Application startup complete.
  ```

### 2. 测试 API 端点

```bash
# 测试 User Core API
curl https://user-core.zeabur.app/health
# 预期返回: {"status": "healthy"} 或类似信息

# 测试 User Core API 文档
curl https://user-core.zeabur.app/docs
# 预期返回: OpenAPI 文档页面

# 如果有 snowbuddy-matching 服务
curl https://snowbuddy-matching.zeabur.app/docs
```

### 3. 检查前端是否正常

访问 https://ski-platform.zeabur.app/:
- [ ] 页面正常加载
- [ ] 可以登录/使用现有功能
- [ ] 没有 API 错误

### 4. 查看日志 (可选)

在 Zeabur Dashboard → 服务 → Logs 标签中,查找:

**正常信息** (预期看到):
```
⚠️ CASI_WORKFLOW_URL not configured, will use local execution
⚠️ MATCHING_WORKFLOW_URL not configured, will fallback to Redis
```

**错误信息** (如果看到这些,请报告):
```
❌ ModuleNotFoundError: No module named 'httpx'
❌ ImportError: cannot import name 'workflow_dispatchers'
```

---

## 🎯 完成后的效果

### ✅ 现在的状态 (更新后)

1. **User Core**:
   - ✅ 支持 CASI/TripBuddy/Course/Gear workflow
   - ✅ 由于 URL 未配置,自动使用本地执行模式
   - ✅ 功能与之前完全相同

2. **Snowbuddy Matching**:
   - ✅ 支持 workflow orchestrator
   - ✅ 由于 URL 未配置,自动使用 Redis BackgroundTasks
   - ✅ 功能与之前完全相同

3. **前端**:
   - ✅ 无变化,继续使用现有 API

### 🔮 未来:启用 AWS Lambda Workflow

当你准备好部署 AWS Lambda 后:

1. 在 AWS 上部署 Lambda + DynamoDB
2. 获得 workflow URL (例如: https://xxxx.execute-api.us-east-2.amazonaws.com/prod)
3. 在 Zeabur 中填入 URL 和 API Key
4. 重新部署服务
5. ✨ 自动切换到 durable workflow 模式!

---

## 🆘 如果遇到问题

### 问题 1: 部署失败

**检查**:
- Zeabur Dashboard → 服务 → Logs
- 查看具体错误信息

**可能原因**:
- 依赖包缺失 → 检查 `requirements.txt`
- 代码语法错误 → 检查 Git commit

**解决**:
```bash
# 回滚到上一个版本
cd /Users/jameschen/Downloads/diyski/project
git revert HEAD
git push origin main
```

### 问题 2: 服务启动但 API 报错

**检查**:
- 环境变量格式是否正确 (留空 = 空字符串,不是 "null")
- 是否有必需的环境变量缺失 (如 DATABASE_URL, REDIS_URL)

**解决**:
- 在 Zeabur Variables 中,确认格式为:
  ```
  MATCHING_WORKFLOW_URL=
  ```
  而不是:
  ```
  MATCHING_WORKFLOW_URL=null
  ```

### 问题 3: 前端无法连接 API

**检查**:
- User Core 服务是否正常运行
- CORS 设置是否包含前端域名

**解决**:
确认 User Core 的 CORS 配置:
```bash
CORS_ORIGINS=https://ski-platform.zeabur.app
CORS_ORIGIN_REGEX=https://.*\.zeabur\.app
```

---

## 📞 联系支持

如果遇到无法解决的问题:

1. **保存日志**: 从 Zeabur Dashboard 复制完整的错误日志
2. **记录步骤**: 记下你执行了哪些操作
3. **回滚**: 使用上述回滚方法恢复服务
4. **报告**: 提供日志和步骤信息以便诊断

---

## ✅ 完成检查清单

部署完成后,确认以下所有项目:

- [ ] User Core 服务在 Zeabur 上显示 Running 状态
- [ ] Snowbuddy Matching 服务在 Zeabur 上显示 Running 状态 (如果有)
- [ ] 环境变量已添加 (可以全部留空)
- [ ] `curl https://user-core.zeabur.app/health` 返回 200
- [ ] 前端 https://ski-platform.zeabur.app 正常访问
- [ ] 现有功能正常工作 (登录、查询、匹配等)
- [ ] 日志中没有 ImportError 或 ModuleNotFoundError
- [ ] 日志中看到 "fallback" 相关信息 (预期行为)

---

## 📊 预期结果

**成功标志**:
- ✅ 所有服务状态为 Running
- ✅ API 端点正常响应
- ✅ 前端功能正常
- ✅ 日志中显示使用 fallback 模式

**用户体验**:
- ❌ 无变化 (这是好事!)
- ✅ 为未来 workflow 升级做好准备

**下一步**:
- 📅 规划 AWS Lambda 部署时间
- 📝 准备 AWS 账号和权限
- 🧪 在 staging 环境测试 workflow 功能

---

**预计完成时间**: 10-15 分钟
**风险**: 🟢 极低 (使用 fallback,不影响现有功能)
**可回滚**: ✅ 是 (随时可以 git revert)

祝部署顺利! 🚀
