#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

from services.casi_skill_analyzer import CASISkillAnalyzer

analyzer = CASISkillAnalyzer()

# 測試實際的 sam_cleaned 課程
test_lessons = [
    "01_滾刃快換刃__L-int__S-blue",
    "03_站姿開閉__L-int-adv__S-blue-black",
    "20_五步前刃貼地刻__L-adv__S-blue",
    "100_後手拉臀夾防反擰__L-int__S-blue-black",
    "unknown_lesson",
]

print("=" * 60)
print("CASI 關鍵字映射測試")
print("=" * 60)

for lesson in test_lessons:
    mapping = analyzer._get_lesson_skill_mapping(lesson)
    print(f"\n課程: {lesson}")
    for skill, weight in sorted(mapping.items(), key=lambda x: -x[1]):
        print(f"  {skill}: {weight}")

print("\n" + "=" * 60)
