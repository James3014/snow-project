/**
 * AI 助手提示詞庫
 * 階段一：簡化版本，友善活潑的風格
 */

import type { ButtonOption } from '../types';

// 基礎訊息
export const MESSAGES = {
  welcome: "嗨！我是你的滑雪小助手 🎿\n我可以幫你做這些事：",
  comingSoon: "這個功能正在開發中...\n敬請期待！😊",
  backToMenu: "還有什麼我可以幫忙的嗎？",
};

// 主選單按鈕
export const MAIN_MENU_BUTTONS: ButtonOption[] = [
  {
    id: 'create',
    label: '建立行程',
    emoji: '📅',
    action: 'CREATE_TRIP'
  },
  {
    id: 'view',
    label: '查看行程',
    emoji: '📊',
    action: 'VIEW_TRIPS'
  },
];

// 返回按鈕
export const BACK_BUTTON: ButtonOption = {
  id: 'back',
  label: '返回主選單',
  emoji: '🔙',
  action: 'MAIN_MENU',
};

// 隨機鼓勵語
export const ENCOURAGEMENTS = [
  "滑雪魂燃燒起來了！🔥",
  "又要征服新雪場了嗎？讚！👍",
  "準備好迎接粉雪了嗎？❄️",
  "這次一定會很精彩！⛷️",
];

export function getRandomEncouragement(): string {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}
