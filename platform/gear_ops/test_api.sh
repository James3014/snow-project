#!/bin/bash
# Gear Operations API 测试脚本

BASE_URL="http://localhost:8002"
TOKEN="your-jwt-token-here"  # 需要从 user_core 获取

echo "🔍 测试 Gear Operations API"
echo ""

# 1. 健康检查
echo "1️⃣ 健康检查"
curl -s "$BASE_URL/health" | jq .
echo ""

# 2. 创建装备
echo "2️⃣ 创建装备"
ITEM_ID=$(curl -s -X POST "$BASE_URL/api/gear/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burton Custom 158",
    "category": "board",
    "brand": "Burton",
    "role": "personal"
  }' | jq -r '.id')
echo "创建的装备 ID: $ITEM_ID"
echo ""

# 3. 查看我的装备
echo "3️⃣ 查看我的装备"
curl -s "$BASE_URL/api/gear/items" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 4. 创建检查记录
echo "4️⃣ 创建检查记录"
curl -s -X POST "$BASE_URL/api/gear/inspections/items/$ITEM_ID/inspections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checklist": {"edge": "good", "bindings": "good"},
    "overall_status": "good",
    "notes": "Ready for the season"
  }' | jq .
echo ""

# 5. 查看我的提醒
echo "5️⃣ 查看我的提醒"
curl -s "$BASE_URL/api/gear/reminders" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "✅ 测试完成"
