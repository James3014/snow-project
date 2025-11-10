#!/usr/bin/env python3
"""
將雪場數據轉換為 ResortMatcher 需要的 JSON 格式
"""
import yaml
import json
from pathlib import Path
from datetime import datetime

# 資料庫路徑
DATA_DIR = Path(__file__).parent.parent / "specs" / "resort-services" / "data"

def parse_season_months(season_data):
    """從 season 數據解析開放月份"""
    if not season_data:
        return []

    try:
        open_date = season_data.get('estimated_open')
        close_date = season_data.get('estimated_close')

        if not open_date or not close_date:
            return []

        # 解析日期
        open_dt = datetime.strptime(str(open_date), '%Y-%m-%d')
        close_dt = datetime.strptime(str(close_date), '%Y-%m-%d')

        # 生成月份列表
        months = set()
        current = open_dt
        while current <= close_dt:
            months.add(current.month)
            # 移到下個月
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1, day=1)
            else:
                current = current.replace(month=current.month + 1, day=1)

        return sorted(list(months))
    except:
        # 預設雪季月份（11-3月）
        return [11, 12, 1, 2, 3]

def calculate_skill_mix(courses):
    """從雪道數據計算技能組合"""
    if not courses:
        return ["beginner", "intermediate", "advanced"]

    levels = set()
    for course in courses:
        level = course.get('level', 'intermediate')
        levels.add(level)

    # 確保至少有基本等級
    if not levels:
        return ["beginner", "intermediate", "advanced"]

    return sorted(list(levels))

def estimate_powder_bias(description, region):
    """估算粉雪偏好"""
    if not description:
        # 根據地區預設
        if region and 'Hokkaido' in region:
            return "high"
        return "medium"

    highlights = description.get('highlights', [])
    tagline = description.get('tagline', '')

    text = ' '.join(highlights) + ' ' + tagline
    text_lower = text.lower()

    # 檢查粉雪相關關鍵字
    powder_keywords = ['粉雪', 'powder', 'champagne', '優質']
    if any(kw in text_lower for kw in powder_keywords):
        return "high"
    elif 'Hokkaido' in region or 'hokkaido' in region.lower():
        return "high"
    else:
        return "medium"

def estimate_budget_level(pricing, region):
    """估算預算等級（1-5）"""
    if not pricing:
        # 預設根據地區
        if region and 'Hokkaido' in region:
            return 4  # 北海道通常較貴
        return 3

    ticket_types = pricing.get('ticket_types', [])
    if not ticket_types:
        return 3

    # 取1日券價格
    one_day_price = None
    for ticket in ticket_types:
        if '1-day' in ticket.get('type', ''):
            one_day_price = ticket.get('adult')
            break

    if not one_day_price:
        return 3

    # 根據價格區間判斷
    if one_day_price < 4000:
        return 2
    elif one_day_price < 6000:
        return 3
    elif one_day_price < 8000:
        return 4
    else:
        return 5

def check_family_friendly(amenities, description):
    """檢查是否家庭友善"""
    if amenities:
        amenities_str = ' '.join(amenities).lower()
        if 'kids' in amenities_str or 'family' in amenities_str or 'children' in amenities_str:
            return True

    if description:
        highlights = description.get('highlights', [])
        text = ' '.join(highlights).lower()
        if '家庭' in text or 'family' in text or '親子' in text:
            return True

    return False

def check_apres_non_ski(amenities, description):
    """檢查是否有溫泉/餐飲等設施"""
    if amenities:
        amenities_str = ' '.join(amenities).lower()
        if 'onsen' in amenities_str or '溫泉' in amenities_str or 'restaurant' in amenities_str:
            return True

    return False

