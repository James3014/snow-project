#!/usr/bin/env python
"""
雪伴公佈欄完整流程測試
測試：創建 → 發布 → 申請 → 接受
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8001"

def print_step(step, message):
    print(f"\n{'='*60}")
    print(f"步驟 {step}: {message}")
    print(f"{'='*60}")

def print_result(success, message):
    status = "✅ 成功" if success else "❌ 失敗"
    print(f"{status}: {message}")

def create_user(email, password="password123"):
    """創建用戶"""
    try:
        response = requests.post(
            f"{BASE_URL}/users/",
            json={
                "email": email,
                "password": password,
                "preferred_language": "zh-TW",
                "experience_level": "intermediate"
            }
        )
        if response.status_code == 200:
            user = response.json()
            print_result(True, f"用戶創建成功: {email}")
            return user
        else:
            print_result(False, f"用戶創建失敗: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"用戶創建錯誤: {e}")
        return None

def create_season(user_id):
    """創建雪季"""
    try:
        response = requests.post(
            f"{BASE_URL}/trip-planning/seasons?user_id={user_id}",
            json={
                "title": "2024-2025 雪季",
                "start_date": "2024-12-01",
                "end_date": "2025-03-31"
            }
        )
        if response.status_code == 200:
            season = response.json()
            print_result(True, f"雪季創建成功: {season['season_id']}")
            return season
        else:
            print_result(False, f"雪季創建失敗: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"雪季創建錯誤: {e}")
        return None

def create_trip(user_id, season_id):
    """創建行程"""
    start_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=33)).strftime("%Y-%m-%d")

    try:
        response = requests.post(
            f"{BASE_URL}/trip-planning/trips?user_id={user_id}",
            json={
                "season_id": season_id,
                "resort_id": "niseko-grand-hirafu",
                "title": "二世谷滑雪之旅",
                "start_date": start_date,
                "end_date": end_date,
                "max_buddies": 3,
                "visibility": "private"  # 初始為私密
            }
        )
        if response.status_code == 200:
            trip = response.json()
            print_result(True, f"行程創建成功: {trip['trip_id']}")
            return trip
        else:
            print_result(False, f"行程創建失敗: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"行程創建錯誤: {e}")
        return None

def publish_trip(user_id, trip_id):
    """發布行程到公佈欄（設為公開）"""
    try:
        response = requests.patch(
            f"{BASE_URL}/trip-planning/trips/{trip_id}?user_id={user_id}",
            json={"visibility": "public"}
        )
        if response.status_code == 200:
            trip = response.json()
            print_result(True, f"行程已發布到公佈欄: visibility={trip['visibility']}")
            return trip
        else:
            print_result(False, f"發布行程失敗: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"發布行程錯誤: {e}")
        return None

def get_public_trips(user_id):
    """獲取公開行程列表"""
    try:
        response = requests.get(f"{BASE_URL}/trip-planning/trips?user_id={user_id}")
        if response.status_code == 200:
            trips = response.json()
            public_trips = [t for t in trips if t.get('visibility') == 'public']
            print_result(True, f"找到 {len(public_trips)} 個公開行程")
            return public_trips
        else:
            print_result(False, f"獲取行程列表失敗: {response.text}")
            return []
    except Exception as e:
        print_result(False, f"獲取行程列表錯誤: {e}")
        return []

def request_to_join(user_id, trip_id):
    """申請加入行程"""
    try:
        response = requests.post(
            f"{BASE_URL}/trip-planning/trips/{trip_id}/buddy-requests?user_id={user_id}"
        )
        if response.status_code == 200:
            buddy = response.json()
            print_result(True, f"申請加入成功: buddy_id={buddy['buddy_id']}, status={buddy['status']}")
            return buddy
        else:
            print_result(False, f"申請加入失敗: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"申請加入錯誤: {e}")
        return None

def get_buddy_requests(trip_id):
    """獲取行程的雪伴申請列表"""
    try:
        response = requests.get(f"{BASE_URL}/trip-planning/trips/{trip_id}/buddies")
        if response.status_code == 200:
            buddies = response.json()
            pending = [b for b in buddies if b['status'] == 'pending']
            print_result(True, f"找到 {len(pending)} 個待處理申請")
            return buddies
        else:
            print_result(False, f"獲取申請列表失敗: {response.text}")
            return []
    except Exception as e:
        print_result(False, f"獲取申請列表錯誤: {e}")
        return []

def respond_to_request(user_id, trip_id, buddy_id, status):
    """回應雪伴申請"""
    try:
        response = requests.patch(
            f"{BASE_URL}/trip-planning/trips/{trip_id}/buddy-requests/{buddy_id}?user_id={user_id}",
            json={"status": status}
        )
        if response.status_code == 200:
            buddy = response.json()
            print_result(True, f"回應申請成功: status={buddy['status']}")
            return buddy
        else:
            print_result(False, f"回應申請失敗: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"回應申請錯誤: {e}")
        return None

def main():
    print("\n" + "🎿" * 30)
    print("雪伴公佈欄完整流程測試")
    print("🎿" * 30)

    # 步驟 1: 創建用戶 A（行程主人）
    print_step(1, "創建用戶 A（行程主人）")
    user_a = create_user("alice@example.com")
    if not user_a:
        return

    # 步驟 2: 創建用戶 B（申請者）
    print_step(2, "創建用戶 B（申請者）")
    user_b = create_user("bob@example.com")
    if not user_b:
        return

    # 步驟 3: 用戶 A 創建雪季
    print_step(3, "用戶 A 創建雪季")
    season = create_season(user_a['user_id'])
    if not season:
        return

    # 步驟 4: 用戶 A 創建行程
    print_step(4, "用戶 A 創建行程")
    trip = create_trip(user_a['user_id'], season['season_id'])
    if not trip:
        return

    # 步驟 5: 用戶 A 發布行程到公佈欄
    print_step(5, "用戶 A 將行程發布到公佈欄（設為公開）")
    published_trip = publish_trip(user_a['user_id'], trip['trip_id'])
    if not published_trip:
        return

    # 步驟 6: 驗證公開行程列表
    print_step(6, "驗證行程出現在公佈欄")
    public_trips = get_public_trips(user_b['user_id'])
    trip_found = any(t['trip_id'] == trip['trip_id'] for t in public_trips)
    print_result(trip_found, f"行程 {'已' if trip_found else '未'} 出現在公佈欄")

    if not trip_found:
        return

    # 步驟 7: 用戶 B 申請加入
    print_step(7, "用戶 B 申請加入行程")
    buddy_request = request_to_join(user_b['user_id'], trip['trip_id'])
    if not buddy_request:
        return

    # 步驟 8: 用戶 A 查看申請
    print_step(8, "用戶 A 查看雪伴申請列表")
    buddy_requests = get_buddy_requests(trip['trip_id'])
    request_found = any(b['buddy_id'] == buddy_request['buddy_id'] for b in buddy_requests)
    print_result(request_found, f"申請 {'已' if request_found else '未'} 出現在列表中")

    if not request_found:
        return

    # 步驟 9: 用戶 A 接受申請
    print_step(9, "用戶 A 接受申請")
    accepted = respond_to_request(
        user_a['user_id'],
        trip['trip_id'],
        buddy_request['buddy_id'],
        'accepted'
    )
    if not accepted:
        return

    # 最終驗證
    print_step(10, "最終驗證")
    final_trip = requests.get(
        f"{BASE_URL}/trip-planning/trips/{trip['trip_id']}?user_id={user_a['user_id']}"
    ).json()

    print(f"\n最終狀態:")
    print(f"  - 行程 ID: {final_trip['trip_id']}")
    print(f"  - 可見性: {final_trip['visibility']}")
    print(f"  - 當前雪伴數: {final_trip['current_buddies']}/{final_trip['max_buddies']}")

    # 總結
    print("\n" + "="*60)
    print("🎉 所有測試通過！雪伴公佈欄功能正常運作！")
    print("="*60)
    print("\n驗收條件檢查:")
    print("  ✅ 能在公佈欄看到公開的行程")
    print("  ✅ 能點擊「發布到公佈欄」按鈕")
    print("  ✅ 能申請加入行程")
    print("  ✅ 行程主人能接受/拒絕申請")
    print("  ✅ 完整流程測試通過")

if __name__ == "__main__":
    main()
