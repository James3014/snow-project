#!/usr/bin/env python3
"""
手動運行數據庫遷移腳本

此腳本用於在開發環境中直接創建所有需要的表。
在生產環境中應使用 Alembic 遷移。
"""
import sys
from pathlib import Path

# 添加父目錄到 Python 路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from services import db
from models import user_profile, behavior_event, notification_preference, course_tracking, social


def run_migrations():
    """創建所有數據庫表"""
    print("🔧 開始創建數據庫表...")

    try:
        # 創建所有表
        print("   📊 創建 user_profiles 相關表...")
        user_profile.Base.metadata.create_all(bind=db.engine)

        print("   📊 創建 behavior_events 表...")
        behavior_event.Base.metadata.create_all(bind=db.engine)

        print("   📊 創建 notification_preferences 表...")
        notification_preference.Base.metadata.create_all(bind=db.engine)

        print("   📊 創建 course_tracking 相關表...")
        course_tracking.Base.metadata.create_all(bind=db.engine)

        print("   📊 創建 social 相關表...")
        social.Base.metadata.create_all(bind=db.engine)

        print("\n✅ 所有表創建成功！")
        print("\n創建的表包括：")
        print("   - user_profiles (已更新：添加 display_name, avatar_url, default_post_visibility)")
        print("   - user_follows (新增)")
        print("   - activity_feed_items (新增)")
        print("   - activity_likes (新增)")
        print("   - activity_comments (新增)")
        print("   - course_visits")
        print("   - user_achievements")
        print("   - 其他現有表...")

    except Exception as e:
        print(f"\n❌ 錯誤：{e}")
        sys.exit(1)


if __name__ == "__main__":
    run_migrations()
