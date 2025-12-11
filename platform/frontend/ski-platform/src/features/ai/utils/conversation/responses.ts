/**
 * 對話回應生成器
 */
import type { ConversationContext, HandlerResult, ConversationState } from './types';
import type { ParsedIntent } from '../intentParser';
import { RESORT_LIST_MESSAGE } from './constants';
import { formatDate } from './utils';

/**
 * 主選單按鈕
 */
const MAIN_MENU_BUTTONS = [
  { id: 'create', label: '建立行程', action: 'CREATE_TRIP' },
  { id: 'view', label: '查看行程', action: 'VIEW_TRIPS' },
];

/**
 * 創建詢問雪場的響應
 */
export function createAskResortResponse(
  message: string,
  suggestions: string[],
  context: ConversationContext
): HandlerResult {
  return {
    response: {
      message,
      nextState: 'AWAITING_RESORT',
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      buttonOptions: [{ id: 'restart', label: '🔄 重新開始', action: 'RESTART' }],
    },
    updatedContext: { ...context, state: 'AWAITING_RESORT' },
  };
}

/**
 * 創建詢問日期的響應
 */
export function createAskDateResponse(
  message: string,
  context: ConversationContext
): HandlerResult {
  return {
    response: {
      message,
      nextState: 'AWAITING_DATE',
      buttonOptions: [{ id: 'restart', label: '🔄 重新開始', action: 'RESTART' }],
    },
    updatedContext: { ...context, state: 'AWAITING_DATE' },
  };
}

/**
 * 創建詢問天數的響應
 */
export function createAskDurationResponse(
  startDate: Date,
  resortName: string,
  context: ConversationContext
): HandlerResult {
  const dateStr = formatDate(startDate);
  return {
    response: {
      message: `好的，${dateStr} 前往 ${resortName}！\n打算待幾天呢？\n例如：5天、一週`,
      nextState: 'AWAITING_DURATION',
    },
    updatedContext: { ...context, state: 'AWAITING_DURATION' },
  };
}

/**
 * 創建查看行程響應
 */
export function createViewTripsResponse(context: ConversationContext): HandlerResult {
  return {
    response: {
      message: '正在獲取你的行程列表...',
      nextState: 'VIEWING_TRIPS',
    },
    updatedContext: { ...context, state: 'VIEWING_TRIPS' },
  };
}

/**
 * 創建未知意圖響應
 */
export function createUnknownIntentResponse(context: ConversationContext): HandlerResult {
  return {
    response: {
      message: '我不太確定你想做什麼，可以再說一次嗎？\n或者選擇以下選項：',
      nextState: 'MAIN_MENU',
      buttonOptions: MAIN_MENU_BUTTONS,
    },
    updatedContext: { ...context, state: 'MAIN_MENU' },
  };
}

/**
 * 創建未知狀態響應
 */
export function createUnknownStateResponse(context: ConversationContext): HandlerResult {
  return {
    response: {
      message: '抱歉，我不太理解。讓我們重新開始吧！',
      nextState: 'MAIN_MENU',
      buttonOptions: MAIN_MENU_BUTTONS,
    },
    updatedContext: { ...context, state: 'MAIN_MENU', tripData: {} },
  };
}

/**
 * 創建雪場列表響應
 */
export function createResortListResponse(
  context: ConversationContext,
  example: string
): HandlerResult {
  return {
    response: {
      message: `${RESORT_LIST_MESSAGE}\n${example}`,
      nextState: 'AWAITING_RESORT',
      buttonOptions: [{ id: 'restart', label: '🔄 重新開始', action: 'RESTART' }],
    },
    updatedContext: { ...context, state: 'AWAITING_RESORT' },
  };
}

/**
 * 創建雪場變更響應
 */
export function createResortChangeResponse(
  intent: ParsedIntent,
  context: ConversationContext,
  nextState: ConversationState = 'AWAITING_DATE'
): HandlerResult {
  const newResortName = intent.resort!.resort.names.zh;
  return {
    response: {
      message: `檢測到您想更換雪場到 ${newResortName}。\n讓我們重新開始吧！\n什麼時候出發呢？\n例如：12/15、明天、下週一`,
      nextState,
    },
    updatedContext: {
      ...context,
      tripData: {
        resort: intent.resort,
        startDate: intent.startDate,
        endDate: intent.endDate,
        duration: intent.duration,
        visibility: intent.visibility,
        maxBuddies: intent.maxBuddies,
      },
      state: nextState,
    },
  };
}

/**
 * 創建行程建立成功響應
 */
export function createTripCreatedResponse(
  context: ConversationContext,
  tripId: string
): HandlerResult {
  return {
    response: {
      message: '行程建立成功！🎉\n已經幫你加到行程列表了～',
      nextState: 'TRIP_CREATED',
      buttonOptions: [
        { id: 'view', label: '查看行程', action: 'VIEW_TRIPS' },
        { id: 'create_another', label: '再建立一個', action: 'CREATE_TRIP' },
        { id: 'back', label: '返回主選單', action: 'MAIN_MENU' },
      ],
      data: { tripId },
    },
    updatedContext: { ...context, state: 'TRIP_CREATED', tripData: {} },
  };
}

/**
 * 創建錯誤響應
 */
export function createErrorResponse(
  context: ConversationContext,
  error: string
): HandlerResult {
  return {
    response: {
      message: `抱歉，發生了錯誤：${error}\n讓我們重新開始吧！`,
      nextState: 'MAIN_MENU',
      buttonOptions: MAIN_MENU_BUTTONS,
    },
    updatedContext: { ...context, state: 'MAIN_MENU', error, tripData: {} },
  };
}
