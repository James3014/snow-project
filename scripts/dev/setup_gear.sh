#!/bin/bash
# Gear Operations Development Setup Script
#
# 一键启动开发环境

set -e

echo "🚀 Setting up Gear Operations development environment..."
echo ""

# 1. 检查 Python
echo "1. Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi
echo "✅ Python $(python3 --version)"

# 2. 安装依赖
echo ""
echo "2. Installing dependencies..."
if [ -f "platform/gear_ops/requirements.txt" ]; then
    pip install -q -r platform/gear_ops/requirements.txt
    echo "✅ Dependencies installed"
else
    echo "❌ requirements.txt not found"
    exit 1
fi

# 3. 设置环境变量
echo ""
echo "3. Setting up environment variables..."
if [ ! -f ".env" ]; then
    cat > .env <<EOF
# Gear Operations Environment Variables
DB_URL=postgresql://user:password@localhost:5432/gear_ops
GEAR_DB_URL=postgresql://user:password@localhost:5432/gear_ops
USER_CORE_BASE_URL=http://localhost:8000
NOTIFICATION_GATEWAY_URL=http://localhost:8001
JWT_SECRET=your-secret-key-change-in-production
EOF
    echo "✅ Created .env file (please update with your values)"
else
    echo "✅ .env file already exists"
fi

# 4. 运行数据库迁移
echo ""
echo "4. Running database migrations..."
if command -v alembic &> /dev/null; then
    cd platform/gear_ops
    alembic upgrade head || echo "⚠️  Migration failed (database may not be running)"
    cd ../..
    echo "✅ Migrations completed"
else
    echo "⚠️  Alembic not found, skipping migrations"
fi

# 5. 运行测试
echo ""
echo "5. Running tests..."
python -m pytest tests/unit/gear_ops tests/integration/gear_ops/test_flows_simple.py -v --tb=short
if [ $? -eq 0 ]; then
    echo "✅ All tests passed"
else
    echo "⚠️  Some tests failed"
fi

# 完成
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with your database credentials"
echo "  2. Run 'cd platform/gear_ops && make run' to start the API"
echo "  3. Visit http://localhost:8002/docs for API documentation"
echo ""
