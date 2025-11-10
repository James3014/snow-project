#!/usr/bin/env python3
"""
生成雪場拼音映射表
"""
import yaml
from pathlib import Path
from pypinyin import lazy_pinyin

# 資料庫路徑
DATA_DIR = Path(__file__).parent.parent / "specs" / "resort-services" / "data"

def generate_pinyin_variants(chinese_name):
    """生成中文名稱的拼音變體"""
    # 生成完整拼音（連在一起）
    full_pinyin = ''.join(lazy_pinyin(chinese_name))
    variants = [full_pinyin]

    # 如果名稱中包含常見後綴，也生成不含後綴的版本
    suffixes = ['滑雪場', '度假村', '滑雪度假村', '滑雪公園', '溫泉', '高原', '集團', '王子大飯店', 'MOUNTAIN', 'リゾート', 'スキー場']
    name_without_suffix = chinese_name
    for suffix in suffixes:
        if chinese_name.endswith(suffix):
            name_without_suffix = chinese_name[:-len(suffix)]
            short_pinyin = ''.join(lazy_pinyin(name_without_suffix))
            if short_pinyin != full_pinyin:
                variants.append(short_pinyin)
            break

    return variants

def main():
    print("生成拼音映射表...")

    # 讀取所有 YAML 文件
    yaml_files = sorted(DATA_DIR.rglob('*.yaml'))
    print(f"找到 {len(yaml_files)} 個雪場文件")

    mappings = []

    for yaml_file in yaml_files:
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if not data or 'resort_id' not in data:
                    continue

                resort_id = data['resort_id']
                names = data.get('names', {})
                zh_name = names.get('zh', '')
                en_name = names.get('en', '')
                ja_name = names.get('ja', '')

                if not zh_name:
                    continue

                # 生成拼音變體
                pinyin_variants = generate_pinyin_variants(zh_name)

                # 添加英文名稱的簡化版
                if en_name:
                    en_simplified = en_name.lower().replace(' ', '').replace('-', '')
                    # 移除常見後綴
                    for suffix in ['resort', 'skiresort', 'skiarea', 'snowresort']:
                        if en_simplified.endswith(suffix):
                            en_short = en_simplified[:-len(suffix)]
                            if en_short not in pinyin_variants:
                                pinyin_variants.append(en_short)
                            break
                    if en_simplified not in pinyin_variants:
                        pinyin_variants.append(en_simplified)

                mappings.append({
                    'resort_id': resort_id,
                    'zh_name': zh_name,
                    'en_name': en_name,
                    'pinyin': list(set(pinyin_variants))  # 去重
                })

        except Exception as e:
            print(f"  ❌ 錯誤 {yaml_file.name}: {e}")

    # 生成 TypeScript 代碼
    ts_code = """/**
 * 拼音映射表
 * 自動生成，包含所有雪場的拼音對照
 */

export interface PinyinMapping {
  pinyin: string[];  // 可能的拼音寫法
  chinese: string;   // 中文名稱
  resortId: string;  // 雪場 ID
}

// 雪場拼音映射
export const RESORT_PINYIN_MAP: PinyinMapping[] = [
"""

    for mapping in mappings:
        pinyin_list = ', '.join(f"'{p}'" for p in mapping['pinyin'])
        ts_code += f"""  {{
    pinyin: [{pinyin_list}],
    chinese: '{mapping['zh_name']}',
    resortId: '{mapping['resort_id']}',
  }},
"""

    ts_code += """];

/**
 * 將拼音轉換為雪場 ID
 */
export function pinyinToResortId(pinyin: string): string | null {
  const normalized = pinyin.toLowerCase().trim();

  for (const mapping of RESORT_PINYIN_MAP) {
    if (mapping.pinyin.some(p => p === normalized || normalized.includes(p))) {
      return mapping.resortId;
    }
  }

  return null;
}

/**
 * 將拼音轉換為中文雪場名稱
 */
export function pinyinToChinese(pinyin: string): string | null {
  const normalized = pinyin.toLowerCase().trim();

  for (const mapping of RESORT_PINYIN_MAP) {
    if (mapping.pinyin.some(p => p === normalized || normalized.includes(p))) {
      return mapping.chinese;
    }
  }

  return null;
}

/**
 * 檢查輸入是否可能是拼音
 */
export function isPossiblyPinyin(input: string): boolean {
  // 簡單檢查：只包含英文字母
  return /^[a-zA-Z]+$/.test(input);
}
"""

    # 輸出
    output_file = Path(__file__).parent.parent / "platform" / "frontend" / "ski-platform" / "src" / "features" / "ai" / "utils" / "pinyinMapper.ts"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(ts_code)

    print(f"✅ 已生成 {output_file}")
    print(f"✅ 總共 {len(mappings)} 個雪場映射")

    # 打印一些示例
    print("\n示例映射：")
    for mapping in mappings[:5]:
        print(f"  {mapping['zh_name']}: {', '.join(mapping['pinyin'][:3])}")

if __name__ == '__main__':
    main()
