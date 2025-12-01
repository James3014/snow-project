/**
 * 對話狀態處理器
 */

import { parseIntent, type ParsedIntent } from '../intentParser';
import type { ConversationContext, HandlerResult } from './types';
import { GREETING_KEYWORDS, THANKS_KEYWORDS } from './constants';
import {
  formatDate, isAskingForResortList, checkUserConfirmation,
  detectResortChange, updateTripData, isTripDataComplete, buildTripIdentifier,
} from './utils';
import {
  createResortListResponse, createViewTripsResponse, createUnknownIntentResponse,
  createAskResortResponse, createAskDateResponse, createAskDurationResponse,
  createMainMenuResponse,
} from './responses';

// ==================== 初始輸入處理 ====================

export async function handleInitialInput(input: string, context: ConversationContext): Promise<HandlerResult> {
  if (isAskingForResortList(input)) {
    return createResortListResponse(context, '例如：「二世谷 12月20日 5天」');
  }
  const intent = await parseIntent(input);
  return dispatchIntent(intent, context);
}

function dispatchIntent(intent: ParsedIntent, context: ConversationContext): HandlerResult {
  switch (intent.action) {
    case 'CHAT': return handleChat(intent, context);
    case 'VIEW_TRIPS': return createViewTripsResponse(context);
    case 'DELETE_TRIP': return handleDeleteTrip(intent, context);
    case 'CREATE_TRIP': return handleCreateTrip(intent, context);
    default: return createUnknownIntentResponse(context);
  }
}

function handleChat(intent: ParsedIntent, context: ConversationContext): HandlerResult {
  const input = intent.rawInput.toLowerCase();
  let message = '嗯嗯，我懂了！還有什麼我可以幫忙的嗎？';
  if (GREETING_KEYWORDS.some(g => input.includes(g))) {
    message = '你好！我是你的滑雪小助手 🎿\n我可以幫你建立行程、查看行程，或者聊聊天～';
  } else if (THANKS_KEYWORDS.some(t => input.includes(t))) {
    message = '不客氣！隨時為你服務 😊';
  }
  return createMainMenuResponse(message, context);
}

function handleDeleteTrip(intent: ParsedIntent, context: ConversationContext): HandlerResult {
  const hasIdentifier = !!(intent.resort || intent.startDate || intent.duration);
  if (!hasIdentifier) {
    return {
      response: {
        message: '請告訴我要刪除哪個行程？\n\n你可以說：\n• "刪除苗場行程"\n• "刪除第1個行程"',
        nextState: 'VIEWING_TRIPS',
        buttonOptions: [
          { id: 'view', label: '查看我的行程', action: 'VIEW_TRIPS' },
          { id: 'cancel', label: '取消', action: 'CANCEL' },
        ],
      },
      updatedContext: { ...context, state: 'VIEWING_TRIPS' },
    };
  }
  return {
    response: {
      message: `要刪除${buildTripIdentifier(intent)}嗎？`,
      nextState: 'VIEWING_TRIPS',
      requiresConfirmation: true,
      buttonOptions: [
        { id: 'confirm_delete', label: '✓ 確認刪除', action: 'CONFIRM_DELETE' },
        { id: 'cancel', label: '✕ 取消', action: 'CANCEL' },
      ],
      data: { deleteIdentifier: { resortId: intent.resort?.resort.resort_id, startDate: intent.startDate, tripNumber: intent.duration } },
    },
    updatedContext: { ...updateTripData(context, intent), state: 'VIEWING_TRIPS' },
  };
}

function handleCreateTrip(intent: ParsedIntent, context: ConversationContext): HandlerResult {
  const updatedContext = updateTripData(context, intent);
  const { resort, startDate, endDate, duration } = updatedContext.tripData;

  if (!resort) {
    const suggestions = intent.suggestions?.map(s => s.resort.names.zh) || [];
    const message = suggestions.length > 0
      ? '找不到完全匹配的雪場，你是想去這些地方嗎？'
      : '請告訴我你想去哪個雪場？\n例如：二世谷、白馬、留壽都';
    return createAskResortResponse(message, suggestions, updatedContext);
  }
  if (!startDate) {
    return createAskDateResponse(`好的，去 ${resort.resort.names.zh}！\n什麼時候出發呢？\n例如：12/15、明天、下週一`, updatedContext);
  }
  if (!duration && !endDate) {
    return createAskDurationResponse(startDate, resort.resort.names.zh, updatedContext);
  }
  return prepareCreation(updatedContext);
}

// ==================== 雪場輸入處理 ====================

