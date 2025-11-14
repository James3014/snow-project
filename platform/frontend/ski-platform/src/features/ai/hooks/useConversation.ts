/**
 * useConversation Hook
 *
 * 统一管理对话狀態，遵循 Linus 原则：
 * - 职责单一：只管理对话狀態和流程
 * - 简化组件：从5个 useState 减少到1个 hook
 * - 数据结构优先：统一的狀態管理
 */

import { useState } from 'react';
import { MESSAGES, MAIN_MENU_BUTTONS } from '../constants/messages';
import type { Message, ButtonOption } from '../types';
import {
  createInitialContext,
  processUserInput as processUserInputEngine,
  handleError,
  type ConversationContext,
  type ConversationResponse,
} from '../utils/conversationEngine';

/**
 * 对话狀態
 */
interface ConversationState {
  messages: Message[];
  buttons: ButtonOption[];
  suggestions: string[];
  context: ConversationContext;
  isProcessing: boolean;
}

/**
 * 对话 Hook 返回值
 */
export interface UseConversationReturn {
  // 狀態
  messages: Message[];
  buttons: ButtonOption[];
  suggestions: string[];
  context: ConversationContext;
  isProcessing: boolean;

  // 操作方法
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  processInput: (input: string) => Promise<{
    response: ConversationResponse;
    updatedContext: ConversationContext;
  }>;
  handleError: (error: Error | string) => void;
  reset: () => void;
  resetToMenu: () => void;
  updateResponse: (response: ConversationResponse) => void;
}

/**
 * 創建初始狀態
 */
function createInitialState(): ConversationState {
  return {
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: MESSAGES.welcome,
        timestamp: new Date(),
      },
    ],
    buttons: MAIN_MENU_BUTTONS,
    suggestions: [],
    context: createInitialContext(),
    isProcessing: false,
  };
}

/**
 * 对话管理 Hook
 */
export function useConversation(): UseConversationReturn {
  const [state, setState] = useState<ConversationState>(createInitialState());

  /**
   * 添加消息
   */
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setState(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: Date.now().toString() + Math.random(),
          role,
          content,
          timestamp: new Date(),
        },
      ],
    }));
  };

  /**
   * 處理用戶輸入
   */
  const processInput = async (input: string): Promise<{
    response: ConversationResponse;
    updatedContext: ConversationContext;
  }> => {
    // 設置處理中狀態
    setState(prev => ({ ...prev, isProcessing: true, suggestions: [] }));

    try {
      // 調用對話引擎
      const { response, updatedContext } = await processUserInputEngine(
        input,
        state.context
      );

      // 更新狀態
      setState(prev => ({
        ...prev,
        context: updatedContext,
        buttons: response.buttonOptions || [],
        suggestions: response.suggestions || [],
        isProcessing: false,
      }));

      // 返回 response 和 updatedContext（組件需要最新的 context）
      return { response, updatedContext };
    } catch (error) {
      // 處理錯誤
      const errorMessage = error instanceof Error ? error.message : '發生未知錯誤';
      const { response: errorResponse, updatedContext: errorContext } =
        handleError(state.context, errorMessage);

      setState(prev => ({
        ...prev,
        context: errorContext,
        buttons: errorResponse.buttonOptions || [],
        suggestions: [],
        isProcessing: false,
      }));

      throw error;
    }
  };

  /**
   * 處理錯誤（手動）
   */
  const handleErrorManual = (error: Error | string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const { response: errorResponse, updatedContext: errorContext } =
      handleError(state.context, errorMessage);

    setState(prev => ({
      ...prev,
      context: errorContext,
      buttons: errorResponse.buttonOptions || [],
      suggestions: [],
      isProcessing: false,
    }));

    addMessage('assistant', errorResponse.message);
  };

  /**
   * 更新響應（用於特殊情況，如創建行程成功後）
   */
  const updateResponse = (response: ConversationResponse) => {
    setState(prev => ({
      ...prev,
      buttons: response.buttonOptions || [],
      suggestions: response.suggestions || [],
    }));
  };

  /**
   * 重置到初始狀態
   */
  const reset = () => {
    setState(createInitialState());
  };

  /**
   * 重置到主選單
   */
  const resetToMenu = () => {
    setState(prev => ({
      ...prev,
      context: createInitialContext(),
      buttons: MAIN_MENU_BUTTONS,
      suggestions: [],
    }));
  };

  return {
    // 狀態
    messages: state.messages,
    buttons: state.buttons,
    suggestions: state.suggestions,
    context: state.context,
    isProcessing: state.isProcessing,

    // 方法
    addMessage,
    processInput,
    handleError: handleErrorManual,
    reset,
    resetToMenu,
    updateResponse,
  };
}
