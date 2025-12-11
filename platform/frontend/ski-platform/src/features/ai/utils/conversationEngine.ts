/**
 * 對話引擎 - 向後兼容導出
 *
 * 實際實現已拆分到 conversation/ 目錄：
 * - types.ts: 類型定義
 * - constants.ts: 常量
 * - utils.ts: 工具函數
 * - responses.ts: 回應生成器
 * - handlers.ts: 處理器
 * - index.ts: 主入口
 */
export {
  processUserInput,
  createInitialContext,
  createTripCreatedResponse as handleTripCreated,
  createErrorResponse as handleError,
} from './conversation';

export type {
  ConversationState,
  ConversationContext,
  ConversationResponse,
} from './conversation';
