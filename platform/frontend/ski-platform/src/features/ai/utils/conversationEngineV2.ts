/**
 * 對話引擎 v2
 * 使用 FormField 模式重構
 *
 * Linus 原則：
 * - 數據結構優先：FormField 替代 optional 欄位
 * - 狀態推導：從數據計算狀態，不單獨存儲
 * - Never break userspace：外部 API 保持不變
 */

import {
  createEmptyForm,
  updateFormFromInput,
  getCurrentState,
  generateResponse,
  type TripForm,
  type ConversationState as TripState,
} from './tripFormLogic';
import type { ResortMatch } from './resortMatcher';

// ==================== 類型定義 ====================

/**
 * 對話狀態（擴展版，包含原有的所有狀態以保持兼容性）
 */
export type ConversationState =
  | 'MAIN_MENU'
  | 'AWAITING_INPUT'
  | 'PROCESSING_INTENT'
  | 'AWAITING_RESORT'
  | 'AWAITING_DATE'
  | 'AWAITING_DURATION'
  | 'CONFIRMING_TRIP'
  | 'CREATING_TRIP'
  | 'TRIP_CREATED'
  | 'VIEWING_TRIPS'
  | 'CHAT'
  | 'ERROR';

/**
 * 對話上下文 v2
 * 使用 TripForm 替代 tripData
 */
export interface ConversationContext {
  state: ConversationState;

  // 新的數據結構：使用 FormField
  tripForm: TripForm;

  // 向後兼容：保留 tripData getter
  tripData: {
    resort?: ResortMatch;
    startDate?: Date;
    endDate?: Date;
    duration?: number;
    visibility?: 'public' | 'private';
    maxBuddies?: number;
  };

  conversationHistory: {
    userInput: string;
    timestamp: Date;
  }[];

  error?: string;
}

/**
 * 對話回應
 */
export interface ConversationResponse {
  message: string;
  nextState: ConversationState;
  suggestions?: string[];
  buttonOptions?: {
    id: string;
    label: string;
    action: string;
  }[];
  requiresConfirmation?: boolean;
  data?: unknown;
}

// ==================== 工具函數 ====================

/**
 * 雪場列表詢問關鍵詞
 */
const RESORT_LIST_KEYWORDS = [
  '哪些雪場', '有哪些雪場', '可以記錄哪些', '支持哪些雪場', '支援哪些雪場',
  '有什麼雪場', '都有哪些', '雪場列表', '所有雪場',
] as const;

/**
 * 雪場列表回復消息
 */
const RESORT_LIST_MESSAGE = `目前系統收錄了43個日本知名雪場！

🔥 熱門雪場包括：
• 北海道：二世谷、留壽都、富良野、Tomamu
• 長野：白馬、志賀高原、野澤溫泉
• 新潟：苗場、神樂、妙高赤倉
• 其他：猪苗代、安比高原等

直接告訴我雪場名稱就可以開始建立行程囉！`;

/**
 * 檢查是否在詢問雪場列表
 */
function isAskingForResortList(input: string): boolean {
  return RESORT_LIST_KEYWORDS.some(keyword => input.includes(keyword));
}

/**
 * 將 TripForm 轉換為 tripData（向後兼容）
 */
function formToTripData(form: TripForm) {
  return {
    resort: form.resort.status === 'filled' ? form.resort.value : undefined,
    startDate: form.startDate.status === 'filled' ? form.startDate.value : undefined,
    endDate: form.endDate.status === 'filled' ? form.endDate.value : undefined,
    duration: form.duration.status === 'filled' ? form.duration.value : undefined,
    visibility: form.visibility.status === 'filled' ? form.visibility.value : undefined,
    maxBuddies: form.maxBuddies.status === 'filled' ? form.maxBuddies.value : undefined,
  };
}

/**
 * 將 TripState 映射到 ConversationState
 */
function mapTripStateToConversationState(tripState: TripState): ConversationState {
  const mapping: Record<TripState, ConversationState> = {
    'AWAITING_INPUT': 'AWAITING_INPUT',
    'AWAITING_RESORT': 'AWAITING_RESORT',
    'AWAITING_DATE': 'AWAITING_DATE',
    'AWAITING_DURATION': 'AWAITING_DURATION',
    'CONFIRMING_TRIP': 'CONFIRMING_TRIP',
  };
  return mapping[tripState];
}

// ==================== 核心函數 ====================

/**
 * 創建初始上下文
 */
export function createInitialContext(): ConversationContext {
  const form = createEmptyForm();
  return {
    state: 'MAIN_MENU',
    tripForm: form,
    tripData: formToTripData(form),
    conversationHistory: [],
  };
}

