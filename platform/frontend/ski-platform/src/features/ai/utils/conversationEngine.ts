/**
 * 對話引擎
 * 管理對話狀態和流程
 */

import {
  parseIntent,
  type ParsedIntent,
} from './intentParser';
import type { ResortMatch } from './resortMatcher';

/**
 * 對話狀態
 */
export type ConversationState =
  | 'MAIN_MENU'           // 主選單
  | 'AWAITING_INPUT'      // 等待輸入
  | 'PROCESSING_INTENT'   // 處理意圖中
  | 'AWAITING_RESORT'     // 等待雪場資訊
  | 'AWAITING_DATE'       // 等待日期資訊
  | 'AWAITING_DURATION'   // 等待天數資訊
  | 'CONFIRMING_TRIP'     // 確認行程資訊
  | 'CREATING_TRIP'       // 建立行程中
  | 'TRIP_CREATED'        // 行程已建立
  | 'VIEWING_TRIPS'       // 查看行程
  | 'CHAT'                // 閒聊
  | 'ERROR';              // 錯誤狀態

/**
 * 對話上下文
 */
export interface ConversationContext {
  state: ConversationState;
  intent?: ParsedIntent;

  // 累積的資訊（用於多輪對話）
  accumulatedData: {
    resort?: ResortMatch;
    startDate?: Date;
    endDate?: Date;
    duration?: number;
  };

  // 對話歷史
  conversationHistory: {
    userInput: string;
    timestamp: Date;
  }[];

  // 錯誤資訊
  error?: string;
}

/**
 * 對話回應
 */
export interface ConversationResponse {
  message: string;
  nextState: ConversationState;
  suggestions?: string[];  // 建議的回覆
  buttonOptions?: {
    id: string;
    label: string;
    action: string;
  }[];
  requiresConfirmation?: boolean;
  data?: unknown;  // 附加數據（如行程列表）
}

/**
 * 建立初始上下文
 */
export function createInitialContext(): ConversationContext {
  return {
    state: 'MAIN_MENU',
    accumulatedData: {},
    conversationHistory: [],
  };
}

/**
 * 處理用戶輸入
 */
export async function processUserInput(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  // 記錄對話歷史
  const updatedContext: ConversationContext = {
    ...context,
    conversationHistory: [
      ...context.conversationHistory,
      { userInput: input, timestamp: new Date() },
    ],
  };

  // 根據當前狀態處理輸入
  switch (context.state) {
    case 'MAIN_MENU':
    case 'AWAITING_INPUT':
      return await handleInitialInput(input, updatedContext);

    case 'AWAITING_RESORT':
      return await handleResortInput(input, updatedContext);

    case 'AWAITING_DATE':
      return await handleDateInput(input, updatedContext);

    case 'AWAITING_DURATION':
      return await handleDurationInput(input, updatedContext);

    case 'CONFIRMING_TRIP':
      return await handleConfirmation(input, updatedContext);

    default:
      return {
        response: {
          message: '抱歉，我不太理解。讓我們重新開始吧！',
          nextState: 'MAIN_MENU',
          buttonOptions: [
            { id: 'create', label: '建立行程', action: 'CREATE_TRIP' },
            { id: 'view', label: '查看行程', action: 'VIEW_TRIPS' },
          ],
        },
        updatedContext: {
          ...updatedContext,
          state: 'MAIN_MENU',
          accumulatedData: {},
        },
      };
  }
}

/**
 * 處理初始輸入
 */
async function handleInitialInput(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  // 解析意圖
  const intent = await parseIntent(input);

  const updatedContext = {
    ...context,
    intent,
    state: 'PROCESSING_INTENT' as ConversationState,
  };

  // 根據意圖類型處理
  switch (intent.action) {
    case 'CHAT':
      return handleChatIntent(intent, updatedContext);

    case 'VIEW_TRIPS':
      return {
        response: {
          message: '正在獲取你的行程列表...',
          nextState: 'VIEWING_TRIPS',
        },
        updatedContext: {
          ...updatedContext,
          state: 'VIEWING_TRIPS',
        },
      };

    case 'CREATE_TRIP':
      return handleCreateTripIntent(intent, updatedContext);

    default:
      return {
        response: {
          message: '我不太確定你想做什麼，可以再說一次嗎？\n或者選擇以下選項：',
          nextState: 'MAIN_MENU',
          buttonOptions: [
            { id: 'create', label: '建立行程', action: 'CREATE_TRIP' },
            { id: 'view', label: '查看行程', action: 'VIEW_TRIPS' },
          ],
        },
        updatedContext: {
          ...updatedContext,
          state: 'MAIN_MENU',
        },
      };
  }
}

/**
 * 處理閒聊意圖
 */
