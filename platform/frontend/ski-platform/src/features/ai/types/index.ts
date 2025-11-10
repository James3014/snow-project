/**
 * AI 助手基礎類型定義
 * 階段一：簡化版本，只包含基本對話功能
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ButtonOption {
  id: string;
  label: string;
  emoji?: string;
  action: string;
}

/**
 * 對話狀態
 * 階段一只有兩個狀態：主選單和開發中
 */
export type ConversationState =
  | 'MAIN_MENU'
  | 'COMING_SOON';