export async function handleResortInput(input: string, context: ConversationContext): Promise<HandlerResult> {
  if (isAskingForResortList(input)) {
    return createResortListResponse(context, '例如：「二世谷」、「白馬」、「苗場」');
  }
  const intent = await parseIntent(`建立行程 ${input}`);
  if (!intent.resort) {
    const suggestions = intent.suggestions?.map(s => s.resort.names.zh) || [];
    return {
      response: {
        message: suggestions.length > 0 ? '找不到完全匹配的雪場，你是想去這些地方嗎？' : '抱歉，找不到這個雪場。\n例如：二世谷、白馬、留壽都',
        nextState: 'AWAITING_RESORT',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      },
      updatedContext: context,
    };
  }

  const updatedContext = {
    ...context,
    tripData: { ...context.tripData, resort: intent.resort, startDate: intent.startDate || context.tripData.startDate, endDate: intent.endDate || context.tripData.endDate, duration: intent.duration || context.tripData.duration },
  };
  const { startDate, endDate, duration } = updatedContext.tripData;

  if (startDate && (endDate || duration)) return prepareCreation(updatedContext);
  if (startDate) return createAskDurationResponse(startDate, intent.resort.resort.names.zh, updatedContext);
  return createAskDateResponse(`好的，去 ${intent.resort.resort.names.zh}！\n什麼時候出發呢？\n例如：12/15、明天、下週一`, updatedContext);
}

// ==================== 日期輸入處理 ====================

export async function handleDateInput(input: string, context: ConversationContext): Promise<HandlerResult> {
  const intent = await parseIntent(input);

  if (detectResortChange(intent, context.tripData.resort)) {
    return {
      response: { message: `檢測到您想更換雪場到 ${intent.resort!.resort.names.zh}。\n什麼時候出發呢？`, nextState: 'AWAITING_DATE' },
      updatedContext: { ...context, tripData: { resort: intent.resort, startDate: intent.startDate, endDate: intent.endDate, duration: intent.duration }, state: 'AWAITING_DATE' },
    };
  }

  if (!intent.startDate) {
    return { response: { message: '抱歉，我沒能理解這個日期。\n例如：12/15、明天、下週一', nextState: 'AWAITING_DATE' }, updatedContext: context };
  }

  const updatedContext = updateTripData(context, intent);
  if (isTripDataComplete(updatedContext.tripData)) return prepareCreation(updatedContext);

  return {
    response: { message: `${formatDate(intent.startDate)} 出發！\n打算待幾天呢？\n例如：5天、一週`, nextState: 'AWAITING_DURATION' },
    updatedContext: { ...updatedContext, state: 'AWAITING_DURATION' },
  };
}

// ==================== 天數輸入處理 ====================

export async function handleDurationInput(input: string, context: ConversationContext): Promise<HandlerResult> {
  const intent = await parseIntent(input);

  if (detectResortChange(intent, context.tripData.resort)) {
    return {
      response: { message: `檢測到您想更換雪場到 ${intent.resort!.resort.names.zh}。\n什麼時候出發呢？`, nextState: 'AWAITING_DATE' },
      updatedContext: { ...context, tripData: { resort: intent.resort, startDate: intent.startDate, endDate: intent.endDate, duration: intent.duration }, state: 'AWAITING_DATE' },
    };
  }

  if (!intent.duration && !intent.endDate) {
    return { response: { message: '抱歉，我沒能理解天數。\n例如：5天、一週、26號', nextState: 'AWAITING_DURATION' }, updatedContext: context };
  }

  return prepareCreation(updateTripData(context, intent));
}

// ==================== 確認處理 ====================

export async function handleConfirmation(input: string, context: ConversationContext): Promise<HandlerResult> {
  const userIntent = checkUserConfirmation(input);

  if (userIntent === 'confirm') {
    return { response: { message: '正在建立行程...', nextState: 'CREATING_TRIP', data: context.tripData }, updatedContext: { ...context, state: 'CREATING_TRIP' } };
  }
  if (userIntent === 'cancel') {
    return createMainMenuResponse('好的，已取消。還有什麼我可以幫忙的嗎？', { ...context, tripData: {} });
  }
  return {
    response: {
      message: '請明確回答「確定」或「取消」～',
      nextState: 'CONFIRMING_TRIP',
      buttonOptions: [{ id: 'confirm', label: '確定建立', action: 'CONFIRM' }, { id: 'cancel', label: '取消', action: 'CANCEL' }],
    },
    updatedContext: context,
  };
}

// ==================== 準備創建 ====================

function prepareCreation(context: ConversationContext): HandlerResult {
  const { resort, startDate, endDate, duration: providedDuration } = context.tripData;
  if (!resort || !startDate) throw new Error('Missing required data');

  let duration = providedDuration;
  if (!duration && endDate) {
    duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const dateDisplay = endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : formatDate(startDate);

  return {
    response: {
      message: `好的！正在建立行程：\n\n📍 雪場：${resort.resort.names.zh}\n📅 日期：${dateDisplay}\n⏱️ 天數：${duration} 天`,
      nextState: 'CREATING_TRIP',
      data: context.tripData,
    },
    updatedContext: { ...context, state: 'CREATING_TRIP' },
  };
}
