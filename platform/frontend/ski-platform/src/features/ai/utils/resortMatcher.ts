/**
 * 雪場匹配器
 * 支援中文、英文、日文名稱匹配，以及拼音和模糊匹配
 */

import { calculateSimilarity } from './levenshtein';
import { pinyinToChinese, pinyinToResortId, isPossiblyPinyin, getAllMatchingResortIds } from './pinyinMapper';
import type { Resort } from '@/shared/data/resorts';
import { resortApiService } from '@/shared/api/resortApi';
import { getResortAliases, getResortPriority } from './resortAliases';
import { ResortIndex } from './ResortIndex';

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
    console.error('Failed to fetch resorts from API:', error);
    // 返回緩存（如果有）或空陣列
    return resortsCache || [];
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
 * 匹配雪場名稱（增強版 - 使用別名系統）
 */
function matchResortName(
  input: string,
  resort: Resort
): { confidence: number; field: 'zh' | 'en' | 'ja'; value: string } | null {
  const normalized = input.toLowerCase().trim();
  const { names } = resort;

  // 獲取雪場的所有別名
  const aliases = getResortAliases(resort.resort_id, names.zh);

  let bestMatch: { confidence: number; field: 'zh' | 'en' | 'ja'; value: string } | null = null;

  for (let i = 0; i < aliases.length; i++) {
    const alias = aliases[i].toLowerCase();

    // 1. 精確匹配
    if (normalized === alias) {
      const confidence = i === 0 ? 1.0 : 0.98;
      return { confidence, field: 'zh', value: names.zh };
    }

    // 2. 輸入包含別名
    if (normalized.includes(alias) && alias.length >= 2) {
      let confidence = alias.length >= 4 ? 0.90 : alias.length === 3 ? 0.87 : 0.80;
      if (i === 0) confidence += 0.05;

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { confidence, field: 'zh', value: names.zh };
      }
    }

    // 3. 別名包含輸入
    if (alias.includes(normalized) && normalized.length >= 2) {
      const confidence = 0.75;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { confidence, field: 'zh', value: names.zh };
      }
    }
  }

  // 模糊匹配後備
  const zhSimilarity = calculateSimilarity(normalized, names.zh.toLowerCase());
  if (zhSimilarity >= 0.7) {
    return { confidence: zhSimilarity * 0.7, field: 'zh', value: names.zh };
  }

  return bestMatch;
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
    console.error('[matchResort] 雪場列表為空！');
    return null;
  }

  const trimmedInput = input.trim();
  const normalizedInput = trimmedInput.toLowerCase();

  // 檢測雪場群關鍵詞
  const resortGroups = [
    { keywords: ['白馬', 'hakuba'], filter: (r: Resort) => r.names.zh.includes('白馬') },
    { keywords: ['二世谷', 'niseko', 'ニセコ'], filter: (r: Resort) => r.names.zh.includes('二世谷') || r.names.en.toLowerCase().includes('niseko') },
    { keywords: ['妙高', 'myoko'], filter: (r: Resort) => r.names.zh.includes('妙高') || r.names.zh.includes('赤倉') || r.names.zh.includes('新井') },
    { keywords: ['湯澤', 'yuzawa'], filter: (r: Resort) => r.names.zh.includes('湯澤') || r.resort_id.includes('yuzawa_') || r.names.zh.includes('苗場') || r.names.zh.includes('神樂') || r.names.zh.includes('石打') || r.names.zh.includes('神立') || r.names.zh.includes('舞子') || r.names.zh.includes('岩原') || r.names.zh.includes('上越國際') },
  ];

  for (const group of resortGroups) {
    if (group.keywords.some(k => normalizedInput === k || normalizedInput.includes(k))) {
      const groupResorts = resorts.filter(group.filter);
      if (groupResorts.length > 1) {
        return { resort: groupResorts[0], matchedField: 'zh', matchedValue: trimmedInput, confidence: 0.5 };
      } else if (groupResorts.length === 1) {
        return { resort: groupResorts[0], matchedField: 'zh', matchedValue: trimmedInput, confidence: 0.95 };
      }
    }
  }

  // 1. 拼音映射
  const allMatchingIds = getAllMatchingResortIds(trimmedInput);
  if (allMatchingIds.length === 1) {
    const resort = resorts.find(r => r.resort_id === allMatchingIds[0]);
    if (resort) return { resort, matchedField: 'pinyin', matchedValue: trimmedInput, confidence: 0.95 };
  } else if (allMatchingIds.length > 1) {
    const resort = resorts.find(r => r.resort_id === allMatchingIds[0]);
    if (resort) return { resort, matchedField: 'pinyin', matchedValue: trimmedInput, confidence: 0.65 };
  }

  // 2. 拼音轉中文
  if (isPossiblyPinyin(trimmedInput)) {
    const chineseName = pinyinToChinese(trimmedInput);
    if (chineseName) {
      const match = matchResortByName(chineseName, resorts);
      if (match) return { ...match, matchedField: 'pinyin', matchedValue: trimmedInput, confidence: Math.min(match.confidence, 0.90) };
    }
  }

  // 3. 直接名稱匹配
  const directMatch = matchResortByName(trimmedInput, resorts);
  if (directMatch) return directMatch;

  // 4. 部分匹配
  const partialMatches: ResortMatch[] = [];
  for (const resort of resorts) {
    const match = matchResortName(trimmedInput, resort);
    if (match && match.confidence >= 0.5) {
      partialMatches.push({ resort, confidence: match.confidence, matchedField: match.field, matchedValue: match.value });
    }
  }

  if (partialMatches.length > 0) {
    partialMatches.sort((a, b) => {
      const diff = b.confidence - a.confidence;
      return Math.abs(diff) < 0.01 ? getResortPriority(b.resort.resort_id) - getResortPriority(a.resort.resort_id) : diff;
    });
    return partialMatches[0];
  }

  return null;
}