/**
 * 處理用戶輸入（主函數）
 *
 * Linus 原則：簡化！不需要複雜的狀態機
 * - 所有輸入統一用 updateFormFromInput 處理
 * - 狀態由 getCurrentState 自動推導
 * - 回應由 generateResponse 自動生成
 */
export async function processUserInput(
  input: string,
  context: ConversationContext
): Promise<{ response: ConversationResponse; updatedContext: ConversationContext }> {
  // 特殊情況：雪場列表查詢
  if (isAskingForResortList(input)) {
    return {
      response: {
        message: RESORT_LIST_MESSAGE + '\n\n例如：「二世谷 12月20日 5天」',
        nextState: 'AWAITING_RESORT',
        buttonOptions: [{ id: 'restart', label: '🔄 重新開始', action: 'RESTART' }],
      },
      updatedContext: {
        ...context,
        state: 'AWAITING_RESORT',
        conversationHistory: [
          ...context.conversationHistory,
          { userInput: input, timestamp: new Date() },
        ],
      },
    };
  }

  // 特殊情況：確認行程（「確定」、「是」、「好」等）
  if (context.state === 'CONFIRMING_TRIP') {
    const confirmKeywords = ['確定', '確認', '是', '好', 'yes', 'ok', '沒問題', '可以'];
    if (confirmKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
      return {
        response: {
          message: '行程已建立！你可以繼續建立其他行程，或說「查看行程」來查看已建立的行程。',
          nextState: 'TRIP_CREATED',
          buttonOptions: [
            { id: 'view_trips', label: '📋 查看行程', action: 'VIEW_TRIPS' },
            { id: 'new_trip', label: '➕ 建立新行程', action: 'NEW_TRIP' },
          ],
        },
        updatedContext: {
          ...context,
          state: 'TRIP_CREATED',
          tripForm: createEmptyForm(),
          tripData: formToTripData(createEmptyForm()),
          conversationHistory: [
            ...context.conversationHistory,
            { userInput: input, timestamp: new Date() },
          ],
        },
      };
    }
  }

  // 核心邏輯：更新表單
  const updatedForm = await updateFormFromInput(context.tripForm, input);

  // 推導新狀態
  const tripState = getCurrentState(updatedForm);
  const newState = mapTripStateToConversationState(tripState);

  // 生成回應
  const message = generateResponse(updatedForm);

  // 建立回應對象
  const response: ConversationResponse = {
    message,
    nextState: newState,
  };

  // 如果到達確認階段，添加確認按鈕
  if (newState === 'CONFIRMING_TRIP') {
    response.buttonOptions = [
      { id: 'confirm', label: '✅ 確定建立', action: 'CONFIRM' },
      { id: 'cancel', label: '❌ 取消', action: 'CANCEL' },
    ];
    response.requiresConfirmation = true;
  }

  // 更新上下文
  const updatedContext: ConversationContext = {
    ...context,
    state: newState,
    tripForm: updatedForm,
    tripData: formToTripData(updatedForm),
    conversationHistory: [
      ...context.conversationHistory,
      { userInput: input, timestamp: new Date() },
    ],
  };

  return { response, updatedContext };
}

/**
 * 處理行程建立成功
 */
export function handleTripCreated(
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  return {
    response: {
      message: '✅ 行程已成功建立！\n\n你可以：\n• 繼續建立新行程\n• 說「查看行程」查看所有行程',
      nextState: 'TRIP_CREATED',
      buttonOptions: [
        { id: 'view_trips', label: '📋 查看行程', action: 'VIEW_TRIPS' },
        { id: 'new_trip', label: '➕ 建立新行程', action: 'NEW_TRIP' },
      ],
    },
    updatedContext: {
      ...context,
      state: 'TRIP_CREATED',
      tripForm: createEmptyForm(),
      tripData: formToTripData(createEmptyForm()),
    },
  };
}

/**
 * 處理錯誤
 */
export function handleError(
  error: string,
  context: ConversationContext
): { response: ConversationResponse; updatedContext: ConversationContext } {
  return {
    response: {
      message: `❌ 發生錯誤：${error}\n\n請重新輸入或說「重新開始」。`,
      nextState: 'ERROR',
      buttonOptions: [
        { id: 'restart', label: '🔄 重新開始', action: 'RESTART' },
      ],
    },
    updatedContext: {
      ...context,
      state: 'ERROR',
      error,
    },
  };
}

// ==================== 導出舊版兼容函數 ====================

/**
 * 向後兼容：創建初始上下文（舊版本）
 */
export function createInitialContextLegacy(): ConversationContext {
  return createInitialContext();
}
