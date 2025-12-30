#!/bin/bash

# Security Headers Deployment Script
# 部署所有添加了安全標頭的服務

echo "🔒 開始部署安全標頭更新..."

# 前端服務
echo "📦 重新建置前端服務..."
cd platform/frontend/ski-platform
npm run build
echo "✅ ski-platform 建置完成"

cd ../../../tour
npm run build
echo "✅ tour 建置完成"

# 後端服務
echo "🚀 重新啟動後端服務..."
cd ..

# 重新啟動 Docker 服務
docker-compose down
docker-compose up --build -d

echo "⏳ 等待服務啟動..."
sleep 30

# 檢查服務狀態
echo "🔍 檢查服務健康狀態..."

services=("user-core:8001" "resort-api:8000" "snowbuddy-matching:8002" "calendar-service:8003" "gear-service:8004" "social-service:8005")

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -s "http://localhost:$port/health" > /dev/null; then
        echo "✅ $name 服務正常運行"
    else
        echo "❌ $name 服務啟動失敗"
    fi
done

echo "🔒 安全標頭部署完成！"
echo ""
echo "已添加的安全標頭："
echo "- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"
echo "- Content-Security-Policy: 防止 XSS 攻擊"
echo "- X-Frame-Options: SAMEORIGIN"
echo "- X-Content-Type-Options: nosniff"
echo "- X-XSS-Protection: 1; mode=block"
echo "- Referrer-Policy: no-referrer-when-downgrade"
