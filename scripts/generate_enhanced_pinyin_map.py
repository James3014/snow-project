#!/usr/bin/env python3
"""
生成增強版拼音映射表 - 包含常見別名和簡稱
"""
import yaml
from pathlib import Path
from pypinyin import lazy_pinyin

# 資料庫路徑
DATA_DIR = Path(__file__).parent.parent / "specs" / "resort-services" / "data"

# 手動定義的常見別名和簡稱
COMMON_ALIASES = {
    'hokkaido_niseko_moiwa': ['二世谷', '二世古', 'niseko', 'ershigu', 'ershigu'],
    'hokkaido_rusutsu': ['留壽都', 'rusutsu', 'liushoudou'],
    'hokkaido_furano': ['富良野', 'furano', 'fuliang'],
    'hokkaido_tomamu': ['tomamu', 'xingye', '星野'],
    'hokkaido_sapporo_teine': ['札幌', '手稻', 'sapporo', 'teine', 'zhahuang'],

    'hakuba_happo_one': ['白馬', '八方', 'hakuba', 'happo', 'baima', 'bafang'],
    'hakuba_goryu_47': ['五龍', 'goryu', '47', 'wulong'],
    'hakuba_tsugaike_kogen': ['栂池', 'tsugaike', 'meichi'],
    'hakuba_cortina': ['cortina', 'baima'],
    'hakuba_iwatake': ['岩岳', 'iwatake', 'yanyue'],
    'hakuba_norikura': ['乗鞍', 'norikura', 'chengan'],

    'yuzawa_gala': ['gala', '湯澤', 'yuzawa', 'tangze'],
    'yuzawa_naeba': ['苗場', 'naeba', 'miaochang'],
    'yuzawa_kagura': ['神樂', 'kagura', 'shenle'],
    'yuzawa_ishiuchi_maruyama': ['石打', '丸山', 'ishiuchi', 'maruyama', 'shida', 'wanshan'],
    'yuzawa_iwappara': ['岩原', 'iwappara', 'yanyuan'],
    'yuzawa_joetsu_kokusai': ['上越', 'joetsu', 'shangyue'],
    'yuzawa_kandatsu': ['神立', 'kandatsu', 'shenli'],
    'yuzawa_maiko_kogen': ['舞子', 'maiko', 'wuzi'],
    'yuzawa_nakazato': ['中里', 'nakazato', 'zhongli'],
    'yuzawa_naspa_ski_garden': ['naspa'],
    'yuzawa_park': ['公園', 'park', 'gongyuan'],

    'myoko_akakura_kanko': ['赤倉', '觀光', 'akakura', 'chicang', 'guanguang'],
    'myoko_akakura_onsen': ['赤倉溫泉', 'chicangwenquan'],
    'myoko_lotte_arai': ['新井', '樂天', 'arai', 'lotte', 'xinjing', 'letian'],
    'myoko_ikenotaira': ['池之平', 'ikenotaira', 'chizhiping'],
    'myoko_suginohara': ['杉之原', 'suginohara', 'shanzhiyuan'],

    'nagano_nozawa_onsen': ['野澤', 'nozawa', 'yeze'],
    'nagano_karuizawa_prince': ['輕井澤', '王子', 'karuizawa', 'qingjingze', 'wangzi'],
    'nagano_madarao_kogen': ['斑尾', 'madarao', 'banwei'],
    'nagano_kurohime_kogen': ['黑姬', 'kurohime', 'heiji'],
    'nagano_ryuoo_ski_park': ['龍王', 'ryuoo', 'longwang'],

    'yamagata_zao_onsen': ['藏王', 'zao', 'cangwang'],

    'iwate_appi_kogen': ['安比', 'appi', 'anbi'],
    'iwate_shizukuishi': ['雫石', 'shizukuishi', 'nashi'],

    'gunma_oze_iwakura': ['尾瀨', '岩鞍', 'oze', 'iwakura', 'weilai', 'yanan'],
    'gunma_marunuma_kogen': ['丸沼', 'marunuma', 'wanzhao'],
    'gunma_minakami_kogen': ['水上', 'minakami', 'shuishang'],
    'gunma_white_valley': ['white valley'],

    'fukushima_inawashiro': ['猪苗代', 'inawashiro', 'zhumiaodai'],
    'fukushima_nekoma_mountain': ['nekoma', 'xingye'],

    'tochigi_hunter_mountain_shiobara': ['hunter', '獵人', 'lieren'],
    'tochigi_edelweiss': ['edelweiss'],
}

