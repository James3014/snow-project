/**
 * 雪場匹配器
 * 支援中文、英文、日文名稱匹配，以及拼音和模糊匹配
 */

import { calculateSimilarity } from './levenshtein';
import { pinyinToChinese, pinyinToResortId, isPossiblyPinyin, getAllMatchingResortIds } from './pinyinMapper';
import type { Resort } from '@/shared/data/resorts';
import { resortApiService } from '@/shared/api/resortApi';
import { getLocalResorts } from '@/shared/data/local-resorts';
import { getResortAliases, getResortPriority } from './resortAliases';

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

    // 如果 API 返回空數據，使用本地資料
    if (resortsCache.length === 0) {
      console.warn('API returned empty resorts list, falling back to local data');
      resortsCache = getLocalResorts();
    }

    return resortsCache;
  } catch (error) {
    console.error('Failed to fetch resorts from API, using local fallback data:', error);
    // 如果 API 失敗，使用本地備份數據
    resortsCache = getLocalResorts();
    lastFetchTime = now;
    return resortsCache;
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

  // 獲取雪場的所有別名（按優先級排序：從完整名到通用名）
  const aliases = getResortAliases(resort.resort_id, names.zh);

  let bestMatch: { confidence: number; field: 'zh' | 'en' | 'ja'; value: string } | null = null;

  // 遍歷所有別名進行匹配
  for (let i = 0; i < aliases.length; i++) {
    const alias = aliases[i].toLowerCase();

    // 1. 精確匹配（最高優先級）
    if (normalized === alias) {
      const confidence = i === 0 ? 1.0 : 0.98;  // 第一個別名（完整名）信心度最高
      return { confidence, field: 'zh', value: names.zh };
    }

    // 2. 輸入包含別名（用戶提到了這個雪場）
    if (normalized.includes(alias) && alias.length >= 2) {
      // 信心度根據別名的具體程度：
      // - 越具體的別名（如"白馬八方"）信心度越高
      // - 越通用的別名（如"白馬"）信心度越低
      let confidence = 0.85;

      if (alias.length >= 4) {
        confidence = 0.90;  // 長別名（4+字）更具體
      } else if (alias.length === 3) {
        confidence = 0.87;  // 中等長度（3字）
      } else {
        confidence = 0.80;  // 短別名（2字）需要更謹慎
      }

      // 如果是排在前面的別名（更準確），提升信心度
      if (i === 0) confidence += 0.05;

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { confidence, field: 'zh', value: names.zh };
      }
    }

    // 3. 別名包含輸入（可能是縮寫）
    if (alias.includes(normalized) && normalized.length >= 2) {
      const confidence = 0.75;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { confidence, field: 'zh', value: names.zh };
      }
    }
  }

  // 如果沒有匹配，嘗試模糊匹配（作為後備）
  const zhSimilarity = calculateSimilarity(normalized, names.zh.toLowerCase());
  if (zhSimilarity >= 0.7) {
    return { confidence: zhSimilarity * 0.7, field: 'zh', value: names.zh };
  }

  return bestMatch;
}

