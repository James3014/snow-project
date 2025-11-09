/**
 * Floating AI Button
 * 浮動 AI 助手按鈕
 */
import { useState } from 'react';
import AIChatWidget from '@/features/ai-assistant/components/AIChatWidget';

export default function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 浮動按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-50 group"
        >
          <span className="text-3xl">🤖</span>
          <div className="absolute right-20 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            <p className="text-sm font-medium">AI 滑雪助手</p>
            <p className="text-xs text-gray-300">點擊開始對話</p>
          </div>
        </button>
      )}

      {/* 聊天窗口 */}
      {isOpen && <AIChatWidget onClose={() => setIsOpen(false)} />}
    </>
  );
}
