/**
 * useConversation Hook
 *
 * 统一管理对话状态，遵循 Linus 原则：
 * - 职责单一：只管理对话状态和流程
 * - 简化组件：从5个 useState 减少到1个 hook
 * - 数据结构优先：统一的状态管理
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
 * 对话状态
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
  // 状态
  messages: Message[];
  buttons: ButtonOption[];
  suggestions: string[];
  context: ConversationContext;
  isProcessing: boolean;

  // 操作方法
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  processInput: (input: string) => Promise<ConversationResponse>;
  handleError: (error: Error | string) => void;
  reset: () => void;
  resetToMenu: () => void;
  updateResponse: (response: ConversationResponse) => void;
}

/**
 * 创建初始状态
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
   * 处理用户输入
   */
  const processInput = async (input: string): Promise<ConversationResponse> => {
    // 设置处理中状态
    setState(prev => ({ ...prev, isProcessing: true, suggestions: [] }));

    try {
      // 调用对话引擎
      const { response, updatedContext } = await processUserInputEngine(
        input,
        state.context
      );

      // 更新状态
      setState(prev => ({
        ...prev,
        context: updatedContext,
        buttons: response.buttonOptions || [],
        suggestions: response.suggestions || [],
        isProcessing: false,
      }));

      return response;
    } catch (error) {
      // 处理错误
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
   * 处理错误（手动）
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
   * 更新响应（用于特殊情况，如创建行程成功后）
   */
  const updateResponse = (response: ConversationResponse) => {
    setState(prev => ({
      ...prev,
      buttons: response.buttonOptions || [],
      suggestions: response.suggestions || [],
    }));
  };

  /**
   * 重置到初始状态
   */
  const reset = () => {
    setState(createInitialState());
  };

  /**
   * 重置到主菜单
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
    // 状态
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
