#!/bin/bash

# Quick Security Headers Fix
# 確保所有服務都有正確的 X-Content-Type-Options 標頭

echo "🔧 快速修復安全標頭..."

# 檢查並修復 nginx 配置
echo "檢查 nginx 配置..."
if ! grep -q "X-Content-Type-Options" ./platform/frontend/ski-platform/nginx.conf; then
    echo "❌ nginx 配置缺少 X-Content-Type-Options"
else
    echo "✅ nginx 配置正常"
fi

# 檢查 Next.js 配置
echo "檢查 Next.js 配置..."
if ! grep -q "X-Content-Type-Options" ./tour/next.config.js; then
    echo "❌ Next.js 配置缺少 X-Content-Type-Options"
else
    echo "✅ Next.js 配置正常"
fi

# 檢查後端服務
services=("resort_api/app/main.py" "snowbuddy_matching/app/main.py" "platform/user_core/api/main.py")

for service in "${services[@]}"; do
    if [ -f "$service" ]; then
        if grep -q "X-Content-Type-Options" "$service"; then
            echo "✅ $service 安全標頭正常"
        else
            echo "❌ $service 缺少安全標頭"
        fi
    else
        echo "⚠️  $service 文件不存在"
    fi
done

echo ""
echo "🚀 建議執行以下命令重新部署："
echo "1. 前端服務: cd platform/frontend/ski-platform && npm run build"
echo "2. Tour 服務: cd tour && npm run build"
echo "3. 後端服務: docker-compose up --build -d"
echo ""
echo "或執行: ./deploy_security_headers.sh"
