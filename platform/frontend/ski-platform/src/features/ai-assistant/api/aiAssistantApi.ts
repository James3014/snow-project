/**
 * AI Assistant API
 * AI 助手 API 調用
 */
import { userCoreApi } from '@/shared/api/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  max_iterations?: number;
}

export interface ToolResult {
  tool: string;
  arguments: Record<string, any>;
  result: {
    success: boolean;
    message: string;
    data?: any;
  };
}

export interface ChatResponse {
  message: string;
  tool_results: ToolResult[];
  finish_reason: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AIStatus {
  provider: string;
  model: string;
  temperature: number;
  available_tools: number;
}

export const aiAssistantApi = {
  /**
   * 發送聊天訊息
   */
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    return userCoreApi.post<ChatResponse>('/ai-assistant/chat', request);
  },

  /**
   * 獲取可用工具列表
   */
  getTools: async (): Promise<{ tools: ToolDefinition[] }> => {
    return userCoreApi.get('/ai-assistant/tools');
  },

  /**
   * 獲取 AI 助手狀態
   */
  getStatus: async (): Promise<AIStatus> => {
    return userCoreApi.get('/ai-assistant/status');
  },
};