/**
 * 匹配單個雪場（增強版：支持中文、多個匹配時返回建議）
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
  const normalizedInput = trimmedInput.toLowerCase();

  // 檢測雪場群關鍵詞（需要用戶進一步選擇）
  const resortGroups = [
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
      filter: (r: Resort) => r.names.zh.includes('湯澤') || r.resort_id.includes('yuzawa_') ||
                           r.names.zh.includes('苗場') || r.names.zh.includes('神樂') ||
                           r.names.zh.includes('石打') || r.names.zh.includes('神立') ||
                           r.names.zh.includes('舞子') || r.names.zh.includes('岩原') ||
                           r.names.zh.includes('上越國際')
    },
  ];

  for (const group of resortGroups) {
    if (group.keywords.some(k => normalizedInput === k || normalizedInput.includes(k))) {
      // 找到所有相關雪場
      const groupResorts = resorts.filter(group.filter);

      if (groupResorts.length > 1) {
        // 返回第一個，但降低信心度，讓系統提供選擇
        return {
          resort: groupResorts[0],
          matchedField: 'zh',
          matchedValue: trimmedInput,
          confidence: 0.5, // 低信心度，觸發建議
        };
      } else if (groupResorts.length === 1) {
        // 只有一個匹配，直接返回
        return {
          resort: groupResorts[0],
          matchedField: 'zh',
          matchedValue: trimmedInput,
          confidence: 0.95,
        };
      }
    }
  }

  // 1. 先嘗試拼音映射（支持中文和英文）
  // 檢查是否有歧義（多個雪場匹配同一個輸入）
  const allMatchingIds = getAllMatchingResortIds(trimmedInput);

  if (allMatchingIds.length === 1) {
    // 唯一匹配，高信心度
    const resort = resorts.find(r => r.resort_id === allMatchingIds[0]);
    if (resort) {
      return {
        resort,
        matchedField: 'pinyin',
        matchedValue: trimmedInput,
        confidence: 0.95,
      };
    }
  } else if (allMatchingIds.length > 1) {
    // 多個匹配，返回第一個但降低信心度（會觸發建議系統）
    const resort = resorts.find(r => r.resort_id === allMatchingIds[0]);
    if (resort) {
      return {
        resort,
        matchedField: 'pinyin',
        matchedValue: trimmedInput,
        confidence: 0.65, // 降低信心度，讓 intentParser 提供建議
      };
    }
  }

  // 2. 如果是拼音（純英文），嘗試轉換為中文
  if (isPossiblyPinyin(trimmedInput)) {
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

  // 3. 直接名稱匹配
  const directMatch = matchResortByName(trimmedInput, resorts);
  if (directMatch) {
    return directMatch;
  }

  // 4. 如果直接匹配失敗，檢查是否有多個部分匹配（返回信心度最高的）
  const partialMatches: ResortMatch[] = [];
  for (const resort of resorts) {
    const match = matchResortName(trimmedInput, resort);
    if (match && match.confidence >= 0.5) {
      partialMatches.push({
        resort,
        confidence: match.confidence,
        matchedField: match.field,
        matchedValue: match.value,
      });
    }
  }

  if (partialMatches.length > 0) {
    // 按信心度排序，信心度相同時按優先級排序
    partialMatches.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) < 0.01) {  // 信心度相差<1%視為相同
        return getResortPriority(b.resort.resort_id) - getResortPriority(a.resort.resort_id);
      }
      return confidenceDiff;
    });
    return partialMatches[0];
  }

  return null;
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
  const normalizedInput = trimmedInput.toLowerCase();
  const matches: ResortMatch[] = [];

  // 檢測雪場群 - 如果匹配到雪場群，返回該群所有雪場
  const resortGroups = [
    {
      keywords: ['白馬', 'hakuba'],
      filter: (r: Resort) => r.names.zh.includes('白馬')
    },
    {
      keywords: ['二世谷', 'niseko', 'ニセコ'],
      filter: (r: Resort) => r.names.zh.includes('二世谷') || r.names.en.toLowerCase().includes('niseko')
    },
    {
      keywords: ['妙高', 'myoko'],
      filter: (r: Resort) => r.names.zh.includes('妙高') || r.names.zh.includes('赤倉') || r.names.zh.includes('新井')
    },
    {
      keywords: ['湯澤', 'yuzawa'],
      filter: (r: Resort) => r.names.zh.includes('湯澤') || r.resort_id.includes('yuzawa_') ||
                           r.names.zh.includes('苗場') || r.names.zh.includes('神樂') ||
                           r.names.zh.includes('石打') || r.names.zh.includes('神立') ||
                           r.names.zh.includes('舞子') || r.names.zh.includes('岩原') ||
                           r.names.zh.includes('上越國際')
    },
  ];

  for (const group of resortGroups) {
    if (group.keywords.some(k => normalizedInput === k || normalizedInput.includes(k))) {
      const groupResorts = resorts.filter(group.filter);
      if (groupResorts.length > 0) {
        return groupResorts.map(r => ({
          resort: r,
          confidence: 0.9,
          matchedField: 'zh' as const,
          matchedValue: trimmedInput,
        }));
      }
    }
  }

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
