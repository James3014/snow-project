# 日期、時區與多語言處理策略

## 問題定義

### 核心挑戰
1. **時區問題**：用戶在台灣說「明天」，對應到日本雪場的哪一天？
2. **跨年判斷**：12月28日說「1月5日」，是今年還是明年？
3. **多語言混用**：「我想去 Niseko 3月20日 4泊5日」
4. **格式多樣**：「3/20」「3月20日」「3-20」「三月二十號」

---

## 策略 1: 時區處理

### 原則
> **以雪場所在地時區為準，用戶時區僅用於「今天」「明天」的相對計算**

### 實現方案

#### 選項 A: 簡化版（推薦用於 MVP）
```typescript
// 1. 統一使用 UTC+9 (日本時區)
// 2. 用戶說「明天」時，轉換為日本時間的明天

function parseRelativeDate(input: string, userTimezone: string): Date {
  // 獲取用戶當地的「現在」
  const userNow = new Date(); // 用戶本地時間

  // 轉換為日本時間
  const japanNow = convertToJapanTime(userNow);

  if (input.includes('明天') || input.includes('tomorrow')) {
    // 日本時間的明天
    return addDays(japanNow, 1);
  }

  if (input.includes('後天')) {
    return addDays(japanNow, 2);
  }

  // ... 其他相對日期
}

function convertToJapanTime(date: Date): Date {
  // 使用 date-fns-tz 或 luxon
  return utcToZonedTime(date, 'Asia/Tokyo');
}
```

#### 選項 B: 完整版（未來考慮）
```typescript
interface DateContext {
  userTimezone: string;        // 'Asia/Taipei'
  targetTimezone: string;      // 'Asia/Tokyo' (雪場所在地)
  userLocalTime: Date;
  targetLocalTime: Date;
}

function parseDate(input: string, context: DateContext): Date {
  // 1. 解析用戶輸入的日期
  const parsedDate = parseUserInput(input);

  // 2. 判斷是絕對日期還是相對日期
  if (isRelativeDate(input)) {
    // 基於用戶本地時間計算
    // 但返回值是雪場時區的日期
    return calculateRelativeDate(input, context);
  } else {
    // 絕對日期直接使用目標時區
    return convertToTargetTimezone(parsedDate, context.targetTimezone);
  }
}
```

### MVP 決策
- ✅ 使用選項 A（簡化版）
- ✅ 假設所有雪場都在日本（UTC+9）
- ✅ 明確告知用戶「所有日期以日本時間為準」
- ⏸️ 選項 B 等支持其他國家雪場時再實現

---

## 策略 2: 跨年判斷

### 問題場景
```
當前：2024年12月28日
用戶："1月5日去苗場"
問題：2024年1月5日（已過）還是 2025年1月5日？
```

### 判斷規則

#### 規則 1: 滑雪季節規則（推薦）
```typescript
function resolveYearForSkiSeason(month: number, day: number, currentDate: Date): number {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JS month is 0-indexed

  // 滑雪季：11月 - 4月
  const SKI_SEASON_MONTHS = [11, 12, 1, 2, 3, 4];

  if (!SKI_SEASON_MONTHS.includes(month)) {
    // 不在滑雪季，警告但允許
    console.warn(`${month}月通常不是滑雪季`);
  }

  // 跨年邏輯
  if (currentMonth >= 11 && month <= 4) {
    // 現在是 11-12月，輸入 1-4月 → 明年
    return currentYear + 1;
  } else if (currentMonth <= 4 && month <= 4) {
    // 現在是 1-4月，輸入 1-4月 → 今年
    return currentYear;
  } else if (currentMonth <= 4 && month >= 11) {
    // 現在是 1-4月，輸入 11-12月 → 去年（不合理，警告）
    console.warn('日期似乎在過去');
    return currentYear - 1;
  } else {
    // 現在是 5-10月，輸入任何月份 → 今年或明年
    const targetDate = new Date(currentYear, month - 1, day);
    if (targetDate < currentDate) {
      return currentYear + 1; // 日期已過，視為明年
    }
    return currentYear;
  }
}
```

#### 規則 2: 簡單向前原則
```typescript
function resolveYear(month: number, day: number, currentDate: Date): number {
  const currentYear = currentDate.getFullYear();

  // 建立今年的目標日期
  const thisYearDate = new Date(currentYear, month - 1, day);

  // 如果今年的日期已經過了，就用明年
  if (thisYearDate < currentDate) {
    return currentYear + 1;
  }

  return currentYear;
}
```

### MVP 決策
- ✅ 使用規則 2（簡單向前原則）
- ✅ 如果日期在過去 **7 天內**，詢問用戶：「您說的是今年的 X月X日（已過）還是明年的？」
- ✅ 如果日期在過去 **7 天以上**，自動視為明年

