/**
 * 浮動 AI 按鈕組件
 * 固定在右下角，點擊後彈出對話框
 */

import { useState } from 'react';
import ChatDialog from './ChatDialog';

export default function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 浮動按鈕 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center z-40 group"
        aria-label="開啟 AI 助手"
      >
        <span className="text-2xl group-hover:animate-bounce">🤖</span>
      </button>

      {/* 對話框 */}
      {isOpen && <ChatDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}
