#!/usr/bin/env python
"""
創建測試帳號和行程數據
"""

import requests
from datetime import datetime, timedelta
import json

BASE_URL = "http://localhost:8001"

# 測試帳號配置
TEST_USERS = [
    {
        "email": "alice@snow.test",
        "password": "snow123456",
        "display_name": "Alice 愛麗絲",
        "experience_level": "intermediate"
    },
    {
        "email": "bob@snow.test",
        "password": "snow123456",
        "display_name": "Bob 鮑伯",
        "experience_level": "beginner"
    },
    {
        "email": "charlie@snow.test",
        "password": "snow123456",
        "display_name": "Charlie 查理",
        "experience_level": "advanced"
    }
]

# 測試行程配置
TEST_TRIPS = [
    {
        "resort_id": "niseko-grand-hirafu",
        "title": "二世谷粉雪之旅",
        "days_offset": 30,
        "duration": 4,
        "max_buddies": 3,
        "visibility": "public",
        "notes": "尋找喜歡粉雪的夥伴！"
    },
    {
        "resort_id": "hakuba-happo-one",
        "title": "白馬週末滑雪",
        "days_offset": 45,
        "duration": 3,
        "max_buddies": 2,
        "visibility": "public",
        "notes": "適合初中級滑雪者"
    },
    {
        "resort_id": "zao-onsen",
        "title": "藏王樹冰行程",
        "days_offset": 60,
        "duration": 3,
        "max_buddies": 4,
        "visibility": "private",
        "notes": "看樹冰和泡溫泉"
    },
    {
        "resort_id": "rusutsu",
        "title": "留壽都度假村",
        "days_offset": 20,
        "duration": 5,
        "max_buddies": 2,
        "visibility": "public",
        "notes": "適合家庭旅遊"
    }
]

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def create_user(user_data):
    """創建用戶"""
    try:
        response = requests.post(
            f"{BASE_URL}/users/",
            json={
                "email": user_data["email"],
                "password": user_data["password"],
                "preferred_language": "zh-TW",
                "experience_level": user_data.get("experience_level", "intermediate"),
                "display_name": user_data.get("display_name", user_data["email"].split("@")[0])
            }
        )

        if response.status_code == 200:
            user = response.json()
            print(f"✅ 創建用戶: {user_data['display_name']} ({user_data['email']})")
            print(f"   密碼: {user_data['password']}")
            print(f"   User ID: {user['user_id']}")
            return user
        else:
            print(f"❌ 創建用戶失敗: {user_data['email']}")
            print(f"   錯誤: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 創建用戶錯誤: {e}")
        return None

def create_season(user_id, user_name):
    """創建雪季"""
    try:
        response = requests.post(
            f"{BASE_URL}/trip-planning/seasons?user_id={user_id}",
            json={
                "title": "2024-2025 雪季",
                "description": f"{user_name} 的滑雪季",
                "start_date": "2024-12-01",
                "end_date": "2025-03-31",
                "goal_trips": 10,
                "goal_resorts": 5
            }
        )

        if response.status_code == 200:
            season = response.json()
            print(f"✅ 創建雪季: {season['season_id']}")
            return season
        else:
            print(f"❌ 創建雪季失敗: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 創建雪季錯誤: {e}")
        return None

def create_trip(user_id, season_id, trip_data):
    """創建行程"""
    start_date = (datetime.now() + timedelta(days=trip_data['days_offset'])).strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=trip_data['days_offset'] + trip_data['duration'])).strftime("%Y-%m-%d")

    try:
        response = requests.post(
            f"{BASE_URL}/trip-planning/trips?user_id={user_id}",
            json={
                "season_id": season_id,
                "resort_id": trip_data["resort_id"],
                "title": trip_data["title"],
                "start_date": start_date,
                "end_date": end_date,
                "max_buddies": trip_data["max_buddies"],
                "visibility": trip_data["visibility"],
                "notes": trip_data.get("notes", ""),
                "flight_status": "not_planned",
                "accommodation_status": "not_planned"
            }
        )

        if response.status_code == 200:
            trip = response.json()
            visibility_icon = "📢" if trip_data["visibility"] == "public" else "🔒"
            print(f"✅ 創建行程: {trip_data['title']} {visibility_icon}")
            print(f"   日期: {start_date} ~ {end_date}")
            print(f"   名額: {trip_data['max_buddies']} 人")
            print(f"   Trip ID: {trip['trip_id']}")
            return trip
        else:
            print(f"❌ 創建行程失敗: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 創建行程錯誤: {e}")
        return None

def main():
    print("\n" + "🎿" * 30)
    print("創建雪伴公佈欄測試數據")
    print("🎿" * 30)

    created_users = []

    # 步驟 1: 創建測試用戶
    print_section("步驟 1: 創建測試用戶")
    for user_data in TEST_USERS:
        user = create_user(user_data)
        if user:
            created_users.append({
                **user,
                "email": user_data["email"],
                "password": user_data["password"],
                "display_name": user_data["display_name"]
            })

    if not created_users:
        print("\n❌ 無法創建用戶，請檢查後端 API")
        return

    print(f"\n✅ 成功創建 {len(created_users)} 個測試用戶")

    # 步驟 2: 為每個用戶創建雪季和行程
    print_section("步驟 2: 創建雪季和行程")

    all_trips = []

    for idx, user in enumerate(created_users):
        print(f"\n👤 {user['display_name']} ({user['email']})")
        print("-" * 60)

        # 創建雪季
        season = create_season(user['user_id'], user['display_name'])
        if not season:
            continue

        # 為每個用戶創建 1-2 個行程
        trips_for_user = TEST_TRIPS[idx:idx+2] if idx < len(TEST_TRIPS) else [TEST_TRIPS[0]]

        for trip_data in trips_for_user:
            trip = create_trip(user['user_id'], season['season_id'], trip_data)
            if trip:
                all_trips.append({
                    **trip,
                    "user_email": user['email'],
                    "user_name": user['display_name']
                })

    # 總結
    print_section("✅ 測試數據創建完成！")

    print("\n📋 測試帳號列表:")
    print("-" * 60)
    for user in created_users:
        print(f"  {user['display_name']}")
        print(f"  Email:    {user['email']}")
        print(f"  Password: {user['password']}")
        print()

    public_trips = [t for t in all_trips if t.get('visibility') == 'public']
    print(f"\n📢 公開行程數量: {len(public_trips)} 個")
    print("-" * 60)
    for trip in public_trips:
        print(f"  • {trip['title']} - by {trip['user_name']}")

    print(f"\n🔒 私密行程數量: {len(all_trips) - len(public_trips)} 個")

    print("\n" + "="*60)
    print("🎉 可以開始測試了！")
    print("="*60)
    print("\n測試步驟:")
    print("1. 訪問 http://localhost:3000/login")
    print("2. 使用上面的測試帳號登入")
    print("3. 查看「行程」頁面 - 應該看到「📢 已發布」標籤")
    print("4. 訪問「雪伴」頁面 - 應該看到公開的行程")
    print("5. 切換帳號申請加入別人的行程")
    print("6. 切回原帳號接受/拒絕申請")
    print()

if __name__ == "__main__":
    main()
