/**
 * 對話引擎工具函數
 */
import type { ParsedIntent } from '../intentParser';
import type { ResortMatch } from '../resortMatcher';
import type { ConversationContext, TripData } from './types';
import {
  RESORT_LIST_KEYWORDS,
  CONFIRM_KEYWORDS,
  CANCEL_KEYWORDS,
} from './constants';

/**
 * 格式化日期為中文簡短格式
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * 構建行程標識符
 */
export function buildTripIdentifier(intent: ParsedIntent): string {
  if (intent.duration) return `第 ${intent.duration} 個行程`;
  if (intent.resort) return `${intent.resort.resort.names.zh} 的行程`;
  if (intent.startDate) return `${formatDate(intent.startDate)} 的行程`;
  return '該行程';
}

/**
 * 檢測用戶是否在詢問雪場列表
 */
export function isAskingForResortList(input: string): boolean {
  const normalized = input.toLowerCase();
  return RESORT_LIST_KEYWORDS.some(keyword =>
    normalized.includes(keyword.toLowerCase())
  );
}

/**
 * 檢查用戶確認意圖
 */
export function checkUserConfirmation(input: string): 'confirm' | 'cancel' | 'unclear' {
  const normalized = input.toLowerCase().trim();

  const isConfirm = CONFIRM_KEYWORDS.some(k =>
    k.length === 1 ? normalized === k : normalized.includes(k)
  );
  const isCancel = CANCEL_KEYWORDS.some(k =>
    k.length === 1 ? normalized === k : normalized.includes(k)
  );

  if (isConfirm) return 'confirm';
  if (isCancel) return 'cancel';
  return 'unclear';
}

/**
 * 檢測雪場是否改變
 */
export function detectResortChange(
  intent: ParsedIntent,
  currentResort: ResortMatch | undefined
): boolean {
  if (!intent.resort || !currentResort) return false;
  return intent.resort.resort.resort_id !== currentResort.resort.resort_id;
}

/**
 * 更新行程數據
 */
export function updateTripData(
  context: ConversationContext,
  intent: ParsedIntent
): ConversationContext {
  return {
    ...context,
    tripData: {
      resort: intent.resort || context.tripData.resort,
      startDate: intent.startDate || context.tripData.startDate,
      endDate: intent.endDate || context.tripData.endDate,
      duration: intent.duration || context.tripData.duration,
      visibility: intent.visibility || context.tripData.visibility,
      maxBuddies: intent.maxBuddies || context.tripData.maxBuddies,
    },
  };
}

/**
 * 檢查行程數據是否完整
 */
export function isTripDataComplete(tripData: TripData): boolean {
  return !!(
    tripData.resort &&
    tripData.startDate &&
    (tripData.endDate || tripData.duration)
  );
}

/**
 * 建立初始上下文
 */
export function createInitialContext(): ConversationContext {
  return {
    state: 'MAIN_MENU',
    tripData: {},
    conversationHistory: [],
  };
}
