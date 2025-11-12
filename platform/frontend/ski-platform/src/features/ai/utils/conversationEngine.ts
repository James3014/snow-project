/**
 * 對話引擎
 * 管理對話狀態和流程
 */

import {
  parseIntent,
  type ParsedIntent,
} from './intentParser';
import type { ResortMatch } from './resortMatcher';

// ==================== 工具函数和常量 ====================

/**
 * 雪場列表詢問關鍵詞（DRY：單一數據源）
 */
const RESORT_LIST_KEYWORDS = [
  '哪些雪場', '有哪些雪場', '可以記錄哪些', '支持哪些雪場', '支援哪些雪場',
  '有什麼雪場', '都有哪些', '雪場列表', '所有雪場',
] as const;

/**
 * 雪場列表回復消息（DRY：單一數據源）
 */
const RESORT_LIST_MESSAGE = `目前系統收錄了43個日本知名雪場！

🔥 熱門雪場包括：
• 北海道：二世谷、留壽都、富良野、Tomamu
• 長野：白馬、志賀高原、野澤溫泉
• 新潟：苗場、神樂、妙高赤倉
• 其他：猪苗代、安比高原等

直接告訴我雪場名稱就可以開始建立行程囉！`;

/**
 * 檢測用戶是否在詢問雪場列表
 */
function isAskingForResortList(input: string): boolean {
  const normalized = input.toLowerCase();
  return RESORT_LIST_KEYWORDS.some(keyword =>
    normalized.includes(keyword.toLowerCase())
  );
}

// ==================== 類型定義 ====================

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

  // 行程數據（單一數據源 - Linus原則：消除數據重複）
  tripData: {
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
    tripData: {},
    conversationHistory: [],
  };
}

// ==================== 工具函數 ====================
// Linus 原則：「將複雜邏輯提取為小而專注的函數，每個函數只做一件事」

/**
 * P1-1: 檢測雪場是否改變
 *
 * @param intent - 解析後的意圖
 * @param currentResort - 當前 context 中的雪場
 * @returns 如果雪場改變返回 true
 */
function detectResortChange(
  intent: ParsedIntent,
  currentResort: ResortMatch | undefined
): boolean {
  if (!intent.resort) return false;
  if (!currentResort) return false;
  return intent.resort.resort.resort_id !== currentResort.resort.resort_id;
}

/**
 * P1-2: 更新行程數據（Linus: 數據操作應該清晰可見）
 *
 * @param context - 當前上下文
 * @param intent - 解析後的意圖
 * @returns 更新後的 context
 */
function updateTripData(
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
    },
  };
}

/**
 * P1-3: 檢查行程數據是否完整
 *
 * @param tripData - 行程數據
 * @returns 如果所有必要字段都存在返回 true
 */
function isTripDataComplete(tripData: ConversationContext['tripData']): boolean {
  return !!(
    tripData.resort &&
    tripData.startDate &&
    (tripData.endDate || tripData.duration)
  );
}

/**
 * P1-4: 處理雪場變更響應
 *
 * @param intent - 包含新雪場的意圖
 * @param context - 當前上下文
 * @param nextState - 下一個狀態
 * @returns 雪場變更的響應和更新後的 context
 */
function handleResortChangeResponse(
  intent: ParsedIntent,
  context: ConversationContext,
  nextState: ConversationState = 'AWAITING_DATE'
): { response: ConversationResponse; updatedContext: ConversationContext } {
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
      },
      state: nextState,
    },
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
    case 'TRIP_CREATED':    // 行程建立後，允許繼續建立新行程
    case 'VIEWING_TRIPS':   // 查看行程後，允許繼續操作
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
          tripData: {},
        },
      };
  }
}

/**
 * 處理初始輸入（簡化版 - 遵循 Linus 原則）
 *
 * "A function should do one thing, do it well, and do it only." - Linus Torvalds
 *
 * 將 68 行大函數拆分為 3 個小函數，提高可讀性和可測試性
 */
