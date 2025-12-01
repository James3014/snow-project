/**
 * 對話引擎工具函數
 */

import type { ParsedIntent } from '../intentParser';
import type { ResortMatch } from '../resortMatcher';
import type { ConversationContext, TripData } from './types';
import { RESORT_LIST_KEYWORDS, CONFIRM_KEYWORDS, CANCEL_KEYWORDS } from './constants';

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
}

export function buildTripIdentifier(intent: ParsedIntent): string {
  if (intent.duration) return `第 ${intent.duration} 個行程`;
  if (intent.resort) return `${intent.resort.resort.names.zh} 的行程`;
  if (intent.startDate) return `${formatDate(intent.startDate)} 的行程`;
  return '該行程';
}

export function isAskingForResortList(input: string): boolean {
  const normalized = input.toLowerCase();
  return RESORT_LIST_KEYWORDS.some(k => normalized.includes(k.toLowerCase()));
}

export function checkUserConfirmation(input: string): 'confirm' | 'cancel' | 'unclear' {
  const normalized = input.toLowerCase().trim();
  const isConfirm = CONFIRM_KEYWORDS.some(k => k.length === 1 ? normalized === k : normalized.includes(k));
  const isCancel = CANCEL_KEYWORDS.some(k => k.length === 1 ? normalized === k : normalized.includes(k));
  if (isConfirm) return 'confirm';
  if (isCancel) return 'cancel';
  return 'unclear';
}

export function detectResortChange(intent: ParsedIntent, currentResort: ResortMatch | undefined): boolean {
  if (!intent.resort || !currentResort) return false;
  return intent.resort.resort.resort_id !== currentResort.resort.resort_id;
}

export function updateTripData(context: ConversationContext, intent: ParsedIntent): ConversationContext {
  return {
    ...context,
    tripData: {
      resort: intent.resort || context.tripData.resort,
      startDate: intent.startDate || context.tripData.startDate,
      endDate: intent.endDate || context.tripData.endDate,
      duration: intent.duration || context.tripData.duration,
    },
  };
}

export function isTripDataComplete(tripData: TripData): boolean {
  return !!(tripData.resort && tripData.startDate && (tripData.endDate || tripData.duration));
}

export function createInitialContext(): ConversationContext {
  return { state: 'MAIN_MENU', tripData: {}, conversationHistory: [] };
}
