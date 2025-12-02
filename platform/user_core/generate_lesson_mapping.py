#!/usr/bin/env python3
"""
根據課程名稱生成 CASI 技能映射
"""

# 關鍵字到技能的映射
KEYWORD_TO_SKILLS = {
    # Stance & Balance (站姿與平衡)
    "站姿": {"stance_balance": 1.0, "timing_coordination": 0.3},
    "平衡": {"stance_balance": 0.9, "timing_coordination": 0.4},
    "居中": {"stance_balance": 0.8, "pressure": 0.5},
    "重心": {"stance_balance": 0.7, "pressure": 0.6},
    "牛仔": {"stance_balance": 0.8, "pressure": 0.5},
    
    # Rotation (旋轉)
    "換刃": {"rotation": 0.8, "edging": 0.7, "timing_coordination": 0.6},
    "轉彎": {"rotation": 0.9, "edging": 0.6, "timing_coordination": 0.7},
    "旋轉": {"rotation": 1.0, "timing_coordination": 0.5},
    "反擰": {"rotation": 0.9, "stance_balance": 0.5},
    "扭轉": {"rotation": 0.8, "timing_coordination": 0.6},
    "180": {"rotation": 1.0, "timing_coordination": 0.7},
    "360": {"rotation": 1.0, "timing_coordination": 0.8},
    
    # Edging (用刃)
    "刃": {"edging": 0.9, "pressure": 0.6},
    "刻滑": {"edging": 1.0, "pressure": 0.8, "stance_balance": 0.6},
    "走刃": {"edging": 0.9, "pressure": 0.7},
    "立刃": {"edging": 0.8, "pressure": 0.7},
    "滾刃": {"edging": 0.9, "timing_coordination": 0.7},
    "前刃": {"edging": 0.8, "pressure": 0.6},
    "後刃": {"edging": 0.8, "pressure": 0.6},
    
    # Pressure (壓力)
    "壓": {"pressure": 0.9, "edging": 0.5},
    "折疊": {"pressure": 0.8, "stance_balance": 0.6},
    "傾倒": {"pressure": 0.9, "edging": 0.7},
    "施壓": {"pressure": 1.0, "timing_coordination": 0.6},
    "蓄力": {"pressure": 0.8, "timing_coordination": 0.7},
    
    # Timing & Coordination (時機與協調性)
    "時機": {"timing_coordination": 1.0},
    "節奏": {"timing_coordination": 0.9, "rotation": 0.5},
    "流暢": {"timing_coordination": 0.8, "rotation": 0.6},
    "連貫": {"timing_coordination": 0.9, "rotation": 0.5},
    "起伏": {"timing_coordination": 0.8, "pressure": 0.6},
}

# 示例課程
sample_lessons = [
    "01_滾刃快換刃",
    "02_微站膝換刃",
    "03_站姿開閉",
    "10_折疊降立刃",
    "20_五步前刃貼地刻",
    "100_後手拉臀夾防反擰",
]

print("# CASI 技能映射（基於關鍵字）\n")
print("LESSON_SKILL_MAPPING = {")

for lesson in sample_lessons:
    # 提取課程名稱
    name = lesson.split("_", 1)[1] if "_" in lesson else lesson
    
    # 找到匹配的關鍵字
    skills = {}
    for keyword, skill_weights in KEYWORD_TO_SKILLS.items():
        if keyword in name:
            for skill, weight in skill_weights.items():
                skills[skill] = max(skills.get(skill, 0), weight)
    
    # 如果沒有匹配，使用默認值
    if not skills:
        skills = {
            "stance_balance": 0.5,
            "rotation": 0.5,
            "edging": 0.5,
            "pressure": 0.5,
            "timing_coordination": 0.5,
        }
    
    print(f'    "{lesson}": {{')
    for skill, weight in sorted(skills.items()):
        print(f'        "{skill}": {weight},')
    print("    },")

print("}")
