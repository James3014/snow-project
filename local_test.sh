#!/bin/bash
# 本地測試腳本 - 不使用 Docker

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=================================================="
echo "  🧪 SnowTrace 本地測試"
echo "=================================================="

# 檢查 Python 環境
echo -e "${BLUE}檢查 Python 環境...${NC}"
python3 --version || { echo "需要 Python 3"; exit 1; }

# 測試 user-core
echo -e "${BLUE}測試 user-core...${NC}"
cd platform/user_core
if [ -f "requirements.txt" ]; then
    echo "✅ user-core requirements.txt 存在"
else
    echo "❌ user-core requirements.txt 不存在"
fi

# 測試 resort-api
echo -e "${BLUE}測試 resort-api...${NC}"
cd ../../resort_api
if [ -f "requirements.txt" ]; then
    echo "✅ resort-api requirements.txt 存在"
else
    echo "❌ resort-api requirements.txt 不存在"
fi

# 測試 snowbuddy-matching
echo -e "${BLUE}測試 snowbuddy-matching...${NC}"
cd ../snowbuddy_matching
if [ -f "requirements.txt" ]; then
    echo "✅ snowbuddy-matching requirements.txt 存在"
else
    echo "❌ snowbuddy-matching requirements.txt 不存在"
fi

# 檢查 JWT 生成器
echo -e "${BLUE}測試 JWT 生成器...${NC}"
cd ../scripts
if python3 generate_jwt_secret.py > /dev/null 2>&1; then
    echo "✅ JWT 生成器正常"
else
    echo "❌ JWT 生成器失敗"
fi

# 生成測試 JWT 密鑰
echo -e "${BLUE}生成測試 JWT 密鑰...${NC}"
JWT_SECRET=$(python3 generate_jwt_secret.py)
echo "JWT_SECRET_KEY=$JWT_SECRET"

echo -e "${GREEN}=================================================="
echo "  ✅ 本地測試完成"
echo "=================================================="
echo "下一步："
echo "1. 設定環境變數"
echo "2. 啟動各服務"
echo "3. 執行 Smoke 測試"
echo "=================================================="
echo -e "${NC}"