async function handleInitialInput(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  // 1. 檢測雪場列表請求
  const listResponse = checkAndHandleResortListRequest(input, context, '例如：「二世谷 12月20日 5天」');
  if (listResponse) return listResponse;

  // 2. 解析用戶意圖
  const intent = await parseIntent(input);

  // 3. 分發到具體處理器（intent 只作為函數參數使用，不持久化到 context）
  return dispatchIntentToHandler(intent, context);
}

/**
 * 檢測並處理雪場列表請求（提取公共邏輯）
 */
function checkAndHandleResortListRequest(
  input: string,
  context: ConversationContext,
  example: string
): { response: ConversationResponse; updatedContext: ConversationContext } | null {
  if (!isAskingForResortList(input)) {
    return null;
  }

  return {
    response: {
      message: `${RESORT_LIST_MESSAGE}\n${example}`,
      nextState: 'AWAITING_RESORT',
      buttonOptions: [{ id: 'restart', label: '🔄 重新開始', action: 'RESTART' }],
    },
    updatedContext: {
      ...context,
      state: 'AWAITING_RESORT',
    },
  };
}

/**
 * 根據意圖類型分發到對應處理器
 */
function dispatchIntentToHandler(
  intent: ParsedIntent,
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  switch (intent.action) {
    case 'CHAT':
      return handleChatIntent(intent, context);

    case 'VIEW_TRIPS':
      return createViewTripsResponse(context);

    case 'DELETE_TRIP':
      return handleDeleteTripIntent(intent, context);

    case 'CREATE_TRIP':
      return handleCreateTripIntent(intent, context);

    default:
      return createUnknownIntentResponse(context);
  }
}

/**
 * 創建查看行程響應
 */
function createViewTripsResponse(
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  return {
    response: {
      message: '正在獲取你的行程列表...',
      nextState: 'VIEWING_TRIPS',
    },
    updatedContext: {
      ...context,
      state: 'VIEWING_TRIPS',
    },
  };
}

/**
 * 創建未知意圖響應
 */
function createUnknownIntentResponse(
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
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
      ...context,
      state: 'MAIN_MENU',
    },
  };
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
 * 處理刪除行程意圖
 */
function handleDeleteTripIntent(
  intent: ParsedIntent,
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  // 檢查是否有識別資訊（Linus: 簡化條件判斷）
  const hasIdentifier = !!(intent.resort || intent.startDate || intent.duration);

  // 如果沒有識別資訊，請求用戶提供
  if (!hasIdentifier) {
    return {
      response: {
        message: '請告訴我要刪除哪個行程？\n\n你可以說：\n• "刪除苗場行程"\n• "刪除第1個行程"\n• "刪除2月的行程"',
        nextState: 'VIEWING_TRIPS',
        buttonOptions: [
          { id: 'view', label: '查看我的行程', action: 'VIEW_TRIPS' },
          { id: 'cancel', label: '取消', action: 'CANCEL' },
        ],
      },
      updatedContext: { ...context, state: 'VIEWING_TRIPS' },
    };
  }

  // 構建刪除標識符（優先級：編號 > 雪場 > 日期）
  const buildIdentifier = (): string => {
    if (intent.duration) return `第 ${intent.duration} 個行程`;
    if (intent.resort) return `${intent.resort.resort.names.zh} 的行程`;
    if (intent.startDate) {
      const dateStr = intent.startDate.toLocaleDateString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
      });
      return `${dateStr} 的行程`;
    }
    return '該行程';
  };

  // 返回確認訊息（使用工具函數更新 context）
  return {
    response: {
      message: `要刪除${buildIdentifier()}嗎？`,
      nextState: 'VIEWING_TRIPS',
      requiresConfirmation: true,
      buttonOptions: [
        { id: 'confirm_delete', label: '✓ 確認刪除', action: 'CONFIRM_DELETE' },
        { id: 'cancel', label: '✕ 取消', action: 'CANCEL' },
      ],
      data: {
        deleteIdentifier: {
          resortId: intent.resort?.resort.resort_id,
          startDate: intent.startDate,
          tripNumber: intent.duration,
        },
      },
    },
    updatedContext: {
      ...updateTripData(context, intent),
      state: 'VIEWING_TRIPS',
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
  // 合併數據（使用工具函數）
  const updatedContext = updateTripData(context, intent);
  const { resort, startDate, endDate, duration } = updatedContext.tripData;

  // 檢查缺少的字段並返回對應請求
  if (!resort) {
    const suggestions = intent.suggestions?.map(s => s.resort.names.zh) || [];
    const message = suggestions.length > 0
      ? '找不到完全匹配的雪場，你是想去這些地方嗎？\n或者直接告訴我雪場名稱～'
      : '請告訴我你想去哪個雪場？\n例如：二世谷、白馬、留壽都';

    return createAskResortResponse(message, suggestions, updatedContext);
  }

  if (!startDate) {
    const message = `好的，去 ${resort.resort.names.zh}！\n\n📍 雪場：${resort.resort.names.zh}\n\n什麼時候出發呢？\n例如：12/15、明天、下週一`;
    return createAskDateResponse(message, updatedContext);
  }

  if (!duration && !endDate) {
    const dateStr = startDate.toLocaleDateString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
    });
    const message = `${dateStr} 出發前往 ${resort.resort.names.zh}！\n\n📍 雪場：${resort.resort.names.zh}\n📅 出發日：${dateStr}\n\n打算待幾天呢？\n例如：5天、一週、26號（結束日期）`;
    return createAskDurationResponse(startDate, resort.resort.names.zh, updatedContext);
  }

  // 數據完整，創建行程
  return prepareCreation(updatedContext);
}

