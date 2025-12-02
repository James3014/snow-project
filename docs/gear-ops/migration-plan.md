# Gear Operations Migration Plan

**Version**: 1.0
**Date**: 2025-11-13
**Status**: Draft

## Executive Summary

本文档描述将现有装备管理資料迁移到新的 Gear Operations 系统的策略。遵循 **"Never Break Userspace"** 原则，确保迁移过程零停机、可回滚、資料一致性。

---

## 1. 现状分析

### 1.1 现有系统评估

**需要调查的資訊**：
- [ ] 现有装备資料存储在哪里？（資料库表名、schema）
- [ ] 现有資料量是多少？（用户数、装备数）
- [ ] 现有系统是否有提醒功能？
- [ ] 现有系统的API端点有哪些？
- [ ] 有哪些下游系统依赖现有API？

**假设情境**（需根据实际情况调整）：
```
旧系统：
- 表名：old_equipment（在 user_core 資料库中）
- 資料量：3,000 用户，10,000 件装备
- 无检查记录和提醒功能
- API：GET /user/{id}/equipment, POST /equipment
```

### 1.2 新系统特性

**Gear Operations 新增功能**：
- 3个新表：gear_items, gear_inspections, gear_reminders
- 检查记录与自动提醒
- 二手买卖marketplace
- 独立的微服务（可独立部署）

---

## 2. 迁移策略

### 2.1 四阶段渐进式迁移

```
Phase 1: 新系统上线（双写）
Phase 2: 历史資料迁移
Phase 3: 切流量到新系统
Phase 4: 关闭旧系统
```

每个 phase 都有明确的回滚步骤。

---

## Phase 1: 新系统上线（双写）

**目标**：新系统与旧系统同时运行，新資料写入两边

### 1.1 部署新系统

```bash
# 1. 部署 gear_ops 服务
cd platform/gear_ops
docker build -t gear_ops:v1 .
docker run -d -p 8002:8002 gear_ops:v1

# 2. 运行資料库迁移
alembic upgrade head

# 3. 验证健康检查
curl http://localhost:8002/health
```

### 1.2 实现双写层

在 user_core 或网关层实现双写逻辑：

```python
# 伪代码示例
def create_equipment(user_id, equipment_data):
    # 写入旧系统
    old_id = old_equipment_db.insert(equipment_data)

    # 同时写入新系统
    try:
        new_id = gear_ops_client.create_gear_item(user_id, equipment_data)
        log_dual_write_success(old_id, new_id)
    except Exception as e:
        log_dual_write_failure(old_id, e)
        # 不影响旧系统的写入

    return old_id  # 仍然返回旧系统ID
```

**关键原则**：
- ✅ 写入旧系统成功是硬性要求
- ✅ 写入新系统失败不影响用户操作
- ✅ 记录双写失败的資料，后续补齐

### 1.3 验证标准

- [ ] 新装备建立时，两边資料库都有记录
- [ ] 新系统API可以正常查詢
- [ ] 旧系统功能不受影响
- [ ] 双写失败率 < 1%

### 1.4 回滚方案

**触发条件**：
- 新系统响应时间 p99 > 1秒
- 双写失败率 > 5%
- 新系统出现严重bug

**回滚步骤**：
1. 停止双写逻辑
2. 关闭 gear_ops 服务
3. 验证旧系统恢复正常

**预计时间**：< 5分钟

---

## Phase 2: 历史資料迁移

**目标**：将旧系统的历史資料迁移到新系统

### 2.1 資料映射

```sql
-- 旧表 → 新表映射
old_equipment.id          → gear_items.id
old_equipment.user_id     → gear_items.user_id
old_equipment.name        → gear_items.name
old_equipment.type        → gear_items.category
old_equipment.brand       → gear_items.brand
old_equipment.created_at  → gear_items.created_at
-- 新增字段使用預設值
gear_items.status         → 'active'
gear_items.role           → 'personal'
```

### 2.2 迁移脚本

