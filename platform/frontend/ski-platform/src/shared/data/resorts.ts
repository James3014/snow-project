/**
 * Resort Data
 * 雪场数据
 *
 * 注意：这是临时的静态数据文件。
 * 未来应该通过 API 从后端获取数据。
 */

export interface Course {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  avg_slope: number;
  max_slope: number;
  notes?: string;
}

export interface Resort {
  resort_id: string;
  names: {
    zh: string;
    en: string;
    ja: string;
  };
  country_code: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  snow_stats: {
    lifts: number;
    courses_total: number;
    beginner_ratio: number;
    intermediate_ratio: number;
    advanced_ratio: number;
    longest_run: number;
    vertical_drop: number;
    night_ski: boolean;
  };
  courses: Course[];
  description?: {
    highlights: string[];
    tagline: string;
  };
}

// Rusutsu Resort 数据
export const RUSUTSU_RESORT: Resort = {
  resort_id: 'rusutsu',
  names: {
    zh: '留寿都度假村',
    en: 'Rusutsu Resort',
    ja: 'ルスツリゾート',
  },
  country_code: 'JP',
  region: '北海道',
  coordinates: {
    lat: 42.7475,
    lng: 140.89639,
  },
  snow_stats: {
    lifts: 18,
    courses_total: 37,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 3.5,
    vertical_drop: 594,
    night_ski: true,
  },
  description: {
    highlights: ['北海道最大单一度假村', '粉雪天堂', '家庭友善', '树林滑雪'],
    tagline: '北海道规模最大的单一度假村，一个提供全年景点的大型多功能目的地。',
  },
  courses: [
    // === 初级雪道 (BEGINNER) ===
    {
      name: 'Family Course / ファミリーコース',
      level: 'beginner',
      tags: ['family-friendly', 'wide'],
      avg_slope: 10,
      max_slope: 12,
    },
    {
      name: 'White Rubber Course / ホワイトラバーコース',
      level: 'beginner',
      tags: ['beginner-friendly'],
      avg_slope: 10,
      max_slope: 15,
    },
    {
      name: 'Isola Course / イゾラコース',
      level: 'beginner',
      tags: ['scenic'],
      avg_slope: 12,
      max_slope: 15,
    },
    {
      name: 'Rainbow Course / レインボーコース',
      level: 'beginner',
      tags: ['family-friendly'],
      avg_slope: 12,
      max_slope: 18,
    },
    {
      name: 'Rabbit Course / ラビットコース',
      level: 'beginner',
      tags: ['short'],
      avg_slope: 10,
      max_slope: 15,
    },
    {
      name: 'Tomte Course / トムテコース',
      level: 'beginner',
      tags: ['beginner-friendly'],
      avg_slope: 11,
      max_slope: 15,
    },
    {
      name: 'Sapporo Weisse Course / サッポロヴァイスコース',
      level: 'beginner',
      tags: ['beginner-friendly'],
      avg_slope: 12,
      max_slope: 18,
    },
    {
      name: 'Fountain Street Course / ファウンテンストリートコース',
      level: 'beginner',
      tags: ['wide'],
      avg_slope: 10,
      max_slope: 15,
    },

    // === 中级雪道 (INTERMEDIATE) ===
    {
      name: 'Isola 2 Course / イゾラ2コース',
      level: 'intermediate',
      tags: ['scenic'],
      avg_slope: 18,
      max_slope: 23,
    },
    {
      name: 'Wonder Course / ワンダーコース',
      level: 'intermediate',
      tags: ['popular'],
      avg_slope: 20,
      max_slope: 25,
    },
    {
      name: 'Highland Course / ハイランドコース',
      level: 'intermediate',
      tags: ['tree-skiing'],
      avg_slope: 18,
      max_slope: 22,
    },
    {
      name: 'Stella Course / ステラコース',
      level: 'intermediate',
      tags: ['cruising'],
      avg_slope: 20,
      max_slope: 25,
    },
    {
      name: 'Vale Course / ヴェールコース',
      level: 'intermediate',
      tags: ['wide'],
      avg_slope: 19,
      max_slope: 24,
    },
    {
      name: 'Snow Cruise / スノークルーズ',
      level: 'intermediate',
      tags: ['long-run'],
      avg_slope: 18,
      max_slope: 22,
    },
    {
      name: 'Heaven Course / ヘブンコース',
      level: 'intermediate',
      tags: ['scenic'],
      avg_slope: 20,
      max_slope: 25,
    },
    {
      name: 'Powder River Course / パウダーリバーコース',
      level: 'intermediate',
      tags: ['powder'],
      avg_slope: 19,
      max_slope: 23,
    },
    {
      name: 'East Mt. Course / イーストマウントコース',
      level: 'intermediate',
      tags: ['tree-skiing'],
      avg_slope: 21,
      max_slope: 26,
    },
    {
      name: 'West Mt. Course / ウエストマウントコース',
      level: 'intermediate',
      tags: ['cruising'],
      avg_slope: 20,
      max_slope: 25,
    },

    // === 高级雪道 (ADVANCED) ===
    {
      name: 'Super East Course / スーパーイーストコース',
      level: 'advanced',
      tags: ['steep', 'moguls'],
      avg_slope: 28,
      max_slope: 35,
    },
    {
      name: 'White Lover Course / ホワイトラバーコース',
      level: 'advanced',
      tags: ['steep'],
      avg_slope: 30,
      max_slope: 38,
    },
    {
      name: 'Hercules Course / ハーキュリースコース',
      level: 'advanced',
      tags: ['steep', 'challenging'],
      avg_slope: 32,
      max_slope: 40,
    },
    {
      name: 'Mt. Isola Course / マウントイゾラコース',
      level: 'advanced',
      tags: ['steep', 'expert'],
      avg_slope: 30,
      max_slope: 36,
    },
    {
      name: 'Sidewinder Course / サイドワインダーコース',
      level: 'advanced',
      tags: ['technical'],
      avg_slope: 28,
      max_slope: 34,
    },
    {
      name: 'Duke Course / デュークコース',
      level: 'advanced',
      tags: ['steep'],
      avg_slope: 29,
      max_slope: 35,
    },
    {
      name: 'Shiretoko Course / 知床コース',
      level: 'advanced',
      tags: ['tree-skiing', 'powder'],
      avg_slope: 27,
      max_slope: 33,
    },
    {
      name: 'Daisetsu Course / 大雪コース',
      level: 'advanced',
      tags: ['tree-skiing'],
      avg_slope: 26,
      max_slope: 32,
    },
    {
      name: 'Free Ride Park Course / フリーライドパークコース',
      level: 'advanced',
      tags: ['park', 'jumps'],
      avg_slope: 25,
      max_slope: 30,
    },
    {
      name: 'Off-Piste Zone A / オフピステゾーンA',
      level: 'advanced',
      tags: ['off-piste', 'powder'],
      avg_slope: 30,
      max_slope: 40,
      notes: '需要特殊装备和经验',
    },
    {
      name: 'Off-Piste Zone B / オフピステゾーンB',
      level: 'advanced',
      tags: ['off-piste', 'tree-skiing'],
      avg_slope: 28,
      max_slope: 35,
      notes: '需要特殊装备和经验',
    },
    {
      name: 'Tree Run Area 1 / ツリーランエリア1',
      level: 'advanced',
      tags: ['tree-skiing', 'powder'],
      avg_slope: 26,
      max_slope: 32,
    },
    {
      name: 'Tree Run Area 2 / ツリーランエリア2',
      level: 'advanced',
      tags: ['tree-skiing'],
      avg_slope: 27,
      max_slope: 33,
    },
    {
      name: 'Night Skiing Course A / ナイトスキーコースA',
      level: 'intermediate',
      tags: ['night-skiing', 'popular'],
      avg_slope: 20,
      max_slope: 25,
      notes: '仅夜间开放',
    },
    {
      name: 'Night Skiing Course B / ナイトスキーコースB',
      level: 'intermediate',
      tags: ['night-skiing'],
      avg_slope: 18,
      max_slope: 23,
      notes: '仅夜间开放',
    },
    {
      name: 'Sunset Paradise / サンセットパラダイス',
      level: 'intermediate',
      tags: ['scenic', 'cruising'],
      avg_slope: 19,
      max_slope: 24,
    },
    {
      name: 'Morning Glory Course / モーニンググローリーコース',
      level: 'beginner',
      tags: ['wide', 'morning-special'],
      avg_slope: 11,
      max_slope: 16,
    },
  ],
};

