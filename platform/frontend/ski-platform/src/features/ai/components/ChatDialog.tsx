/**
 * AI 對話框主組件
 * 階段一：基礎版本，只有簡單的按鈕互動
 */

import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import QuickButtons from './QuickButtons';
import { MESSAGES, MAIN_MENU_BUTTONS, BACK_BUTTON } from '../constants/messages';
import type { Message, ButtonOption } from '../types';

interface ChatDialogProps {
  onClose: () => void;
}

export default function ChatDialog({ onClose }: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: MESSAGES.welcome,
      timestamp: new Date(),
    },
  ]);

  const [buttons, setButtons] = useState<ButtonOption[]>(MAIN_MENU_BUTTONS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleButtonClick = (action: string) => {
    // 找到被點擊的按鈕
    const clickedButton = buttons.find(b => b.action === action);

    if (!clickedButton) return;

    // 添加用戶訊息
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: clickedButton.label,
        timestamp: new Date(),
      },
    ]);

    // 根據動作返回不同的回應
    setTimeout(() => {
      if (action === 'MAIN_MENU') {
        // 返回主選單
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: MESSAGES.backToMenu,
            timestamp: new Date(),
          },
        ]);
        setButtons(MAIN_MENU_BUTTONS);
      } else {
        // 其他功能顯示「開發中」
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: MESSAGES.comingSoon,
            timestamp: new Date(),
          },
        ]);
        setButtons([BACK_BUTTON]);
      }
    }, 500);
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
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 按鈕區域 */}
      {buttons.length > 0 && (
        <div className="p-4 border-t bg-white rounded-b-lg">
          <QuickButtons buttons={buttons} onButtonClick={handleButtonClick} />
        </div>
      )}
    </div>
  );
}
