#!/usr/bin/env python3
"""
社交功能 API 測試腳本

測試所有新增的社交功能 API 端點：
- 關注/取消關注
- 動態牆
- 點讚
- 評論
"""
import requests
import uuid
import json
from datetime import datetime, date


# 配置
BASE_URL = "http://localhost:8001"
USER_A_ID = str(uuid.uuid4())
USER_B_ID = str(uuid.uuid4())


def print_section(title):
    """打印區塊標題"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def print_result(name, response):
    """打印測試結果"""
    status_icon = "✅" if response.status_code < 400 else "❌"
    print(f"{status_icon} {name}")
    print(f"   Status: {response.status_code}")
    if response.status_code < 400:
        try:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)[:200]}...")
        except:
            print(f"   Response: {response.text[:200]}")
    else:
        print(f"   Error: {response.text}")
    return response


def test_user_creation():
    """測試創建用戶"""
    print_section("📝 步驟 1: 創建測試用戶")

    # 創建用戶 A
    response = requests.post(
        f"{BASE_URL}/users",
        json={
            "user_id": USER_A_ID,
            "display_name": "測試用戶 A",
            "preferred_language": "zh",
            "experience_level": "intermediate"
        }
    )
    print_result("創建用戶 A", response)

    # 創建用戶 B
    response = requests.post(
        f"{BASE_URL}/users",
        json={
            "user_id": USER_B_ID,
            "display_name": "測試用戶 B",
            "preferred_language": "zh",
            "experience_level": "advanced"
        }
    )
    print_result("創建用戶 B", response)


def test_follow_features():
    """測試關注功能"""
    print_section("👥 步驟 2: 測試關注功能")

    # 用戶 A 關注用戶 B
    response = requests.post(
        f"{BASE_URL}/social/users/{USER_B_ID}/follow",
        headers={"X-User-Id": USER_A_ID}
    )
    print_result("用戶 A 關注用戶 B", response)

    # 獲取關注統計
    response = requests.get(
        f"{BASE_URL}/social/users/{USER_B_ID}/follow-stats",
        headers={"X-User-Id": USER_A_ID}
    )
    print_result("獲取用戶 B 的關注統計", response)

    # 獲取粉絲列表
    response = requests.get(
        f"{BASE_URL}/social/users/{USER_B_ID}/followers",
        headers={"X-User-Id": USER_A_ID}
    )
    print_result("獲取用戶 B 的粉絲列表", response)


def test_course_visit_with_feed():
    """測試紀錄課程訪問（自動生成動態）"""
    print_section("⛷️ 步驟 3: 紀錄滑雪活動（自動生成動態）")

    # 用戶 B 紀錄滑雪活動
    response = requests.post(
        f"{BASE_URL}/users/{USER_B_ID}/course-visits",
        headers={"X-User-Id": USER_B_ID},
        json={
            "resort_id": "niseko",
            "course_name": "Grand Hirafu",
            "visited_date": date.today().isoformat(),
            "rating": 5,
            "snow_condition": "powder",
            "weather": "sunny",
            "notes": "完美的粉雪日！"
        }
    )
    print_result("紀錄滑雪活動", response)


def test_feed_retrieval():
    """測試獲取動態牆"""
    print_section("📰 步驟 4: 獲取動態牆")

    # 獲取所有公開動態
    response = requests.get(
        f"{BASE_URL}/social/feed?feed_type=all&limit=10",
        headers={"X-User-Id": USER_A_ID}
    )
    print_result("獲取所有公開動態", response)

    # 獲取關注的人的動態
    response = requests.get(
        f"{BASE_URL}/social/feed?feed_type=following&limit=10",
        headers={"X-User-Id": USER_A_ID}
    )
    print_result("獲取關注者的動態", response)

    # 獲取用戶 B 的個人動態
    response = requests.get(
        f"{BASE_URL}/social/users/{USER_B_ID}/feed",
        headers={"X-User-Id": USER_A_ID}
    )
    print_result("獲取用戶 B 的個人動態", response)

    return response


def test_like_feature(activity_id):
    """測試點讚功能"""
    print_section("❤️ 步驟 5: 測試點讚功能")

    # 用戶 A 點讚
    response = requests.post(
        f"{BASE_URL}/social/feed/{activity_id}/like",
        headers={"X-User-Id": USER_A_ID}
    )
    print_result("點讚動態", response)

    # 再次點讚（應該返回已點讚）
    response = requests.post(
        f"{BASE_URL}/social/feed/{activity_id}/like",
        headers={"X-User-Id": USER_A_ID}
    )
    print_result("重複點讚（應該返回已點讚）", response)

    # 取消點讚
    response = requests.delete(
        f"{BASE_URL}/social/feed/{activity_id}/like",
        headers={"X-User-Id": USER_A_ID}
    )
    print_result("取消點讚", response)


def test_comment_feature(activity_id):
    """測試評論功能"""
    print_section("💬 步驟 6: 測試評論功能")

    # 發表評論
    response = requests.post(
        f"{BASE_URL}/social/feed/{activity_id}/comments",
        headers={"X-User-Id": USER_A_ID},
        json={
            "content": "哇！看起來很棒！我也想去 Niseko！"
        }
    )
    print_result("發表評論", response)

    # 獲取評論列表
    response = requests.get(
        f"{BASE_URL}/social/feed/{activity_id}/comments",
        headers={"X-User-Id": USER_A_ID}
    )
    print_result("獲取評論列表", response)


def test_ski_map():
    """測試滑雪地圖"""
    print_section("🗺️ 步驟 7: 測試滑雪地圖")

    # 獲取用戶 B 的滑雪地圖
    response = requests.get(
        f"{BASE_URL}/ski-map/users/{USER_B_ID}/ski-map",
        headers={"X-User-Id": USER_B_ID}
    )
    print_result("獲取滑雪地圖數據", response)


def main():
    """運行所有測試"""
    print("\n" + "="*60)
    print("  🧪 社交功能 API 測試")
    print("="*60)
    print(f"\n測試用戶 ID:")
    print(f"  用戶 A: {USER_A_ID}")
    print(f"  用戶 B: {USER_B_ID}")
    print(f"\nAPI 基礎 URL: {BASE_URL}")

    try:
        # 檢查服務是否運行
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print(f"\n❌ 服務未運行或不健康！")
            return
        print(f"\n✅ 服務運行正常")

        # 運行測試
        test_user_creation()
        test_follow_features()
        test_course_visit_with_feed()

        # 獲取動態 ID 用於後續測試
        feed_response = test_feed_retrieval()
        if feed_response.status_code == 200:
            items = feed_response.json().get("items", [])
            if items:
                activity_id = items[0]["id"]
                test_like_feature(activity_id)
                test_comment_feature(activity_id)
            else:
                print("\n⚠️ 沒有找到動態項目，跳過點讚和評論測試")

        test_ski_map()

        print("\n" + "="*60)
        print("  ✅ 所有測試完成！")
        print("="*60)

    except requests.exceptions.ConnectionError:
        print(f"\n❌ 無法連接到 {BASE_URL}")
        print("   請確保服務正在運行：")
        print("   cd platform/user_core && python -m uvicorn api.main:app --port 8001")
    except Exception as e:
        print(f"\n❌ 測試失敗: {e}")


if __name__ == "__main__":
    main()
