/**
 * 快速按鈕組件
 * 顯示可點擊的選項按鈕
 */

import type { ButtonOption } from '../types';

interface QuickButtonsProps {
  buttons: ButtonOption[];
  onButtonClick: (action: string) => void | Promise<void>;
}

export default function QuickButtons({ buttons, onButtonClick }: QuickButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={() => onButtonClick(button.action)}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
        >
          {button.emoji && <span>{button.emoji}</span>}
          <span>{button.label}</span>
        </button>
      ))}
    </div>
  );
}