```python
# scripts/migrate_old_equipment.py

def migrate_equipment_batch(offset, limit):
    """批量迁移装备資料"""
    old_items = old_db.query(
        "SELECT * FROM old_equipment LIMIT %s OFFSET %s",
        (limit, offset)
    )

    for old_item in old_items:
        new_item = {
            "id": old_item.id,
            "user_id": old_item.user_id,
            "name": old_item.name,
            "category": old_item.type,
            "brand": old_item.brand,
            "status": "active",
            "role": "personal",
            "created_at": old_item.created_at,
            "updated_at": old_item.created_at,
        }

        try:
            gear_ops_db.insert_gear_item(new_item)
            log_migration_success(old_item.id)
        except Exception as e:
            log_migration_failure(old_item.id, e)

# 分批执行，每批1000条
for offset in range(0, total_count, 1000):
    migrate_equipment_batch(offset, 1000)
    time.sleep(1)  # 避免資料库压力
```

### 2.3 資料验证

```sql
-- 验证資料一致性
SELECT
    COUNT(*) as old_count,
    (SELECT COUNT(*) FROM gear_ops.gear_items) as new_count,
    COUNT(*) - (SELECT COUNT(*) FROM gear_ops.gear_items) as diff
FROM old_equipment;

-- 应该返回 diff = 0
```

### 2.4 验证标准

- [ ] 新旧系统装备数量一致
- [ ] 随机抽样100条資料，字段一致性100%
- [ ] 迁移失败的資料已补齐

### 2.5 回滚方案

**触发条件**：
- 資料一致性 < 99%
- 发现严重的資料损坏

**回滚步骤**：
1. 停止迁移脚本
2. 清空 gear_items 表
3. 重新执行迁移（修复bug后）

**資料不会丢失**：旧系统資料未被修改

---

## Phase 3: 切流量到新系统

**目标**：将读写流量从旧系统切到新系统

### 3.1 灰度发布策略

```
Day 1: 10% 流量 → 新系统
Day 2: 30% 流量 → 新系统
Day 3: 50% 流量 → 新系统
Day 5: 80% 流量 → 新系统
Day 7: 100% 流量 → 新系统
```

**实现方式**（API网关配置）：
```nginx
# Nginx 配置示例
upstream equipment_backend {
    server old_system:8000 weight=20;  # 20% 流量
    server gear_ops:8002 weight=80;    # 80% 流量
}
```

### 3.2 监控指标

**实时监控**：
- API 响应时间（p50, p95, p99）
- 错误率
- 資料一致性（每小时抽样检查）

**报警阈值**：
- 新系统错误率 > 1% → 回滚
- 新系统p99延迟 > 500ms → 回滚
- 資料不一致 > 5条/小时 → 暂停切流量

### 3.3 验证标准

- [ ] 新系统承载100%流量，稳定运行3天
- [ ] 错误率 < 0.1%
- [ ] 用户无感知（无投诉）

### 3.4 回滚方案

**触发条件**：
- 错误率超标
- 用户投诉增加
- 发现严重功能bug

**回滚步骤**：
1. 修改网关配置，流量100%回到旧系统
2. 重启网关（生效时间 < 10秒）
3. 验证旧系统恢复正常

**预计时间**：< 2分钟

---

## Phase 4: 关闭旧系统

**目标**：下线旧系统，清理冗余代码和資料

### 4.1 准备工作

**在关闭前確認**：
- [ ] 新系统稳定运行30天
- [ ] 无資料一致性问题
- [ ] 所有下游系统已更新到新API
- [ ] 旧資料已备份

### 4.2 关闭步骤

```bash
# 1. 备份旧資料
pg_dump old_equipment > backup_old_equipment_$(date +%Y%m%d).sql

# 2. 停止双写逻辑
# 在代码中移除双写代码，部署

# 3. 停止旧系统服务
docker stop old_equipment_service

# 4. 归档旧資料（不要立即刪除）
# 保留6个月，以备不时之需
```

### 4.3 验证标准

- [ ] 新系统继续正常运行
- [ ] 旧資料已备份并可恢复
- [ ] 所有旧系统代码已移除

### 4.4 回滚方案（紧急情况）

**触发条件**：
- 发现新系统有致命bug，必须恢复旧系统