/**
 * 處理雪場輸入（簡化版 - 遵循單一職責原則）
 *
 * 將 80 行函數拆分為 4 個小函數，每個函數專注於一個特定場景
 */
async function handleResortInput(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  // 1. 檢測雪場列表請求
  const listResponse = checkAndHandleResortListRequest(input, context, '例如：「二世谷」、「白馬」、「苗場」');
  if (listResponse) return listResponse;

  // 2. 解析雪場信息
  const intent = await parseIntent(`建立行程 ${input}`);

  // 3. 根據是否找到雪場分發處理
  return intent.resort
    ? handleFoundResort(intent, context)
    : handleResortNotFound(intent, context);
}

/**
 * 處理找到雪場的情況
 */
function handleFoundResort(
  intent: ParsedIntent,
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  const updatedContext = mergeResortDataToContext(intent, context);
  const resort = intent.resort!;

  // 場景1：完整信息（雪場 + 日期 + 天數），直接創建
  if (intent.startDate && (intent.endDate || intent.duration)) {
    return prepareCreation(updatedContext);
  }

  // 場景2：有雪場和日期，缺天數
  if (intent.startDate) {
    return createAskDurationResponse(intent.startDate, resort.resort.names.zh, updatedContext);
  }

  // 場景3：只有雪場，詢問日期
  return createAskDateResponse(resort.resort.names.zh, updatedContext);
}

/**
 * 合併雪場數據到上下文
 */
function mergeResortDataToContext(
  intent: ParsedIntent,
  context: ConversationContext
): ConversationContext {
  return {
    ...context,
    tripData: {
      ...context.tripData,
      resort: intent.resort,
      startDate: intent.startDate || context.tripData.startDate,
      endDate: intent.endDate || context.tripData.endDate,
      duration: intent.duration || context.tripData.duration,
    },
  };
}

/**
 * 創建詢問天數的響應
 */
function createAskDurationResponse(
  startDate: Date,
  resortName: string,
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  const dateStr = startDate.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
  });

  return {
    response: {
      message: `好的，${dateStr} 前往 ${resortName}！\n打算待幾天呢？\n例如：5天、一週`,
      nextState: 'AWAITING_DURATION',
    },
    updatedContext: {
      ...context,
      state: 'AWAITING_DURATION',
    },
  };
}

/**
 * 創建詢問日期的響應
 */
function createAskDateResponse(
  resortName: string,
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  return {
    response: {
      message: `好的，去 ${resortName}！\n什麼時候出發呢？\n例如：12/15、明天、下週一`,
      nextState: 'AWAITING_DATE',
    },
    updatedContext: {
      ...context,
      state: 'AWAITING_DATE',
    },
  };
}

/**
 * 處理未找到雪場的情況
 */
