#!/bin/bash

# Security Headers Test Script
# 測試所有服務的安全標頭

echo "🔍 測試安全標頭配置..."

# 測試函數
test_security_headers() {
    local url=$1
    local service_name=$2
    
    echo "測試 $service_name ($url)..."
    
    # 使用 curl 獲取標頭
    headers=$(curl -s -I "$url" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "❌ $service_name 無法連接"
        return 1
    fi
    
    # 檢查各個安全標頭
    local missing_headers=()
    
    if ! echo "$headers" | grep -qi "strict-transport-security"; then
        missing_headers+=("HSTS")
    fi
    
    if ! echo "$headers" | grep -qi "content-security-policy"; then
        missing_headers+=("CSP")
    fi
    
    if ! echo "$headers" | grep -qi "x-frame-options"; then
        missing_headers+=("X-Frame-Options")
    fi
    
    if ! echo "$headers" | grep -qi "x-content-type-options"; then
        missing_headers+=("X-Content-Type-Options")
    fi
    
    if ! echo "$headers" | grep -qi "x-xss-protection"; then
        missing_headers+=("X-XSS-Protection")
    fi
    
    if [ ${#missing_headers[@]} -eq 0 ]; then
        echo "✅ $service_name 所有安全標頭正常"
    else
        echo "⚠️  $service_name 缺少標頭: ${missing_headers[*]}"
    fi
    
    echo ""
}

# 測試本地服務
echo "=== 本地服務測試 ==="
test_security_headers "http://localhost:8001/health" "User Core"
test_security_headers "http://localhost:8000/health" "Resort API"
test_security_headers "http://localhost:8002/health" "Snowbuddy Matching"
test_security_headers "http://localhost:8003/health" "Calendar Service"
test_security_headers "http://localhost:8004/health" "Gear Service"
test_security_headers "http://localhost:8005/health" "Social Service"

# 測試生產服務（如果可用）
echo "=== 生產服務測試 ==="
test_security_headers "https://ski-platform.zeabur.app" "Ski Platform (Production)"
test_security_headers "https://tour.zeabur.app" "Tour (Production)"
test_security_headers "https://user-core.zeabur.app/health" "User Core (Production)"
test_security_headers "https://resort-api.zeabur.app/health" "Resort API (Production)"
test_security_headers "https://snowbuddy-matching.zeabur.app/health" "Snowbuddy (Production)"

echo "🔒 安全標頭測試完成！"
