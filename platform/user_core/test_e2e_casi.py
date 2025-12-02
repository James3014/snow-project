#!/usr/bin/env python3
"""
端到端測試：模擬完整的 CASI 技能分析流程
"""
import sys
sys.path.insert(0, '.')

from services.casi_skill_analyzer import CASISkillAnalyzer
from schemas.behavior_event import BehaviorEvent
from datetime import datetime, UTC
import uuid

print("=" * 70)
print("CASI 技能分析 - 端到端測試")
print("=" * 70)
print()

# 模擬用戶
test_user_id = uuid.uuid4()
print(f"測試用戶 ID: {test_user_id}")
print()

# 模擬單板教學的練習事件（使用實際的 sam_cleaned 課程）
mock_events = [
    # 初學者練習站姿和平衡
    BehaviorEvent(
        event_id=uuid.uuid4(),
        user_id=test_user_id,
        source_project="snowboard-teaching",
        event_type="snowboard.practice.completed",
        occurred_at=datetime.now(UTC),
        payload={
            "lesson_id": "03_站姿開閉__L-int-adv__S-blue-black",
            "rating": 3,  # 技術理解 3, 動作成功度 3, 穩定度 3
            "note": "開始理解站姿的重要性"
        }
    ),
    # 練習換刃
    BehaviorEvent(
        event_id=uuid.uuid4(),
        user_id=test_user_id,
        source_project="snowboard-teaching",
        event_type="snowboard.practice.completed",
        occurred_at=datetime.now(UTC),
        payload={
            "lesson_id": "01_滾刃快換刃__L-int__S-blue",
            "rating": 4,
            "note": "換刃比較順了"
        }
    ),
    # 練習前刃刻滑
    BehaviorEvent(
        event_id=uuid.uuid4(),
        user_id=test_user_id,
        source_project="snowboard-teaching",
        event_type="snowboard.practice.completed",
        occurred_at=datetime.now(UTC),
        payload={
            "lesson_id": "20_五步前刃貼地刻__L-adv__S-blue",
            "rating": 2,
            "note": "前刃還不太穩"
        }
    ),
    # 練習反擰
    BehaviorEvent(
        event_id=uuid.uuid4(),
        user_id=test_user_id,
        source_project="snowboard-teaching",
        event_type="snowboard.practice.completed",
        occurred_at=datetime.now(UTC),
        payload={
            "lesson_id": "100_後手拉臀夾防反擰__L-int__S-blue-black",
            "rating": 3,
            "note": "反擰動作還在摸索"
        }
    ),
    # 再次練習換刃（進步了）
    BehaviorEvent(
        event_id=uuid.uuid4(),
        user_id=test_user_id,
        source_project="snowboard-teaching",
        event_type="snowboard.practice.completed",
        occurred_at=datetime.now(UTC),
        payload={
            "lesson_id": "02_微站膝換刃__L-beg-int__S-green-blue",
            "rating": 5,
            "note": "換刃很順暢了！"
        }
    ),
]

print(f"模擬 {len(mock_events)} 個練習事件:")
print("-" * 70)
for i, event in enumerate(mock_events, 1):
    lesson_name = event.payload['lesson_id'].split('__')[0]
    rating = event.payload['rating']
    print(f"{i}. {lesson_name} (評分: {rating}/5)")
print()

# 創建分析器
analyzer = CASISkillAnalyzer()

# 計算技能分數
print("計算 CASI 技能分數...")
print("-" * 70)
skill_scores = analyzer._compute_skill_scores_from_events(mock_events)

for skill, score in sorted(skill_scores.items(), key=lambda x: -x[1]):
    bar_length = int(score * 40)
    bar = "█" * bar_length + "░" * (40 - bar_length)
    print(f"{skill:20s} {score:.2f} |{bar}|")

print()

# 計算 skill_level
avg_score = sum(skill_scores.values()) / len(skill_scores)
skill_level = max(1, min(10, int(avg_score * 10)))

print(f"平均分數: {avg_score:.2f}")
print(f"Skill Level (1-10): {skill_level}")
print()

# 等級判定
if skill_level <= 3:
    level_name = "初級 (Beginner)"
elif skill_level <= 6:
    level_name = "中級 (Intermediate)"
elif skill_level <= 9:
    level_name = "高級 (Advanced)"
else:
    level_name = "專家 (Expert)"

print(f"等級: {level_name}")
print()

# 顯示每個課程的技能貢獻
print("課程技能貢獻分析:")
print("-" * 70)
for event in mock_events:
    lesson_id = event.payload['lesson_id']
    lesson_name = lesson_id.split('__')[0]
    rating = event.payload['rating']
    
    mapping = analyzer._get_lesson_skill_mapping(lesson_id)
    print(f"\n{lesson_name} (評分: {rating}/5)")
    
    for skill, weight in sorted(mapping.items(), key=lambda x: -x[1])[:3]:
        contribution = (rating / 5.0) * weight
        print(f"  → {skill}: {weight} × {rating/5:.1f} = {contribution:.2f}")

print()
print("=" * 70)
print("✅ 測試完成")
print("=" * 70)
