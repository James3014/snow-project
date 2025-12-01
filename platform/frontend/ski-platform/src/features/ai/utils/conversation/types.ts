/**
 * 對話引擎類型定義
 */

import type { ResortMatch } from '../resortMatcher';

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

export interface TripData {
  resort?: ResortMatch;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
}

export interface ConversationContext {
  state: ConversationState;
  tripData: TripData;
  conversationHistory: { userInput: string; timestamp: Date }[];
  error?: string;
}

export interface ConversationResponse {
  message: string;
  nextState: ConversationState;
  suggestions?: string[];
  buttonOptions?: { id: string; label: string; action: string }[];
  requiresConfirmation?: boolean;
  data?: unknown;
}

export type HandlerResult = {
  response: ConversationResponse;
  updatedContext: ConversationContext;
};
