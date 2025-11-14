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
    aliases: ['留壽都度假村', '留壽都', '留寿都', 'rusutsu'],
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
  {
    resort_id: 'hokkaido_sapporo_teine',
    aliases: ['札幌手稻滑雪場', '札幌手稻', '手稻', 'sapporo teine', 'teine'],
    priority: 7,
  },

  // === 長野：白馬地區 ===
  {
    resort_id: 'hakuba_happo_one',
    aliases: ['白馬八方尾根滑雪場', '白馬八方尾根', '白马八方尾根', '白馬八方', '白马八方', '八方尾根', '八方', 'hakuba happo', 'happo one', 'happo'],
    priority: 9,
  },
  {
    resort_id: 'hakuba_goryu_47',
    aliases: ['白馬五龍 & Hakuba47 滑雪場', '白馬五龍', '白马五龙', '白馬47', '白马47', '五龍', '五龙', 'hakuba 47', 'hakuba47', 'goryu'],
    priority: 8,
  },
  {
    resort_id: 'hakuba_cortina',
    aliases: ['白馬Cortina滑雪場', '白馬Cortina', '白马Cortina', 'hakuba cortina', 'cortina'],
    priority: 7,
  },
  {
    resort_id: 'hakuba_iwatake',
    aliases: ['白馬岩岳滑雪場', '白馬岩岳', '白马岩岳', '岩岳', 'hakuba iwatake', 'iwatake'],
    priority: 7,
  },
  {
    resort_id: 'hakuba_tsugaike_kogen',
    aliases: ['白馬栂池高原滑雪場', '白馬栂池', '白马栂池', '栂池', 'hakuba tsugaike', 'tsugaike'],
    priority: 7,
  },
  {
    resort_id: 'hakuba_norikura',
    aliases: ['白馬乗鞍溫泉滑雪場', '白馬乗鞍', '白马乘鞍', '乗鞍', '乘鞍', 'hakuba norikura', 'norikura'],
    priority: 6,
  },

  // === 長野：其他 ===
  {
    resort_id: 'nagano_nozawa_onsen',
    aliases: ['野澤溫泉滑雪場', '野澤溫泉', '野泽温泉', '野澤', '野泽', 'nozawa onsen', 'nozawa'],
    priority: 9,
  },
  {
    resort_id: 'nagano_karuizawa_prince',
    aliases: ['輕井澤王子大飯店滑雪場', '輕井澤王子', '轻井泽王子', '輕井澤', '轻井泽', 'karuizawa prince', 'karuizawa'],
    priority: 8,
  },
  {
    resort_id: 'nagano_kurohime_kogen',
    aliases: ['黑姬高原滑雪場', '黑姬高原', '黑姬', 'kurohime'],
    priority: 6,
  },
  {
    resort_id: 'nagano_madarao_kogen',
    aliases: ['斑尾高原滑雪場', '斑尾高原', '斑尾', 'madarao'],
    priority: 6,
  },
  {
    resort_id: 'nagano_ryuoo_ski_park',
    aliases: ['竜王滑雪公園', '龍王', '龙王', '竜王', 'ryuoo'],
    priority: 7,
  },

  // === 新潟：妙高地區 ===
  {
    resort_id: 'myoko_akakura_kanko',
    aliases: ['赤倉觀光雪場', '赤倉觀光', '赤仓观光', '赤倉', '赤仓', 'akakura kanko'],
    priority: 8,
  },
  {
    resort_id: 'myoko_akakura_onsen',
    aliases: ['赤倉溫泉滑雪場', '赤倉溫泉', '赤仓温泉', 'akakura onsen'],
    priority: 7,
  },
  {
    resort_id: 'myoko_ikenotaira',
    aliases: ['妙高池之平溫泉滑雪場', '妙高池之平', '池之平', 'ikenotaira'],
    priority: 7,
  },
  {
    resort_id: 'myoko_lotte_arai',
    aliases: ['樂天新井度假村', '樂天新井', '乐天新井', '新井', 'lotte arai', 'arai'],
    priority: 8,
  },
  {
    resort_id: 'myoko_suginohara',
    aliases: ['妙高杉之原滑雪場', '妙高杉之原', '杉之原', 'suginohara'],
    priority: 7,
  },

  // === 新潟：湯澤地區 ===
  {
    resort_id: 'yuzawa_naeba',
    aliases: ['苗場滑雪場', '苗場', '苗场', 'naeba'],
    priority: 10,
  },
  {
    resort_id: 'yuzawa_kagura',
    aliases: ['神樂滑雪場', '神樂', '神乐', 'kagura'],
    priority: 8,
  },
  {
    resort_id: 'yuzawa_gala',
    aliases: ['GALA湯澤滑雪場', 'GALA湯澤', 'GALA汤泽', 'GALA', 'gala yuzawa', 'gala'],
    priority: 8,
  },
  {
    resort_id: 'yuzawa_ishiuchi_maruyama',
    aliases: ['石打丸山滑雪場', '石打丸山', '石打', 'ishiuchi maruyama', 'ishiuchi'],
    priority: 7,
  },
  {
    resort_id: 'yuzawa_iwappara',
    aliases: ['岩原滑雪場', '岩原', 'iwappara'],
    priority: 7,
  },
  {
    resort_id: 'yuzawa_joetsu_kokusai',
    aliases: ['上越國際滑雪場', '上越國際', '上越国际', '上越', 'joetsu kokusai', 'joetsu'],
    priority: 8,
  },
  {
    resort_id: 'yuzawa_kandatsu',
    aliases: ['神立高原滑雪場', '神立高原', '神立', 'kandatsu'],
    priority: 7,
  },
  {
    resort_id: 'yuzawa_maiko_kogen',
    aliases: ['舞子高原滑雪場', '舞子高原', '舞子', 'maiko'],
    priority: 7,
  },
  {
    resort_id: 'yuzawa_nakazato',
    aliases: ['湯澤中里滑雪度假村', '湯澤中里', '汤泽中里', '中里', 'nakazato'],
    priority: 7,
  },
  {
    resort_id: 'yuzawa_naspa_ski_garden',
    aliases: ['NASPA滑雪花園', 'NASPA', 'naspa'],
    priority: 7,
  },
  {
    resort_id: 'yuzawa_park',
    aliases: ['湯澤公園滑雪場', '湯澤公園', '汤泽公园', 'yuzawa park'],
    priority: 7,
  },

  // === 其他地區 ===
  {
    resort_id: 'fukushima_inawashiro',
    aliases: ['猪苗代滑雪場', '猪苗代', '豬苗代滑雪場', '豬苗代', 'inawashiro'],
    priority: 6,
  },
  {
    resort_id: 'gunma_marunuma_kogen',
    aliases: ['丸沼高原滑雪場', '丸沼高原', '丸沼', 'marunuma'],
    priority: 6,
  },
  {
    resort_id: 'gunma_minakami_kogen',
    aliases: ['水上高原滑雪度假村', '水上高原', '水上', 'minakami'],
    priority: 6,
  },
  {
    resort_id: 'gunma_oze_iwakura',
    aliases: ['尾瀨岩鞍滑雪場', '尾瀨岩鞍', '尾濑岩鞍', '岩鞍', 'oze iwakura', 'iwakura'],
    priority: 6,
  },
  {
    resort_id: 'gunma_white_valley',
    aliases: ['群馬White Valley滑雪場', 'White Valley', 'white valley'],
    priority: 6,
  },
  {
    resort_id: 'iwate_appi_kogen',
    aliases: ['安比高原滑雪場', '安比高原', '安比', 'appi'],
    priority: 7,
  },
  {
    resort_id: 'iwate_shizukuishi',
    aliases: ['雫石滑雪場', '雫石', 'shizukuishi'],
    priority: 6,
  },
  {
    resort_id: 'tochigi_edelweiss',
    aliases: ['Edelweiss滑雪場', 'Edelweiss', 'edelweiss'],
    priority: 5,
  },
  {
    resort_id: 'tochigi_hunter_mountain_shiobara',
    aliases: ['Hunter Mountain鹽原滑雪場', 'Hunter Mountain', 'hunter mountain'],
    priority: 6,
  },
  {
    resort_id: 'yamagata_zao_onsen',
    aliases: ['藏王溫泉滑雪場', '藏王溫泉', '藏王', '蔵王温泉', '蔵王', 'zao onsen', 'zao'],
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
  const parts = withoutSuffix.split(/[\s&/]+/).filter(p => p.length >= 2);
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
