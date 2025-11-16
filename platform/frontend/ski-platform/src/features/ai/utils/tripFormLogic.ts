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
import type { ResortMatch } from './resortMatcher';

// ==================== 類型定義 ====================

export type FormField<T> =
  | { status: 'empty' }
  | { status: 'filled'; value: T }
  | { status: 'invalid'; error: string };

// 導出 ResortMatch 以便測試使用
export type { ResortMatch };

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

  // 檢查輸入中是否包含無效的月份或日期（如 99月、99日）
  const invalidMonthMatch = input.match(/(\d{2,})月/);
  const invalidDayMatch = input.match(/(\d{2,})日/);
  const hasInvalidMonth = invalidMonthMatch && parseInt(invalidMonthMatch[1]) > 12;
  const hasInvalidDay = invalidDayMatch && parseInt(invalidDayMatch[1]) > 31;

  // 檢查輸入中是否包含明確的年份（如 2025/3/20）
  const explicitYearMatch = input.match(/(\d{4})[\/\-年]/);
  const explicitYear = explicitYearMatch ? parseInt(explicitYearMatch[1]) : null;

  // 檢查是否包含完整的日期範圍格式（如 2025/3/20-2025/3/25）
  const fullDateRangeMatch = input.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})[-到至](\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (fullDateRangeMatch && parsed.endDate) {
    // 解析結束日期的年月日
    const endYear = parseInt(fullDateRangeMatch[4]);
    const endMonth = parseInt(fullDateRangeMatch[5]) - 1; // JS months are 0-indexed
    const endDay = parseInt(fullDateRangeMatch[6]);

    // 覆蓋 parseIntent 的結果
    const correctedEndDate = new Date(endYear, endMonth, endDay);
    if (!isNaN(correctedEndDate.getTime())) {
      parsed.endDate = correctedEndDate;
    }
  }

  // 處理簡化日期範圍（如 3/20至3/25, 3/20到25）
  const simpleDateRangeMatch = input.match(/(\d{1,2})\/(\d{1,2})[至到](\d{1,2})\/(\d{1,2})/);
  if (simpleDateRangeMatch && parsed.startDate && parsed.endDate) {
    // 提取結束日期的月和日
    const endMonth = parseInt(simpleDateRangeMatch[3]) - 1; // JS months are 0-indexed
    const endDay = parseInt(simpleDateRangeMatch[4]);

    // 使用 startDate 的年份
    const year = parsed.startDate.getFullYear();
    const correctedEndDate = new Date(year, endMonth, endDay);

    if (!isNaN(correctedEndDate.getTime())) {
      parsed.endDate = correctedEndDate;
    }
  }

  // 處理同月日期範圍（如 3月20到25日, 3月20日到3月25日）
  const sameMonthRangeMatch = input.match(/(\d{1,2})月(\d{1,2})[日號]?[到至](?:\d{1,2}月)?(\d{1,2})[日號]/);
  if (sameMonthRangeMatch && parsed.startDate && parsed.endDate) {
    const month = parseInt(sameMonthRangeMatch[1]) - 1;
    const endDay = parseInt(sameMonthRangeMatch[3]);
    const year = explicitYear || parsed.startDate.getFullYear();

    const correctedEndDate = new Date(year, month, endDay);
    if (!isNaN(correctedEndDate.getTime())) {
      parsed.endDate = correctedEndDate;
    }
  }

  // 更新日期
  if (parsed.startDate) {
    // 檢查日期是否有效
    if (isNaN(parsed.startDate.getTime())) {
      newForm.startDate = { status: 'invalid', error: '無效的開始日期' };
    } else if (hasInvalidMonth || hasInvalidDay) {
      // 輸入包含無效的月份或日期數字
      newForm.startDate = { status: 'invalid', error: '無效的日期格式' };
    } else {
      let startDate = parsed.startDate;

      // 如果輸入包含明確年份，且與解析結果不符，以用戶輸入為準
      if (explicitYear && startDate.getFullYear() !== explicitYear) {
        startDate = new Date(startDate);
        startDate.setFullYear(explicitYear);
      }

      // 檢查日期是否在過去（只有在沒有明確年份時才檢查）
      if (!explicitYear) {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // 重置到當天的開始
        const dateToCheck = new Date(startDate);
        dateToCheck.setHours(0, 0, 0, 0);

        if (dateToCheck < now) {
          // 日期在過去，需要用戶確認或提供完整年份
          const nextYear = startDate.getFullYear() + 1;
          const monthDay = `${startDate.getMonth() + 1}月${startDate.getDate()}日`;
          newForm.startDate = {
            status: 'invalid',
            error: `您輸入的日期（${monthDay}）已經過去了。如果是指明年，請輸入「${nextYear}年${monthDay}」。`
          };
        } else {
          newForm.startDate = { status: 'filled', value: startDate };
        }
      } else {
        newForm.startDate = { status: 'filled', value: startDate };
      }
    }
  }

  if (parsed.endDate) {
    // 檢查日期是否有效
    if (isNaN(parsed.endDate.getTime())) {
      newForm.endDate = { status: 'invalid', error: '無效的結束日期' };
    } else if (hasInvalidMonth || hasInvalidDay) {
      // 輸入包含無效的月份或日期數字
      newForm.endDate = { status: 'invalid', error: '無效的日期格式' };
    } else {
      let endDate = parsed.endDate;

      // 如果輸入包含明確年份，且與解析結果不符，以用戶輸入為準
      if (explicitYear && endDate.getFullYear() !== explicitYear) {
        endDate = new Date(endDate);
        endDate.setFullYear(explicitYear);
      }

      newForm.endDate = { status: 'filled', value: endDate };
    }
  }

  // 驗證日期順序：結束日期必須 >= 開始日期
  if (
    newForm.startDate.status === 'filled' &&
    newForm.endDate.status === 'filled'
  ) {
    const start = newForm.startDate.value;
    const end = newForm.endDate.value;

    if (end < start) {
      // 日期順序錯誤
      newForm.endDate = { status: 'invalid', error: '結束日期不能早於開始日期' };
    }
  }

  // 日期和天數計算邏輯
  // 優先級：當衝突時，判斷用戶是明確給了日期範圍還是明確給了天數

  // 檢查輸入是否包含日期範圍格式（如"20-25"、"3/20-25"）
  const hasDateRange = /\d+[-到至]\d+/.test(input);

  // 判斷是否有真正的衝突
  if (
    parsed.startDate &&
    parsed.endDate &&
    parsed.duration &&
    newForm.startDate.status === 'filled' &&
    newForm.endDate.status === 'filled'
  ) {
    // 從日期範圍計算天數
    const start = newForm.startDate.value;
    const end = newForm.endDate.value;
    const daysFromRange = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 如果日期範圍計算的天數 != 用戶指定的天數，存在衝突
    const hasConflict = daysFromRange !== parsed.duration;

    if (hasConflict) {
      // 如果用戶明確給了日期範圍（輸入包含"20-25"格式），以日期範圍為準
      // 否則以明確指定的天數為準
      if (hasDateRange) {
        newForm.duration = { status: 'filled', value: daysFromRange };
      } else {
        // 用戶只給了開始日期和天數，endDate是parseIntent推測的，以天數為準
        newForm.duration = { status: 'filled', value: parsed.duration };
        const newEnd = new Date(start);
        newEnd.setDate(newEnd.getDate() + parsed.duration - 1);
        newForm.endDate = { status: 'filled', value: newEnd };
      }
    } else {
      // 沒有衝突，使用用戶指定的天數
      newForm.duration = { status: 'filled', value: parsed.duration };
    }
  }
  // 有開始日期和天數，沒有結束日期 - 用天數計算
  else if (
    newForm.startDate.status === 'filled' &&
    parsed.duration &&
    !parsed.endDate
  ) {
    newForm.duration = { status: 'filled', value: parsed.duration };
    const start = newForm.startDate.value;
    const end = new Date(start);
    end.setDate(end.getDate() + parsed.duration - 1);
    newForm.endDate = { status: 'filled', value: end };
  }
  // 有日期範圍但沒有天數 - 從日期範圍計算
  else if (
    newForm.startDate.status === 'filled' &&
    newForm.endDate.status === 'filled' &&
    !parsed.duration
  ) {
    const start = newForm.startDate.value;
    const end = newForm.endDate.value;
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    newForm.duration = { status: 'filled', value: days };
  }
  // 只有天數
  else if (parsed.duration) {
    newForm.duration = { status: 'filled', value: parsed.duration };
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
        const resortName = form.resort.value.matchedValue || form.resort.value.resort.names.zh;
        return `好的，想去${resortName}！請問出發日期是？（例如：3月20-25日）`;
      }
      return '請問出發日期是？';

    case 'AWAITING_DURATION':
      if (form.resort.status === 'filled' && form.startDate.status === 'filled') {
        const resortName = form.resort.value.matchedValue || form.resort.value.resort.names.zh;
        const dateStr = formatDate(form.startDate.value);
        return `了解！${resortName}，${dateStr}出發。請問要去幾天？`;
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
    const resortName = form.resort.value.matchedValue || form.resort.value.resort.names.zh;
    parts.push(`雪場：${resortName}`);
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
