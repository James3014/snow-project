/**
 * 拼音映射表
 * 手動維護常用雪場的拼音對照
 */

export interface PinyinMapping {
  pinyin: string[];  // 可能的拼音寫法
  chinese: string;   // 中文名稱
}

// 常用雪場拼音映射
export const RESORT_PINYIN_MAP: PinyinMapping[] = [
  {
    pinyin: ['ershi', 'ershigu', 'niseko', 'nise'],
    chinese: '二世谷',
  },
  {
    pinyin: ['baima', 'hakuba'],
    chinese: '白馬',
  },
  {
    pinyin: ['liushou', 'liushoudou', 'rusutsu', 'rus'],
    chinese: '留壽都',
  },
  {
    pinyin: ['zhangbai', 'zhangbaishan', 'changbai'],
    chinese: '長白山',
  },
  {
    pinyin: ['fulong', 'furano'],
    chinese: '富良野',
  },
  {
    pinyin: ['zhichuan', 'shiga', 'shigakogen'],
    chinese: '志賀高原',
  },
  {
    pinyin: ['yuzawa', 'gala'],
    chinese: '湯澤',
  },
  {
    pinyin: ['zhawo', 'zao', 'zaou'],
    chinese: '藏王',
  },
];

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
