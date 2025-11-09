/**
 * AI Chat Hook
 * AI 聊天功能 Hook
 */
import { useState, useCallback } from 'react';
import { aiAssistantApi, ChatMessage, ChatResponse } from '../api/aiAssistantApi';

export interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // 添加用戶訊息
    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // 發送到後端
      const response: ChatResponse = await aiAssistantApi.chat({
        messages: [...messages, userMessage],
      });

      // 添加 AI 回應
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 如果有工具執行結果，可以在這裡處理
      if (response.tool_results && response.tool_results.length > 0) {
        console.log('Tool results:', response.tool_results);
      }

    } catch (err: any) {
      const errorMessage = err.message || '發送訊息失敗';
      setError(errorMessage);

      // 添加錯誤訊息
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `抱歉，處理您的請求時遇到問題：${errorMessage}`,
      };
      setMessages((prev) => [...prev, errorMsg]);

    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