function handleChatIntent(
  intent: ParsedIntent,
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  const greetings = ['你好', '嗨', 'hi', 'hello'];
  const thanks = ['謝謝', '感謝', 'thanks'];

  const input = intent.rawInput.toLowerCase();

  let message = '';

  if (greetings.some(g => input.includes(g))) {
    message = '你好！我是你的滑雪小助手 🎿\n我可以幫你建立行程、查看行程，或者聊聊天～';
  } else if (thanks.some(t => input.includes(t))) {
    message = '不客氣！隨時為你服務 😊';
  } else {
    message = '嗯嗯，我懂了！還有什麼我可以幫忙的嗎？';
  }

  return {
    response: {
      message,
      nextState: 'MAIN_MENU',
      buttonOptions: [
        { id: 'create', label: '建立行程', action: 'CREATE_TRIP' },
        { id: 'view', label: '查看行程', action: 'VIEW_TRIPS' },
      ],
    },
    updatedContext: {
      ...context,
      state: 'MAIN_MENU',
    },
  };
}

/**
 * 處理建立行程意圖
 */
function handleCreateTripIntent(
  intent: ParsedIntent,
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  // 合併累積的資料
  const mergedData = {
    resort: intent.resort || context.accumulatedData.resort,
    startDate: intent.startDate || context.accumulatedData.startDate,
    endDate: intent.endDate || context.accumulatedData.endDate,
    duration: intent.duration || context.accumulatedData.duration,
  };

  const updatedContext = {
    ...context,
    accumulatedData: mergedData,
  };

  // 檢查是否有缺少的資訊
  if (!mergedData.resort) {
    const suggestions = intent.suggestions?.map(s => s.resort.names.zh) || [];
    return {
      response: {
        message: intent.suggestions && intent.suggestions.length > 0
          ? `找不到完全匹配的雪場，你是想去這些地方嗎？\n或者直接告訴我雪場名稱～`
          : '請告訴我你想去哪個雪場？\n例如：二世谷、白馬、留壽都',
        nextState: 'AWAITING_RESORT',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      },
      updatedContext: {
        ...updatedContext,
        state: 'AWAITING_RESORT',
      },
    };
  }

  if (!mergedData.startDate) {
    return {
      response: {
        message: `好的，去 ${mergedData.resort.resort.names.zh}！\n什麼時候出發呢？\n例如：12/15、明天、下週一`,
        nextState: 'AWAITING_DATE',
      },
      updatedContext: {
        ...updatedContext,
        state: 'AWAITING_DATE',
      },
    };
  }

  if (!mergedData.duration && !mergedData.endDate) {
    const dateStr = mergedData.startDate.toLocaleDateString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
    });
    return {
      response: {
        message: `${dateStr} 出發前往 ${mergedData.resort.resort.names.zh}！\n打算待幾天呢？\n例如：5天、一週`,
        nextState: 'AWAITING_DURATION',
      },
      updatedContext: {
        ...updatedContext,
        state: 'AWAITING_DURATION',
      },
    };
  }

  // 所有資訊都齊全，直接創建行程
  return prepareCreation(updatedContext);
}

/**
 * 處理雪場輸入
 */
async function handleResortInput(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  const intent = await parseIntent(`建立行程 ${input}`);

  if (intent.resort) {
    const updatedContext = {
      ...context,
      accumulatedData: {
        ...context.accumulatedData,
        resort: intent.resort,
      },
    };

    // 繼續詢問日期
    return {
      response: {
        message: `好的，去 ${intent.resort.resort.names.zh}！\n什麼時候出發呢？\n例如：12/15、明天、下週一`,
        nextState: 'AWAITING_DATE',
      },
      updatedContext: {
        ...updatedContext,
        state: 'AWAITING_DATE',
      },
    };
  } else {
    const suggestions = intent.suggestions?.map(s => s.resort.names.zh) || [];
    return {
      response: {
        message: suggestions.length > 0
          ? `找不到完全匹配的雪場，你是想去這些地方嗎？`
          : '抱歉，找不到這個雪場。\n可以換個說法試試嗎？\n例如：二世谷、白馬、留壽都',
        nextState: 'AWAITING_RESORT',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      },
      updatedContext: context,
    };
  }
}

/**
 * 處理日期輸入
 */
async function handleDateInput(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  const intent = await parseIntent(input);

  if (intent.startDate) {
    const updatedContext = {
      ...context,
      accumulatedData: {
        ...context.accumulatedData,
        startDate: intent.startDate,
        endDate: intent.endDate,
        duration: intent.duration,
      },
    };

    // 如果同時有天數或結束日期，直接創建行程
    if (intent.duration || intent.endDate) {
      return prepareCreation(updatedContext);
    }

    // 繼續詢問天數
    const dateStr = intent.startDate.toLocaleDateString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
    });
    return {
      response: {
        message: `${dateStr} 出發！\n打算待幾天呢？\n例如：5天、一週`,
        nextState: 'AWAITING_DURATION',
      },
      updatedContext: {
        ...updatedContext,
        state: 'AWAITING_DURATION',
      },
    };
  } else {
    return {
      response: {
        message: '抱歉，我沒能理解這個日期。\n可以換個說法試試嗎？\n例如：12/15、明天、下週一',
        nextState: 'AWAITING_DATE',
      },
      updatedContext: context,
    };
  }
}