def generate_pinyin_variants(chinese_name, resort_id):
    """生成中文名稱的拼音變體"""
    variants = []

    # 添加手動定義的別名
    if resort_id in COMMON_ALIASES:
        for alias in COMMON_ALIASES[resort_id]:
            if alias not in variants:
                variants.append(alias.lower())

    # 生成完整拼音（連在一起）
    full_pinyin = ''.join(lazy_pinyin(chinese_name)).lower()
    if full_pinyin not in variants:
        variants.append(full_pinyin)

    # 移除常見後綴生成簡短版本
    suffixes = ['滑雪場', '度假村', '滑雪度假村', '滑雪公園', '溫泉', '高原', '集團', '王子大飯店', '王子飯店']
    name_without_suffix = chinese_name
    for suffix in suffixes:
        if chinese_name.endswith(suffix):
            name_without_suffix = chinese_name[:-len(suffix)]
            short_pinyin = ''.join(lazy_pinyin(name_without_suffix)).lower()
            if short_pinyin and short_pinyin != full_pinyin and short_pinyin not in variants:
                variants.append(short_pinyin)
            break

    # 取前2-4個字的簡稱
    if len(chinese_name) >= 2:
        for length in [2, 3, 4]:
            if len(chinese_name) >= length:
                short_name = chinese_name[:length]
                short_pinyin = ''.join(lazy_pinyin(short_name)).lower()
                if short_pinyin and short_pinyin not in variants:
                    variants.append(short_pinyin)

    return variants

def main():
    print("生成增強版拼音映射表...")

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

                if not zh_name:
                    continue

                # 生成拼音變體（包含別名）
                pinyin_variants = generate_pinyin_variants(zh_name, resort_id)

                # 添加英文名稱的變體
                if en_name:
                    en_simplified = en_name.lower().replace(' ', '').replace('-', '')
                    if en_simplified not in pinyin_variants:
                        pinyin_variants.append(en_simplified)

                    # 添加英文簡稱（移除後綴）
                    for suffix in ['resort', 'skiresort', 'skiarea', 'snowresort', 'ski', 'snow']:
                        if en_simplified.endswith(suffix):
                            en_short = en_simplified[:-len(suffix)]
                            if en_short and en_short not in pinyin_variants:
                                pinyin_variants.append(en_short)

                    # 添加帶空格的原始英文名
                    en_lower = en_name.lower()
                    if en_lower not in pinyin_variants:
                        pinyin_variants.append(en_lower)

                mappings.append({
                    'resort_id': resort_id,
                    'zh_name': zh_name,
                    'en_name': en_name,
                    'pinyin': list(set(pinyin_variants))[:15]  # 限制最多15個變體
                })

                print(f"  ✅ {zh_name}: {len(pinyin_variants)} 個變體")

        except Exception as e:
            print(f"  ❌ 錯誤 {yaml_file.name}: {e}")

    # 生成 TypeScript 代碼
    ts_code = """/**
 * 增強版拼音映射表
 * 包含常見別名、簡稱和多種拼音變體
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
    // 完全匹配
    if (mapping.pinyin.includes(normalized)) {
      return mapping.resortId;
    }
    // 包含匹配（用於處理用戶輸入較長的情況）
    if (mapping.pinyin.some(p => normalized.includes(p) && p.length >= 3)) {
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
    // 完全匹配
    if (mapping.pinyin.includes(normalized)) {
      return mapping.chinese;
    }
    // 包含匹配
    if (mapping.pinyin.some(p => normalized.includes(p) && p.length >= 3)) {
      return mapping.chinese;
    }
  }

  return null;
}

/**
 * 檢查輸入是否可能是拼音
 */
export function isPossiblyPinyin(input: string): boolean {
  // 檢查：只包含英文字母、數字、空格
  return /^[a-zA-Z0-9\s]+$/.test(input);
}
"""

    # 輸出
    output_file = Path(__file__).parent.parent / "platform" / "frontend" / "ski-platform" / "src" / "features" / "ai" / "utils" / "pinyinMapper.ts"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(ts_code)

    print(f"\n✅ 已生成 {output_file}")
    print(f"✅ 總共 {len(mappings)} 個雪場映射")
    print(f"✅ 平均每個雪場 {sum(len(m['pinyin']) for m in mappings) / len(mappings):.1f} 個變體")

if __name__ == '__main__':
    main()
