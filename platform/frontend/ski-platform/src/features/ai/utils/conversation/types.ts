/**
 * 對話引擎類型定義
 */
import type { ResortMatch } from '../resortMatcher';

/**
 * 對話狀態
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
 * 行程數據
 */
export interface TripData {
  resort?: ResortMatch;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  visibility?: 'public' | 'private';
  maxBuddies?: number;
}

/**
 * 對話上下文
 */
export interface ConversationContext {
  state: ConversationState;
  tripData: TripData;
  conversationHistory: {
    userInput: string;
    timestamp: Date;
  }[];
  error?: string;
}

/**
 * 按鈕選項
 */
export interface ButtonOption {
  id: string;
  label: string;
  action: string;
}

/**
 * 對話回應
 */
export interface ConversationResponse {
  message: string;
  nextState: ConversationState;
  suggestions?: string[];
  buttonOptions?: ButtonOption[];
  requiresConfirmation?: boolean;
  data?: unknown;
}

/**
 * 處理結果
 */
export interface HandlerResult {
  response: ConversationResponse;
  updatedContext: ConversationContext;
}