function handleResortNotFound(
  intent: ParsedIntent,
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  const suggestions = intent.suggestions?.map(s => s.resort.names.zh) || [];
  const hasSuggestions = suggestions.length > 0;

  return {
    response: {
      message: hasSuggestions
        ? `找不到完全匹配的雪場，你是想去這些地方嗎？`
        : '抱歉，找不到這個雪場。\n可以換個說法試試嗎？\n例如：二世谷、白馬、留壽都',
      nextState: 'AWAITING_RESORT',
      suggestions: hasSuggestions ? suggestions : undefined,
    },
    updatedContext: context,
  };
}

/**
 * 處理日期輸入
 */
async function handleDateInput(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  const intent = await parseIntent(input);

  // 檢測雪場變更（使用工具函數）
  if (detectResortChange(intent, context.tripData.resort)) {
    return handleResortChangeResponse(intent, context, 'AWAITING_DATE');
  }

  // 驗證日期輸入
  if (!intent.startDate) {
    return {
      response: {
        message: '抱歉，我沒能理解這個日期。\n可以換個說法試試嗎？\n例如：12/15、明天、下週一',
        nextState: 'AWAITING_DATE',
      },
      updatedContext: context,
    };
  }

  // 更新數據（使用工具函數）
  const updatedContext = updateTripData(context, intent);

  // 如果數據完整，直接創建行程
  if (isTripDataComplete(updatedContext.tripData)) {
    return prepareCreation(updatedContext);
  }

  // 繼續詢問天數
  const dateStr = intent.startDate.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
  });
  const resortName = context.tripData.resort?.resort.names.zh || '目的地';

  return {
    response: {
      message: `${dateStr} 出發前往 ${resortName}！\n打算待幾天呢？\n例如：5天、一週、26號`,
      nextState: 'AWAITING_DURATION',
    },
    updatedContext: {
      ...updatedContext,
      state: 'AWAITING_DURATION',
    },
  };
}

/**
 * 處理天數輸入
 */
async function handleDurationInput(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  const intent = await parseIntent(input);

  // 檢測雪場變更（使用工具函數）
  if (detectResortChange(intent, context.tripData.resort)) {
    return handleResortChangeResponse(intent, context, 'AWAITING_DATE');
  }

  // 驗證輸入：必須有天數或結束日期
  if (!intent.duration && !intent.endDate) {
    return {
      response: {
        message: '抱歉，我沒能理解天數或結束日期。\n可以換個說法試試嗎？\n例如：5天、一週、26號、12月26日',
        nextState: 'AWAITING_DURATION',
      },
      updatedContext: context,
    };
  }

  // 更新數據並創建行程（使用工具函數）
  const updatedContext = updateTripData(context, intent);
  return prepareCreation(updatedContext);
}

/**
 * 準備創建行程
 */
function prepareCreation(
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  const { resort, startDate, endDate, duration: providedDuration } = context.tripData;

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
      data: context.tripData,
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

  // 檢查關鍵詞匹配（Linus: 使用數組簡化重複條件）
  const confirmKeywords = ['確定', '是', '好', 'yes', 'y'];
  const cancelKeywords = ['取消', '不要', '算了', 'no', 'n'];

  const isConfirm = confirmKeywords.some(k =>
    k.length === 1 ? normalized === k : normalized.includes(k)
  );
  const isCancel = cancelKeywords.some(k =>
    k.length === 1 ? normalized === k : normalized.includes(k)
  );

  // 確定建立
  if (isConfirm) {
    return {
      response: {
        message: '正在建立行程...',
        nextState: 'CREATING_TRIP',
        data: context.tripData,
      },
      updatedContext: { ...context, state: 'CREATING_TRIP' },
    };
  }

  // 取消
  if (isCancel) {
    return {
      response: {
        message: '好的，已取消。還有什麼我可以幫忙的嗎？',
        nextState: 'MAIN_MENU',
        buttonOptions: [
          { id: 'create', label: '建立行程', action: 'CREATE_TRIP' },
          { id: 'view', label: '查看行程', action: 'VIEW_TRIPS' },
        ],
      },
      updatedContext: { ...context, state: 'MAIN_MENU', tripData: {} },
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
      tripData: {},
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
      tripData: {},
    },
  };
}
