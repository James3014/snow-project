/**
 * 意圖解析器
 * 整合所有解析器，理解用戶完整意圖
 */

import { extractDates } from './dateParser';
import { extractDuration, calculateEndDate } from './durationParser';
import { matchResortV2 as matchResort, getSuggestionsV2 as getSuggestions, type ResortMatch } from './resortMatcher';
import { MatchConfidence } from './resort-config';

/**
 * 用戶意圖類型
 */
export type IntentAction =
  | 'CREATE_TRIP'    // 建立行程
  | 'VIEW_TRIPS'     // 查看行程
  | 'DELETE_TRIP'    // 刪除行程
  | 'CHAT'           // 閒聊
  | 'UNKNOWN';       // 無法識別

/**
 * 解析後的意圖
 */
export interface ParsedIntent {
  action: IntentAction;
  confidence: number;  // 0-1，整體信心度

  // 行程相關資訊
  resort?: ResortMatch;
  startDate?: Date;
  endDate?: Date;
  duration?: number;

  // 元數據
  rawInput: string;
  missingFields: string[];  // 缺少的必要欄位
  suggestions?: ResortMatch[];  // 如果雪場匹配不確定，提供建議
}

/**
 * 動作關鍵詞映射
 */
const ACTION_KEYWORDS = {
  CREATE_TRIP: [
    '建立', '建立行程', '新增', '新增行程', '創建', '創建行程',
    '規劃', '規劃行程', '計劃', '安排', '去', '想去',
  ],
  VIEW_TRIPS: [
    '查看', '查看行程', '我的行程', '行程列表', '看看',
    '顯示行程', '有什麼行程', '都有什麼',
  ],
  DELETE_TRIP: [
    '刪除', '刪除行程', '移除', '移除行程', '取消', '取消行程',
    '不去', '不去了', '刪掉',
  ],
  CHAT: [
    '你好', '嗨', 'hi', 'hello', '哈囉', '安安',
    '謝謝', '感謝', 'thanks', '幫助', 'help',
  ],
};

/**
 * 檢測動作意圖
 */
function detectAction(input: string): { action: IntentAction; confidence: number } {
  const normalized = input.toLowerCase().trim();

  // 檢查刪除行程（優先級最高，因為「不去」等詞可能與其他動作衝突）
  for (const keyword of ACTION_KEYWORDS.DELETE_TRIP) {
    if (normalized.includes(keyword.toLowerCase())) {
      return { action: 'DELETE_TRIP', confidence: 1.0 };
    }
  }

  // 檢查查看行程（優先級高於建立行程，因為關鍵詞更明確）
  for (const keyword of ACTION_KEYWORDS.VIEW_TRIPS) {
    if (normalized.includes(keyword.toLowerCase())) {
      return { action: 'VIEW_TRIPS', confidence: 1.0 };
    }
  }

  // 檢查建立行程
  for (const keyword of ACTION_KEYWORDS.CREATE_TRIP) {
    if (normalized.includes(keyword.toLowerCase())) {
      return { action: 'CREATE_TRIP', confidence: 1.0 };
    }
  }

  // 檢查閒聊
  for (const keyword of ACTION_KEYWORDS.CHAT) {
    if (normalized.includes(keyword.toLowerCase())) {
      return { action: 'CHAT', confidence: 0.9 };
    }
  }

  // 如果包含雪場名稱但沒有明確動作，推測為建立行程
  // 這個邏輯會在後面的完整解析中處理

  return { action: 'UNKNOWN', confidence: 0.0 };
}

/**
 * 主要解析函數
 */
