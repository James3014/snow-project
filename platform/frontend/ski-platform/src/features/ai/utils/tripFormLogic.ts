/**
 * Trip Form Logic
 * 行程表單邏輯
 *
 * Linus 原則：
 * 1. 數據結構優先 - FormField 模式消除 optional 混亂
 * 2. 狀態推導而非存儲 - 從數據計算狀態
 * 3. 消除特殊情況 - 統一的欄位處理
 */

import { parseIntent } from './intentParser';

// ==================== 類型定義 ====================

export type FormField<T> =
  | { status: 'empty' }
  | { status: 'filled'; value: T }
  | { status: 'invalid'; error: string };

export interface ResortMatch {
  id: string;
  name: string;
  prefecture: string;
}

export interface TripForm {
  resort: FormField<ResortMatch>;
  startDate: FormField<Date>;
  endDate: FormField<Date>;
  duration: FormField<number>;
  visibility: FormField<'public' | 'private'>;
  maxBuddies: FormField<number>;
}

export type ConversationState =
  | 'AWAITING_INPUT'
  | 'AWAITING_RESORT'
  | 'AWAITING_DATE'
  | 'AWAITING_DURATION'
  | 'CONFIRMING_TRIP';

// ==================== 核心函數 ====================

/**
 * 創建空白表單
 * Linus: 最簡單的初始化，零特殊情況
 */
export function createEmptyForm(): TripForm {
  return {
    resort: { status: 'empty' },
    startDate: { status: 'empty' },
    endDate: { status: 'empty' },
    duration: { status: 'empty' },
    visibility: { status: 'empty' },
    maxBuddies: { status: 'empty' },
  };
}

/**
 * 從用戶輸入更新表單
 * Linus: 單一職責 - 解析輸入並更新對應欄位
 */
export async function updateFormFromInput(form: TripForm, input: string): Promise<TripForm> {
  // 使用現有的 intentParser
  const parsed = await parseIntent(input);

  // 創建新表單（不可變更新）
  const newForm = { ...form };

  // 更新雪場
  if (parsed.resort) {
    newForm.resort = { status: 'filled', value: parsed.resort };
  }

  // 更新日期
  if (parsed.startDate) {
    newForm.startDate = { status: 'filled', value: parsed.startDate };
  }

  if (parsed.endDate) {
    newForm.endDate = { status: 'filled', value: parsed.endDate };
  }

  // 更新或計算天數
  if (parsed.duration) {
    newForm.duration = { status: 'filled', value: parsed.duration };
  }

  // 如果有開始和結束日期，自動計算天數（包含首尾）
  if (newForm.startDate.status === 'filled' && newForm.endDate.status === 'filled') {
    const start = newForm.startDate.value;
    const end = newForm.endDate.value;
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    newForm.duration = { status: 'filled', value: days };
  }

  // 如果只有開始日期和天數，計算結束日期
  if (
    newForm.startDate.status === 'filled' &&
    newForm.duration.status === 'filled' &&
    newForm.endDate.status === 'empty'
  ) {
    const start = newForm.startDate.value;
    const end = new Date(start);
    end.setDate(end.getDate() + newForm.duration.value - 1);
    newForm.endDate = { status: 'filled', value: end };
  }

  // 更新可見性
  // 檢查公開關鍵字（使用更靈活的匹配）
  const publicKeywords = [
    '公開', '開放', 'public',
    '一起', '揪團', '組團'
  ];

  // 檢查動作關鍵字（找/徵/邀等）+ 人/伴/雪友等
  const hasActionKeyword = /找|徵|邀/.test(input);
  const hasTargetKeyword = /人|伴|雪友/.test(input);

  const hasPublicKeyword = publicKeywords.some(keyword => input.includes(keyword)) ||
    (hasActionKeyword && hasTargetKeyword);

  if (hasPublicKeyword) {
    newForm.visibility = { status: 'filled', value: 'public' };
  } else if (parsed.visibility) {
    newForm.visibility = { status: 'filled', value: parsed.visibility };
  } else if (newForm.visibility.status === 'empty') {
    // 預設為 private
    newForm.visibility = { status: 'filled', value: 'private' };
  }

  // 更新最大雪伴數
  if (parsed.maxBuddies) {
    newForm.maxBuddies = { status: 'filled', value: parsed.maxBuddies };
  }

  // 從輸入中提取數字（找N個人、徵N個雪友等）
  if (!parsed.maxBuddies && newForm.maxBuddies.status === 'empty') {
    const buddyPattern = /(?:找|徵|要|最多)(?:雪友|雪伴|人)?\s*(\d+)\s*(?:個|位|人)?/;
    const buddyMatch = input.match(buddyPattern);
    if (buddyMatch) {
      const count = parseInt(buddyMatch[1]);
      if (!isNaN(count) && count >= 1 && count <= 20) {
        newForm.maxBuddies = { status: 'filled', value: count };
      }
    }
  }

  return newForm;
}

