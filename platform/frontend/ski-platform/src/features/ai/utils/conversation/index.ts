/**
 * 對話引擎 - 主入口
 * 遵循 Linus 原則：模組化、關注點分離
 */
export type {
  ConversationState,
  ConversationContext,
  ConversationResponse,
  TripData,
  HandlerResult,
} from './types';

export { createInitialContext } from './utils';

export {
  createTripCreatedResponse,
  createErrorResponse,
} from './responses';

export {
  handleInitialInput,
  handleResortInput,
  handleDateInput,
  handleDurationInput,
  handleConfirmation,
} from './handlers';

import type { ConversationContext, HandlerResult } from './types';
import { createUnknownStateResponse } from './responses';
import {
  handleInitialInput,
  handleResortInput,
  handleDateInput,
  handleDurationInput,
  handleConfirmation,
} from './handlers';

/**
 * 處理用戶輸入 - 主入口函數
 */
export async function processUserInput(
  input: string,
  context: ConversationContext
): Promise<HandlerResult> {
  // 紀錄對話歷史
  const updatedContext: ConversationContext = {
    ...context,
    conversationHistory: [
      ...context.conversationHistory,
      { userInput: input, timestamp: new Date() },
    ],
  };

  // 根據當前狀態分發處理
  switch (context.state) {
    case 'MAIN_MENU':
    case 'AWAITING_INPUT':
    case 'TRIP_CREATED':
    case 'VIEWING_TRIPS':
      return handleInitialInput(input, updatedContext);

    case 'AWAITING_RESORT':
      return handleResortInput(input, updatedContext);

    case 'AWAITING_DATE':
      return handleDateInput(input, updatedContext);

    case 'AWAITING_DURATION':
      return handleDurationInput(input, updatedContext);

    case 'CONFIRMING_TRIP':
      return handleConfirmation(input, updatedContext);

    default:
      return createUnknownStateResponse(updatedContext);
  }
}

// 向後兼容的導出
export const handleTripCreated = (context: ConversationContext, tripId: string) =>
  import('./responses').then(m => m.createTripCreatedResponse(context, tripId));

export const handleError = (context: ConversationContext, error: string) =>
  import('./responses').then(m => m.createErrorResponse(context, error));
