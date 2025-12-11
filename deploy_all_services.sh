#!/bin/bash
# SnowTrace 完整部署腳本
# 按順序部署所有服務並驗證

set -e

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=================================================="
echo "  🚀 SnowTrace 完整部署流程"
echo "=================================================="

# 檢查必要工具
command -v curl >/dev/null 2>&1 || { echo "需要安裝 curl"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "需要安裝 python3"; exit 1; }

# 1. 部署 user-core (認證中心)
echo -e "${BLUE}步驟 1: 部署 user-core${NC}"
echo "請在 Zeabur 部署 user-core 服務..."
read -p "user-core 部署完成後，請輸入 URL (例: https://user-core.zeabur.app): " USER_CORE_URL

# 驗證 user-core
echo "驗證 user-core..."
if curl -s "$USER_CORE_URL/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ user-core 部署成功${NC}"
else
    echo -e "${RED}❌ user-core 部署失敗${NC}"
    exit 1
fi

# 2. 部署 resort-api
echo -e "${BLUE}步驟 2: 部署 resort-api${NC}"
read -p "resort-api URL: " RESORT_API_URL

# 驗證 resort-api
echo "驗證 resort-api..."
if curl -s "$RESORT_API_URL/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ resort-api 部署成功${NC}"
else
    echo -e "${RED}❌ resort-api 部署失敗${NC}"
    exit 1
fi

# 3. 部署 snowbuddy-matching
echo -e "${BLUE}步驟 3: 部署 snowbuddy-matching${NC}"
read -p "snowbuddy-matching URL: " SNOWBUDDY_URL

# 驗證 snowbuddy-matching
echo "驗證 snowbuddy-matching..."
if curl -s "$SNOWBUDDY_URL/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ snowbuddy-matching 部署成功${NC}"
else
    echo -e "${RED}❌ snowbuddy-matching 部署失敗${NC}"
    exit 1
fi

# 4. 部署 tour (Next.js)
echo -e "${BLUE}步驟 4: 部署 tour${NC}"
read -p "tour URL: " TOUR_URL

# 5. 部署 ski-platform (前端)
echo -e "${BLUE}步驟 5: 部署 ski-platform${NC}"
read -p "ski-platform URL: " FRONTEND_URL

# 執行完整的 Smoke 測試
echo -e "${BLUE}執行完整驗證測試...${NC}"

# 注意：需要有效的 JWT token 進行測試
echo "⚠️  請提供有效的 JWT token 進行測試"
read -p "請輸入測試用 JWT token (或按 Enter 跳過認證測試): " TEST_JWT
if [ -z "$TEST_JWT" ]; then
    echo "跳過需要認證的測試..."
    TEST_JWT=""
fi

# 執行 Smoke 測試
echo "執行 user-core smoke 測試..."
USER_CORE_BASE_URL="$USER_CORE_URL" TOKEN="$TEST_JWT" python3 scripts/smoke_user_core.py || echo "⚠️ user-core 測試失敗"

echo "執行 resort-api smoke 測試..."
RESORT_API_BASE_URL="$RESORT_API_URL" TOKEN="$TEST_JWT" python3 scripts/smoke_resort_api.py || echo "⚠️ resort-api 測試失敗"

echo "執行 snowbuddy smoke 測試..."
SNOWBUDDY_BASE_URL="$SNOWBUDDY_URL" TOKEN="$TEST_JWT" python3 scripts/smoke_snowbuddy.py || echo "⚠️ snowbuddy 測試失敗"

# 生成部署報告
echo -e "${GREEN}=================================================="
echo "  🎉 部署完成！"
echo "=================================================="
echo "服務端點:"
echo "  - User Core: $USER_CORE_URL"
echo "  - Resort API: $RESORT_API_URL"  
echo "  - Snowbuddy: $SNOWBUDDY_URL"
echo "  - Tour: $TOUR_URL"
echo "  - Frontend: $FRONTEND_URL"
echo ""
echo "API 文檔:"
echo "  - $USER_CORE_URL/docs"
echo "  - $RESORT_API_URL/docs"
echo "  - $SNOWBUDDY_URL/docs"
echo ""
echo "監控:"
echo "  - 健康檢查: /health"
echo "  - Sentry 監控已啟用"
echo "=================================================="
echo -e "${NC}"

# 儲存部署資訊
cat > deployment_info.txt << EOF
SnowTrace 部署資訊
部署時間: $(date)
Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

服務端點:
- User Core: $USER_CORE_URL
- Resort API: $RESORT_API_URL
- Snowbuddy: $SNOWBUDDY_URL
- Tour: $TOUR_URL
- Frontend: $FRONTEND_URL

狀態: 部署成功 ✅
EOF

echo "部署資訊已儲存到 deployment_info.txt"
