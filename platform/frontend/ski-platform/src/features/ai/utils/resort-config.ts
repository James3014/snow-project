/**
 * 雪場配置文件
 * 集中管理所有雪場相关的配置常量
 *
 * 遵循 DRY 原则 - 单一数据源
 */

import type { Resort } from '@/shared/data/resorts';

/**
 * 雪場群配置
 * 用於處理一个地区有多个雪場的情況（如白马、二世谷等）
 */
export interface ResortGroup {
  /** 触发该群組的关键词 */
  keywords: string[];
  /** 群組内雪場的名称列表（用於顯示建議）*/
  names: string[];
  /** 过滤函数，判断一个雪場是否属于该群組 */
  filter: (resort: Resort) => boolean;
}

/**
 * 雪場群配置列表
 *
 * 当用戶输入群組关键词时：
 * - 如果群組只有1个雪場 → 直接返回（高信心度）
 * - 如果群組有多个雪場 → 返回第一个但降低信心度，触发建議系统
 */
export const RESORT_GROUPS: ResortGroup[] = [
  {
    keywords: ['白馬', '白马', 'hakuba'],
    names: ['白馬Cortina', '白馬八方尾根', '白馬五龍', '白馬岩岳', '白馬栂池', '白馬乗鞍'],
    filter: (r: Resort) => r.names.zh.includes('白馬')
  },
  {
    keywords: ['二世谷', 'niseko', 'ニセコ'],
    names: ['二世谷'],
    filter: (r: Resort) => r.names.zh.includes('二世谷') || r.names.en.toLowerCase().includes('niseko')
  },
  {
    keywords: ['妙高', 'myoko'],
    names: ['妙高杉之原', '妙高池之平', '赤倉溫泉', '赤倉觀光', '樂天新井'],
    filter: (r: Resort) => r.names.zh.includes('妙高') || r.names.zh.includes('赤倉') || r.names.zh.includes('新井')
  },
  {
    keywords: ['湯澤', '汤泽', 'yuzawa'],
    names: ['GALA湯澤', 'NASPA', '苗場', '神樂', '石打丸山', '湯澤中里', '湯澤公園', '神立高原', '舞子高原', '岩原', '上越國際'],
    filter: (r: Resort) =>
      r.names.zh.includes('湯澤') ||
      r.resort_id.includes('yuzawa_') ||
      r.names.zh.includes('苗場') ||
      r.names.zh.includes('神樂') ||
      r.names.zh.includes('石打') ||
      r.names.zh.includes('神立') ||
      r.names.zh.includes('舞子') ||
      r.names.zh.includes('岩原') ||
      r.names.zh.includes('上越國際')
  },
];

/**
 * 匹配信心度枚举
 *
 * 简化版信心度系统（遵循 Linus 建議）：
 * - EXACT: 精確匹配，直接使用
 * - HIGH: 高置信度，可能需要確認但通常可用
 * - LOW: 需要用戶選擇確認
 *
 * 设计原则：
 * "Perfection is achieved not when there is nothing more to add,
 *  but when there is nothing left to take away." - Antoine de Saint-Exupéry
 */
export const MatchConfidence = {
  /** 精確匹配（1.0）- 直接使用，无需確認 */
  EXACT: 1.0,

  /** 高置信度（0.8）- 通常可用，某些场景需要確認 */
  HIGH: 0.8,

  /** 低置信度（0.5）- 需要用戶選擇確認 */
  LOW: 0.5,
} as const;

/**
 * 匹配信心度阈值（向后兼容版本，逐步废弃）
 *
 * @deprecated 请使用 MatchConfidence 枚举代替
 * 将在下一版本中移除
 */
export const CONFIDENCE_THRESHOLDS = {
  EXACT_MATCH: MatchConfidence.EXACT,           // 完全精確匹配
  EXACT_ALIAS_PRIMARY: 0.98,                    // 主要别名精確匹配 → 映射到 EXACT
  EXACT_ALIAS_SECONDARY: 0.95,                  // 次要别名精確匹配 → 映射到 EXACT
  PARTIAL_MATCH_LONG: 0.90,                     // 长字串部分匹配 → 映射到 HIGH
  PARTIAL_MATCH_MEDIUM: 0.87,                   // 中等字串部分匹配 → 映射到 HIGH
  PARTIAL_MATCH_SHORT: MatchConfidence.HIGH,    // 短字串部分匹配
  FUZZY_MATCH_HIGH: 0.75,                       // 高相似度模糊匹配 → 映射到 HIGH
  FUZZY_MATCH_MEDIUM: 0.70,                     // 中等相似度模糊匹配 → 映射到 HIGH
  PINYIN_AMBIGUOUS: 0.65,                       // 拼音映射但有歧义 → 映射到 LOW
  GROUP_AMBIGUOUS: MatchConfidence.LOW,         // 雪場群匹配但需要用戶選擇
  FUZZY_MATCH_LOW: MatchConfidence.LOW,         // 低相似度模糊匹配
} as const;

/**
 * Levenshtein 距離相似度阈值
 * 用於模糊匹配，計算字串編輯距離
 */
export const FUZZY_MATCH_SIMILARITY_THRESHOLD = 0.6;

/**
 * 拼音映射表
 * 将常见的中文雪場名映射到 resort_id
 *
 * 格式：{ "用戶输入": ["resort_id1", "resort_id2", ...] }
 */
export const PINYIN_MAPPINGS: Record<string, string[]> = {
  // 可以在需要时扩展
  // 例如：'miaochang': ['yuzawa_naeba', ...]
};
