/**
 * 雪場別名配置
 * 為每個雪場定義所有可能的稱呼方式
 */

export interface ResortAliases {
  resort_id: string;
  aliases: string[];  // 所有可能的稱呼，從最具體到最通用
  priority: number;   // 優先級（處理歧義時使用）
}

/**
 * 手動定義的雪場別名
 * 優先級：10 = 最知名，5 = 一般，1 = 較少人知道
 */
export const RESORT_ALIASES: ResortAliases[] = [
  // === 北海道 ===
  {
    resort_id: 'hokkaido_niseko_moiwa',
    aliases: ['二世谷Moiwa滑雪場', '二世谷Moiwa', '二世谷moiwa', 'niseko moiwa', 'niseko', '二世谷'],
    priority: 9,
  },
  {
    resort_id: 'hokkaido_rusutsu',
    aliases: ['留壽都度假村', '留壽都', 'rusutsu'],
    priority: 9,
  },
  {
    resort_id: 'hokkaido_tomamu',
    aliases: ['星野集團TOMAMU度假村', '星野TOMAMU', 'TOMAMU', 'tomamu', '星野', 'hoshino'],
    priority: 10,  // 最知名的星野雪場
  },
  {
    resort_id: 'fukushima_nekoma_mountain',
    aliases: ['星野集團 NEKOMA MOUNTAIN', '星野NEKOMA', 'NEKOMA', 'nekoma'],
    priority: 5,  // 較少人知道的星野雪場
  },
  {
    resort_id: 'hokkaido_furano',
    aliases: ['富良野滑雪度假村', '富良野', 'furano'],
    priority: 8,
  },

  // === 長野：白馬地區 ===
  {
    resort_id: 'hakuba_happo_one',
    aliases: ['白馬八方尾根滑雪場', '白馬八方尾根', '白馬八方', '八方尾根', '八方', 'hakuba happo', 'happo'],
    priority: 9,
  },
  {
    resort_id: 'hakuba_goryu_47',
    aliases: ['白馬五龍 & Hakuba47 滑雪場', '白馬五龍', '白馬47', '五龍', 'hakuba 47', 'goryu'],
    priority: 8,
  },
  {
    resort_id: 'hakuba_cortina',
    aliases: ['白馬Cortina滑雪場', '白馬Cortina', 'cortina'],
    priority: 7,
  },
  {
    resort_id: 'hakuba_iwatake',
    aliases: ['白馬岩岳滑雪場', '白馬岩岳', '岩岳', 'iwatake'],
    priority: 7,
  },
  {
    resort_id: 'hakuba_tsugaike',
    aliases: ['白馬栂池高原滑雪場', '白馬栂池', '栂池', 'tsugaike'],
    priority: 7,
  },
  {
    resort_id: 'hakuba_norikura',
    aliases: ['白馬乗鞍溫泉滑雪場', '白馬乗鞍', '乗鞍', 'norikura'],
    priority: 6,
  },

  // === 長野：其他 ===
  {
    resort_id: 'nagano_nozawa_onsen',
    aliases: ['野澤溫泉滑雪場', '野澤溫泉', '野澤', 'nozawa onsen', 'nozawa'],
    priority: 9,
  },

  // === 新潟：湯澤地區 ===
  {
    resort_id: 'yuzawa_naeba',
    aliases: ['苗場滑雪場', '苗場', 'naeba'],
    priority: 10,
  },
  {
    resort_id: 'yuzawa_kagura',
    aliases: ['神樂滑雪場', '神樂', 'kagura'],
    priority: 8,
  },
  {
    resort_id: 'yuzawa_gala',
    aliases: ['GALA湯澤滑雪場', 'GALA湯澤', 'GALA', 'gala yuzawa', 'gala'],
    priority: 8,
  },
];

/**
 * 從雪場名稱自動提取核心詞
 */
export function extractCoreNames(fullName: string): string[] {
  const coreNames: string[] = [];

  // 移除通用後綴
  const withoutSuffix = fullName
    .replace(/滑雪場|度假村|滑雪度假村|滑雪公園|溫泉|高原|雪場/g, '')
    .trim();

  if (withoutSuffix.length >= 2) {
    coreNames.push(withoutSuffix);
  }

  // 分割複合名稱（用空格、&、/等分隔）
  const parts = withoutSuffix.split(/[\s&\/]+/).filter(p => p.length >= 2);
  coreNames.push(...parts);

  // 提取連續的中文字符（至少2個字）
  const chineseParts = withoutSuffix.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  coreNames.push(...chineseParts);

  // 去重
  return [...new Set(coreNames)];
}

/**
 * 獲取雪場的所有別名（包括手動定義和自動提取）
 */
export function getResortAliases(resort_id: string, fullName: string): string[] {
  // 先找手動定義的別名
  const manual = RESORT_ALIASES.find(r => r.resort_id === resort_id);
  if (manual) {
    return manual.aliases;
  }

  // 否則自動提取
  return [fullName, ...extractCoreNames(fullName)];
}

/**
 * 獲取雪場優先級（用於處理歧義）
 */
export function getResortPriority(resort_id: string): number {
  const manual = RESORT_ALIASES.find(r => r.resort_id === resort_id);
  return manual?.priority || 5;  // 默認優先級 5
}