---

## 策略 3: 多語言混用

### 支持的格式

#### 中文
- ✅ "3月20日"
- ✅ "三月二十號"
- ✅ "3/20"
- ✅ "明天"、"後天"、"下週一"

#### 英文
- ✅ "March 20"
- ✅ "3/20"
- ✅ "tomorrow", "next Monday"

#### 日文
- ✅ "3月20日"
- ✅ "3-20"
- ✅ "4泊5日" → duration = 5
- ✅ "明日"、"来週"

#### 混用
- ✅ "我想去 Niseko 3月20日"
- ✅ "Hakuba tomorrow 5 days"

### 實現方案

```typescript
import chrono from 'chrono-node';

function parseDate(input: string, context: ParseContext): DateParseResult {
  // 1. 使用 chrono-node 做基礎解析（支持多語言）
  const chronoResult = chrono.parse(input, context.referenceDate);

  if (chronoResult.length > 0) {
    const parsedDate = chronoResult[0].start.date();

    // 2. 檢查年份是否需要調整
    const adjustedYear = resolveYear(
      parsedDate.getMonth() + 1,
      parsedDate.getDate(),
      context.referenceDate
    );

    parsedDate.setFullYear(adjustedYear);

    return {
      success: true,
      date: parsedDate,
      confidence: chronoResult[0].confidence || 0.8,
    };
  }

  // 3. 如果 chrono 失敗，嘗試自定義解析器
  return customDateParser(input, context);
}

function customDateParser(input: string, context: ParseContext): DateParseResult {
  // 處理特殊格式，如「4泊5日」
  const japaneseStayPattern = /(\d+)泊(\d+)日/;
  const match = input.match(japaneseStayPattern);

  if (match) {
    const nights = parseInt(match[1]);
    const days = parseInt(match[2]);

    return {
      success: true,
      duration: days,
      nights: nights,
    };
  }

  return { success: false };
}
```

### MVP 決策
- ✅ 使用 chrono-node 做基礎解析
- ✅ 優先支持中文和英文
- ✅ 日文格式作為加分項（如「4泊5日」）
- ⏸️ 完整的多語言 NLP 等有需求再加

---

## 策略 4: 格式多樣性

### 日期格式

#### 支持的輸入格式
```typescript
const SUPPORTED_DATE_FORMATS = [
  // 數字格式
  '3/20',         // MM/DD
  '3-20',         // MM-DD
  '2024/3/20',    // YYYY/MM/DD
  '2024-03-20',   // ISO format

  // 中文格式
  '3月20日',
  '三月二十號',
  '3月20號',

  // 英文格式
  'March 20',
  'Mar 20',
  '20 March',

  // 日文格式
  '3月20日',

  // 相對日期
  '明天', 'tomorrow', '明日',
  '後天', 'day after tomorrow',
  '下週一', 'next Monday', '来週月曜日',
];
```

### 天數格式

#### 支持的輸入格式
```typescript
const SUPPORTED_DURATION_FORMATS = [
  // 數字 + 單位
  '5天', '5 days', '5日',
  '一週', '1 week', '1週間',

  // 日文特殊格式
  '4泊5日',  // 4 nights 5 days
  '2泊3日',  // 2 nights 3 days

  // 口語表達
  '三天兩夜',
  '兩天一夜',
];
```

### 實現範例

```typescript
function parseDuration(input: string): number | null {
  // 1. 標準格式：數字 + 天/days/日
  const standardPattern = /(\d+)\s*(天|days?|日)/i;
  const standardMatch = input.match(standardPattern);
  if (standardMatch) {
    return parseInt(standardMatch[1]);
  }

  // 2. 週：數字 + 週/week
  const weekPattern = /(\d+|一|兩|二)\s*(週|week|週間)/i;
  const weekMatch = input.match(weekPattern);
  if (weekMatch) {
    const weeks = chineseNumberToInt(weekMatch[1]);
    return weeks * 7;
  }

  // 3. 日文格式：X泊Y日
  const japanesePattern = /(\d+)泊(\d+)日/;
  const japaneseMatch = input.match(japanesePattern);
  if (japaneseMatch) {
    return parseInt(japaneseMatch[2]); // 取「日」的數字
  }

  // 4. 中文口語：X天Y夜
  const chinesePattern = /(一|二|三|四|五|六|七|\d+)天(一|二|三|四|五|六|七|\d+)?夜/;
  const chineseMatch = input.match(chinesePattern);
  if (chineseMatch) {
    return chineseNumberToInt(chineseMatch[1]);
  }

  return null;
}
```

---

## 測試策略

