/**
 * 日期解析器
 * 支援絕對日期和相對日期的解析
 */

export interface ParsedDate {
  date: Date;
  confidence: number;  // 0-1
}

/**
 * 根據月份判斷雪季年份
 * 11-12月用當年，1-4月判斷是當年還是明年
 */
function getSeasonYear(month: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 11-12月：當年
  if (month >= 11) {
    return currentYear;
  }
  // 1-4月：如果現在是11-12月，則是明年；否則是當年
  else if (month <= 4) {
    return currentMonth >= 11 ? currentYear + 1 : currentYear;
  }
  // 5-10月：可能是室內或南半球，用當年
  else {
    return currentYear;
  }
}

/**
 * 解析絕對日期
 */
function parseAbsoluteDate(input: string): ParsedDate | null {
  // 格式 1: 完整日期 2024-12-15, 2024/12/15
  const fullDatePattern = /(\d{4})[/-年](\d{1,2})[/-月](\d{1,2})[日號]?/;
  const fullMatch = input.match(fullDatePattern);

  if (fullMatch) {
    const year = parseInt(fullMatch[1]);
    const month = parseInt(fullMatch[2]);
    const day = parseInt(fullMatch[3]);
    return {
      date: new Date(year, month - 1, day),
      confidence: 1.0,
    };
  }

  // 格式 2: 月日 12/15, 12-15, 12月15日
  const monthDayPattern = /(\d{1,2})[/-月](\d{1,2})[日號]?/;
  const monthDayMatch = input.match(monthDayPattern);

  if (monthDayMatch) {
    const month = parseInt(monthDayMatch[1]);
    const day = parseInt(monthDayMatch[2]);
    const year = getSeasonYear(month);

    return {
      date: new Date(year, month - 1, day),
      confidence: 0.9,
    };
  }

  return null;
}

/**
 * 獲取下一個指定星期幾的日期
 */
function getNextWeekday(targetDay: number, weeksFromNow: number = 0): Date {
  const now = new Date();
  const currentDay = now.getDay();

  let daysToAdd = targetDay - currentDay;

  // 如果目標日已過或是今天，加7天到下週
  if (daysToAdd <= 0 && weeksFromNow === 0) {
    daysToAdd += 7;
  }

  // 加上指定的週數
  daysToAdd += weeksFromNow * 7;

  const result = new Date(now);
  result.setDate(result.getDate() + daysToAdd);
  result.setHours(0, 0, 0, 0);

  return result;
}

/**
 * 解析相對日期
 */
function parseRelativeDate(input: string): ParsedDate | null {
  const now = new Date();
  const normalized = input.toLowerCase();

  // 今天
  if (normalized.includes('今天') || normalized.includes('今日')) {
    return { date: now, confidence: 1.0 };
  }

  // 明天
  if (normalized.includes('明天') || normalized.includes('明日')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { date: tomorrow, confidence: 1.0 };
  }

  // 後天
  if (normalized.includes('後天')) {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return { date: dayAfter, confidence: 1.0 };
  }

  // 大後天
  if (normalized.includes('大後天')) {
    const dayAfter3 = new Date(now);
    dayAfter3.setDate(dayAfter3.getDate() + 3);
    return { date: dayAfter3, confidence: 1.0 };
  }

  // 星期幾
  const weekdayMap: Record<string, number> = {
    '一': 1,
    '二': 2,
    '三': 3,
    '四': 4,
    '五': 5,
    '六': 6,
    '日': 0,
    '天': 0,
  };

  for (const [char, targetDay] of Object.entries(weekdayMap)) {
    // 下週X
    if (normalized.includes('下週') && normalized.includes(char)) {
      return { date: getNextWeekday(targetDay, 1), confidence: 1.0 };
    }

    // 這週X、本週X
    if (
      (normalized.includes('這週') || normalized.includes('本週')) &&
      normalized.includes(char)
    ) {
      return { date: getNextWeekday(targetDay, 0), confidence: 0.9 };
    }

    // 週X、星期X（預設找下一個）
    if (
      (normalized.includes('週' + char) || normalized.includes('星期' + char)) &&
      !normalized.includes('上週')
    ) {
      return { date: getNextWeekday(targetDay, 0), confidence: 0.8 };
    }
  }

  // X天後
  const daysAfterMatch = normalized.match(/(\d+)[天日]後/);
  if (daysAfterMatch) {
    const days = parseInt(daysAfterMatch[1]);
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    return { date: future, confidence: 1.0 };
  }

  // X週後
  const weeksAfterMatch = normalized.match(/(\d+)週後/);
  if (weeksAfterMatch) {
    const weeks = parseInt(weeksAfterMatch[1]);
    const future = new Date(now);
    future.setDate(future.getDate() + weeks * 7);
    return { date: future, confidence: 1.0 };
  }

  // 下個月
  if (normalized.includes('下個月') || normalized.includes('下月')) {
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return { date: nextMonth, confidence: 0.7 };
  }

  return null;
}

