/**
 * AI 對話框主組件
 * 階段二：完整版本，支援文字輸入和完整流程
 */

import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import QuickButtons from './QuickButtons';
import InputBox from './InputBox';
import SuggestionList from './SuggestionList';
import { MESSAGES } from '../constants/messages';
import {
  handleTripCreated,
  type ConversationContext,
} from '../utils/conversationEngine';
import { useAppSelector } from '@/store/hooks';
import { useTripCreation } from '../hooks/useTripCreation';
import { useConversation } from '../hooks/useConversation';

interface ChatDialogProps {
  onClose: () => void;
}

export default function ChatDialog({ onClose }: ChatDialogProps) {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // 使用对话管理 Hook（统一管理 5 个状态）
  const {
    messages,
    buttons,
    suggestions,
    context,
    isProcessing,
    addMessage,
    processInput,
    handleError: handleConversationError,
    resetToMenu,
    updateResponse,
  } = useConversation();

  // 使用行程创建 Hook（提取业务逻辑）
  const { createTrip } = useTripCreation(user?.user_id);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 處理用戶輸入（文字或按鈕）
  const handleUserInput = async (input: string) => {
    if (isProcessing) return;

    // 添加用戶訊息
    addMessage('user', input);

    try {
      // 使用 hook 处理输入（自动管理状态）
      const response = await processInput(input);

      // 添加助手回應
      addMessage('assistant', response.message);

      // 處理特殊狀態
      if (response.nextState === 'CREATING_TRIP') {
        await handleCreateTrip(context);
      } else if (response.nextState === 'VIEWING_TRIPS') {
        handleViewTrips();
      }
    } catch (error) {
      console.error('Error processing input:', error);
      handleConversationError(error instanceof Error ? error : new Error('發生未知錯誤'));
    }
  };

  // 處理按鈕點擊
  const handleButtonClick = (action: string) => {
    const clickedButton = buttons.find(b => b.action === action);
    if (!clickedButton) return;

    // 特殊處理一些動作
    if (action === 'MAIN_MENU') {
      // 重置到主選單（使用 hook 方法）
      addMessage('user', '返回主選單');
      addMessage('assistant', MESSAGES.backToMenu);
      resetToMenu();
      return;
    }

    if (action === 'RESTART') {
      // 重新開始建立行程
      addMessage('user', '重新開始');
      addMessage('assistant', '好的！讓我們重新開始。\n請告訴我你想去哪個雪場？\n例如：二世谷、白馬、留壽都');
      resetToMenu();
      return;
    }

    // 其他動作作為文字輸入處理
    handleUserInput(clickedButton.label);
  };

  // 處理建議點擊
  const handleSuggestionClick = (suggestion: string) => {
    handleUserInput(suggestion);
  };

  // 建立行程（使用 Hook 提取的业务逻辑）
  const handleCreateTrip = async (currentContext: ConversationContext) => {
    const { resort, startDate, endDate, duration } = currentContext.accumulatedData;

    if (!resort || !startDate) {
      throw new Error('缺少必要資訊');
    }

    try {
      // 使用 useTripCreation hook 处理所有业务逻辑
      const result = await createTrip({
        resort,
        startDate,
        endDate,
        duration,
      });

      // 處理成功
      const { response: successResponse } = handleTripCreated(
        currentContext,
        result.tripId
      );

      // 使用 hook 方法更新状态
      addMessage('assistant', successResponse.message);
      updateResponse(successResponse);
    } catch (error) {
      console.error('Failed to create trip:', error);
      throw error; // 让外层 catch 处理
    }
  };

  // 查看行程
  const handleViewTrips = () => {
    // 導航到行程列表頁面
    setTimeout(() => {
      onClose();
      navigate('/trips');
    }, 1000);
  };

  return (
    <div className="fixed bottom-24 right-8 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
      {/* 標題列 */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="text-xl">🎿</span>
          <span>滑雪小助手</span>
        </h3>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-white/20"
          aria-label="關閉對話框"
        >
          ✕
        </button>
      </div>

      {/* 訊息區域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id}>
            <MessageBubble message={msg} />
            {/* 如果是最後一條助手訊息且有建議，顯示建議列表 */}
            {msg.id === messages[messages.length - 1]?.id &&
              msg.role === 'assistant' &&
              suggestions.length > 0 && (
                <SuggestionList
                  suggestions={suggestions}
                  onSelect={handleSuggestionClick}
                />
              )}
          </div>
        ))}

        {/* 載入中指示器 */}
        {isProcessing && (
          <div className="flex items-center justify-center py-2">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 按鈕區域 */}
      {buttons.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-t bg-white">
          <QuickButtons buttons={buttons} onButtonClick={handleButtonClick} />
        </div>
      )}

      {/* 輸入框 */}
      <InputBox
        onSubmit={handleUserInput}
        disabled={isProcessing}
        placeholder="輸入訊息..."
      />
    </div>
  );
}
