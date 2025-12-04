# 🚀 Zeabur 环境设定快速指南

## 需要做什么?

在 Zeabur Dashboard (https://dash.zeabur.com/) 中为你的服务添加新的环境变量。

---

## 步骤 1: User Core 服务

进入 **user-core** 服务 → **Variables** → **Edit Raw Variables**

复制粘贴:
```bash
CASI_WORKFLOW_URL=
CASI_WORKFLOW_API_KEY=
TRIPBUDDY_WORKFLOW_URL=
TRIPBUDDY_WORKFLOW_API_KEY=
COURSE_RECOMMENDATION_WORKFLOW_URL=
COURSE_RECOMMENDATION_WORKFLOW_API_KEY=
GEAR_REMINDER_WORKFLOW_URL=
GEAR_REMINDER_WORKFLOW_API_KEY=
```

点击 **Save** → 等待自动重新部署 (1-2 分钟)

---

## 步骤 2: 推送代码 (如果还没推送)

```bash
cd /Users/jameschen/Downloads/diyski/project
git add .
git commit -m "feat: add LDF workflow integration"
git push origin main
```

Zeabur 会自动检测并重新部署。

---

## 步骤 3: 验证

```bash
# 检查 API 是否正常
curl https://user-core.zeabur.app/health
```

应该返回 200 状态码。

---

## ⚠️ 重要说明

- ✅ 所有新环境变量都**留空** (空字符串 `=` 后面什么都不填)
- ✅ 系统会自动使用**本地执行模式** (Redis/BackgroundTasks)
- ✅ **不影响现有功能**
- ✅ 未来部署 AWS Lambda 后,只需填入 URL 即可启用 workflow

---

## 📚 详细文档

- [完整部署指南](docs/ZEABUR_LDF_DEPLOYMENT.md)
- [详细检查清单](docs/ZEABUR_UPDATE_CHECKLIST.md)
- [环境变量说明](docs/LDF_ENVIRONMENT.md)
- [测试报告](docs/LDF_TEST_REPORT.md)

---

## 需要帮助?

如果遇到问题:
1. 查看 Zeabur Dashboard → 服务 → Logs
2. 运行 `./scripts/verify_ldf_integration.sh` 验证本地代码
3. 参考 [故障排除](docs/ZEABUR_UPDATE_CHECKLIST.md#-如果遇到问题)

---

**预计时间**: 10 分钟
**风险**: 🟢 极低
**可回滚**: ✅ 是
