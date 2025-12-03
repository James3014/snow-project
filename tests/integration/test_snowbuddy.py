#!/usr/bin/env python3
"""
雪伴公佈欄功能自動化測試腳本
測試所有核心功能：註冊、創建行程、發布、申請、接受/拒絕
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def log_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def log_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")

def log_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")

class TestUser:
    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = password
        self.user_id = None
        self.token = None
        self.season_id = None
        self.trips = []

def register_user(user: TestUser):
    """註冊用戶"""
    log_info(f"註冊用戶: {user.username}")

    response = requests.post(f"{BASE_URL}/auth/register", json={
        "username": user.username,
        "email": user.email,
        "password": user.password,
        "display_name": user.username
    })

    if response.status_code == 201:
        data = response.json()
        user.user_id = data['user_id']
        log_success(f"用戶 {user.username} 註冊成功 (ID: {user.user_id})")
        return True
    else:
        log_error(f"用戶 {user.username} 註冊失敗: {response.text}")
        return False

def create_season(user: TestUser):
    """創建雪季"""
    log_info(f"為 {user.username} 創建雪季")

    response = requests.post(
        f"{BASE_URL}/trip-planning/seasons",
        params={"user_id": user.user_id},
        json={
            "title": "2024-2025 冬季",
            "start_date": "2024-11-01",
            "end_date": "2025-04-30",
            "goal_trips": 10
        }
    )

    if response.status_code == 201:
        data = response.json()
        user.season_id = data['season_id']
        log_success(f"雪季創建成功 (ID: {user.season_id})")
        return True
    else:
        log_error(f"雪季創建失敗: {response.text}")
        return False

def create_trip(user: TestUser, resort_id: str, start_date: str, end_date: str, visibility: str = "private"):
    """創建行程"""
    log_info(f"{user.username} 創建行程: {resort_id} ({start_date} - {end_date})")

    response = requests.post(
        f"{BASE_URL}/trip-planning/trips",
        params={"user_id": user.user_id},
        json={
            "season_id": user.season_id,
            "resort_id": resort_id,
            "start_date": start_date,
            "end_date": end_date,
            "title": f"{resort_id} 行程",
            "visibility": visibility,
            "max_buddies": 5
        }
    )

    if response.status_code == 201:
        data = response.json()
        trip_id = data['trip_id']
        user.trips.append(data)
        log_success(f"行程創建成功 (ID: {trip_id}, visibility: {visibility})")
        return trip_id
    else:
        log_error(f"行程創建失敗: {response.text}")
        return None

def publish_trip(user: TestUser, trip_id: str):
    """發布行程到公佈欄"""
    log_info(f"{user.username} 發布行程到公佈欄")

    response = requests.patch(
        f"{BASE_URL}/trip-planning/trips/{trip_id}",
        params={"user_id": user.user_id},
        json={"visibility": "public"}
    )

    if response.status_code == 200:
        log_success(f"行程已發布到公佈欄")
        return True
    else:
        log_error(f"發布失敗: {response.text}")
        return False

def get_public_trips():
    """獲取所有公開行程"""
    log_info("獲取公佈欄上的所有公開行程")

    response = requests.get(f"{BASE_URL}/trip-planning/trips/public")

    if response.status_code == 200:
        trips = response.json()
        log_success(f"成功獲取 {len(trips)} 個公開行程")
        return trips
    else:
        log_error(f"獲取公開行程失敗: {response.text}")
        return []

def request_to_join(applicant: TestUser, trip_id: str):
    """申請加入行程"""
    log_info(f"{applicant.username} 申請加入行程 {trip_id}")

    response = requests.post(
        f"{BASE_URL}/trip-planning/trips/{trip_id}/buddy-requests",
        params={"user_id": applicant.user_id, "request_message": "我想一起去滑雪！"}
    )

    if response.status_code == 201:
        data = response.json()
        buddy_id = data['buddy_id']
        log_success(f"申請成功 (buddy_id: {buddy_id})")
        return buddy_id
    elif response.status_code == 400:
        log_warning(f"申請失敗: {response.json().get('detail', 'Unknown error')}")
        return None
    else:
        log_error(f"申請失敗: {response.text}")
        return None

def get_trip_buddies(trip_id: str):
    """獲取行程的所有申請"""
    response = requests.get(f"{BASE_URL}/trip-planning/trips/{trip_id}/buddies")

    if response.status_code == 200:
        return response.json()
    else:
        log_error(f"獲取申請列表失敗: {response.text}")
        return []

def respond_to_buddy_request(owner: TestUser, trip_id: str, buddy_id: str, status: str):
    """回應雪伴申請"""
    action = "接受" if status == "accepted" else "拒絕"
    log_info(f"{owner.username} {action}申請 {buddy_id}")

    response = requests.patch(
        f"{BASE_URL}/trip-planning/trips/{trip_id}/buddy-requests/{buddy_id}",
        params={"user_id": owner.user_id},
        json={
            "status": status,
            "response_message": f"申請已{action}"
        }
    )

    if response.status_code == 200:
        log_success(f"已{action}申請")
        return True
    else:
        log_error(f"{action}失敗: {response.text}")
        return False

def main():
    print("\n" + "="*60)
    print("🎿 雪伴公佈欄功能測試")
    print("="*60 + "\n")

    # 創建測試用戶（使用時間戳確保唯一性）
    import time
    timestamp = str(int(time.time()))
    alice = TestUser("Alice", f"alice_{timestamp}@test.com", "snow123456")
    bob = TestUser("Bob", f"bob_{timestamp}@test.com", "snow123456")
    charlie = TestUser("Charlie", f"charlie_{timestamp}@test.com", "snow123456")

    # 測試 1: 註冊用戶
    print("\n📝 測試 1: 用戶註冊")
    print("-" * 60)
    assert register_user(alice), "Alice 註冊失敗"
    assert register_user(bob), "Bob 註冊失敗"
    assert register_user(charlie), "Charlie 註冊失敗"

    # 測試 2: 創建雪季
    print("\n📅 測試 2: 創建雪季")
    print("-" * 60)
    assert create_season(alice), "Alice 雪季創建失敗"
    assert create_season(bob), "Bob 雪季創建失敗"
    assert create_season(charlie), "Charlie 雪季創建失敗"

    # 測試 3: 創建行程
    print("\n🏔️ 測試 3: 創建行程")
    print("-" * 60)

    # Alice 創建公開和私密行程
    alice_trip1 = create_trip(alice, "fukushima_inawashiro", "2024-12-15", "2024-12-17", "public")
    alice_trip2 = create_trip(alice, "nagano_hakuba_happo", "2024-12-20", "2024-12-23", "private")

    # Bob 創建公開行程
    bob_trip1 = create_trip(bob, "hokkaido_niseko", "2024-12-25", "2024-12-30", "public")

    # Charlie 創建公開行程
    charlie_trip1 = create_trip(charlie, "hokkaido_rusutsu", "2025-01-05", "2025-01-09", "public")

    assert alice_trip1 and bob_trip1 and charlie_trip1, "行程創建失敗"

    # 測試 4: 獲取公開行程
    print("\n📋 測試 4: 公佈欄顯示所有公開行程")
    print("-" * 60)
    public_trips = get_public_trips()

    # 驗證我們的測試行程是否正確顯示
    trip_ids = [trip['trip_id'] for trip in public_trips]

    # 檢查私密行程不應該出現
    assert alice_trip2 not in trip_ids, "公佈欄不應顯示私密行程"
    log_success("✓ 私密行程不會顯示在公佈欄")

    # 檢查所有公開行程都應該出現
    assert alice_trip1 in trip_ids, "公佈欄應顯示Alice的公開行程"
    log_success("✓ Alice的公開行程出現在公佈欄")

    assert bob_trip1 in trip_ids, "公佈欄應顯示Bob的公開行程"
    log_success("✓ Bob的公開行程出現在公佈欄")

    assert charlie_trip1 in trip_ids, "公佈欄應顯示Charlie的公開行程"
    log_success("✓ Charlie的公開行程出現在公佈欄")

    log_success(f"✓ 公佈欄總共顯示 {len(public_trips)} 個公開行程（包含測試數據）")

    # 測試 5: 申請加入行程
    print("\n🤝 測試 5: 申請加入行程")
    print("-" * 60)

    # Bob 申請加入 Alice 的行程
    bob_buddy_id = request_to_join(bob, alice_trip1)
    assert bob_buddy_id is not None, "Bob 申請失敗"

    # Charlie 申請加入 Alice 的行程
    charlie_buddy_id = request_to_join(charlie, alice_trip1)
    assert charlie_buddy_id is not None, "Charlie 申請失敗"

    # 測試 6: 獲取申請列表
    print("\n📬 測試 6: 查看申請列表")
    print("-" * 60)
    buddies = get_trip_buddies(alice_trip1)

    assert len(buddies) == 2, f"應該有2個申請，實際有{len(buddies)}個"
    log_success(f"✓ Alice的行程收到 {len(buddies)} 個申請")

    # 測試 7: 接受和拒絕申請
    print("\n✅❌ 測試 7: 處理申請")
    print("-" * 60)

    # Alice 接受 Bob 的申請
    assert respond_to_buddy_request(alice, alice_trip1, bob_buddy_id, "accepted"), "接受Bob失敗"

    # Alice 拒絕 Charlie 的申請
    assert respond_to_buddy_request(alice, alice_trip1, charlie_buddy_id, "declined"), "拒絕Charlie失敗"

    # 測試 8: 驗證申請狀態
    print("\n🔍 測試 8: 驗證申請狀態")
    print("-" * 60)
    buddies = get_trip_buddies(alice_trip1)

    bob_request = next((b for b in buddies if b['buddy_id'] == bob_buddy_id), None)
    charlie_request = next((b for b in buddies if b['buddy_id'] == charlie_buddy_id), None)

    assert bob_request['status'] == 'accepted', "Bob的狀態應該是accepted"
    assert charlie_request['status'] == 'declined', "Charlie的狀態應該是declined"

    log_success("✓ Bob的申請狀態: accepted")
    log_success("✓ Charlie的申請狀態: declined")

    # 驗證雪伴顯示名字
    assert bob_request.get('user_display_name') == bob.username, "Bob的名字應該顯示"
    log_success(f"✓ Bob的顯示名字: {bob_request.get('user_display_name')}")

    # 統計 accepted 的雪伴數量
    accepted_buddies = [b for b in buddies if b['status'] == 'accepted']
    assert len(accepted_buddies) == 1, f"應該有1個已加入的雪伴，實際有{len(accepted_buddies)}個"
    log_success(f"✓ 已加入的雪伴: {len(accepted_buddies)} 人")

    # 測試 9: 防止重複申請
    print("\n🚫 測試 9: 防止重複申請")
    print("-" * 60)

    # Bob 再次申請同一行程（應該失敗）
    duplicate_request = request_to_join(bob, alice_trip1)
    assert duplicate_request is None, "應該禁止重複申請"
    log_success("✓ 成功防止重複申請")

    # 最終報告
    print("\n" + "="*60)
    print("🎉 所有測試通過！")
    print("="*60)
    print("\n測試摘要:")
    print(f"  ✅ 用戶註冊: 3個新用戶成功註冊")
    print(f"  ✅ 雪季創建: 3個雪季成功創建")
    print(f"  ✅ 行程創建: 4個行程（3個公開，1個私密）")
    print(f"  ✅ 公佈欄顯示: 正確顯示公開行程，隱藏私密行程")
    print(f"  ✅ 申請功能: 2個申請成功提交")
    print(f"  ✅ 申請管理: 1個接受，1個拒絕")
    print(f"  ✅ 狀態追蹤: 正確更新申請狀態")
    print(f"  ✅ 重複申請防護: 成功阻止重複申請")
    print("\n✨ 雪伴公佈欄功能完全正常！\n")

if __name__ == "__main__":
    try:
        main()
    except AssertionError as e:
        log_error(f"測試失敗: {e}")
        exit(1)
    except Exception as e:
        log_error(f"未預期的錯誤: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
