/**
 * ResortIndex - 高效的雪场索引系统
 *
 * 核心改进：
 * - 使用 Map 实现 O(1) 查找（替代 O(n) 线性搜索）
 * - 预构建索引，避免重复计算
 * - 清晰的数据结构设计
 *
 * Linus 原则：
 * "Bad programmers worry about the code. Good programmers worry about data structures."
 */

import type { Resort } from '@/shared/data/resorts';
import { getResortAliases, getResortPriority } from './resortAliases';
import { RESORT_GROUPS, MatchConfidence } from './resort-config';
import { calculateSimilarity } from './levenshtein';
import {
  isPossiblyPinyin,
  pinyinToChinese,
  getAllMatchingResortIds,
} from './pinyinMapper';

export interface ResortMatch {
  resort: Resort;
  confidence: number;
  matchedField: 'zh' | 'en' | 'ja' | 'pinyin';
  matchedValue: string;
}

/**
 * 雪场索引类 - 使用 Map 实现高效查找
 */
export class ResortIndex {
  // 核心索引数据结构
  private resortIdMap: Map<string, Resort>;           // resort_id -> Resort
  private exactMatchMap: Map<string, Resort[]>;       // 小写精确名 -> Resort[]
  private aliasMap: Map<string, Resort[]>;            // 小写别名 -> Resort[]
  private groupKeywordMap: Map<string, Resort[]>;     // 雪场群关键词 -> Resort[]
  private resorts: Resort[];

  constructor(resorts: Resort[]) {
    this.resorts = resorts;
    this.resortIdMap = new Map();
    this.exactMatchMap = new Map();
    this.aliasMap = new Map();
    this.groupKeywordMap = new Map();

    this.buildIndexes();
  }

  /**
   * 构建所有索引（一次性计算，后续 O(1) 查找）
   */
  private buildIndexes(): void {
    // 1. 构建 resort_id 索引
    for (const resort of this.resorts) {
      this.resortIdMap.set(resort.resort_id, resort);
    }

    // 2. 构建精确匹配索引（中文、英文、日文名）
    for (const resort of this.resorts) {
      const { zh, en, ja } = resort.names;

      // 中文名
      this.addToIndex(this.exactMatchMap, zh.toLowerCase(), resort);
      // 英文名
      this.addToIndex(this.exactMatchMap, en.toLowerCase(), resort);
      // 日文名
      if (ja) {
        this.addToIndex(this.exactMatchMap, ja.toLowerCase(), resort);
      }
    }

    // 3. 构建别名索引
    for (const resort of this.resorts) {
      const aliases = getResortAliases(resort.resort_id, resort.names.zh);
      for (const alias of aliases) {
        this.addToIndex(this.aliasMap, alias.toLowerCase(), resort);
      }
    }

    // 4. 构建雪场群关键词索引
    for (const group of RESORT_GROUPS) {
      const groupResorts = this.resorts.filter(group.filter);
      for (const keyword of group.keywords) {
        this.groupKeywordMap.set(keyword.toLowerCase(), groupResorts);
      }
    }
  }

  /**
   * 辅助函数：添加到索引 Map
   */
  private addToIndex(map: Map<string, Resort[]>, key: string, resort: Resort): void {
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(resort);
  }

  /**
   * 主匹配方法 - 替代原来的 matchResort()
   */
  match(input: string): ResortMatch | null {
    if (!input || input.trim().length === 0) {
      return null;
    }

    const trimmed = input.trim();
    const normalized = trimmed.toLowerCase();

    // 【优先级1】拼音映射（支持歧义检测）
    const pinyinMatch = this.matchPinyin(trimmed);
    if (pinyinMatch) return pinyinMatch;

    // 【优先级2】精确匹配（中英日文名）
    const exactMatch = this.matchExact(normalized);
    if (exactMatch) return exactMatch;

    // 【优先级3】别名匹配
    const aliasMatch = this.matchAlias(normalized);
    if (aliasMatch) return aliasMatch;

    // 【优先级4】检查雪场群关键词（降低优先级，只在无精确匹配时触发）
    const groupMatch = this.matchGroup(normalized, trimmed);
    if (groupMatch) return groupMatch;

    // 【优先级5】模糊匹配（后备方案）
    const fuzzyMatch = this.matchFuzzy(normalized);
    if (fuzzyMatch) return fuzzyMatch;

    return null;
  }

