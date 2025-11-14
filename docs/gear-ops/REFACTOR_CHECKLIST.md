# Gear Operations 重构执行清单

> 将独立的 gear_ops 服务合并到 user_core

---

## 📋 Phase 1：后端迁移

### 1.1 复制和修改模型文件
```bash
cp platform/gear_ops/models.py platform/user_core/models/gear.py
```

- [ ] 复制文件成功
- [ ] 修改导入：`from platform.user_core.database import Base`
- [ ] 验证：`python -c "from platform.user_core.models.gear import GearItem"`

### 1.2 复制 schemas
```bash
cp platform/gear_ops/schemas.py platform/user_core/schemas/gear.py
```

- [ ] 复制文件成功
- [ ] 验证：`python -c "from platform.user_core.schemas.gear import GearItemRead"`

### 1.3 创建服务层
```bash
touch platform/user_core/services/gear_service.py
```

- [ ] 创建文件
- [ ] 从 `gear_ops/api/items.py` 提取业务逻辑到 `GearService` 类
- [ ] 从 `gear_ops/api/inspections.py` 添加检查相关方法
- [ ] 从 `gear_ops/api/reminders.py` 添加提醒相关方法

### 1.4 创建 API 端点
```bash
touch platform/user_core/api/gear.py
```

- [ ] 创建 `router = APIRouter(prefix="/gear", tags=["gear"])`
- [ ] 添加装备 CRUD 端点（参考 `gear_ops/api/items.py`）
  - [ ] `GET /items` - 列出装备
  - [ ] `POST /items` - 创建装备
  - [ ] `GET /items/{id}` - 获取单个装备
  - [ ] `PUT /items/{id}` - 更新装备
  - [ ] `DELETE /items/{id}` - 删除装备
- [ ] 添加检查端点（参考 `gear_ops/api/inspections.py`）
  - [ ] `GET /items/{id}/inspections` - 列出检查记录
  - [ ] `POST /items/{id}/inspections` - 创建检查
- [ ] 添加提醒端点（参考 `gear_ops/api/reminders.py`）
  - [ ] `GET /reminders` - 列出提醒
- [ ] 添加二手市场端点
  - [ ] `GET /marketplace` - 列出待售装备

### 1.5 注册路由
编辑 `platform/user_core/main.py`

- [ ] 添加导入：`from platform.user_core.api import gear`
- [ ] 添加路由：`app.include_router(gear.router, prefix="/api")`
- [ ] 验证：启动服务，访问 `http://localhost:8000/docs`，查看 gear 端点

### 1.6 创建数据库迁移
```bash
cd platform/user_core
alembic revision -m "add_gear_tables"
```

- [ ] 运行命令创建迁移文件
- [ ] 编辑迁移文件，添加 `upgrade()` 逻辑（创建 3 个表）
  - [ ] gear_items 表
  - [ ] gear_inspections 表
  - [ ] gear_reminders 表
- [ ] 编辑 `downgrade()` 逻辑（删除 3 个表）
- [ ] 复制迁移 SQL 参考：`platform/gear_ops/alembic/versions/001_create_gear_tables.py`

### 1.7 运行迁移
```bash
cd platform/user_core
alembic upgrade head
```

- [ ] 运行迁移成功
- [ ] 验证表已创建：
```sql
\dt gear_*
-- 应该看到 3 个表
```

### 1.8 更新依赖
编辑 `platform/user_core/requirements.txt`

- [ ] 确认已包含：`python-jose[cryptography]==3.3.0`
- [ ] 运行 `pip install -r requirements.txt`

### 1.9 测试后端
```bash
cd platform/user_core
uvicorn main:app --reload --port 8000
```

- [ ] 服务启动成功
- [ ] 访问 `http://localhost:8000/docs`
- [ ] 测试 `POST /api/gear/items` 创建装备
- [ ] 测试 `GET /api/gear/items` 列出装备
- [ ] 确认 JWT 认证正常工作

---

## 📋 Phase 2：前端迁移

### 2.1 修改 API 客户端
编辑 `platform/frontend/ski-platform/src/shared/api/gearApi.ts`

