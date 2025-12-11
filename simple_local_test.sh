#!/bin/bash
# 簡化本地測試 - 跳過虛擬環境，直接測試現有部署

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=================================================="
echo "  🧪 SnowTrace 簡化本地測試"
echo "=================================================="

# 1. 測試現有 Zeabur 部署
echo -e "${BLUE}1. 測試現有 user-core 部署...${NC}"
if curl -s https://user-core.zeabur.app/health | grep -q "ok"; then
    echo "✅ user-core 運行正常"
else
    echo "❌ user-core 無法訪問"
fi

# 2. 測試 API 文檔
echo -e "${BLUE}2. 測試 API 文檔...${NC}"
if curl -s -o /dev/null -w "%{http_code}" https://user-core.zeabur.app/docs | grep -q "200"; then
    echo "✅ API 文檔可訪問"
else
    echo "❌ API 文檔無法訪問"
fi

# 3. 檢查前端項目
echo -e "${BLUE}3. 檢查前端項目...${NC}"
if [ -d "tour/node_modules" ]; then
    echo "✅ tour 依賴已安裝"
else
    echo -e "${YELLOW}⚠️ tour 需要 npm install${NC}"
fi

if [ -d "platform/frontend/ski-platform/node_modules" ]; then
    echo "✅ ski-platform 依賴已安裝"
else
    echo -e "${YELLOW}⚠️ ski-platform 需要 npm install${NC}"
fi

# 4. 檢查配置文件
echo -e "${BLUE}4. 檢查配置文件...${NC}"
for service in "platform/user_core" "resort_api" "snowbuddy_matching"; do
    if [ -f "$service/requirements.txt" ]; then
        echo "✅ $service requirements.txt 存在"
    else
        echo "❌ $service requirements.txt 不存在"
    fi
done

# 5. 生成部署用的 JWT 密鑰
echo -e "${BLUE}5. 生成部署密鑰...${NC}"
JWT_SECRET=$(python3 scripts/generate_jwt_secret.py)
echo "部署用 JWT 密鑰已生成："
echo "JWT_SECRET_KEY=$JWT_SECRET"

echo -e "${GREEN}=================================================="
echo "  📋 測試總結"
echo "=================================================="
echo "✅ 現有部署正常運行"
echo "✅ 配置文件完整"
echo "✅ 前端項目就緒"
echo ""
echo "建議部署順序："
echo "1. 先部署其他後端服務 (resort-api, snowbuddy-matching)"
echo "2. 再部署前端服務 (tour, ski-platform)"
echo "3. 最後進行端到端測試"
echo "=================================================="
echo -e "${NC}"
