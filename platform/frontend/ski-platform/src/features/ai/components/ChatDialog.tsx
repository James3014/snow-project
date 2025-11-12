/**
 * AI 對話框主組件
 * 階段二：完整版本，支援文字輸入和完整流程
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import QuickButtons from './QuickButtons';
import InputBox from './InputBox';
import SuggestionList from './SuggestionList';
import { MESSAGES, MAIN_MENU_BUTTONS } from '../constants/messages';
import type { Message, ButtonOption } from '../types';
import {
  createInitialContext,
  processUserInput,
  handleTripCreated,
  handleError,
  type ConversationContext,
} from '../utils/conversationEngine';
import { useAppSelector } from '@/store/hooks';
import { useTripCreation } from '../hooks/useTripCreation';

interface ChatDialogProps {
  onClose: () => void;
}

export default function ChatDialog({ onClose }: ChatDialogProps) {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // 使用行程创建 Hook（提取业务逻辑）
  const { createTrip } = useTripCreation(user?.user_id);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: MESSAGES.welcome,
      timestamp: new Date(),
    },
  ]);

  const [buttons, setButtons] = useState<ButtonOption[]>(MAIN_MENU_BUTTONS);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationContext, setConversationContext] = useState<ConversationContext>(
    createInitialContext()
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 添加訊息的輔助函數
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        role,
        content,
        timestamp: new Date(),
      },
    ]);
  };

  // 處理用戶輸入（文字或按鈕）
  const handleUserInput = async (input: string) => {
    if (isProcessing) return;

    // 添加用戶訊息
    addMessage('user', input);

    // 清空建議
    setSuggestions([]);

    setIsProcessing(true);

    try {
      // 處理輸入
      const { response, updatedContext } = await processUserInput(input, conversationContext);

      // 更新上下文
      setConversationContext(updatedContext);

      // 添加助手回應
      addMessage('assistant', response.message);

      // 更新按鈕
      if (response.buttonOptions) {
        setButtons(response.buttonOptions);
      } else {
        setButtons([]);
      }

      // 更新建議
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }

      // 處理特殊狀態
      if (response.nextState === 'CREATING_TRIP') {
        await handleCreateTrip(updatedContext);
      } else if (response.nextState === 'VIEWING_TRIPS') {
        handleViewTrips();
      }
    } catch (error) {
      console.error('Error processing input:', error);
      const errorMessage = error instanceof Error ? error.message : '發生未知錯誤';
      const { response: errorResponse, updatedContext: errorContext } = handleError(
        conversationContext,
        errorMessage
      );
      setConversationContext(errorContext);
      addMessage('assistant', errorResponse.message);
      if (errorResponse.buttonOptions) {
        setButtons(errorResponse.buttonOptions);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 處理按鈕點擊
  const handleButtonClick = (action: string) => {
    const clickedButton = buttons.find(b => b.action === action);
    if (!clickedButton) return;

    // 特殊處理一些動作
    if (action === 'MAIN_MENU') {
      // 重置上下文
      setConversationContext(createInitialContext());
      addMessage('user', '返回主選單');
      addMessage('assistant', MESSAGES.backToMenu);
      setButtons(MAIN_MENU_BUTTONS);
      return;
    }

    if (action === 'RESTART') {
      // 重新開始建立行程
      setConversationContext(createInitialContext());
      addMessage('user', '重新開始');
      addMessage('assistant', '好的！讓我們重新開始。\n請告訴我你想去哪個雪場？\n例如：二世谷、白馬、留壽都');
      setButtons([]);
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
  const handleCreateTrip = async (context: ConversationContext) => {
    const { resort, startDate, endDate, duration } = context.accumulatedData;

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
      const { response: successResponse, updatedContext } = handleTripCreated(
        context,
        result.tripId
      );

      setConversationContext(updatedContext);
      addMessage('assistant', successResponse.message);

      if (successResponse.buttonOptions) {
        setButtons(successResponse.buttonOptions);
      }
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
