#!/usr/bin/env python3
"""
同步資料庫中的雪場數據到前端 TypeScript 文件
"""
import yaml
from pathlib import Path
import json

# 資料庫路徑
DATA_DIR = Path(__file__).parent.parent / "specs" / "resort-services" / "data"
OUTPUT_FILE = Path(__file__).parent.parent / "platform" / "frontend" / "ski-platform" / "src" / "shared" / "data" / "resorts.ts"

def yaml_to_ts_course(course):
    """將 YAML 課程轉換為 TS 格式"""
    tags = course.get('tags', [])
    tags_str = json.dumps(tags) if tags else '[]'

    return f"""  {{
    name: {json.dumps(course.get('name', ''))},
    level: {json.dumps(course.get('level', 'beginner'))},
    tags: {tags_str},
    avg_slope: {course.get('avg_slope', 0)},
    max_slope: {course.get('max_slope', 0) or course.get('avg_slope', 0)},
    {f"notes: {json.dumps(course.get('notes'))}," if course.get('notes') else ''}
  }}"""

def yaml_to_ts_resort(resort_data, const_name):
    """將 YAML 雪場轉換為 TS 格式"""
    names = resort_data.get('names', {})
    coords = resort_data.get('coordinates', {})
    snow_stats = resort_data.get('snow_stats', {})
    description = resort_data.get('description', {})
    courses = resort_data.get('courses', [])

    # 生成 courses 陣列
    courses_str = ',\n'.join([yaml_to_ts_course(c) for c in courses])

    # 生成 description
    highlights = description.get('highlights', [])
    highlights_str = json.dumps(highlights)
    tagline = description.get('tagline', '')

    return f"""export const {const_name}: Resort = {{
  resort_id: {json.dumps(resort_data.get('resort_id'))},
  names: {{
    zh: {json.dumps(names.get('zh', ''))},
    en: {json.dumps(names.get('en', ''))},
    ja: {json.dumps(names.get('ja', ''))},
  }},
  country_code: {json.dumps(resort_data.get('country_code', 'JP'))},
  region: {json.dumps(resort_data.get('region', ''))},
  coordinates: {{
    lat: {coords.get('lat', 0)},
    lng: {coords.get('lng', 0)},
  }},
  snow_stats: {{
    lifts: {snow_stats.get('lifts', 0)},
    courses_total: {snow_stats.get('courses_total', len(courses))},
    beginner_ratio: {snow_stats.get('beginner_ratio', 0.3)},
    intermediate_ratio: {snow_stats.get('intermediate_ratio', 0.4)},
    advanced_ratio: {snow_stats.get('advanced_ratio', 0.3)},
    longest_run: {snow_stats.get('longest_run', 0)},
    vertical_drop: {snow_stats.get('vertical_drop', 0)},
    night_ski: {str(snow_stats.get('night_ski', False)).lower()},
  }},
  description: {{
    highlights: {highlights_str},
    tagline: {json.dumps(tagline)},
  }},
  courses: [
{courses_str}
  ],
}};
"""

def generate_const_name(resort_id):
    """生成常量名稱"""
    # 移除前綴並轉換為大寫
    parts = resort_id.split('_')
    if parts[0] in ['hokkaido', 'nagano', 'niigata', 'yamagata', 'gunma', 'iwate', 'tochigi', 'fukushima']:
        parts = parts[1:]  # 移除地區前綴

    name = '_'.join(parts).upper()
    return f"{name}_RESORT"

def main():
    print("開始同步雪場數據...")

    # 讀取所有 YAML 文件
    yaml_files = sorted(DATA_DIR.rglob('*.yaml'))
    print(f"找到 {len(yaml_files)} 個雪場文件")

    resorts_data = []
    const_names = []

    for yaml_file in yaml_files:
        print(f"處理: {yaml_file.name}")
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if not data or 'resort_id' not in data:
                    print(f"  ⚠️ 跳過（無效數據）")
                    continue

                resort_id = data['resort_id']
                const_name = generate_const_name(resort_id)

                resorts_data.append((const_name, data))
                const_names.append(const_name)

                courses_count = len(data.get('courses', []))
                print(f"  ✅ {data['names'].get('zh', resort_id)} - {courses_count} 條雪道")
        except Exception as e:
            print(f"  ❌ 錯誤: {e}")

    # 生成 TypeScript 文件
    print(f"\n生成 TypeScript 文件...")

    ts_content = """/**
 * Resort Data
 * 雪場數據
 *
 * 注意：這是從資料庫同步的數據。
 * 資料來源：specs/resort-services/data/
 */

export interface Course {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  avg_slope: number;
  max_slope: number;
  notes?: string;
}

export interface Resort {
  resort_id: string;
  names: {
    zh: string;
    en: string;
    ja: string;
  };
  country_code: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  snow_stats: {
    lifts: number;
    courses_total: number;
    beginner_ratio: number;
    intermediate_ratio: number;
    advanced_ratio: number;
    longest_run: number;
    vertical_drop: number;
    night_ski: boolean;
  };
  courses: Course[];
  description?: {
    highlights: string[];
    tagline: string;
  };
}

"""

    # 添加所有雪場常量
    for const_name, data in resorts_data:
        ts_content += yaml_to_ts_resort(data, const_name) + "\n"

    # 添加雪場列表
    resorts_list = ',\n'.join(f'  {name}' for name in const_names)
    ts_content += f"""// 所有雪場列表
export const RESORTS: Resort[] = [
{resorts_list}
];

// 根據 ID 獲取雪場
export const getResortById = (resortId: string): Resort | undefined => {{
  return RESORTS.find((r) => r.resort_id === resortId);
}};

// 獲取所有雪場
export const getAllResorts = (): Resort[] => {{
  return RESORTS;
}};
"""

    # 寫入文件
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(ts_content)

    print(f"✅ 已生成 {OUTPUT_FILE}")
    print(f"✅ 總共 {len(resorts_data)} 個雪場")
    print(f"✅ 總雪道數: {sum(len(d.get('courses', [])) for _, d in resorts_data)}")

if __name__ == '__main__':
    main()
