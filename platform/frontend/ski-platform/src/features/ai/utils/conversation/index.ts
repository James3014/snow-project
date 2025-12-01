/**
 * 對話引擎
 * 管理對話狀態和流程
 */

export * from './types';
export { createInitialContext } from './utils';
export { createTripCreatedResponse, createErrorResponse } from './responses';

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
 * 處理用戶輸入
 */
export async function processUserInput(
  input: string,
  context: ConversationContext
): Promise<HandlerResult> {
  const updatedContext: ConversationContext = {
    ...context,
    conversationHistory: [...context.conversationHistory, { userInput: input, timestamp: new Date() }],
  };

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

// 向後兼容導出
export function handleTripCreated(context: ConversationContext, tripId: string): HandlerResult {
  const { createTripCreatedResponse } = require('./responses');
  return createTripCreatedResponse(context, tripId);
}

export function handleError(context: ConversationContext, error: string): HandlerResult {
  const { createErrorResponse } = require('./responses');
  return createErrorResponse(context, error);
}