function matchResortByName(input: string, resorts: Resort[]): ResortMatch | null {
  let bestMatch: ResortMatch | null = null;
  for (const resort of resorts) {
    const match = matchResortName(input, resort);
    if (match && (!bestMatch || match.confidence > bestMatch.confidence)) {
      bestMatch = { resort, confidence: match.confidence, matchedField: match.field, matchedValue: match.value };
    }
  }
  return bestMatch;
}

/**
 * 獲取建議列表
 */
export async function getSuggestions(input: string, limit: number = 3): Promise<ResortMatch[]> {
  if (!input || input.trim().length === 0) return [];

  const resorts = await getResorts();
  if (resorts.length === 0) return [];

  const trimmedInput = input.trim();
  const normalizedInput = trimmedInput.toLowerCase();

  // 檢測雪場群
  const resortGroups = [
    { keywords: ['白馬', 'hakuba'], filter: (r: Resort) => r.names.zh.includes('白馬') },
    { keywords: ['二世谷', 'niseko', 'ニセコ'], filter: (r: Resort) => r.names.zh.includes('二世谷') || r.names.en.toLowerCase().includes('niseko') },
    { keywords: ['妙高', 'myoko'], filter: (r: Resort) => r.names.zh.includes('妙高') || r.names.zh.includes('赤倉') || r.names.zh.includes('新井') },
    { keywords: ['湯澤', 'yuzawa'], filter: (r: Resort) => r.names.zh.includes('湯澤') || r.resort_id.includes('yuzawa_') || r.names.zh.includes('苗場') || r.names.zh.includes('神樂') || r.names.zh.includes('石打') || r.names.zh.includes('神立') || r.names.zh.includes('舞子') || r.names.zh.includes('岩原') || r.names.zh.includes('上越國際') },
  ];

  for (const group of resortGroups) {
    if (group.keywords.some(k => normalizedInput === k || normalizedInput.includes(k))) {
      const groupResorts = resorts.filter(group.filter);
      if (groupResorts.length > 0) {
        return groupResorts.map(r => ({ resort: r, confidence: 0.9, matchedField: 'zh' as const, matchedValue: trimmedInput }));
      }
    }
  }

  // 拼音直接匹配
  if (isPossiblyPinyin(trimmedInput)) {
    const resortId = pinyinToResortId(trimmedInput);
    if (resortId) {
      const resort = resorts.find(r => r.resort_id === resortId);
      if (resort) return [{ resort, confidence: 0.95, matchedField: 'pinyin', matchedValue: trimmedInput }];
    }
  }

  // 拼音轉中文
  let searchInput = trimmedInput;
  if (isPossiblyPinyin(trimmedInput)) {
    const chineseName = pinyinToChinese(trimmedInput);
    if (chineseName) searchInput = chineseName;
  }

  // 收集匹配
  const matches: ResortMatch[] = [];
  for (const resort of resorts) {
    const match = matchResortName(searchInput, resort);
    if (match) matches.push({ resort, confidence: match.confidence, matchedField: match.field, matchedValue: match.value });
  }

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
}

export async function matchResorts(inputs: string[]): Promise<(ResortMatch | null)[]> {
  return Promise.all(inputs.map(input => matchResort(input)));
}

export async function resortExists(resortId: string): Promise<boolean> {
  const resorts = await getResorts();
  return resorts.some(r => r.resort_id === resortId);
}

export async function getResortById(resortId: string): Promise<Resort | null> {
  const resorts = await getResorts();
  return resorts.find(r => r.resort_id === resortId) || null;
}

// ==================== V2 方法（使用 ResortIndex）====================

let resortIndexCache: ResortIndex | null = null;
let indexLastBuildTime = 0;

async function getResortIndex(): Promise<ResortIndex> {
  const now = Date.now();
  if (resortIndexCache && now - indexLastBuildTime < CACHE_DURATION) {
    return resortIndexCache;
  }
  const resorts = await getResorts();
  resortIndexCache = new ResortIndex(resorts);
  indexLastBuildTime = now;
  return resortIndexCache;
}

export async function matchResortV2(input: string): Promise<ResortMatch | null> {
  const index = await getResortIndex();
  return index.match(input);
}

export async function getSuggestionsV2(input: string, limit: number = 3): Promise<ResortMatch[]> {
  const index = await getResortIndex();
  return index.getSuggestions(input, limit);
}

export function clearResortIndexCache(): void {
  resortIndexCache = null;
  indexLastBuildTime = 0;
}