/**
 * 推導當前對話狀態
 * Linus: 狀態是數據的函數，不需要單獨存儲
 */
export function getCurrentState(form: TripForm): ConversationState {
  // 檢查是否所有欄位都是空的（初始狀態）
  const allEmpty = Object.values(form).every(field => field.status === 'empty');
  if (allEmpty) {
    return 'AWAITING_INPUT';
  }

  // 檢查欄位順序：resort -> date -> duration
  if (form.resort.status === 'empty') {
    return 'AWAITING_RESORT';
  }

  if (form.startDate.status === 'empty') {
    return 'AWAITING_DATE';
  }

  if (form.endDate.status === 'empty' && form.duration.status === 'empty') {
    return 'AWAITING_DURATION';
  }

  // 所有必要欄位都已填寫
  if (
    form.resort.status === 'filled' &&
    form.startDate.status === 'filled' &&
    (form.endDate.status === 'filled' || form.duration.status === 'filled')
  ) {
    return 'CONFIRMING_TRIP';
  }

  return 'AWAITING_INPUT';
}

/**
 * 生成回應訊息
 * Linus: 簡單的狀態機，每個狀態一個訊息
 */
export function generateResponse(form: TripForm): string {
  const state = getCurrentState(form);

  switch (state) {
    case 'AWAITING_INPUT':
      return '你好！我可以幫你規劃滑雪行程。請告訴我你想去哪個雪場？';

    case 'AWAITING_RESORT':
      return '請告訴我你想去哪個雪場？';

    case 'AWAITING_DATE':
      if (form.resort.status === 'filled') {
        return `好的，想去${form.resort.value.name}！請問什麼時候出發？（例如：3月20-25日）`;
      }
      return '請問什麼時候出發？';

    case 'AWAITING_DURATION':
      if (form.resort.status === 'filled' && form.startDate.status === 'filled') {
        const dateStr = formatDate(form.startDate.value);
        return `了解！${form.resort.value.name}，${dateStr}出發。請問要去幾天？`;
      }
      return '請問要去幾天？';

    case 'CONFIRMING_TRIP':
      return generateConfirmationMessage(form);

    default:
      return '我可以幫你規劃滑雪行程，請告訴我詳細資訊。';
  }
}

// ==================== 輔助函數 ====================

function formatDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

function generateConfirmationMessage(form: TripForm): string {
  const parts: string[] = [];

  if (form.resort.status === 'filled') {
    parts.push(`雪場：${form.resort.value.name}`);
  }

  if (form.startDate.status === 'filled' && form.endDate.status === 'filled') {
    const startStr = formatDate(form.startDate.value);
    const endStr = formatDate(form.endDate.value);
    parts.push(`日期：${startStr} - ${endStr}`);
  }

  if (form.duration.status === 'filled') {
    parts.push(`天數：${form.duration.value}天`);
  }

  if (form.visibility.status === 'filled') {
    const visibilityText = form.visibility.value === 'public' ? '公開' : '私人';
    parts.push(`可見性：${visibilityText}`);
  }

  if (form.maxBuddies.status === 'filled') {
    parts.push(`尋找雪伴：${form.maxBuddies.value}人`);
  }

  return `確認行程資訊：\n${parts.join('\n')}\n\n確定要建立這個行程嗎？`;
}