/**
 * 處理天數輸入
 */
async function handleDurationInput(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  const intent = await parseIntent(input);

  if (intent.duration) {
    const updatedContext = {
      ...context,
      accumulatedData: {
        ...context.accumulatedData,
        duration: intent.duration,
      },
    };

    return prepareCreation(updatedContext);
  } else {
    return {
      response: {
        message: '抱歉，我沒能理解天數。\n可以換個說法試試嗎？\n例如：5天、一週、三天兩夜',
        nextState: 'AWAITING_DURATION',
      },
      updatedContext: context,
    };
  }
}

/**
 * 準備創建行程
 */
function prepareCreation(
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  const { resort, startDate, endDate, duration: providedDuration } = context.accumulatedData;

  if (!resort || !startDate) {
    throw new Error('Missing required data for creation');
  }

  // 確保有 endDate 或 duration（至少一個）
  if (!endDate && !providedDuration) {
    throw new Error('Missing date range or duration');
  }

  // 計算 duration（如果需要）
  let duration = providedDuration;
  if (!duration && endDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    duration = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const dateStr = startDate.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
  });

  // 如果有 endDate，顯示日期範圍
  let dateDisplay = dateStr;
  if (endDate) {
    const endDateStr = endDate.toLocaleDateString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
    });
    dateDisplay = `${dateStr} - ${endDateStr}`;
  }

  const message = `好的！正在建立行程：\n\n📍 雪場：${resort.resort.names.zh}\n📅 日期：${dateDisplay}\n⏱️ 天數：${duration} 天`;

  return {
    response: {
      message,
      nextState: 'CREATING_TRIP',
      data: context.accumulatedData,
    },
    updatedContext: {
      ...context,
      state: 'CREATING_TRIP',
    },
  };
}

/**
 * 處理確認
 */
async function handleConfirmation(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  const normalized = input.toLowerCase().trim();

  // 確定建立
  if (
    normalized.includes('確定') ||
    normalized.includes('是') ||
    normalized.includes('好') ||
    normalized.includes('yes') ||
    normalized === 'y'
  ) {
    return {
      response: {
        message: '正在建立行程...',
        nextState: 'CREATING_TRIP',
        data: context.accumulatedData,
      },
      updatedContext: {
        ...context,
        state: 'CREATING_TRIP',
      },
    };
  }

  // 取消
  if (
    normalized.includes('取消') ||
    normalized.includes('不要') ||
    normalized.includes('算了') ||
    normalized.includes('no') ||
    normalized === 'n'
  ) {
    return {
      response: {
        message: '好的，已取消。還有什麼我可以幫忙的嗎？',
        nextState: 'MAIN_MENU',
        buttonOptions: [
          { id: 'create', label: '建立行程', action: 'CREATE_TRIP' },
          { id: 'view', label: '查看行程', action: 'VIEW_TRIPS' },
        ],
      },
      updatedContext: {
        ...context,
        state: 'MAIN_MENU',
        accumulatedData: {},
      },
    };
  }

  // 不明確的回答
  return {
    response: {
      message: '請明確回答「確定」或「取消」～',
      nextState: 'CONFIRMING_TRIP',
      buttonOptions: [
        { id: 'confirm', label: '確定建立', action: 'CONFIRM' },
        { id: 'cancel', label: '取消', action: 'CANCEL' },
      ],
    },
    updatedContext: context,
  };
}

/**
 * 處理行程建立成功
 */
export function handleTripCreated(
  context: ConversationContext,
  tripId: string
): { response: ConversationResponse; updatedContext: ConversationContext } {
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
    updatedContext: {
      ...context,
      state: 'TRIP_CREATED',
      accumulatedData: {},
    },
  };
}

/**
 * 處理錯誤
 */
export function handleError(
  context: ConversationContext,
  error: string
): { response: ConversationResponse; updatedContext: ConversationContext } {
  return {
    response: {
      message: `抱歉，發生了錯誤：${error}\n讓我們重新開始吧！`,
      nextState: 'MAIN_MENU',
      buttonOptions: [
        { id: 'create', label: '建立行程', action: 'CREATE_TRIP' },
        { id: 'view', label: '查看行程', action: 'VIEW_TRIPS' },
      ],
    },
    updatedContext: {
      ...context,
      state: 'MAIN_MENU',
      error,
      accumulatedData: {},
    },
  };
}
