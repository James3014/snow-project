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

// 所有雪场列表
export const RESORTS: Resort[] = [RUSUTSU_RESORT];

// 根据 ID 获取雪场
export const getResortById = (resortId: string): Resort | undefined => {
  return RESORTS.find((r) => r.resort_id === resortId);
};

// 获取所有雪场
export const getAllResorts = (): Resort[] => {
  return RESORTS;
};
