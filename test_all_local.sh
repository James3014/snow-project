#!/bin/bash
# 完整本地測試腳本 - 測試所有服務

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=================================================="
echo "  🧪 SnowTrace 完整本地測試"
echo "=================================================="

# 生成測試環境變數
echo -e "${BLUE}1. 生成測試配置...${NC}"
JWT_SECRET=$(python3 scripts/generate_jwt_secret.py)
echo "JWT_SECRET_KEY=$JWT_SECRET" > .env.test

cat >> .env.test << EOF
JWT_ALGORITHM=HS256
JWT_AUDIENCE=user_core
JWT_ISSUER=SnowTrace
USER_CORE_DB_URL=sqlite:///./test_user_core.db
USER_CORE_API_URL=http://localhost:8001
RESORT_SERVICES_API_URL=http://localhost:8000
SNOWBUDDY_API_URL=http://localhost:8002
EOF

echo "✅ 測試配置已生成"

# 測試 1: user-core
echo -e "${BLUE}2. 測試 user-core...${NC}"
cd platform/user_core
if python3 -c "import fastapi, sqlalchemy, pydantic" 2>/dev/null; then
    echo "✅ user-core 依賴正常"
else
    echo -e "${YELLOW}⚠️ user-core 需要安裝依賴${NC}"
fi

# 測試 2: resort-api  
echo -e "${BLUE}3. 測試 resort-api...${NC}"
cd ../../resort_api
if python3 -c "import fastapi, pydantic" 2>/dev/null; then
    echo "✅ resort-api 依賴正常"
else
    echo -e "${YELLOW}⚠️ resort-api 需要安裝依賴${NC}"
fi

# 測試 3: snowbuddy-matching
echo -e "${BLUE}4. 測試 snowbuddy-matching...${NC}"
cd ../snowbuddy_matching
if python3 -c "import fastapi, pydantic, redis" 2>/dev/null; then
    echo "✅ snowbuddy-matching 依賴正常"
else
    echo -e "${YELLOW}⚠️ snowbuddy-matching 需要安裝依賴${NC}"
fi

# 測試 4: tour (Next.js)
echo -e "${BLUE}5. 測試 tour...${NC}"
cd ../tour
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    echo "✅ tour 依賴已安裝"
elif [ -f "package.json" ]; then
    echo -e "${YELLOW}⚠️ tour 需要 npm install${NC}"
else
    echo -e "${RED}❌ tour package.json 不存在${NC}"
fi

# 測試 5: ski-platform (前端)
echo -e "${BLUE}6. 測試 ski-platform...${NC}"
cd ../platform/frontend/ski-platform
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    echo "✅ ski-platform 依賴已安裝"
elif [ -f "package.json" ]; then
    echo -e "${YELLOW}⚠️ ski-platform 需要 npm install${NC}"
else
    echo -e "${RED}❌ ski-platform package.json 不存在${NC}"
fi

# 回到根目錄
cd ../../../

echo -e "${GREEN}=================================================="
echo "  📋 本地測試總結"
echo "=================================================="
echo "配置文件: .env.test"
echo ""
echo "下一步："
echo "1. 安裝缺少的依賴"
echo "2. 啟動各服務進行功能測試"
echo "3. 執行端到端測試"
echo "=================================================="
echo -e "${NC}"