export async function parseIntent(input: string): Promise<ParsedIntent> {
  const rawInput = input.trim();

  if (!rawInput) {
    return {
      action: 'UNKNOWN',
      confidence: 0.0,
      rawInput,
      missingFields: [],
    };
  }

  // 1. 檢測動作
  const { action, confidence: actionConfidence } = detectAction(rawInput);

  // 2. 如果是閒聊，直接返回
  if (action === 'CHAT') {
    return {
      action: 'CHAT',
      confidence: actionConfidence,
      rawInput,
      missingFields: [],
    };
  }

  // 3. 如果是查看行程，直接返回
  if (action === 'VIEW_TRIPS') {
    return {
      action: 'VIEW_TRIPS',
      confidence: actionConfidence,
      rawInput,
      missingFields: [],
    };
  }

  // 4. 如果是刪除行程，解析刪除相關資訊
  if (action === 'DELETE_TRIP') {
    return await parseDeleteTripIntent(rawInput, actionConfidence);
  }

  // 5. 解析建立行程的相關資訊
  return await parseCreateTripIntent(rawInput, action, actionConfidence);
}

/**
 * 解析建立行程意圖
 */
async function parseCreateTripIntent(
  input: string,
  detectedAction: IntentAction,
  actionConfidence: number
): Promise<ParsedIntent> {
  const missingFields: string[] = [];
  let totalConfidence = 0;
  let confidenceCount = 0;

  // 1. 雪場匹配
  const resortMatch = await matchResort(input);
  let resortConfidence = 0;
  let suggestions: ResortMatch[] | undefined;

  if (resortMatch) {
    resortConfidence = resortMatch.confidence;

    // 使用 MatchConfidence 枚舉判斷：
    // - EXACT (1.0) / HIGH (0.8): 信心度夠高，直接使用
    // - LOW (0.5): 信心度低（如雪場群、拼音歧義），需要用戶選擇確認
    if (resortConfidence < MatchConfidence.HIGH) {
      suggestions = await getSuggestions(input, 3);
      missingFields.push('resort');  // 標記為缺失，強制用戶選擇
      // 不計入 totalConfidence，因為需要用戶確認
    } else {
      // 信心度高（EXACT 或 HIGH），直接使用匹配結果
      totalConfidence += resortConfidence;
      confidenceCount++;
    }
  } else {
    missingFields.push('resort');
    // 嘗試獲取建議
    suggestions = await getSuggestions(input, 3);
  }

  // 2. 日期解析
  const dates = extractDates(input);
  let startDate = dates.startDate;
  let endDate = dates.endDate;
  let duration: number | undefined;

  if (startDate) {
    totalConfidence += 1.0;
    confidenceCount++;
  } else {
    missingFields.push('startDate');
  }

  // 3. 天數提取
  const extractedDuration = extractDuration(input);
  if (extractedDuration) {
    duration = extractedDuration;
    totalConfidence += 1.0;
    confidenceCount++;

    // 如果有開始日期和天數，計算結束日期
    if (startDate && !endDate) {
      endDate = calculateEndDate(startDate, duration);
    }
  }

  // 如果有結束日期但沒有天數，計算天數
  if (startDate && endDate && !duration) {
    const diffTime = endDate.getTime() - startDate.getTime();
    duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 4. 決定最終動作
  let finalAction = detectedAction;
  let finalActionConfidence = actionConfidence;

  // 如果沒有明確動作但有雪場資訊，推測為建立行程
  if (detectedAction === 'UNKNOWN' && resortMatch) {
    finalAction = 'CREATE_TRIP';
    finalActionConfidence = 0.7;  // 推測的信心度較低
  }

  // 5. 計算整體信心度
  if (confidenceCount > 0) {
    totalConfidence = totalConfidence / confidenceCount;
  }

  // 包含動作信心度
  if (finalActionConfidence > 0) {
    totalConfidence = (totalConfidence + finalActionConfidence) / 2;
  }

  return {
    action: finalAction,
    confidence: Math.max(0, Math.min(1, totalConfidence)),
    // 如果 missingFields 包含 'resort'，不返回 resort（即使有低信心度匹配）
    // 這樣 conversationEngine 才會正確處理需要用戶選擇的情況
    resort: missingFields.includes('resort') ? undefined : (resortMatch || undefined),
    startDate,
    endDate,
    duration,
    rawInput: input,
    missingFields,
    suggestions,
  };
}

/**
 * 解析刪除行程意圖
 */
async function parseDeleteTripIntent(
  input: string,
  actionConfidence: number
): Promise<ParsedIntent> {
  const missingFields: string[] = [];

  // 嘗試識別要刪除的行程
  // 可能的方式：
  // 1. 包含雪場名稱："刪除苗場行程"
  // 2. 包含編號："刪除第1個行程"
  // 3. 包含日期："刪除2月的行程"

  // 1. 嘗試匹配雪場
  const resortMatch = await matchResort(input);

  // 2. 提取日期資訊
  const dates = extractDates(input);

  // 3. 檢測是否有編號（第1個、第2個等）
  const numberPattern = /第?(\d+)個?|(\d+)號/;
  const numberMatch = input.match(numberPattern);
  const tripNumber = numberMatch ? parseInt(numberMatch[1] || numberMatch[2]) : undefined;

  // 如果沒有任何識別資訊，需要用戶指定
  if (!resortMatch && !dates.startDate && !tripNumber) {
    missingFields.push('trip_identifier');
  }

  return {
    action: 'DELETE_TRIP',
    confidence: actionConfidence,
    resort: resortMatch || undefined,
    startDate: dates.startDate,
    endDate: dates.endDate,
    rawInput: input,
    missingFields,
    // 將 tripNumber 存儲在 duration 欄位（複用現有結構）
    duration: tripNumber,
  };
}

/**
 * 批量解析（用於處理多個輸入）
 */
export async function parseIntents(inputs: string[]): Promise<ParsedIntent[]> {
  const results: ParsedIntent[] = [];

  for (const input of inputs) {
    const intent = await parseIntent(input);
    results.push(intent);
  }

  return results;
}

/**
 * 驗證意圖是否完整（用於建立行程）
 */
export function isIntentComplete(intent: ParsedIntent): boolean {
  if (intent.action !== 'CREATE_TRIP') {
    return true;  // 非建立行程的意圖不需要驗證
  }

  // 建立行程需要：雪場、開始日期
  return (
    intent.resort !== undefined &&
    intent.startDate !== undefined &&
    (intent.endDate !== undefined || intent.duration !== undefined)
  );
}

/**
 * 生成缺少欄位的提示訊息
 */
export function getMissingFieldsPrompt(intent: ParsedIntent): string {
  if (intent.missingFields.length === 0) {
    return '';
  }

  const fieldNames: Record<string, string> = {
    resort: '雪場',
    startDate: '出發日期',
    duration: '停留天數',
  };

  const missing = intent.missingFields.map(f => fieldNames[f] || f);

  if (missing.length === 1) {
    return `請告訴我${missing[0]}～`;
  } else if (missing.length === 2) {
    return `還需要${missing[0]}和${missing[1]}喔～`;
  } else {
    return `還需要${missing.slice(0, -1).join('、')}和${missing[missing.length - 1]}喔～`;
  }
}

/**
 * 格式化意圖摘要（用於確認）
 */
export function formatIntentSummary(intent: ParsedIntent): string {
  if (intent.action === 'VIEW_TRIPS') {
    return '查看你的行程列表';
  }

  if (intent.action === 'CHAT') {
    return '閒聊';
  }

  if (intent.action !== 'CREATE_TRIP') {
    return '未知動作';
  }

  const parts: string[] = [];

  if (intent.resort) {
    parts.push(`前往 ${intent.resort.resort.names.zh}`);
  }

  if (intent.startDate) {
    const dateStr = intent.startDate.toLocaleDateString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
    });
    parts.push(`${dateStr} 出發`);
  }

  if (intent.duration) {
    parts.push(`停留 ${intent.duration} 天`);
  } else if (intent.endDate && intent.startDate) {
    const diffTime = intent.endDate.getTime() - intent.startDate.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    parts.push(`停留 ${days} 天`);
  }

  return parts.join('，');
}
