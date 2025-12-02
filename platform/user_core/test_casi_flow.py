#!/usr/bin/env python3
"""
測試 CASI 技能分析流程
"""
import sys
sys.path.insert(0, '.')

from services.casi_skill_analyzer import CASISkillAnalyzer

# 測試課程映射
analyzer = CASISkillAnalyzer()

print("=" * 60)
print("CASI 技能分析器測試")
print("=" * 60)
print()

# 測試 1: 檢查課程映射
print("測試 1: 課程映射")
print("-" * 60)
test_lessons = [
    "basic_stance",
    "falling_leaf",
    "j_turn",
    "linked_turns",
    "carving",
    "unknown_lesson"
]

for lesson in test_lessons:
    mapping = analyzer._get_lesson_skill_mapping(lesson)
    print(f"\n課程: {lesson}")
    for skill, weight in mapping.items():
        print(f"  - {skill}: {weight}")

print()
print("=" * 60)

# 測試 2: 模擬事件計算
print("\n測試 2: 模擬技能分數計算")
print("-" * 60)

class MockEvent:
    def __init__(self, event_type, lesson_id, rating):
        self.event_type = event_type
        self.payload = {"lesson_id": lesson_id, "rating": rating}

mock_events = [
    MockEvent("lesson_completed", "basic_stance", 4),
    MockEvent("practice_session", "falling_leaf", 3),
    MockEvent("lesson_completed", "j_turn", 5),
    MockEvent("lesson_completed", "linked_turns", 4),
]

print(f"\n模擬 {len(mock_events)} 個練習事件:")
for i, event in enumerate(mock_events, 1):
    print(f"  {i}. {event.payload['lesson_id']} (評分: {event.payload['rating']}/5)")

skill_scores = analyzer._compute_skill_scores_from_events(mock_events)

print(f"\n計算結果:")
for skill, score in skill_scores.items():
    print(f"  - {skill}: {score:.2f}")

# 計算平均分數和 skill_level
avg_score = sum(skill_scores.values()) / len(skill_scores)
skill_level = max(1, min(10, int(avg_score * 10)))

print(f"\n平均分數: {avg_score:.2f}")
print(f"Skill Level (1-10): {skill_level}")

print()
print("=" * 60)
print("✅ 測試完成")
print("=" * 60)