**修改前**：
```typescript
const GEAR_API_BASE = import.meta.env.VITE_GEAR_API_URL || 'http://localhost:8002/api/gear';
```

**修改后**：
```typescript
const USER_CORE_API = import.meta.env.VITE_USER_CORE_API || 'http://localhost:8000';
const GEAR_API_BASE = `${USER_CORE_API}/api/gear`;
```

- [ ] 修改代码
- [ ] 删除 axios 客户端的独立配置

### 2.2 删除环境变量

编辑 `.env.development`：
- [ ] 删除 `VITE_GEAR_API_URL=http://localhost:8002/api/gear`

编辑 `.env.production`：
- [ ] 删除 `VITE_GEAR_API_URL=https://gear-api.zeabur.app/api/gear`

### 2.3 测试前端
```bash
cd platform/frontend/ski-platform
npm run dev
```

- [ ] 前端启动成功
- [ ] 访问 `http://localhost:3000/gear`
- [ ] 测试创建装备
- [ ] 测试列表显示
- [ ] 测试删除装备
- [ ] 测试标记待售
- [ ] 检查浏览器控制台无错误

---

## 📋 Phase 3：清理旧代码

### 3.1 删除 gear_ops 目录

**选项 A：直接删除**
```bash
rm -rf platform/gear_ops
```

**选项 B：先备份**
```bash
mv platform/gear_ops platform/gear_ops.backup
```

- [ ] 选择删除或备份
- [ ] 确认删除成功

### 3.2 更新文档
- [ ] 删除或更新 `docs/gear-ops/migration-plan.md`
- [ ] 更新 `docs/gear-ops/IMPLEMENTATION_SUMMARY.md`，说明现在是 user_core 的一部分

### 3.3 Git 提交
```bash
git add -A
git commit -m "refactor: 将 Gear Operations 合并到 user_core

- 删除独立的 gear_ops 微服务
- 装备功能现在是 user_core 的一部分
- 简化部署：不需要额外的服务和数据库
- 复用现有认证和数据库基础设施
"
```

- [ ] 暂存所有改动
- [ ] 提交
- [ ] 推送到远程

---

## 📋 Phase 4：生产环境部署

### 4.1 部署准备
- [ ] 确认本地测试全部通过
- [ ] 合并到 main 分支
```bash
git checkout main
git merge claude/review-gear-ops-tasks-011CV4xH8XTzkP52DHK8zYfK
git push origin main
```

### 4.2 Zeabur 部署
- [ ] Zeabur 自动检测到 push，开始部署 user_core
- [ ] 等待部署完成
- [ ] 查看部署日志，确认无错误

### 4.3 数据库迁移
在 Zeabur 控制台或远程服务器：
```bash
cd platform/user_core
alembic upgrade head
```

- [ ] 运行迁移
- [ ] 确认表已创建

### 4.4 生产环境验证
- [ ] 访问 `https://user-core.zeabur.app/docs`
- [ ] 确认 `/api/gear/*` 端点存在
- [ ] 前端访问 `https://your-frontend.zeabur.app/gear`
- [ ] 测试完整的 CRUD 流程
- [ ] 检查生产环境日志，确认无错误

---

## ✅ 完成检查

- [ ] 后端 API 正常工作（开发环境）
- [ ] 前端 UI 正常工作（开发环境）
- [ ] 数据库迁移成功
- [ ] 生产环境部署成功
- [ ] 生产环境功能测试通过
- [ ] 旧代码已删除
- [ ] 文档已更新
- [ ] Git 历史清晰

---

## 🆘 遇到问题？

### 问题 1：迁移失败
```bash
# 回滚迁移
cd platform/user_core
alembic downgrade -1
```

### 问题 2：API 报错
- 检查日志：`tail -f logs/user_core.log`
- 检查数据库连接
- 确认模型导入正确

### 问题 3：前端无法连接
- 检查环境变量：`VITE_USER_CORE_API` 是否正确
- 检查浏览器控制台 Network 标签
- 确认后端 CORS 配置

### 问题 4：需要回滚
```bash
# 代码回滚
git revert HEAD
git push

# 数据库回滚
alembic downgrade -1
```

---

## 📞 联系

如果在执行过程中遇到任何问题，请联系项目负责人。
