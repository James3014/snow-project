#!/bin/bash
# 本地服務啟動腳本

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=================================================="
echo "  🚀 啟動 SnowTrace 本地服務"
echo "=================================================="

# 載入測試環境變數
if [ -f ".env.test" ]; then
    export $(cat .env.test | xargs)
    echo "✅ 已載入測試環境變數"
else
    echo "❌ 請先執行 ./test_all_local.sh 生成配置"
    exit 1
fi

# 建立虛擬環境函數
setup_python_env() {
    local service_name=$1
    local service_path=$2
    
    echo -e "${BLUE}設置 $service_name Python 環境...${NC}"
    cd $service_path
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "✅ 已建立虛擬環境"
    fi
    
    source venv/bin/activate
    pip install --break-system-packages -r requirements.txt
    echo "✅ 已安裝依賴"
    cd - > /dev/null
}

# 1. 設置 user-core
setup_python_env "user-core" "platform/user_core"

# 2. 設置 resort-api
setup_python_env "resort-api" "resort_api"

# 3. 設置 snowbuddy-matching
setup_python_env "snowbuddy-matching" "snowbuddy_matching"

echo -e "${GREEN}=================================================="
echo "  ✅ 所有服務環境已準備就緒"
echo "=================================================="
echo "啟動服務："
echo "1. user-core:     cd platform/user_core && source venv/bin/activate && uvicorn app.main:app --port 8001"
echo "2. resort-api:    cd resort_api && source venv/bin/activate && uvicorn app.main:app --port 8000"
echo "3. snowbuddy:     cd snowbuddy_matching && source venv/bin/activate && uvicorn app.main:app --port 8002"
echo "4. tour:          cd tour && npm run dev"
echo "5. ski-platform:  cd platform/frontend/ski-platform && npm run dev"
echo "=================================================="
echo -e "${NC}"
