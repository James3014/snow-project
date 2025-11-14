/**
 * 天數解析器
 * 支援中文數字和阿拉伯數字
 */

// 中文數字映射
const CHINESE_NUMBER_MAP: Record<string, number> = {
  '一': 1,
  '二': 2,
  '三': 3,
  '四': 4,
  '五': 5,
  '六': 6,
  '七': 7,
  '八': 8,
  '九': 9,
  '十': 10,
};

/**
 * 將中文數字轉換為阿拉伯數字
 */
function chineseNumberToInt(str: string): number {
  // 如果已經是阿拉伯數字
  if (/^\d+$/.test(str)) {
    return parseInt(str);
  }

  // 單個中文數字
  if (CHINESE_NUMBER_MAP[str]) {
    return CHINESE_NUMBER_MAP[str];
  }

  // 十幾（十一、十二...十九）
  if (str.startsWith('十') && str.length === 2) {
    const second = str[1];
    return 10 + (CHINESE_NUMBER_MAP[second] || 0);
  }

  // 幾十（二十、三十...）
  if (str.endsWith('十') && str.length === 2) {
    const first = str[0];
    return (CHINESE_NUMBER_MAP[first] || 0) * 10;
  }

  // 幾十幾（二十一、三十五...）
  if (str.includes('十') && str.length === 3) {
    const [first, , third] = str;
    return (CHINESE_NUMBER_MAP[first] || 0) * 10 + (CHINESE_NUMBER_MAP[third] || 0);
  }

  return 1;  // 預設 1
}

/**
 * 從文本中提取天數
 */
export function extractDuration(input: string): number | null {
  // 先移除日期部分，避免誤判
  let text = input.replace(/\d{4}[/-]\d{1,2}[/-]\d{1,2}/g, '');
  text = text.replace(/\d{1,2}[/-月]\d{1,2}[日號]?/g, '');

  // 格式 1: "5天"、"5日"
  const dayMatch = text.match(/(\d+)[天日]/);
  if (dayMatch) {
    return parseInt(dayMatch[1]);
  }

  // 格式 2: "待5天"、"住5天"、"停留5天"
  const stayMatch = text.match(/[待住停留](\d+)[天日]/);
  if (stayMatch) {
    return parseInt(stayMatch[1]);
  }

  // 格式 3: "三天兩夜"、"五天四夜"
  const chineseDayMatch = text.match(/([一二三四五六七八九十\d]+)天/);
  if (chineseDayMatch) {
    return chineseNumberToInt(chineseDayMatch[1]);
  }

  // 格式 4: "一週"、"兩週"、"一星期"
  const weekMatch = text.match(/([一二三四\d]+)[週星期]/);
  if (weekMatch) {
    return chineseNumberToInt(weekMatch[1]) * 7;
  }

  // 格式 5: 單純數字（在特定上下文）
  if (text.includes('待') || text.includes('住') || text.includes('停留')) {
    const numMatch = text.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      // 合理的天數範圍 (1-30)
      if (num >= 1 && num <= 30) {
        return num;
      }
    }
  }

  return null;
}

/**
 * 計算結束日期
 */
export function calculateEndDate(startDate: Date, duration: number): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration);
  return endDate;
}
