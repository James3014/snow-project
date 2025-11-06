#!/usr/bin/env python3
"""
测试数据生成脚本 - 雪道追踪系统

创建10个测试用户并生成模拟数据：
- 用户资料
- 雪道访问记录
- 课程推荐
- 成就数据
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, date
import random
import uuid

# 添加user_core到路径
USER_CORE_ROOT = Path(__file__).resolve().parents[1] / "platform" / "user_core"
sys.path.insert(0, str(USER_CORE_ROOT))

from sqlalchemy.orm import Session
from sqlalchemy import func
from services.db import get_db, engine
from models.user_profile import UserProfile, Base as UserBase
from models.course_tracking import (
    CourseVisit, CourseRecommendation, UserAchievement,
    AchievementDefinition, Base as CourseBase
)

# 测试用户数据
TEST_USERS = [
    {"name": "张伟", "bio": "滑雪爱好者，喜欢挑战黑道", "roles": ["student"]},
    {"name": "王芳", "bio": "初学者，正在努力学习中", "roles": ["student"]},
    {"name": "李明", "bio": "资深滑雪教练", "roles": ["coach"]},
    {"name": "刘静", "bio": "周末滑雪党", "roles": ["student"]},
    {"name": "陈强", "bio": "粉雪追逐者", "roles": ["student"]},
    {"name": "杨丽", "bio": "喜欢在树林里滑", "roles": ["student"]},
    {"name": "赵敏", "bio": "滑雪摄影师", "roles": ["student"]},
    {"name": "孙涛", "bio": "竞技滑雪选手", "roles": ["student"]},
    {"name": "周婷", "bio": "家庭滑雪爱好者", "roles": ["student"]},
    {"name": "吴刚", "bio": "单板滑雪玩家", "roles": ["student"]},
]

# Rusutsu雪场的雪道列表（从之前的数据）
RUSUTSU_COURSES = {
    "beginner": [
        "Family Course / ファミリーコース",
        "Isola Course / イゾラコース",
        "Stream Course / ストリームコース",
        "Wide Course / ワイドコース",
        "Heaven Course / ヘブンコース",
        "Rainbow Course / レインボーコース",
        "Gentle Course / ジェントルコース",
        "Kids Park Course / キッズパークコース",
        "Slow Course / スローコース",
    ],
    "intermediate": [
        "Isola 2 Course / イゾラ2コース",
        "Wonder Course / ワンダーコース",
        "Panorama Course / パノラマコース",
        "Isola Panorama Course / イゾラパノラマコース",
        "Sunset Course / サンセットコース",
        "View Course / ビューコース",
        "Echo Course / エコーコース",
        "Valley Course / バレーコース",
        "Forest Course / フォレストコース",
        "Dream Course / ドリームコース",
        "Nature Course / ネイチャーコース",
        "Scenic Course / シーニックコース",
    ],
    "advanced": [
        "Super East Course / スーパーイーストコース",
        "White Lover Course / ホワイトラバーコース",
        "Side Country Course / サイドカントリーコース",
        "Champion Course / チャンピオンコース",
        "Expert Course / エキスパートコース",
        "Steep Vale Course / スティープベールコース",
        "Heaven Valley Course / ヘブンバレーコース",
        "West Mt Isola Course / ウエストMtイゾラコース",
        "East Mt Isola Course / イーストMtイゾラコース",
        "Tower Course / タワーコース",
        "Challenger Course / チャレンジャーコース",
        "Black Diamond Course / ブラックダイヤモンドコース",
        "Extreme Course / エクストリームコース",
        "Powder Zone Course / パウダーゾーンコース",
        "Tree Run Course / ツリーランコース",
        "Backcountry Gate Course / バックカントリーゲートコース",
    ]
}

# 所有雪道列表（扁平化）
ALL_COURSES = (
    RUSUTSU_COURSES["beginner"] +
    RUSUTSU_COURSES["intermediate"] +
    RUSUTSU_COURSES["advanced"]
)

# 推荐理由示例
RECOMMENDATION_REASONS = [
    "坡度适中，雪质很好，适合练习技术",
    "视野开阔，风景绝美，拍照圣地",
    "粉雪天堂！树林穿梭超级爽",
    "超长雪道，一口气滑到底太过瘾了",
    "陡坡挑战，适合高手，刺激感满满",
    "宽敞平缓，带孩子来非常安全",
    "早上第一个来滑，压雪车刚压完，完美",
    "晚上灯光下滑别有风味",
    "人少清静，可以尽情练习",
    "教练推荐的练习场，进步很快",
]


def create_tables():
    """创建所有数据表"""
    print("📋 创建数据表...")
    UserBase.metadata.create_all(bind=engine)
    CourseBase.metadata.create_all(bind=engine)
    print("✅ 数据表创建完成")


def clear_test_data(db: Session):
    """清除旧的测试数据"""
    print("🧹 清除旧测试数据...")

    # 删除课程追踪数据
    db.query(CourseVisit).delete()
    db.query(CourseRecommendation).delete()
    db.query(UserAchievement).delete()

    # 删除测试用户（bio包含特定标记的）
    test_users = db.query(UserProfile).filter(
        UserProfile.bio.contains("滑雪")
    ).all()

    for user in test_users:
        db.delete(user)

    db.commit()
    print(f"✅ 清除了 {len(test_users)} 个测试用户的数据")


def create_test_users(db: Session):
    """创建10个测试用户"""
    print("\n👥 创建测试用户...")

    created_users = []

    for user_data in TEST_USERS:
        user = UserProfile(
            user_id=uuid.uuid4(),
            bio=user_data["bio"],
            roles=user_data["roles"],
            status="active",
            preferred_language="zh",
        )
        db.add(user)
        created_users.append({
            "id": user.user_id,
            "name": user_data["name"],
            "user": user
        })

    db.commit()
    print(f"✅ 创建了 {len(created_users)} 个测试用户")

    return created_users


def generate_course_visits(db: Session, users):
    """为用户生成雪道访问记录"""
    print("\n⛷️  生成雪道访问记录...")

    total_visits = 0

    for user_data in users:
        user_id = user_data["id"]
        name = user_data["name"]

        # 不同用户访问不同数量的雪道
        # 前3个用户是活跃用户，后面的递减
        if users.index(user_data) < 3:
            num_courses = random.randint(15, 25)  # 活跃用户
        elif users.index(user_data) < 6:
            num_courses = random.randint(8, 15)   # 中等用户
        else:
            num_courses = random.randint(3, 8)    # 新用户

        # 随机选择雪道
        selected_courses = random.sample(ALL_COURSES, min(num_courses, len(ALL_COURSES)))

        # 生成访问记录（最近30天内）
        for course in selected_courses:
            days_ago = random.randint(0, 30)
            visit_date = date.today() - timedelta(days=days_ago)

            visit = CourseVisit(
                user_id=user_id,
                resort_id="rusutsu",
                course_name=course,
                visited_date=visit_date,
                notes=random.choice([
                    None,
                    "雪质很好",
                    "今天人不多",
                    "风有点大",
                    "完美的一天！",
                    "进步了不少",
                ]) if random.random() > 0.5 else None
            )
            db.add(visit)
            total_visits += 1

        print(f"  - {name}: {num_courses} 条雪道")

    db.commit()
    print(f"✅ 生成了 {total_visits} 条访问记录")


def generate_recommendations(db: Session, users):
    """为用户生成雪道推荐"""
    print("\n💡 生成雪道推荐...")

    total_recommendations = 0

    # 只有前7个用户有推荐
    for user_data in users[:7]:
        user_id = user_data["id"]
        name = user_data["name"]

        # 获取该用户访问过的雪道
        visited = db.query(CourseVisit.course_name).filter(
            CourseVisit.user_id == user_id
        ).distinct().all()

        if not visited or len(visited) < 3:
            continue

        visited_courses = [v.course_name for v in visited]

        # 随机选择3条推荐（从访问过的里面选）
        recommended_courses = random.sample(visited_courses, min(3, len(visited_courses)))

        for rank, course in enumerate(recommended_courses, 1):
            rec = CourseRecommendation(
                user_id=user_id,
                resort_id="rusutsu",
                course_name=course,
                rank=rank,
                reason=random.choice(RECOMMENDATION_REASONS),
                status=random.choice(["approved", "approved", "approved", "pending_review"]),  # 75%通过
            )
            db.add(rec)
            total_recommendations += 1

        print(f"  - {name}: {len(recommended_courses)} 条推荐")

    db.commit()
    print(f"✅ 生成了 {total_recommendations} 条推荐")


def generate_achievements(db: Session, users):
    """为用户生成成就数据"""
    print("\n🏆 生成成就数据...")

    # 先确保有成就定义
    definitions_count = db.query(AchievementDefinition).count()
    if definitions_count == 0:
        print("⚠️  警告：没有找到成就定义，请先运行应用加载achievement_definitions.yaml")
        return

    print(f"  找到 {definitions_count} 个成就定义")

    # 获取一些基础成就
    basic_achievements = [
        "first_course",
        "early_bird",
        "weekend_warrior",
    ]

    total_achievements = 0

    for user_data in users:
        user_id = user_data["id"]
        name = user_data["name"]

        # 获取用户完成的雪道数量
        course_count = db.query(CourseVisit).filter(
            CourseVisit.user_id == user_id
        ).distinct(CourseVisit.course_name).count()

        awarded = 0

        # 所有人都有first_course
        if course_count > 0:
            achievement = UserAchievement(
                user_id=user_id,
                achievement_type="first_course",
                points=10,
                achievement_data={"courses_count": course_count}
            )
            db.add(achievement)
            awarded += 1

        # 根据完成数量给予不同成就
        if course_count >= 5:
            achievement = UserAchievement(
                user_id=user_id,
                achievement_type="course_collector_level_1",
                points=30,
                achievement_data={"courses_count": course_count}
            )
            db.add(achievement)
            awarded += 1

        if course_count >= 10:
            achievement = UserAchievement(
                user_id=user_id,
                achievement_type="course_collector_level_2",
                points=60,
                achievement_data={"courses_count": course_count}
            )
            db.add(achievement)
            awarded += 1

        if course_count >= 20:
            achievement = UserAchievement(
                user_id=user_id,
                achievement_type="course_collector_level_3",
                points=100,
                achievement_data={"courses_count": course_count}
            )
            db.add(achievement)
            awarded += 1

        # 一些随机的特殊成就
        if random.random() > 0.7 and course_count > 0:
            achievement = UserAchievement(
                user_id=user_id,
                achievement_type="early_bird",
                points=20,
                achievement_data={}
            )
            db.add(achievement)
            awarded += 1

        total_achievements += awarded
        if awarded > 0:
            print(f"  - {name}: {awarded} 个成就")

    db.commit()
    print(f"✅ 生成了 {total_achievements} 个成就记录")


def print_summary(db: Session, users):
    """打印数据摘要"""
    print("\n" + "="*60)
    print("📊 测试数据摘要")
    print("="*60)

    print(f"\n👥 用户: {len(users)}")
    for user_data in users:
        user_id = user_data["id"]
        name = user_data["name"]

        visits = db.query(CourseVisit).filter(
            CourseVisit.user_id == user_id
        ).count()

        courses = db.query(CourseVisit.course_name).filter(
            CourseVisit.user_id == user_id
        ).distinct().count()

        recs = db.query(CourseRecommendation).filter(
            CourseRecommendation.user_id == user_id
        ).count()

        achievements = db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id
        ).count()

        points = db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id
        ).with_entities(
            func.sum(UserAchievement.points)
        ).scalar() or 0

        print(f"\n{name} ({str(user_id)[:8]}...)")
        print(f"  - 访问记录: {visits} 次")
        print(f"  - 完成雪道: {courses} 条")
        print(f"  - 推荐: {recs} 条")
        print(f"  - 成就: {achievements} 个")
        print(f"  - 积分: {points} 分")

    # 总计
    total_visits = db.query(CourseVisit).count()
    total_recs = db.query(CourseRecommendation).count()
    total_achievements = db.query(UserAchievement).count()

    print("\n" + "-"*60)
    print(f"总访问记录: {total_visits}")
    print(f"总推荐: {total_recs}")
    print(f"总成就: {total_achievements}")
    print("="*60)

    # 打印用户ID供前端测试使用
    print("\n🔑 测试用户ID列表（供前端使用）:")
    print("-"*60)
    for user_data in users:
        print(f"{user_data['name']}: {user_data['id']}")
    print("="*60)


def main():
    """主函数"""
    print("\n" + "="*60)
    print("🎿 雪道追踪系统 - 测试数据生成器")
    print("="*60)

    # 创建表
    create_tables()

    # 获取数据库会话
    db = next(get_db())

    try:
        # 清除旧数据
        clear_test_data(db)

        # 创建用户
        users = create_test_users(db)

        # 生成数据
        generate_course_visits(db, users)
        generate_recommendations(db, users)
        generate_achievements(db, users)

        # 打印摘要
        print_summary(db, users)

        print("\n✅ 测试数据生成完成！")
        print("\n💡 提示：")
        print("  - 可以使用上面的用户ID进行前端测试")
        print("  - 用户密码需要通过认证系统设置")
        print("  - 数据已写入数据库，可以直接通过API访问")

    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