def estimate_crowd_level(description, resort_id):
    """估算人潮等級（1=少，5=多）"""
    if description:
        highlights = description.get('highlights', [])
        text = ' '.join(highlights).lower()

        if '人潮稀少' in text or '私人' in text or 'quiet' in text:
            return 2
        elif '熱門' in text or 'popular' in text or '知名' in text:
            return 4

    # 根據雪場名稱判斷
    famous_resorts = ['niseko', 'hakuba', 'rusutsu', 'furano']
    if any(name in resort_id.lower() for name in famous_resorts):
        return 4

    return 3  # 預設中等

def convert_resort_to_matcher_format(yaml_data):
    """轉換單個雪場數據"""
    resort_id = yaml_data.get('resort_id')
    names = yaml_data.get('names', {})

    result = {
        "id": resort_id,
        "name": names.get('zh', names.get('en', resort_id)),
        "name_en": names.get('en', ''),
        "name_ja": names.get('ja', ''),
        "country": yaml_data.get('country_code', 'JP'),
        "region": yaml_data.get('region', ''),
    }

    # 解析雪季月份
    season_data = yaml_data.get('season')
    result["open_months"] = parse_season_months(season_data)

    # 計算技能組合
    courses = yaml_data.get('courses', [])
    result["skill_mix"] = calculate_skill_mix(courses)

    # 雪道統計
    snow_stats = yaml_data.get('snow_stats', {})
    result["night_skiing"] = snow_stats.get('night_ski', False)
    result["lifts"] = snow_stats.get('lifts', 0)
    result["courses_total"] = snow_stats.get('courses_total', 0)
    result["longest_run"] = snow_stats.get('longest_run', 0)
    result["vertical_drop"] = snow_stats.get('vertical_drop', 0)

    # 等級比例
    result["beginner_ratio"] = snow_stats.get('beginner_ratio', 0.3)
    result["intermediate_ratio"] = snow_stats.get('intermediate_ratio', 0.4)
    result["advanced_ratio"] = snow_stats.get('advanced_ratio', 0.3)

    # 估算屬性
    description = yaml_data.get('description')
    amenities = yaml_data.get('amenities', [])
    pricing = yaml_data.get('pricing')

    result["powder_bias"] = estimate_powder_bias(description, result["region"])
    result["budget_level"] = estimate_budget_level(pricing, result["region"])
    result["family_kids"] = check_family_friendly(amenities, description)
    result["apres_non_ski"] = check_apres_non_ski(amenities, description)
    result["crowd_level"] = estimate_crowd_level(description, resort_id)

    # 描述
    if description:
        result["highlights"] = description.get('highlights', [])
        result["tagline"] = description.get('tagline', '')

    # 標註缺少的欄位（需要手動補充）
    result["pass"] = []  # 需要手動補充通行證信息
    result["lessons_languages"] = []  # 需要手動補充教學語言

    return result

def main():
    print("轉換雪場數據為 ResortMatcher 格式...")

    # 讀取所有 YAML 文件
    yaml_files = sorted(DATA_DIR.rglob('*.yaml'))
    print(f"找到 {len(yaml_files)} 個雪場文件")

    resorts = []

    for yaml_file in yaml_files:
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if not data or 'resort_id' not in data:
                    continue

                resort = convert_resort_to_matcher_format(data)
                resorts.append(resort)

                print(f"  ✅ {resort['name']} ({resort['id']})")
        except Exception as e:
            print(f"  ❌ 錯誤 {yaml_file.name}: {e}")

    # 輸出 JSON
    output = {
        "resorts": resorts,
        "metadata": {
            "total_count": len(resorts),
            "generated_at": datetime.now().isoformat(),
            "data_version": "1.0",
            "notes": "pass 和 lessons_languages 欄位需要手動補充"
        }
    }

    output_file = Path(__file__).parent.parent / "data" / "resorts_for_matcher.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 已生成 {output_file}")
    print(f"✅ 總共 {len(resorts)} 個雪場")
    print(f"\n📝 注意：以下欄位需要手動補充：")
    print(f"   - pass: 通行證信息（Ikon, Epic 等）")
    print(f"   - lessons_languages: 教學語言（Japanese, English, Chinese 等）")

if __name__ == '__main__':
    main()
