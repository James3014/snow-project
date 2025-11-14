# Gear Operations 重构计划：合并到 user_core

## 问题分析

### 当前设计的问题（违反 Linus 原则）

❌ **过度复杂**：
- 需要独立部署 gear_ops 微服务（端口 8002）
- 需要单独的 PostgreSQL 数据库配置
- 需要运行独立的 Alembic 迁移
- 需要在生产环境（Zeabur）部署新服务
- 增加运维复杂度和成本

❌ **不符合实际需求**：
- 3k 用户的装备管理不需要独立微服务
- 装备功能是用户核心功能的一部分
- 现有 user_core 完全能承载这个负载

### Linus 原则审视

> "Don't design for things you don't need yet"

- 我们不需要独立扩展装备服务
- 装备管理和用户管理天然耦合（每个装备属于一个用户）
- 简单方案：直接放 user_core，复用现有基础设施

## 重构方案：合并到 user_core

### 架构对比

**重构前**：
```
platform/
  gear_ops/          # 独立服务（端口 8002）
    ├── api/
    ├── models.py
    └── database.py
  user_core/         # 用户服务（端口 8000）
    ├── api/
    └── models/
```

**重构后**：
```
platform/
  user_core/         # 统一用户服务（端口 8000）
    ├── api/
    │   ├── users.py
    │   ├── trip_planning.py
    │   └── gear.py           # 新增：装备 API
    ├── models/
    │   ├── user.py
    │   ├── trip_planning.py
    │   └── gear.py           # 新增：装备模型
    └── services/
        └── gear_service.py   # 新增：装备业务逻辑
```

### 优势

✅ **部署简单**：
- 不需要新服务，重启现有 user_core 即可
- 复用现有 PostgreSQL 数据库
- 一次数据库迁移就完成

✅ **开发简单**：
- 复用 user_core 的认证系统
- 复用依赖管理
- 代码组织更合理（用户相关功能在一起）

✅ **运维简单**：
- 减少一个部署单元
- 减少配置复杂度
- 降低成本

---

## 迁移步骤

### Phase 1：后端迁移（user_core）

#### 步骤 1.1：复制模型文件
```bash
# 从 gear_ops 复制到 user_core
cp platform/gear_ops/models.py platform/user_core/models/gear.py
```

**修改内容**：
- 确保导入正确：`from sqlalchemy import ...`
- 确保 `Base` 导入正确：`from platform.user_core.database import Base`

#### 步骤 1.2：复制 schemas
```bash
# 从 gear_ops 复制到 user_core
cp platform/gear_ops/schemas.py platform/user_core/schemas/gear.py
```

**修改内容**：
- 确保 Pydantic 导入正确
- 保持所有 schema 定义不变

#### 步骤 1.3：创建服务层
```bash
# 创建业务逻辑文件
touch platform/user_core/services/gear_service.py
```

**内容**：将 `gear_ops/api/*.py` 中的业务逻辑提取到服务层

#### 步骤 1.4：创建 API 端点
```bash
# 创建 API 文件
touch platform/user_core/api/gear.py
```

**内容**：
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from platform.user_core.database import get_db
from platform.user_core.schemas.gear import GearItemRead, GearItemCreate, GearItemUpdate
from platform.user_core.services.gear_service import GearService
from platform.user_core.api.dependencies import get_current_user_id

router = APIRouter(prefix="/gear", tags=["gear"])

