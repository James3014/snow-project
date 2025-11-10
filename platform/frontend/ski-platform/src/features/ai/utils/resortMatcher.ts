/**
 * 雪場匹配器
 * 支援中文、英文、日文名稱匹配，以及拼音和模糊匹配
 */

import { calculateSimilarity } from './levenshtein';
import { pinyinToChinese, pinyinToResortId, isPossiblyPinyin } from './pinyinMapper';
import type { Resort } from '@/shared/data/resorts';
import { resortApiService } from '@/shared/api/resortApi';

export interface ResortMatch {
  resort: Resort;
  confidence: number;  // 0-1
  matchedField: 'zh' | 'en' | 'ja' | 'pinyin';
  matchedValue: string;
}

// 緩存雪場列表
let resortsCache: Resort[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘

/**
 * 獲取雪場列表（帶緩存）
 */
async function getResorts(): Promise<Resort[]> {
  const now = Date.now();

  // 使用緩存
  if (resortsCache && now - lastFetchTime < CACHE_DURATION) {
    return resortsCache;
  }

  try {
    const response = await resortApiService.getAllResorts();
    resortsCache = response.items || [];
    lastFetchTime = now;
    return resortsCache;
  } catch (error) {
    console.error('Failed to fetch resorts:', error);
    // 如果API失敗，返回空數組（或可以考慮使用本地備份數據）
    resortsCache = [];
    return [];
  }
}

/**
 * 清空緩存（用於測試或強制刷新）
 */
export function clearResortCache(): void {
  resortsCache = null;
  lastFetchTime = 0;
}

/**
 * 匹配雪場名稱
 */
function matchResortName(
  input: string,
  resort: Resort
): { confidence: number; field: 'zh' | 'en' | 'ja'; value: string } | null {
  const normalized = input.toLowerCase().trim();
  const { names } = resort;

  // 精確匹配（最高優先級）
  if (names.zh.toLowerCase() === normalized) {
    return { confidence: 1.0, field: 'zh', value: names.zh };
  }
  if (names.en.toLowerCase() === normalized) {
    return { confidence: 1.0, field: 'en', value: names.en };
  }
  if (names.ja === normalized) {
    return { confidence: 1.0, field: 'ja', value: names.ja };
  }

  // 包含匹配（高優先級）
  if (names.zh.toLowerCase().includes(normalized)) {
    return { confidence: 0.95, field: 'zh', value: names.zh };
  }
  if (names.en.toLowerCase().includes(normalized)) {
    return { confidence: 0.95, field: 'en', value: names.en };
  }
  if (names.ja.includes(normalized)) {
    return { confidence: 0.95, field: 'ja', value: names.ja };
  }

  // 反向包含（用戶輸入更長）
  if (normalized.includes(names.zh.toLowerCase())) {
    return { confidence: 0.9, field: 'zh', value: names.zh };
  }
  if (normalized.includes(names.en.toLowerCase())) {
    return { confidence: 0.9, field: 'en', value: names.en };
  }

  // 模糊匹配（使用編輯距離）
  const zhSimilarity = calculateSimilarity(normalized, names.zh);
  const enSimilarity = calculateSimilarity(normalized, names.en);
  const jaSimilarity = calculateSimilarity(normalized, names.ja);

  const maxSimilarity = Math.max(zhSimilarity, enSimilarity, jaSimilarity);

  // 只有相似度超過 0.6 才認為是匹配
  if (maxSimilarity >= 0.6) {
    if (maxSimilarity === zhSimilarity) {
      return { confidence: maxSimilarity, field: 'zh', value: names.zh };
    } else if (maxSimilarity === enSimilarity) {
      return { confidence: maxSimilarity, field: 'en', value: names.en };
    } else {
      return { confidence: maxSimilarity, field: 'ja', value: names.ja };
    }
  }

  return null;
}

/**
 * 匹配單個雪場
 */
export async function matchResort(input: string): Promise<ResortMatch | null> {
  if (!input || input.trim().length === 0) {
    return null;
  }

  const resorts = await getResorts();
  if (resorts.length === 0) {
    return null;
  }

  const trimmedInput = input.trim();

  // 1. 檢查是否是拼音輸入
  if (isPossiblyPinyin(trimmedInput)) {
    const resortId = pinyinToResortId(trimmedInput);
    if (resortId) {
      // 直接通過 resort ID 查找
      const resort = resorts.find(r => r.resort_id === resortId);
      if (resort) {
        return {
          resort,
          matchedField: 'pinyin',
          matchedValue: trimmedInput,
          confidence: 0.95, // 拼音匹配信心度
        };
      }
    }

    // 如果沒有直接匹配，嘗試轉換為中文名稱
    const chineseName = pinyinToChinese(trimmedInput);
    if (chineseName) {
      const match = await matchResortByName(chineseName, resorts);
      if (match) {
        return {
          ...match,
          matchedField: 'pinyin',
          matchedValue: trimmedInput,
          confidence: Math.min(match.confidence, 0.90),
        };
      }
    }
  }

  // 2. 直接名稱匹配
  return matchResortByName(trimmedInput, resorts);
}

/**
 * 根據名稱匹配雪場
 */
function matchResortByName(
  input: string,
  resorts: Resort[]
): ResortMatch | null {
  let bestMatch: ResortMatch | null = null;

  for (const resort of resorts) {
    const match = matchResortName(input, resort);
    if (match) {
      if (!bestMatch || match.confidence > bestMatch.confidence) {
        bestMatch = {
          resort,
          confidence: match.confidence,
          matchedField: match.field,
          matchedValue: match.value,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * 獲取建議列表（前3個最相似的）
 */
export async function getSuggestions(
  input: string,
  limit: number = 3
): Promise<ResortMatch[]> {
  if (!input || input.trim().length === 0) {
    return [];
  }

  const resorts = await getResorts();
  if (resorts.length === 0) {
    return [];
  }

  const trimmedInput = input.trim();
  const matches: ResortMatch[] = [];

  // 如果是拼音，先嘗試直接匹配 resort ID
  if (isPossiblyPinyin(trimmedInput)) {
    const resortId = pinyinToResortId(trimmedInput);
    if (resortId) {
      const resort = resorts.find(r => r.resort_id === resortId);
      if (resort) {
        return [{
          resort,
          confidence: 0.95,
          matchedField: 'pinyin',
          matchedValue: trimmedInput,
        }];
      }
    }
  }

  // 如果是拼音且沒有直接匹配，嘗試轉換為中文
  let searchInput = trimmedInput;
  if (isPossiblyPinyin(trimmedInput)) {
    const chineseName = pinyinToChinese(trimmedInput);
    if (chineseName) {
      searchInput = chineseName;
    }
  }

  // 收集所有匹配
  for (const resort of resorts) {
    const match = matchResortName(searchInput, resort);
    if (match) {
      matches.push({
        resort,
        confidence: match.confidence,
        matchedField: match.field,
        matchedValue: match.value,
      });
    }
  }

  // 按信心度排序並返回前N個
  return matches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

/**
 * 批量匹配多個雪場名稱
 */
export async function matchResorts(
  inputs: string[]
): Promise<(ResortMatch | null)[]> {
  const results: (ResortMatch | null)[] = [];

  for (const input of inputs) {
    const match = await matchResort(input);
    results.push(match);
  }

  return results;
}

/**
 * 檢查雪場是否存在
 */
export async function resortExists(
  resortId: string
): Promise<boolean> {
  const resorts = await getResorts();
  return resorts.some(r => r.resort_id === resortId);
}

/**
 * 根據 ID 獲取雪場
 */
export async function getResortById(
  resortId: string
): Promise<Resort | null> {
  const resorts = await getResorts();
  return resorts.find(r => r.resort_id === resortId) || null;
}
