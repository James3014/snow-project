# 部署指南 (Deployment Guide)

## 目录
- [本地开发](#本地开发)
- [Docker 部署](#docker-部署)
- [生产环境部署](#生产环境部署)
- [环境变量配置](#环境变量配置)
- [健康检查](#健康检查)

## 本地开发

### 前端开发

```bash
cd platform/frontend/ski-platform

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 后端开发

```bash
cd platform/user_core

# 建立虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动API服务器
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# 访问 http://localhost:8000/docs
```

## Docker 部署

### 使用 Docker Compose (推荐)

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f frontend

# 停止所有服务
docker-compose down
```

服务端口：
- 前端: http://localhost:3000
- 用户核心API: http://localhost:8000
- 度假村API: http://localhost:8001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 单独构建前端

```bash
cd platform/frontend/ski-platform

# 构建镜像
docker build -t snow-project-frontend:latest .

# 运行容器
docker run -d \
  --name frontend \
  -p 3000:80 \
  -e VITE_USER_CORE_API=http://localhost:8000 \
  snow-project-frontend:latest

# 查看日志
docker logs -f frontend

# 健康检查
curl http://localhost:3000/health
```

## 生产环境部署

### 前置要求

- Node.js 20+
- Docker & Docker Compose
- Nginx (如果不使用 Docker)
- PostgreSQL 15+
- Redis 7+ (可选，用于缓存)

### 1. 环境变量配置

建立 `.env.production` 文件：

```bash
# 前端环境变量
VITE_USER_CORE_API=https://api.yourdomain.com/user-core
VITE_RESORT_API=https://api.yourdomain.com/resort
VITE_ENABLE_ANALYTICS=true
VITE_ENV=production

# 后端环境变量
USER_CORE_DB_URL=postgresql://user:pass@localhost:5432/ski_platform
USER_CORE_API_KEY=your-secret-key-here
```

### 2. 构建生产版本

#### 前端

```bash
cd platform/frontend/ski-platform

# 安装依赖
npm ci --production=false

# 构建
npm run build

# 构建产物在 dist/ 目录
```

构建优化：
- ✅ 代码分割 (Code Splitting)
- ✅ Tree Shaking
- ✅ CSS 压缩
- ✅ 资源哈希命名
- ✅ Gzip 压缩
- ✅ 移除 console.log

#### 后端

```bash
cd platform/user_core

# 安装生产依赖
pip install -r requirements.txt --no-dev

# 运行迁移
alembic upgrade head

# 启动生产服务器
gunicorn api.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### 3. Nginx 配置

如果不使用 Docker，手动配置 Nginx：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端静态文件
    location / {
        root /var/www/ski-platform;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/user-core {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/resort {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. SSL/TLS 配置 (使用 Let's Encrypt)

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 取得证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 5. 性能优化

#### 前端优化

- ✅ 启用 HTTP/2
- ✅ 启用 Gzip/Brotli 压缩
- ✅ 設定缓存头
- ✅ CDN 加速 (可选)
- ✅ 图片懒加载
- ✅ 代码分割

#### 后端优化

- ✅ 資料库连接池
- ✅ Redis 缓存
- ✅ API 速率限制
- ✅ 資料库索引优化
- ✅ 异步任务队列

### 6. 监控和日志

#### 应用日志

```bash
# Docker 日志
docker-compose logs -f --tail=100 frontend
docker-compose logs -f --tail=100 user-core

# 系统日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

#### 健康检查端点

- 前端: `GET /health` → 返回 200 "healthy"
- 后端: `GET /docs` → Swagger UI
- 資料库: `SELECT 1` 查詢

#### 推荐监控工具

- **日志聚合**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **APM**: New Relic, Datadog, 或 Sentry
- **正常运行时间监控**: UptimeRobot, Pingdom
- **性能监控**: Lighthouse CI, WebPageTest

## CI/CD 自动部署

GitHub Actions 工作流已配置在 `.github/workflows/frontend-ci.yml`

### 触发条件

- Push 到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop`
- 修改 `platform/frontend/**` 路径下的文件

### 部署步骤

1. Lint 检查
2. TypeScript 类型检查
3. 构建生产版本
4. 构建 Docker 镜像
5. 推送到 Docker Registry (仅 main 分支)

### 配置 Secrets

在 GitHub 仓库設定中添加：

```
DOCKERHUB_USERNAME=your_username
DOCKERHUB_TOKEN=your_access_token
```

## 扩展性和高可用

### 水平扩展

使用 Docker Swarm 或 Kubernetes:

```bash
# Docker Swarm 示例
docker service create \
  --name frontend \
  --replicas 3 \
  --publish 80:80 \
  snow-project-frontend:latest
```

### 负载均衡

使用 Nginx 或云服务商的负载均衡器：

```nginx
upstream frontend_servers {
    server frontend1:80;
    server frontend2:80;
    server frontend3:80;
}

server {
    location / {
        proxy_pass http://frontend_servers;
    }
}
```

### 資料库集群

- 主从复制
- 读写分离
- 定期备份

## 故障排查

### 常见问题

#### 1. 前端白屏

```bash
# 检查构建是否成功
ls -la platform/frontend/ski-platform/dist/

# 检查 nginx 配置
nginx -t

# 查看浏览器控制台错误
```

#### 2. API 连接失败

```bash
# 检查 API 服务状态
curl http://localhost:8000/docs

# 检查环境变量
docker exec frontend env | grep VITE

# 检查網路连接
docker network ls
docker network inspect snow-project-network
```

#### 3. 資料库连接问题

```bash
# 测试資料库连接
psql -h localhost -U skiuser -d ski_platform

# 检查迁移状态
cd platform/user_core
alembic current
alembic history
```

## 回滚策略

### Docker 部署回滚

```bash
# 查看历史镜像
docker images snow-project-frontend

# 回滚到上一个版本
docker-compose down
docker-compose up -d frontend:previous_tag
```

### 資料库回滚

```bash
# Alembic 降级
alembic downgrade -1

# 或回滚到特定版本
alembic downgrade <revision_id>
```

## 安全最佳实践

- ✅ 使用 HTTPS
- ✅ 設定安全头 (CSP, HSTS, X-Frame-Options)
- ✅ 定期更新依赖
- ✅ 使用环境变量存储敏感資訊
- ✅ 实施 API 速率限制
- ✅ 定期安全审计
- ✅ 最小权限原则

## 备份策略

### 資料库备份

```bash
# 建立备份
pg_dump -h localhost -U skiuser ski_platform > backup_$(date +%Y%m%d).sql

# 恢复备份
psql -h localhost -U skiuser ski_platform < backup_20250101.sql
```

### 自动备份

```bash
# 添加到 crontab
0 2 * * * /path/to/backup_script.sh
```

## 支持和资源

- 文档: [README.md](./README.md)
- 前端文档: [platform/frontend/ski-platform/README.md](./platform/frontend/ski-platform/README.md)
- Issue 追踪: GitHub Issues
- API 文档: http://localhost:8000/docs (Swagger UI)

---

**最后更新**: 2025-11-06
**版本**: 1.0.0