@router.get("/items", response_model=List[GearItemRead])
def list_gear_items(
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = GearService(db)
    return service.list_user_gear(current_user_id)

@router.post("/items", response_model=GearItemRead)
def create_gear_item(
    data: GearItemCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = GearService(db)
    return service.create_gear_item(current_user_id, data)

# ... 其他端点类似
```

#### 步骤 1.5：注册路由
编辑 `platform/user_core/main.py`：
```python
from platform.user_core.api import gear

app.include_router(gear.router, prefix="/api")
```

#### 步骤 1.6：创建数据库迁移
```bash
cd platform/user_core
alembic revision -m "add_gear_tables"
```

编辑新创建的迁移文件：
```python
def upgrade():
    # 创建 gear_items 表
    op.create_table(
        'gear_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('brand', sa.String(100)),
        sa.Column('model', sa.String(100)),
        sa.Column('purchase_date', sa.Date()),
        sa.Column('status', sa.String(20), default='active'),
        sa.Column('role', sa.String(20), default='personal'),
        sa.Column('sale_price', sa.Numeric(10, 2)),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
    )

    # 创建 gear_inspections 表
    op.create_table(
        'gear_inspections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('gear_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('inspection_date', sa.Date(), nullable=False),
        sa.Column('overall_status', sa.String(20), nullable=False),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['gear_id'], ['gear_items.id'], ondelete='CASCADE'),
    )

    # 创建 gear_reminders 表
    op.create_table(
        'gear_reminders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('gear_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reminder_type', sa.String(50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('sent_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.ForeignKeyConstraint(['gear_id'], ['gear_items.id'], ondelete='CASCADE'),
    )

def downgrade():
    op.drop_table('gear_reminders')
    op.drop_table('gear_inspections')
    op.drop_table('gear_items')
```

#### 步骤 1.7：运行迁移
```bash
cd platform/user_core
alembic upgrade head
```

#### 步骤 1.8：更新依赖
编辑 `platform/user_core/requirements.txt`，确保包含：
```
python-jose[cryptography]==3.3.0
```

---

### Phase 2：前端迁移

#### 步骤 2.1：修改 API 客户端
编辑 `platform/frontend/ski-platform/src/shared/api/gearApi.ts`：

**修改前**：
```typescript
const GEAR_API_BASE = import.meta.env.VITE_GEAR_API_URL || 'http://localhost:8002/api/gear';
```

**修改后**：
```typescript
const USER_CORE_API = import.meta.env.VITE_USER_CORE_API || 'http://localhost:8000';
const GEAR_API_BASE = `${USER_CORE_API}/api/gear`;
```

#### 步骤 2.2：删除环境变量
编辑 `.env.development`：
```diff
VITE_USER_CORE_API=http://localhost:8000
VITE_RESORT_API=http://localhost:8001
- VITE_GEAR_API_URL=http://localhost:8002/api/gear
```

编辑 `.env.production`：
```diff
VITE_USER_CORE_API=https://user-core.zeabur.app
VITE_RESORT_API=https://resort-api.zeabur.app
- VITE_GEAR_API_URL=https://gear-api.zeabur.app/api/gear
```

#### 步骤 2.3：验证前端调用
确保所有 API 调用路径正确：
- `GET /api/gear/items` → 列出装备
- `POST /api/gear/items` → 创建装备
- `PUT /api/gear/items/{id}` → 更新装备
- `DELETE /api/gear/items/{id}` → 删除装备

---

### Phase 3：清理旧代码

#### 步骤 3.1：删除 gear_ops 目录
```bash
# 备份（可选）
mv platform/gear_ops platform/gear_ops.backup

# 或直接删除
rm -rf platform/gear_ops
```

#### 步骤 3.2：更新文档
- 删除 `docs/gear-ops/migration-plan.md`（针对独立服务的迁移计划）
- 更新 `docs/gear-ops/IMPLEMENTATION_SUMMARY.md`，说明现在是 user_core 的一部分

#### 步骤 3.3：清理测试文件
如果有独立的 gear_ops 测试：
```bash
# 移动测试到 user_core
mv platform/gear_ops/tests platform/user_core/tests/gear
```

---

### Phase 4：测试验证

#### 步骤 4.1：后端单元测试
```bash
cd platform/user_core
pytest tests/gear/test_gear_service.py -v
```

#### 步骤 4.2：API 集成测试
```bash
# 启动 user_core
cd platform/user_core
uvicorn main:app --reload --port 8000

# 测试 API
curl -X GET http://localhost:8000/api/gear/items \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 步骤 4.3：前端测试
```bash
# 启动前端
cd platform/frontend/ski-platform
npm run dev

# 访问 http://localhost:3000/gear
# 验证：
# - 能够加载装备列表
# - 能够创建新装备
# - 能够删除装备
# - 能够标记待售
```

#### 步骤 4.4：生产环境验证
```bash
# 部署到 Zeabur
# 1. 推送代码到 main 分支
# 2. Zeabur 自动部署 user_core
# 3. 运行数据库迁移：alembic upgrade head
# 4. 验证前端能正常访问 https://user-core.zeabur.app/api/gear/items
```

---

## 文件清单

### 需要创建的文件
- [ ] `platform/user_core/models/gear.py`
- [ ] `platform/user_core/schemas/gear.py`
- [ ] `platform/user_core/services/gear_service.py`
- [ ] `platform/user_core/api/gear.py`
- [ ] `platform/user_core/alembic/versions/XXX_add_gear_tables.py`

### 需要修改的文件
- [ ] `platform/user_core/main.py` - 注册 gear 路由
- [ ] `platform/user_core/requirements.txt` - 添加依赖
- [ ] `platform/frontend/ski-platform/src/shared/api/gearApi.ts` - 修改 API base URL
- [ ] `platform/frontend/ski-platform/.env.development` - 删除 VITE_GEAR_API_URL
- [ ] `platform/frontend/ski-platform/.env.production` - 删除 VITE_GEAR_API_URL

### 需要删除的文件/目录
- [ ] `platform/gear_ops/` - 整个目录

---

## 风险评估

### 低风险
- ✅ 装备功能是新功能，没有现有用户数据
- ✅ 不影响现有 user_core 功能
- ✅ 可以在开发环境充分测试后再部署

### 需要注意
- ⚠️ 确保数据库迁移正确执行
- ⚠️ 确保前端 API URL 修改后测试通过
- ⚠️ 生产环境部署时确认 user_core 服务正常重启

---

## 回滚计划

如果重构后发现问题，可以：

1. **代码回滚**：
```bash
git revert <commit-hash>
git push
```

2. **数据库回滚**：
```bash
cd platform/user_core
alembic downgrade -1
```

3. **恢复独立服务**（如果需要）：
```bash
git checkout <previous-commit> -- platform/gear_ops
```

---

## 时间估算

- Phase 1（后端迁移）：2-3 小时
- Phase 2（前端迁移）：30 分钟
- Phase 3（清理）：15 分钟
- Phase 4（测试）：1-2 小时

**总计：4-6 小时**

---

## 总结

这次重构体现了 Linus 原则：
- ✅ **简单优于复杂**：一个服务优于两个服务
- ✅ **实用优于理想**：3k 用户不需要微服务
- ✅ **可工作优于完美**：复用现有基础设施，快速上线

重构后的系统更简单、更易维护、成本更低。