  /**
   * 获取建议列表
   */
  getSuggestions(input: string, limit: number = 3): ResortMatch[] {
    if (!input || input.trim().length === 0) {
      return [];
    }

    const trimmed = input.trim();
    const normalized = trimmed.toLowerCase();
    const matches: ResortMatch[] = [];

    // 1. 检查雪场群 - 返回群内所有雪场
    // 先尝试精确匹配
    let groupResorts = this.groupKeywordMap.get(normalized);

    // 如果精确匹配失败，尝试 .includes() 匹配（处理"建立行程 妙高"等情况）
    if (!groupResorts) {
      for (const [keyword, resorts] of this.groupKeywordMap) {
        if (normalized.includes(keyword)) {
          groupResorts = resorts;
          break;
        }
      }
    }

    if (groupResorts && groupResorts.length > 0) {
      return groupResorts.map(r => ({
        resort: r,
        confidence: 0.9,
        matchedField: 'zh' as const,
        matchedValue: trimmed,
      }));
    }

    // 2. 拼音直接匹配
    if (isPossiblyPinyin(trimmed)) {
      const resortIds = getAllMatchingResortIds(trimmed);
      for (const resortId of resortIds) {
        const resort = this.resortIdMap.get(resortId);
        if (resort) {
          matches.push({
            resort,
            confidence: 0.95,
            matchedField: 'pinyin',
            matchedValue: trimmed,
          });
        }
      }
      if (matches.length > 0) return matches.slice(0, limit);
    }

    // 3. 收集所有部分匹配
    let searchInput = trimmed;
    if (isPossiblyPinyin(trimmed)) {
      const chineseName = pinyinToChinese(trimmed);
      if (chineseName) {
        searchInput = chineseName;
      }
    }

    for (const resort of this.resorts) {
      const match = this.matchResortName(searchInput.toLowerCase(), resort);
      if (match && match.confidence >= 0.5) {
        matches.push({
          resort,
          confidence: match.confidence,
          matchedField: match.field,
          matchedValue: match.value,
        });
      }
    }

    // 按信心度排序并返回前 N 个
    return matches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // ==================== 私有匹配方法 ====================

  /**
   * 匹配雪场群关键词
   *
   * 优化：只在输入完全等于地区关键词时触发，避免干扰精确匹配
   * 例如："白马" 触发群组，"白马八方" 不触发（应该走别名匹配）
   */
  private matchGroup(normalized: string, original: string): ResortMatch | null {
    for (const [keyword, resorts] of this.groupKeywordMap) {
      // 只匹配完全相等的情况，不使用 includes
      if (normalized === keyword) {
        if (resorts.length === 1) {
          // 唯一匹配，精确信心度
          return {
            resort: resorts[0],
            confidence: MatchConfidence.EXACT,
            matchedField: 'zh',
            matchedValue: original,
          };
        } else if (resorts.length > 1) {
          // 多个匹配，降低信心度触发建议
          return {
            resort: resorts[0],
            confidence: MatchConfidence.LOW,
            matchedField: 'zh',
            matchedValue: original,
          };
        }
      }
    }
    return null;
  }

  /**
   * 拼音匹配（支持歧义检测）
   */
  private matchPinyin(original: string): ResortMatch | null {
    if (!isPossiblyPinyin(original)) {
      return null;
    }

    // 检查拼音映射
    const matchingIds = getAllMatchingResortIds(original);

    if (matchingIds.length === 1) {
      // 唯一匹配
      const resort = this.resortIdMap.get(matchingIds[0]);
      if (resort) {
        return {
          resort,
          confidence: MatchConfidence.EXACT,
          matchedField: 'pinyin',
          matchedValue: original,
        };
      }
    } else if (matchingIds.length > 1) {
      // 歧义匹配
      const resort = this.resortIdMap.get(matchingIds[0]);
      if (resort) {
        return {
          resort,
          confidence: MatchConfidence.LOW,
          matchedField: 'pinyin',
          matchedValue: original,
        };
      }
    }

    // 尝试拼音转中文
    const chineseName = pinyinToChinese(original);
    if (chineseName) {
      const match = this.matchExact(chineseName.toLowerCase());
      if (match) {
        return {
          ...match,
          matchedField: 'pinyin',
          matchedValue: original,
          confidence: MatchConfidence.HIGH,
        };
      }
    }

    return null;
  }

  /**
   * 精确匹配（O(1) 查找）
   */
  private matchExact(normalized: string): ResortMatch | null {
    const resorts = this.exactMatchMap.get(normalized);
    if (!resorts || resorts.length === 0) {
      return null;
    }

    // 如果有多个精确匹配，选择优先级最高的
    const sorted = resorts.sort((a, b) =>
      getResortPriority(b.resort_id) - getResortPriority(a.resort_id)
    );

    return {
      resort: sorted[0],
      confidence: MatchConfidence.EXACT,
      matchedField: 'zh',
      matchedValue: sorted[0].names.zh,
    };
  }

  /**
   * 别名匹配（O(1) 查找）
   */
  private matchAlias(normalized: string): ResortMatch | null {
    const resorts = this.aliasMap.get(normalized);
    if (!resorts || resorts.length === 0) {
      return null;
    }

    // 选择优先级最高的
    const sorted = resorts.sort((a, b) =>
      getResortPriority(b.resort_id) - getResortPriority(a.resort_id)
    );

    return {
      resort: sorted[0],
      confidence: MatchConfidence.EXACT,
      matchedField: 'zh',
      matchedValue: sorted[0].names.zh,
    };
  }

  /**
   * 模糊匹配（后备方案）
   */
  private matchFuzzy(normalized: string): ResortMatch | null {
    const matches: ResortMatch[] = [];

    for (const resort of this.resorts) {
      const match = this.matchResortName(normalized, resort);
      if (match && match.confidence >= 0.5) {
        matches.push({
          resort,
          confidence: match.confidence,
          matchedField: match.field,
          matchedValue: match.value,
        });
      }
    }

    if (matches.length === 0) {
      return null;
    }

    // 按信心度排序，信心度相同时按优先级排序
    matches.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) < 0.01) {
        return getResortPriority(b.resort.resort_id) - getResortPriority(a.resort.resort_id);
      }
      return confidenceDiff;
    });

    return matches[0];
  }

  /**
   * 匹配单个雪场的名称和别名
   */
  private matchResortName(
    input: string,
    resort: Resort
  ): { confidence: number; field: 'zh' | 'en' | 'ja'; value: string } | null {
    const aliases = getResortAliases(resort.resort_id, resort.names.zh);
    let bestMatch: { confidence: number; field: 'zh' | 'en' | 'ja'; value: string } | null = null;

    // 遍历所有别名
    for (let i = 0; i < aliases.length; i++) {
      const alias = aliases[i].toLowerCase();

      // 精确匹配 - 使用 EXACT
      if (input === alias) {
        return {
          confidence: MatchConfidence.EXACT,
          field: 'zh',
          value: resort.names.zh
        };
      }

      // 输入包含别名 - 使用 HIGH（部分匹配）
      if (input.includes(alias) && alias.length >= 2) {
        const confidence = MatchConfidence.HIGH;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { confidence, field: 'zh', value: resort.names.zh };
        }
      }

      // 别名包含输入 - 使用 HIGH（反向部分匹配）
      if (alias.includes(input) && input.length >= 2) {
        const confidence = MatchConfidence.HIGH;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { confidence, field: 'zh', value: resort.names.zh };
        }
      }
    }

    // 模糊匹配（Levenshtein 距离）- 使用 HIGH
    if (!bestMatch) {
      const similarity = calculateSimilarity(input, resort.names.zh.toLowerCase());
      if (similarity >= 0.7) {
        return {
          confidence: MatchConfidence.HIGH,
          field: 'zh',
          value: resort.names.zh,
        };
      }
    }

    return bestMatch;
  }
}
