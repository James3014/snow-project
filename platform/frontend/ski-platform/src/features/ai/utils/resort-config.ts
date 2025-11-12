/**
 * 雪场配置文件
 * 集中管理所有雪场相关的配置常量
 *
 * 遵循 DRY 原则 - 单一数据源
 */

import type { Resort } from '@/shared/data/resorts';

/**
 * 雪场群配置
 * 用于处理一个地区有多个雪场的情况（如白马、二世谷等）
 */
export interface ResortGroup {
  /** 触发该群组的关键词 */
  keywords: string[];
  /** 群组内雪场的名称列表（用于显示建议）*/
  names: string[];
  /** 过滤函数，判断一个雪场是否属于该群组 */
  filter: (resort: Resort) => boolean;
}

/**
 * 雪场群配置列表
 *
 * 当用户输入群组关键词时：
 * - 如果群组只有1个雪场 → 直接返回（高信心度）
 * - 如果群组有多个雪场 → 返回第一个但降低信心度，触发建议系统
 */
export const RESORT_GROUPS: ResortGroup[] = [
  {
    keywords: ['白馬', 'hakuba'],
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
    keywords: ['湯澤', 'yuzawa'],
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
 * 匹配信心度阈值（当前版本）
 *
 * TODO: Linus 建议简化为 3 个级别
 * - EXACT: 1.0 (精确匹配)
 * - HIGH: 0.8 (高置信度)
 * - LOW: 0.5 (需要用户确认)
 */
export const CONFIDENCE_THRESHOLDS = {
  EXACT_MATCH: 1.0,           // 完全精确匹配
  EXACT_ALIAS_PRIMARY: 0.98,  // 主要别名精确匹配
  EXACT_ALIAS_SECONDARY: 0.95, // 次要别名精确匹配
  PARTIAL_MATCH_LONG: 0.90,   // 长字符串部分匹配（≥4字符）
  PARTIAL_MATCH_MEDIUM: 0.87, // 中等字符串部分匹配（3字符）
  PARTIAL_MATCH_SHORT: 0.80,  // 短字符串部分匹配（2字符）
  FUZZY_MATCH_HIGH: 0.75,     // 高相似度模糊匹配
  FUZZY_MATCH_MEDIUM: 0.70,   // 中等相似度模糊匹配
  PINYIN_AMBIGUOUS: 0.65,     // 拼音映射但有歧义
  GROUP_AMBIGUOUS: 0.5,       // 雪场群匹配但需要用户选择
  FUZZY_MATCH_LOW: 0.5,       // 低相似度模糊匹配
} as const;

/**
 * Levenshtein 距离相似度阈值
 * 用于模糊匹配，计算字符串编辑距离
 */
export const FUZZY_MATCH_SIMILARITY_THRESHOLD = 0.6;

/**
 * 拼音映射表
 * 将常见的中文雪场名映射到 resort_id
 *
 * 格式：{ "用户输入": ["resort_id1", "resort_id2", ...] }
 */
export const PINYIN_MAPPINGS: Record<string, string[]> = {
  // 可以在需要时扩展
  // 例如：'miaochang': ['yuzawa_naeba', ...]
};