// Niseko (二世谷) Resort 数据
export const NISEKO_RESORT: Resort = {
  resort_id: 'niseko',
  names: {
    zh: '二世谷',
    en: 'Niseko',
    ja: 'ニセコ',
  },
  country_code: 'JP',
  region: '北海道',
  coordinates: {
    lat: 42.8048,
    lng: 140.6874,
  },
  snow_stats: {
    lifts: 38,
    courses_total: 70,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 5.5,
    vertical_drop: 940,
    night_ski: true,
  },
  description: {
    highlights: ['世界級粉雪', '國際化度假村', '豐富餐飲選擇', '溫泉設施'],
    tagline: '北海道最知名的國際滑雪勝地，以優質粉雪聞名全球。',
  },
  courses: [],
};

// Hakuba (白馬) Resort 数据
export const HAKUBA_RESORT: Resort = {
  resort_id: 'hakuba',
  names: {
    zh: '白馬',
    en: 'Hakuba',
    ja: '白馬',
  },
  country_code: 'JP',
  region: '長野縣',
  coordinates: {
    lat: 36.6997,
    lng: 137.8311,
  },
  snow_stats: {
    lifts: 139,
    courses_total: 200,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 8.0,
    vertical_drop: 1071,
    night_ski: true,
  },
  description: {
    highlights: ['1998冬奧會場地', '多個雪場互通', '壯麗山景', '適合各級滑雪者'],
    tagline: '長野縣白馬村，擁有多個世界級滑雪場的大型滑雪區域。',
  },
  courses: [],
};