### 單元測試
```typescript
describe('Date Parsing', () => {
  it('應該正確解析各種日期格式', () => {
    const testCases = [
      { input: '3/20', expected: { month: 3, day: 20 } },
      { input: '3月20日', expected: { month: 3, day: 20 } },
      { input: 'March 20', expected: { month: 3, day: 20 } },
      { input: '明天', expected: { relative: 1 } },
    ];

    testCases.forEach(({ input, expected }) => {
      const result = parseDate(input, context);
      expect(result).toMatchObject(expected);
    });
  });

  it('應該正確處理跨年情況', () => {
    const context = { currentDate: new Date('2024-12-28') };
    const result = parseDate('1月5日', context);
    expect(result.date.getFullYear()).toBe(2025);
  });
});

describe('Duration Parsing', () => {
  it('應該正確解析各種天數格式', () => {
    expect(parseDuration('5天')).toBe(5);
    expect(parseDuration('5 days')).toBe(5);
    expect(parseDuration('一週')).toBe(7);
    expect(parseDuration('4泊5日')).toBe(5);
    expect(parseDuration('三天兩夜')).toBe(3);
  });
});
```

---

## 錯誤處理與降級策略

### 場景 1: 無法解析日期
```typescript
if (!parseResult.success) {
  return {
    response: {
      message: `抱歉，我沒能理解「${input}」這個日期。

      你可以試試：
      • 3/20
      • 3月20日
      • 明天
      • 下週一`,
      nextState: 'AWAITING_DATE',
    },
  };
}
```

### 場景 2: 日期在過去
```typescript
if (parsedDate < currentDate) {
  // 如果在 7 天內，詢問用戶
  const daysDiff = differenceInDays(currentDate, parsedDate);

  if (daysDiff <= 7) {
    return {
      response: {
        message: `${formatDate(parsedDate)} 已經過了。
        您是說明年的 ${month}月${day}日嗎？`,
        buttonOptions: [
          { label: '是，明年', action: 'CONFIRM_NEXT_YEAR' },
          { label: '重新輸入', action: 'RETRY_DATE' },
        ],
      },
    };
  } else {
    // 超過 7 天，自動視為明年
    parsedDate.setFullYear(parsedDate.getFullYear() + 1);
  }
}
```

### 場景 3: 格式模糊
```typescript
if (parseResult.confidence < 0.7) {
  return {
    response: {
      message: `我理解的是 ${formatDate(parseResult.date)}，對嗎？`,
      buttonOptions: [
        { label: '✅ 對', action: 'CONFIRM' },
        { label: '❌ 重新輸入', action: 'RETRY' },
      ],
    },
  };
}
```

---

## 實現優先級

### P0 - MVP 必須 (階段 6)
- ✅ 基礎日期解析（3/20, 3月20日, 明天）
- ✅ 簡單跨年判斷（向前原則）
- ✅ 基礎天數解析（5天, 一週）
- ✅ 日期在過去的拒絕

### P1 - 下一版 (階段 7)
- [ ] 完整時區處理
- [ ] 日文格式支持（4泊5日）
- [ ] 模糊日期的二次確認
- [ ] 滑雪季節規則

### P2 - 未來考慮 (階段 8+)
- [ ] 多時區雪場支持
- [ ] 完整多語言 NLP
- [ ] 語音輸入適配
- [ ] 智能糾錯（"3-210" → "3-20"）

---

## 使用的第三方庫

### chrono-node
```bash
npm install chrono-node
npm install -D @types/chrono-node
```

**優點**：
- ✅ 支持多語言
- ✅ 支持相對日期
- ✅ 社群活躍

**缺點**：
- ⚠️ Bundle size 較大（~200KB）
- ⚠️ 中文支持一般（需要補充）

### date-fns
```bash
npm install date-fns
npm install date-fns-tz  # 時區支持
```

**優點**：
- ✅ Tree-shakable（只打包用到的）
- ✅ 類型安全
- ✅ 文檔完整

### luxon (備選)
```bash
npm install luxon
npm install -D @types/luxon
```

**優點**：
- ✅ 更好的時區支持
- ✅ 更清晰的 API

**缺點**：
- ⚠️ Bundle size 較大

---

## 配置與文檔

### 使用者說明
在 UI 中明確告知：
```
📅 日期輸入提示：
• 支持格式：3/20、3月20日、明天、下週一
• 所有日期以日本時間為準
• 系統會自動判斷年份（如果日期已過，視為明年）
```

### 開發者文檔
```typescript
/**
 * 日期解析規則
 *
 * 1. 時區：統一使用 UTC+9 (日本時間)
 * 2. 跨年：如果日期已過，自動視為明年
 * 3. 格式：支持 中/英/日 多種格式
 * 4. 降級：無法解析時提供範例
 */
```

---

**最後更新**: 2025-11-16
**狀態**: 策略定義完成，等待實現