/**
 * 主要解析函數
 */
export function parseDate(input: string): ParsedDate | null {
  // 先嘗試絕對日期
  const absoluteDate = parseAbsoluteDate(input);
  if (absoluteDate) return absoluteDate;

  // 再嘗試相對日期
  const relativeDate = parseRelativeDate(input);
  if (relativeDate) return relativeDate;

  return null;
}

/**
 * 從文本中提取所有日期
 */
export function extractDates(input: string): {
  startDate?: Date;
  endDate?: Date;
} {
  const result: { startDate?: Date; endDate?: Date } = {};

  // 增強版日期範圍格式匹配 - 支持更多格式
  const rangePatterns = [
    // 格式 0: 跨月格式 12-30到1月2號、12/30到1月2日 (最優先，處理跨年情況)
    {
      regex: /(\d{1,2})[/-](\d{1,2})[日號]?[\s]*[到至~－─|\-]\s*(\d{1,2})月(\d{1,2})[日號]?/,
      extract: (m: RegExpMatchArray) => {
        const startMonth = parseInt(m[1]);
        const startDay = parseInt(m[2]);
        const endMonth = parseInt(m[3]);
        const endDay = parseInt(m[4]);

        const startYear = getSeasonYear(startMonth);
        const endYear = getSeasonYear(endMonth);

        return {
          startMonth,
          startDay,
          startYear,
          endMonth,
          endDay,
          endYear,
          crossMonth: true
        };
      }
    },
    // 格式 1: 12月11到20日、12月11至20日、12月11~20日 (最常見)
    {
      regex: /(\d{1,2})月(\d{1,2})[日號]?[\s]*[到至~－─|\-]\s*(\d{1,2})[日號]?/,
      extract: (m: RegExpMatchArray) => ({
        month: parseInt(m[1]),
        startDay: parseInt(m[2]),
        endDay: parseInt(m[3])
      })
    },
    // 格式 2: 12/11-20、12/11到20
    {
      regex: /(\d{1,2})[/](\d{1,2})[\s]*[到至~－─|\-]\s*(\d{1,2})[日號]?/,
      extract: (m: RegExpMatchArray) => ({
        month: parseInt(m[1]),
        startDay: parseInt(m[2]),
        endDay: parseInt(m[3])
      })
    },
    // 格式 3: 12-22到26、12-22至26 (新增！用戶實際使用的格式)
    {
      regex: /(\d{1,2})-(\d{1,2})[\s]*[到至]\s*(\d{1,2})[日號]?/,
      extract: (m: RegExpMatchArray) => ({
        month: parseInt(m[1]),
        startDay: parseInt(m[2]),
        endDay: parseInt(m[3])
      })
    },
    // 格式 4: 11號到20號 (需要從上下文推斷月份)
    {
      regex: /(\d{1,2})[號日][\s]*[到至~－─|\-]\s*(\d{1,2})[號日]/,
      extract: (m: RegExpMatchArray, fullInput: string) => {
        const monthMatch = fullInput.match(/(\d{1,2})月/);
        const month = monthMatch ? parseInt(monthMatch[1]) : new Date().getMonth() + 1;
        return {
          month,
          startDay: parseInt(m[1]),
          endDay: parseInt(m[2])
        };
      }
    },
  ];

  for (const { regex, extract } of rangePatterns) {
    const match = input.match(regex);
    if (match) {
      const extracted = extract(match, input);

      // 處理跨月格式
      if ('crossMonth' in extracted && extracted.crossMonth) {
        result.startDate = new Date(extracted.startYear, extracted.startMonth - 1, extracted.startDay);
        result.endDate = new Date(extracted.endYear, extracted.endMonth - 1, extracted.endDay);
        return result;
      }

      // 處理同月格式
      if ('month' in extracted) {
        const { month, startDay, endDay } = extracted;
        const year = getSeasonYear(month);

        result.startDate = new Date(year, month - 1, startDay);
        result.endDate = new Date(year, month - 1, endDay);
        return result;
      }
    }
  }

  // 先嘗試找兩個絕對日期
  const fullDatePattern = /(\d{4}[/-年]\d{1,2}[/-月]\d{1,2}[日號]?|\d{1,2}[/-月]\d{1,2}[日號]?)/g;
  const matches = [...input.matchAll(fullDatePattern)];

  if (matches.length >= 1) {
    const first = parseDate(matches[0][0]);
    if (first) result.startDate = first.date;
  }

  if (matches.length >= 2) {
    const second = parseDate(matches[1][0]);
    if (second) result.endDate = second.date;
  }

  // 如果沒有找到絕對日期，嘗試相對日期
  if (!result.startDate) {
    const parsed = parseDate(input);
    if (parsed) result.startDate = parsed.date;
  }

  return result;
}