// Furano (富良野) Resort 数据
export const FURANO_RESORT: Resort = {
  resort_id: 'furano',
  names: {
    zh: '富良野',
    en: 'Furano',
    ja: '富良野',
  },
  country_code: 'JP',
  region: '北海道',
  coordinates: {
    lat: 43.3333,
    lng: 142.3833,
  },
  snow_stats: {
    lifts: 11,
    courses_total: 28,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 4.0,
    vertical_drop: 952,
    night_ski: false,
  },
  description: {
    highlights: ['優質粉雪', '家庭友善', '薰衣草之鄉', '樹冰景觀'],
    tagline: '北海道中部的滑雪勝地，夏季以薰衣草田聞名。',
  },
  courses: [],
};

// Changbai Mountain (長白山) Resort 数据
export const CHANGBAI_RESORT: Resort = {
  resort_id: 'changbai',
  names: {
    zh: '長白山',
    en: 'Changbai Mountain',
    ja: '長白山',
  },
  country_code: 'CN',
  region: '吉林省',
  coordinates: {
    lat: 42.0106,
    lng: 128.0565,
  },
  snow_stats: {
    lifts: 9,
    courses_total: 43,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 5.0,
    vertical_drop: 930,
    night_ski: true,
  },
  description: {
    highlights: ['國內頂級雪場', '雪期長', '設施完善', '天池景觀'],
    tagline: '中國東北最著名的滑雪勝地，擁有優質的雪況和完善設施。',
  },
  courses: [],
};

// Shiga Kogen (志賀高原) Resort 数据
export const SHIGA_RESORT: Resort = {
  resort_id: 'shiga',
  names: {
    zh: '志賀高原',
    en: 'Shiga Kogen',
    ja: '志賀高原',
  },
  country_code: 'JP',
  region: '長野縣',
  coordinates: {
    lat: 36.7444,
    lng: 138.5261,
  },
  snow_stats: {
    lifts: 52,
    courses_total: 80,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.5,
    advanced_ratio: 0.2,
    longest_run: 6.0,
    vertical_drop: 939,
    night_ski: false,
  },
  description: {
    highlights: ['日本最大雪場', '一票多場', '雪質優良', '高海拔雪場'],
    tagline: '長野縣最大的滑雪區域，由多個雪場組成的廣闊滑雪地帶。',
  },
  courses: [],
};

// Yuzawa (湯澤) Resort 数据
export const YUZAWA_RESORT: Resort = {
  resort_id: 'yuzawa',
  names: {
    zh: '湯澤',
    en: 'Yuzawa',
    ja: '湯沢',
  },
  country_code: 'JP',
  region: '新潟縣',
  coordinates: {
    lat: 36.9333,
    lng: 138.8167,
  },
  snow_stats: {
    lifts: 35,
    courses_total: 65,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 6.0,
    vertical_drop: 1181,
    night_ski: true,
  },
  description: {
    highlights: ['交通便利', '多個雪場', '溫泉鄉', '距東京近'],
    tagline: '新潟縣湯澤町，距離東京僅90分鐘車程的滑雪度假區。',
  },
  courses: [],
};

// Zao (藏王) Resort 数据
export const ZAO_RESORT: Resort = {
  resort_id: 'zao',
  names: {
    zh: '藏王',
    en: 'Zao',
    ja: '蔵王',
  },
  country_code: 'JP',
  region: '山形縣',
  coordinates: {
    lat: 38.1428,
    lng: 140.4553,
  },
  snow_stats: {
    lifts: 41,
    courses_total: 42,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 9.0,
    vertical_drop: 881,
    night_ski: false,
  },
  description: {
    highlights: ['樹冰奇觀', '溫泉勝地', '長雪道', '纜車觀光'],
    tagline: '山形縣著名雪場，以壯觀的樹冰景觀和優質溫泉聞名。',
  },
  courses: [],
};

// 所有雪场列表
export const RESORTS: Resort[] = [
  NISEKO_RESORT,
  HAKUBA_RESORT,
  RUSUTSU_RESORT,
  FURANO_RESORT,
  CHANGBAI_RESORT,
  SHIGA_RESORT,
  YUZAWA_RESORT,
  ZAO_RESORT,
];

// 根据 ID 获取雪场
export const getResortById = (resortId: string): Resort | undefined => {
  return RESORTS.find((r) => r.resort_id === resortId);
};

// 获取所有雪场
export const getAllResorts = (): Resort[] => {
  return RESORTS;
};