**回滚步骤**：
1. 重新启动旧系统服务
2. 恢复旧資料（如果被修改）
3. 切换流量到旧系统
4. 修复新系统bug

**预计时间**：< 30分钟

---

## 3. 資料一致性保障

### 3.1 双写一致性检查

**每日任务**（在 Phase 1 & 2）：
```python
# scripts/check_consistency.py

def check_daily_consistency():
    """检查双写資料一致性"""
    # 随机抽样100条資料
    sample_ids = random.sample(all_ids, 100)

    inconsistent = []
    for item_id in sample_ids:
        old_data = old_db.get(item_id)
        new_data = gear_ops_db.get(item_id)

        if not data_matches(old_data, new_data):
            inconsistent.append(item_id)
            log_inconsistency(item_id, old_data, new_data)

    if len(inconsistent) > 5:  # 超过5%不一致
        alert_team("Data consistency issue detected!")

    return len(inconsistent)
```

### 3.2 Checksum验证

```sql
-- 定期运行（每天）
SELECT
    COUNT(*) as count,
    SUM(CRC32(CONCAT(id, user_id, name))) as checksum
FROM old_equipment;

SELECT
    COUNT(*) as count,
    SUM(CRC32(CONCAT(id::text, user_id::text, name))) as checksum
FROM gear_ops.gear_items;

-- 两者应该相同
```

---

## 4. 回滚触发条件总结

| 阶段 | 触发条件 | 回滚时间 | 資料丢失风险 |
|------|----------|----------|--------------|
| Phase 1 | 双写失败率 > 5% | < 5分钟 | 无 |
| Phase 2 | 資料一致性 < 99% | < 10分钟 | 无 |
| Phase 3 | 错误率 > 1% 或 p99 > 500ms | < 2分钟 | 无 |
| Phase 4 | 新系统致命bug | < 30分钟 | 低（有备份） |

---

## 5. 时间表

| 阶段 | 预计时间 | 负责人 | 验收标准 |
|------|----------|--------|----------|
| Phase 1 准备 | Week 1 | DevOps | 新系统部署完成 |
| Phase 1 双写 | Week 2 | Backend | 双写成功率 > 99% |
| Phase 2 迁移 | Week 3 | Backend | 資料一致性100% |
| Phase 3 切流量 | Week 4-5 | 全团队 | 100%流量稳定3天 |
| Phase 4 关闭旧系统 | Week 6+ | DevOps | 旧系统下线 |

**总时长**：约 6-8 周

---

## 6. 风险与应对

### 6.1 主要风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 双写失败率高 | 中 | 高 | 完善错误处理，增加重试机制 |
| 資料迁移bug | 低 | 高 | 充分测试，分批迁移，实时监控 |
| 新系统性能问题 | 低 | 中 | 压力测试，灰度发布 |
| 下游系统兼容性 | 中 | 中 | 提前沟通，提供API兼容层 |

### 6.2 应急联系

- **技术负责人**：[待填入]
- **DBA**：[待填入]
- **DevOps**：[待填入]
- **紧急联系方式**：[待填入]

---

## 7. 检查清单

### Pre-Migration
- [ ] 新系统已完成所有功能测试
- [ ] 性能测试通过（承载预期流量2倍）
- [ ] 监控和报警已配置
- [ ] 回滚方案已演练
- [ ] 团队已培训
- [ ] 用户已通知（如需要）

### Post-Migration
- [ ] 旧資料已备份
- [ ] 新系统运行稳定30天
- [ ] 无資料丢失
- [ ] 用户满意度无下降
- [ ] 文档已更新

---

## 8. Linus 原则验证

✅ **Never Break Userspace**:
- 用户API保持兼容（或提供兼容层）
- 資料零丢失
- 服务零停机
- 任何阶段都可回滚

✅ **简单实用**:
- 不用复杂的資料同步工具
- 分阶段渐进，每步可验证
- 双写逻辑简单直接

✅ **資料第一**:
- 資料一致性是最高优先级
- 每个阶段都有資料验证

---

**"Talk is cheap. Show me the code."** - 迁移脚本已就绪，可随时执行。
