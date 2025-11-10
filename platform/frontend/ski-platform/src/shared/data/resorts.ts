/**
 * Resort Data
 * 雪場數據
 *
 * 注意：這是從資料庫同步的數據。
 * 資料來源：specs/resort-services/data/
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

export const INAWASHIRO_RESORT: Resort = {
  resort_id: "fukushima_inawashiro",
  names: {
    zh: "\u732a\u82d7\u4ee3\u6ed1\u96ea\u5834",
    en: "Inawashiro Ski Resort",
    ja: "\u732a\u82d7\u4ee3\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Fukushima Prefecture",
  coordinates: {
    lat: 37.58139,
    lng: 140.0925,
  },
  snow_stats: {
    lifts: 9,
    courses_total: 18,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.3,
    advanced_ratio: 0.3,
    longest_run: 3.0,
    vertical_drop: 650,
    night_ski: true,
  },
  description: {
    highlights: ["\u7d55\u666f\u6ed1\u96ea\u5834", "\u732a\u82d7\u4ee3\u6e56\u666f", "\u9ad8CP\u503c", "\u5e73\u65e5\u514d\u8cbb"],
    tagline: "\u5728\u58ef\u9e97\u7684\u732a\u82d7\u4ee3\u6e56\u5168\u666f\u4e0b\uff0c\u4eab\u53d7\u7121\u8207\u502b\u6bd4\u7684\u9ad8\u6027\u50f9\u6bd4\u6ed1\u96ea\u9ad4\u9a57\u3002",
  },
  courses: [
  {
    name: "Chuo Line (\u4e2d\u592e\u30e9\u30a4\u30f3)",
    level: "intermediate",
    tags: ["cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Akahani Giant Slalom Course (\u8d64\u57f4\u5927\u56de\u8ee2\u30b3\u30fc\u30b9)",
    level: "advanced",
    tags: ["moguls", "un-groomed", "steep"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Hayama Course (\u8449\u5c71\u30b3\u30fc\u30b9)",
    level: "beginner",
    tags: ["beginner-friendly", "gentle-slope"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const NEKOMA_MOUNTAIN_RESORT: Resort = {
  resort_id: "fukushima_nekoma_mountain",
  names: {
    zh: "\u661f\u91ce\u96c6\u5718 NEKOMA MOUNTAIN",
    en: "Hoshino Resorts NEKOMA MOUNTAIN",
    ja: "\u661f\u91ce\u30ea\u30be\u30fc\u30c8 \u30cd\u30b3\u30de \u30de\u30a6\u30f3\u30c6\u30f3",
  },
  country_code: "JP",
  region: "Fukushima Prefecture",
  coordinates: {
    lat: 37.6,
    lng: 140.04,
  },
  snow_stats: {
    lifts: 13,
    courses_total: 33,
    beginner_ratio: 0.35,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.25,
    longest_run: 4.0,
    vertical_drop: 586,
    night_ski: true,
  },
  description: {
    highlights: ["\u96d9\u5cf0\u5408\u4e00", "\u8d85\u5fae\u7d30\u96ea", "\u78d0\u68af\u5c71\u6eab\u6cc9\u98ef\u5e97", "\u5730\u5f62\u516c\u5712"],
    tagline: "\u5728\u78d0\u68af\u5c71\u9ad4\u9a57\u5169\u7a2e\u622a\u7136\u4e0d\u540c\u7684\u6ed1\u96ea\u6a02\u8da3\uff0c\u5f9e\u967d\u5149\u5de1\u822a\u5230\u6975\u81f4\u7c89\u96ea\u3002",
  },
  courses: [
  {
    name: "Deep 1",
    level: "advanced",
    tags: ["powder", "un-groomed", "steep"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "White Valley 2",
    level: "advanced",
    tags: ["powder", "un-groomed", "moguls"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Frozen 2",
    level: "advanced",
    tags: ["powder", "un-groomed", "scenic-view"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const MARUNUMA_KOGEN_RESORT: Resort = {
  resort_id: "gunma_marunuma_kogen",
  names: {
    zh: "\u4e38\u6cbc\u9ad8\u539f\u6ed1\u96ea\u5834",
    en: "Marunuma Kogen Ski Resort",
    ja: "\u4e38\u6cbc\u9ad8\u539f\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Gunma Prefecture",
  coordinates: {
    lat: 36.81389,
    lng: 139.33333,
  },
  snow_stats: {
    lifts: 8,
    courses_total: 20,
    beginner_ratio: 0.45,
    intermediate_ratio: 0.45,
    advanced_ratio: 0.1,
    longest_run: 4.0,
    vertical_drop: 600,
    night_ski: false,
  },
  description: {
    highlights: ["\u9ad8\u6d77\u62d4\u7c89\u96ea", "4\u516c\u91cc\u9577\u6ed1\u9053", "\u8d85\u9577\u96ea\u5b63", "\u5730\u5f62\u516c\u5712"],
    tagline: "\u5728\u95dc\u6771\u5730\u5340\u9ad4\u9a57\u53ef\u8207\u5317\u6d77\u9053\u76f8\u5ab2\u7f8e\u7684\u9802\u7d1a\u9ad8\u5c71\u96ea\u6cc1\u3002",
  },
  courses: [
  {
    name: "Karakura Course (\u304b\u3089\u304f\u3089\u30b3\u30fc\u30b9)",
    level: "intermediate",
    tags: ["cruising", "scenic-view"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Silver Course (\u30b7\u30eb\u30d0\u30fc\u30b3\u30fc\u30b9)",
    level: "advanced",
    tags: ["steep", "un-groomed", "moguls"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Blue Course (\u30d6\u30eb\u30fc\u30b3\u30fc\u30b9)",
    level: "beginner",
    tags: ["beginner-friendly", "wide"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const MINAKAMI_KOGEN_RESORT: Resort = {
  resort_id: "gunma_minakami_kogen",
  names: {
    zh: "\u6c34\u4e0a\u9ad8\u539f\u6ed1\u96ea\u5ea6\u5047\u6751",
    en: "Minakami Kogen Ski Resort",
    ja: "\u6c34\u4e0a\u9ad8\u539f\u30b9\u30ad\u30fc\u30ea\u30be\u30fc\u30c8",
  },
  country_code: "JP",
  region: "Gunma Prefecture",
  coordinates: {
    lat: 36.854654,
    lng: 139.076318,
  },
  snow_stats: {
    lifts: 4,
    courses_total: 12,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.3,
    advanced_ratio: 0.3,
    longest_run: 3.0,
    vertical_drop: 398,
    night_ski: true,
  },
  description: {
    highlights: ["\u5bb6\u5ead\u6a02\u5712", "\u72d7\u62c9\u96ea\u6a47", "\u5bf6\u53ef\u5922\u96ea\u796d", "\u6eab\u6cc9"],
    tagline: "\u5c08\u70ba\u5bb6\u5ead\u6253\u9020\u7684\u65e5\u672c\u96ea\u570b\u51ac\u5b63\u4ed9\u5883\uff0c\u63d0\u4f9b\u8c50\u5bcc\u7684\u975e\u6ed1\u96ea\u6d3b\u52d5\u3002",
  },
  courses: [
  {
    name: "Sui Sui Family Course (\u3059\u3044\u3059\u3044\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9)",
    level: "beginner",
    tags: ["beginner-friendly", "family-friendly"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Kumabokkosu Course (\u718a\u307c\u3063\u3053\u3059\u30b3\u30fc\u30b9)",
    level: "advanced",
    tags: ["un-groomed", "powder", "moguls"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Forest Exploration Course (\u6797\u9593\u304d\u3089\u3081\u304d\u30b3\u30fc\u30b9)",
    level: "intermediate",
    tags: ["tree-lined", "cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const OZE_IWAKURA_RESORT: Resort = {
  resort_id: "gunma_oze_iwakura",
  names: {
    zh: "\u5c3e\u7028\u5ca9\u978d\u6ed1\u96ea\u5834",
    en: "White World Oze Iwakura",
    ja: "\u30db\u30ef\u30a4\u30c8\u30ef\u30fc\u30eb\u30c9\u5c3e\u702c\u5ca9\u978d",
  },
  country_code: "JP",
  region: "Gunma Prefecture",
  coordinates: {
    lat: 36.81833,
    lng: 139.21111,
  },
  snow_stats: {
    lifts: 10,
    courses_total: 18,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 3.2,
    vertical_drop: 697,
    night_ski: true,
  },
  description: {
    highlights: ["\u95dc\u6771\u6700\u5927\u7d1a", "Gun-Powder", "\u5bb6\u5ead\u53cb\u5584", "\u6eab\u6cc9"],
    tagline: "\u7fa4\u99ac\u7684\u7c89\u96ea\u5929\u5802\uff0c\u95dc\u6771\u5730\u5340\u898f\u6a21\u6700\u5927\u7684\u6ed1\u96ea\u5834\u4e4b\u4e00\u3002",
  },
  courses: [
  {
    name: "Family Course (\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9)",
    level: "beginner",
    tags: ["beginner-friendly", "wide", "gentle-slope"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Milky Way (\u30df\u30eb\u30ad\u30fc\u30a6\u30a7\u30a4)",
    level: "intermediate",
    tags: ["long-run", "cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Expert Course",
    level: "advanced",
    tags: ["steep"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const WHITE_VALLEY_RESORT: Resort = {
  resort_id: "gunma_white_valley",
  names: {
    zh: "\u7fa4\u99acWhite Valley\u6ed1\u96ea\u5834",
    en: "Gunma White Valley Ski Resort",
    ja: "\u7fa4\u99ac\u307f\u306a\u304b\u307f\u30db\u30ef\u30a4\u30c8\u30d0\u30ec\u30fc\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Gunma Prefecture",
  coordinates: {
    lat: 36.79639,
    lng: 138.96111,
  },
  snow_stats: {
    lifts: 2,
    courses_total: 5,
    beginner_ratio: 0.2,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.4,
    longest_run: 1.0,
    vertical_drop: 380,
    night_ski: false,
  },
  description: {
    highlights: ["\u7c89\u96ea\u611b\u597d\u8005\u7684\u79c1\u623f\u666f\u9ede", "\u975e\u58d3\u96ea", "\u4eba\u6f6e\u7a00\u5c11", "\u5728\u5730\u611f"],
    tagline: "\u6c34\u4e0a\u5730\u5340\u7684\u7c89\u96ea\u79d8\u5bc6\u57fa\u5730\uff0c\u4eab\u53d7\u7121\u4eba\u6253\u64fe\u7684\u6ed1\u96ea\u6642\u5149\u3002",
  },
  courses: [
  {
    name: "Fantasy Course",
    level: "beginner",
    tags: ["beginner-friendly", "wide"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "White Heaven Course",
    level: "intermediate",
    tags: ["long-run", "scenic-view"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const FURANO_RESORT: Resort = {
  resort_id: "hokkaido_furano",
  names: {
    zh: "\u5bcc\u826f\u91ce\u6ed1\u96ea\u5ea6\u5047\u6751",
    en: "Furano Ski Resort",
    ja: "\u5bcc\u826f\u91ce\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Hokkaido",
  coordinates: {
    lat: 43.33278,
    lng: 142.33222,
  },
  snow_stats: {
    lifts: 9,
    courses_total: 26,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 4.0,
    vertical_drop: 839,
    night_ski: true,
  },
  description: {
    highlights: ["\u9999\u6ab3\u7c89\u96ea", "\u96d9\u5340\u57df", "\u5bb6\u5ead\u53cb\u5584", "\u68ee\u6797\u7cbe\u9748\u9732\u53f0"],
    tagline: "\u5728\u5317\u6d77\u9053\u7684\u7c89\u96ea\u5730\u5e36\uff0c\u9ad4\u9a57\u9802\u7d1a\u7c89\u96ea\u8207\u6975\u81f4\u81ea\u7136\u7f8e\u666f\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u5317\u306e\u5cf0\u30be\u30fc\u30f3\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u5bcc\u826f\u91ce\u30be\u30fc\u30f3\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30d7\u30ea\u30f3\u30b9\u30b3\u30fc\u30b9\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u5317\u306e\u5cf0\u30be\u30fc\u30f3\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u5bcc\u826f\u91ce\u30be\u30fc\u30f3\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u30d7\u30ea\u30f3\u30b9\u30b3\u30fc\u30b9\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 16.0,
    max_slope: 16.0,
    
  },
  {
    name: "\u30c0\u30a6\u30f3\u30d2\u30eb\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30c0\u30a4\u30ca\u30df\u30c3\u30af\u30d0\u30fc\u30f3",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u5317\u306e\u5cf0\u30be\u30fc\u30f3\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u5bcc\u826f\u91ce\u30be\u30fc\u30f3\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30d7\u30ea\u30f3\u30b9\u30b3\u30fc\u30b9\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 29.0,
    max_slope: 29.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 33.0,
    max_slope: 33.0,
    
  },
  {
    name: "\u30b9\u30fc\u30d1\u30fc\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30d6\u30e9\u30c3\u30af\u30c0\u30a4\u30e4\u30e2\u30f3\u30c9",
    level: "advanced",
    tags: [],
    avg_slope: 35.0,
    max_slope: 35.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30c8\u30ea\u30fc\u30e0\u30be\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 38.0,
    max_slope: 38.0,
    
  },
  {
    name: "\u30c1\u30e3\u30f3\u30d4\u30aa\u30f3\u30b7\u30c3\u30d7",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30de\u30b9\u30bf\u30fc\u30ba\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30c6\u30af\u30cb\u30ab\u30eb\u30d0\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30c1\u30e3\u30ec\u30f3\u30b8\u30be\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 34.0,
    max_slope: 34.0,
    
  },
  {
    name: "\u30b9\u30e9\u30ed\u30fc\u30e0\u30d0\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  }
  ],
};

export const NISEKO_MOIWA_RESORT: Resort = {
  resort_id: "hokkaido_niseko_moiwa",
  names: {
    zh: "\u4e8c\u4e16\u8c37Moiwa\u6ed1\u96ea\u5834",
    en: "Niseko Moiwa Ski Resort",
    ja: "\u30cb\u30bb\u30b3\u30e2\u30a4\u30ef\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Hokkaido",
  coordinates: {
    lat: 42.848039,
    lng: 140.629644,
  },
  snow_stats: {
    lifts: 3,
    courses_total: 8,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 2.0,
    vertical_drop: 450,
    night_ski: false,
  },
  description: {
    highlights: ["\u7c89\u96ea", "\u4eba\u6f6e\u7a00\u5c11", "\u79c1\u4eba\u611f", "\u6a39\u6797\u6ed1\u96ea"],
    tagline: "\u4eab\u53d7\u30cb\u30bb\u30b3\u7684\u512a\u8cea\u7c89\u96ea\uff0c\u9ad4\u9a57\u79c1\u4eba\u822c\u7684\u6ed1\u96ea\u6642\u5149\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30b9\u30fc\u30d1\u30fc\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30d6\u30e9\u30c3\u30af\u30c0\u30a4\u30e4\u30e2\u30f3\u30c9",
    level: "advanced",
    tags: [],
    avg_slope: 35.0,
    max_slope: 35.0,
    
  }
  ],
};

export const RUSUTSU_RESORT: Resort = {
  resort_id: "hokkaido_rusutsu",
  names: {
    zh: "\u7559\u58fd\u90fd\u5ea6\u5047\u6751",
    en: "Rusutsu Resort",
    ja: "\u30eb\u30b9\u30c4\u30ea\u30be\u30fc\u30c8",
  },
  country_code: "JP",
  region: "Hokkaido",
  coordinates: {
    lat: 42.7475,
    lng: 140.89639,
  },
  snow_stats: {
    lifts: 18,
    courses_total: 36,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 3.5,
    vertical_drop: 594,
    night_ski: true,
  },
  description: {
    highlights: ["\u5317\u6d77\u9053\u6700\u5927\u55ae\u4e00\u5ea6\u5047\u6751", "\u7c89\u96ea\u5929\u5802", "\u5bb6\u5ead\u53cb\u5584", "\u6a39\u6797\u6ed1\u96ea"],
    tagline: "\u5317\u6d77\u9053\u898f\u6a21\u6700\u5927\u7684\u55ae\u4e00\u5ea6\u5047\u6751\uff0c\u4e00\u500b\u63d0\u4f9b\u5168\u5e74\u666f\u9ede\u7684\u5927\u578b\u591a\u529f\u80fd\u76ee\u7684\u5730\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2A",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2B",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u30a6\u30a8\u30b9\u30c8\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u30a4\u30fc\u30b9\u30c8\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30a4\u30be\u30e9\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 9.0,
    max_slope: 9.0,
    
  },
  {
    name: "\u30ad\u30c3\u30ba\u30d1\u30fc\u30af",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u30d3\u30ae\u30ca\u30fc\u30d1\u30e9\u30c0\u30a4\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30b9\u30de\u30a4\u30eb\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9A",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9B",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9C",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30a6\u30a8\u30b9\u30c8\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30a4\u30fc\u30b9\u30c8\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u30a4\u30be\u30e9\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 16.0,
    max_slope: 16.0,
    
  },
  {
    name: "\u30c0\u30a6\u30f3\u30d2\u30eb\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30b9\u30ab\u30a4\u30e9\u30a4\u30f3\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30c0\u30a4\u30ca\u30df\u30c3\u30af\u30d0\u30fc\u30f3",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u30ed\u30f3\u30b0\u30af\u30eb\u30fc\u30ba",
    level: "intermediate",
    tags: [],
    avg_slope: 15.0,
    max_slope: 15.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9A",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9B",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9C",
    level: "advanced",
    tags: [],
    avg_slope: 25.0,
    max_slope: 25.0,
    
  },
  {
    name: "\u30a6\u30a8\u30b9\u30c8\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30a4\u30fc\u30b9\u30c8\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 27.0,
    max_slope: 27.0,
    
  },
  {
    name: "\u30a4\u30be\u30e9\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30d0\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u6025\u659c\u9762\u30c1\u30e3\u30ec\u30f3\u30b8",
    level: "advanced",
    tags: [],
    avg_slope: 33.0,
    max_slope: 33.0,
    
  },
  {
    name: "\u30d6\u30e9\u30c3\u30af\u30c0\u30a4\u30e4\u30e2\u30f3\u30c9A",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30d6\u30e9\u30c3\u30af\u30c0\u30a4\u30e4\u30e2\u30f3\u30c9B",
    level: "advanced",
    tags: [],
    avg_slope: 34.0,
    max_slope: 34.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30c8\u30ea\u30fc\u30e0\u30be\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 36.0,
    max_slope: 36.0,
    
  },
  {
    name: "\u30b5\u30a4\u30c9\u30ab\u30f3\u30c8\u30ea\u30fc",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30b9\u30fc\u30d1\u30fc\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30c1\u30e3\u30f3\u30d4\u30aa\u30f3\u30b7\u30c3\u30d7",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30de\u30b9\u30bf\u30fc\u30ba\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  }
  ],
};

export const SAPPORO_TEINE_RESORT: Resort = {
  resort_id: "hokkaido_sapporo_teine",
  names: {
    zh: "\u672d\u5e4c\u624b\u7a3b\u6ed1\u96ea\u5834",
    en: "Sapporo Teine Ski Resort",
    ja: "\u30b5\u30c3\u30dd\u30ed\u30c6\u30a4\u30cd\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Hokkaido",
  coordinates: {
    lat: 43.0965,
    lng: 141.2025,
  },
  snow_stats: {
    lifts: 15,
    courses_total: 13,
    beginner_ratio: 0.31,
    intermediate_ratio: 0.38,
    advanced_ratio: 0.31,
    longest_run: 6.0,
    vertical_drop: 683,
    night_ski: true,
  },
  description: {
    highlights: ["1972\u5e74\u672d\u5e4c\u51ac\u5b63\u5967\u904b\u6703\u5834\u5730", "\u5169\u5927\u96ea\u5340", "\u9130\u8fd1\u672d\u5e4c\u5e02\u5340", "\u7c89\u96ea"],
    tagline: "\u66fe\u8209\u8fa6\u672d\u5e4c\u51ac\u5b63\u5967\u904b\u6703\u7684\u6b77\u53f2\u540d\u5834\uff0c\u64c1\u6709\u5967\u6797\u5339\u4e9e\u548c\u9ad8\u5730\u5169\u5927\u96ea\u5340\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30aa\u30ea\u30f3\u30d4\u30a2\u30be\u30fc\u30f3\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u30cf\u30a4\u30e9\u30f3\u30c9\u30be\u30fc\u30f3\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30aa\u30ea\u30f3\u30d4\u30a2\u30be\u30fc\u30f3\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u30cf\u30a4\u30e9\u30f3\u30c9\u30be\u30fc\u30f3\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 16.0,
    max_slope: 16.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u30aa\u30ea\u30f3\u30d4\u30a2\u30be\u30fc\u30f3\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30cf\u30a4\u30e9\u30f3\u30c9\u30be\u30fc\u30f3\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 33.0,
    max_slope: 33.0,
    
  }
  ],
};

export const TOMAMU_RESORT: Resort = {
  resort_id: "hokkaido_tomamu",
  names: {
    zh: "\u661f\u91ce\u96c6\u5718TOMAMU\u5ea6\u5047\u6751",
    en: "Hoshino Resorts TOMAMU",
    ja: "\u661f\u91ce\u30ea\u30be\u30fc\u30c8 \u30c8\u30de\u30e0",
  },
  country_code: "JP",
  region: "Hokkaido",
  coordinates: {
    lat: 43.066793,
    lng: 142.634809,
  },
  snow_stats: {
    lifts: 6,
    courses_total: 29,
    beginner_ratio: 0.35,
    intermediate_ratio: 0.5,
    advanced_ratio: 0.15,
    longest_run: 4.2,
    vertical_drop: 699,
    night_ski: true,
  },
  description: {
    highlights: ["\u81ea\u7136\u5947\u89c0\u5ea6\u5047\u6751", "\u611b\u7d72\u51b0\u57ce", "\u5fae\u7b11\u6d77\u7058", "\u9727\u51b0\u5e73\u53f0", "\u7c89\u96ea"],
    tagline: "\u5728\u4f54\u5730\u5ee3\u90541,000\u516c\u9803\u7684\u5c71\u6797\u9593\uff0c\u9ad4\u9a57\u5168\u65b9\u4f4d\u7684\u5317\u6d77\u9053\u51ac\u5b63\u5947\u89c0\u3002",
  },
  courses: [
  {
    name: "Silver Bell",
    level: "beginner",
    tags: ["long-run", "beginner-friendly"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Glory",
    level: "advanced",
    tags: ["powder", "un-groomed"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const APPI_KOGEN_RESORT: Resort = {
  resort_id: "iwate_appi_kogen",
  names: {
    zh: "\u5b89\u6bd4\u9ad8\u539f\u6ed1\u96ea\u5834",
    en: "Appi Kogen Ski Resort",
    ja: "\u5b89\u6bd4\u9ad8\u539f\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Iwate Prefecture",
  coordinates: {
    lat: 40.002249,
    lng: 140.97061,
  },
  snow_stats: {
    lifts: 11,
    courses_total: 21,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 5.5,
    vertical_drop: 805,
    night_ski: true,
  },
  description: {
    highlights: ["\u963f\u65af\u5339\u9748\u7c89\u96ea", "\u9577\u8ddd\u96e2\u5de1\u822a\u5929\u5802", "\u6a39\u6797\u6ed1\u96ea", "\u4e16\u754c\u6ed1\u96ea\u5927\u734e"],
    tagline: "\u5728\u65e5\u672c\u6771\u5317\u7684\u9802\u7d1a\u6ed1\u96ea\u5ea6\u5047\u6751\uff0c\u9ad4\u9a57\u50b3\u8aaa\u4e2d\u7684\u300e\u963f\u65af\u5339\u9748\u7c89\u96ea\u300f\u3002",
  },
  courses: [
  {
    name: "Yamabato Course (\u5c71\u9ce9\u96ea\u9053)",
    level: "beginner",
    tags: ["long-run", "beginner-friendly", "scenic-view"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Hayabusa Course (\u96bc\u96ea\u9053)",
    level: "intermediate",
    tags: ["long-run", "wide", "cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Daini Sailer A (\u7b2c\u4e8c\u30b6\u30a4\u30e9\u30fcA)",
    level: "advanced",
    tags: ["steep", "un-groomed", "moguls"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Attack (Tree Run Zone)",
    level: "advanced",
    tags: ["tree-run", "powder", "off-piste"],
    avg_slope: 0,
    max_slope: 0,
    notes: "\u9032\u5165\u9700\u767b\u8a18\u4e26\u4f69\u6234\u5b89\u5168\u5e3d\u3002",
  }
  ],
};

export const SHIZUKUISHI_RESORT: Resort = {
  resort_id: "iwate_shizukuishi",
  names: {
    zh: "\u96eb\u77f3\u6ed1\u96ea\u5834",
    en: "Shizukuishi Ski Resort",
    ja: "\u96eb\u77f3\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Iwate Prefecture",
  coordinates: {
    lat: 39.78556,
    lng: 140.90833,
  },
  snow_stats: {
    lifts: 6,
    courses_total: 20,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.25,
    advanced_ratio: 0.45,
    longest_run: 2.6,
    vertical_drop: 721,
    night_ski: false,
  },
  description: {
    highlights: ["\u963f\u65af\u5339\u9748\u7c89\u96ea", "\u4e16\u754c\u9326\u6a19\u8cfd\u907a\u7522", "CAT Skiing", "\u9ad8\u5009\u6eab\u6cc9"],
    tagline: "\u57281993\u5e74\u4e16\u754c\u9326\u6a19\u8cfd\u7684\u50b3\u5947\u8cfd\u9053\u4e0a\uff0c\u9ad4\u9a57\u65e5\u672c\u6771\u5317\u7684\u9802\u7d1a\u7c89\u96ea\u3002",
  },
  courses: [
  {
    name: "Joyful",
    level: "intermediate",
    tags: ["cruising", "long-run"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Daini Sailer A (\u7b2c\u4e8c\u30b6\u30a4\u30e9\u30fcA)",
    level: "advanced",
    tags: ["steep", "un-groomed", "moguls"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const HAKUBA_CORTINA_RESORT: Resort = {
  resort_id: "hakuba_cortina",
  names: {
    zh: "\u767d\u99acCortina\u6ed1\u96ea\u5834",
    en: "Hakuba Cortina Ski Resort",
    ja: "\u767d\u99ac\u30b3\u30eb\u30c1\u30ca\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.776543,
    lng: 137.888657,
  },
  snow_stats: {
    lifts: 7,
    courses_total: 16,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.3,
    advanced_ratio: 0.3,
    longest_run: 3.5,
    vertical_drop: 530,
    night_ski: true,
  },
  description: {
    highlights: ["\u7c89\u96ea\u5929\u5802", "\u6a39\u6797\u6ed1\u96ea\u8056\u5730", "100%\u7d14\u5929\u7136\u96ea", "\u81ea\u7531\u6ed1\u884c"],
    tagline: "\u767d\u99ac\u5c71\u8c37\u6700\u5317\u7aef\u7684\u7c89\u96ea\u5929\u5802\u8207\u6a39\u6797\u6ed1\u96ea\u8056\u5730\u3002",
  },
  courses: [
  {
    name: "Ikenota Gelande (\u6c60\u306e\u7530\u30b2\u30ec\u30f3\u30c7)",
    level: "beginner",
    tags: ["beginner-friendly", "wide", "gentle-slope"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Hiedayama Course 2 (\u7a17\u7530\u5c71\u30b3\u30fc\u30b92)",
    level: "advanced",
    tags: ["steep", "powder", "un-groomed"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Giant Course (\u30b8\u30e3\u30a4\u30a2\u30f3\u30c8\u30b3\u30fc\u30b9)",
    level: "advanced",
    tags: ["steep", "un-groomed"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Itadaira Course (\u677f\u5e73\u30b3\u30fc\u30b9)",
    level: "advanced",
    tags: ["moguls", "un-groomed"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const HAKUBA_GORYU_47_RESORT: Resort = {
  resort_id: "hakuba_goryu_47",
  names: {
    zh: "\u767d\u99ac\u4e94\u9f8d & Hakuba47 \u6ed1\u96ea\u5834",
    en: "Hakuba Goryu & Hakuba47 Winter Sports Park",
    ja: "\u30a8\u30a4\u30d6\u30eb\u767d\u99ac\u4e94\u7adc & Hakuba47",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.662937,
    lng: 137.836664,
  },
  snow_stats: {
    lifts: 12,
    courses_total: 24,
    beginner_ratio: 0.35,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.25,
    longest_run: 6.4,
    vertical_drop: 926,
    night_ski: true,
  },
  description: {
    highlights: ["\u96d9\u5b50\u661f\u7d50\u69cb", "\u521d\u5b78\u8005\u5b8c\u7f8e\u6416\u7c43", "\u9802\u7d1a\u5730\u5f62\u516c\u5712", "\u6eab\u6cc9"],
    tagline: "\u4e00\u5f35\u7e9c\u8eca\u7968\uff0c\u66a2\u904a\u5169\u5ea7\u98a8\u683c\u4e92\u88dc\u7684\u5c71\u8108\uff0c\u5f9e\u521d\u5b78\u8005\u7684\u6a02\u5712\u5230\u516c\u5712\u73a9\u5bb6\u7684\u8056\u5730\u3002",
  },
  courses: [
  {
    name: "Toomi Zone (\u3068\u304a\u307f\u30b2\u30ec\u30f3\u30c7)",
    level: "beginner",
    tags: ["beginner-friendly", "wide", "long-run", "night-skiing"],
    avg_slope: 0,
    max_slope: 0,
    notes: "Toomi\u7b2c\u4e00\u7e9c\u8eca\u5c0d\u55ae\u677f\u521d\u5b78\u8005\u975e\u5e38\u53cb\u597d\u3002",
  },
  {
    name: "Iimori Zone (\u3044\u3044\u3082\u308a\u30b2\u30ec\u30f3\u30c7)",
    level: "beginner",
    tags: ["beginner-friendly", "ski-school"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Alps-daira (\u30a2\u30eb\u30d7\u30b9\u5e73\u30b2\u30ec\u30f3\u30c7)",
    level: "intermediate",
    tags: ["scenic-view", "powder"],
    avg_slope: 0,
    max_slope: 0,
    notes: "\u5f9e\u6b64\u8655\u53ef\u9023\u63a5\u81f3Hakuba47\u3002",
  },
  {
    name: "47 PARKS",
    level: "advanced",
    tags: ["terrain-park", "half-pipe", "freestyle"],
    avg_slope: 0,
    max_slope: 0,
    notes: "\u4f4d\u65bcHakuba47\u5340\u57df\u3002",
  }
  ],
};

export const HAKUBA_HAPPO_ONE_RESORT: Resort = {
  resort_id: "hakuba_happo_one",
  names: {
    zh: "\u767d\u99ac\u516b\u65b9\u5c3e\u6839\u6ed1\u96ea\u5834",
    en: "Hakuba Happo-one Ski Resort",
    ja: "\u767d\u99ac\u516b\u65b9\u5c3e\u6839\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.702528,
    lng: 137.836806,
  },
  snow_stats: {
    lifts: 27,
    courses_total: 16,
    beginner_ratio: 0.2,
    intermediate_ratio: 0.5,
    advanced_ratio: 0.3,
    longest_run: 8.0,
    vertical_drop: 1071,
    night_ski: true,
  },
  description: {
    highlights: ["\u5967\u904b\u7d1a\u6311\u6230", "Japow\u7c89\u96ea", "\u570b\u969b\u5316\u6c1b\u570d", "\u9577\u8ddd\u96e2\u6ed1\u9053"],
    tagline: "\u57281998\u5e74\u9577\u91ce\u5967\u904b\u8cfd\u9053\u4e0a\uff0c\u9ad4\u9a57\u4e16\u754c\u7d1a\u7684\u6311\u6230\u8207\u58ef\u9e97\u3002",
  },
  courses: [
  {
    name: "Sakka Slope (\u54b2\u82b1\u30b2\u30ec\u30f3\u30c7)",
    level: "beginner",
    tags: ["beginner-friendly", "wide", "gentle-slope", "family-friendly"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Nakiyama Slope (\u540d\u6728\u5c71\u30b2\u30ec\u30f3\u30c7)",
    level: "beginner",
    tags: ["beginner-friendly", "night-skiing"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Riesen Slalom Course (\u30ea\u30fc\u30bc\u30f3\u30b9\u30e9\u30ed\u30fc\u30e0)",
    level: "intermediate",
    tags: ["long-run", "wide", "cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Skyline Course (\u30b9\u30ab\u30a4\u30e9\u30a4\u30f3\u30b3\u30fc\u30b9)",
    level: "intermediate",
    tags: ["long-run", "scenic-view"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const HAKUBA_IWATAKE_RESORT: Resort = {
  resort_id: "hakuba_iwatake",
  names: {
    zh: "\u767d\u99ac\u5ca9\u5cb3\u6ed1\u96ea\u5834",
    en: "Hakuba Iwatake Snow Field",
    ja: "\u767d\u99ac\u5ca9\u5cb3\u30b9\u30ce\u30fc\u30d5\u30a3\u30fc\u30eb\u30c9",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.716652,
    lng: 137.859097,
  },
  snow_stats: {
    lifts: 12,
    courses_total: 26,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.5,
    advanced_ratio: 0.2,
    longest_run: 3.3,
    vertical_drop: 539,
    night_ski: false,
  },
  description: {
    highlights: ["360\u5ea6\u5168\u666f", "\u5c71\u5cb3\u5ea6\u5047\u6751", "HAKUBA MOUNTAIN HARBOR", "THE CITY BAKERY"],
    tagline: "\u5750\u64c1\u767d\u99ac\u8c37\u9748\u9b42\u7684360\u5ea6\u5168\u666f\u8996\u91ce\u3002",
  },
  courses: [
  {
    name: "South Slope",
    level: "beginner",
    tags: ["beginner-friendly", "wide", "scenic-view"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Sunny Valley Course",
    level: "intermediate",
    tags: ["long-run", "cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "DANGAN",
    level: "advanced",
    tags: ["steep"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "VIEW A",
    level: "advanced",
    tags: ["powder", "un-groomed", "bowl"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const HAKUBA_NORIKURA_RESORT: Resort = {
  resort_id: "hakuba_norikura",
  names: {
    zh: "\u767d\u99ac\u4e57\u978d\u6eab\u6cc9\u6ed1\u96ea\u5834",
    en: "Hakuba Norikura Onsen Ski Resort",
    ja: "\u767d\u99ac\u4e57\u978d\u6e29\u6cc9\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.763616,
    lng: 137.876077,
  },
  snow_stats: {
    lifts: 9,
    courses_total: 14,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.5,
    advanced_ratio: 0.2,
    longest_run: 2.5,
    vertical_drop: 600,
    night_ski: false,
  },
  description: {
    highlights: ["100%\u81ea\u7136\u964d\u96ea", "\u5bb6\u5ead\u53cb\u5584", "\u7c89\u96ea\u79d8\u5883", "\u5bf5\u7269\u53cb\u5584"],
    tagline: "\u767d\u99ac\u5c71\u8c37\u5317\u7aef\u7684\u7c89\u96ea\u79d8\u5883\uff0c\u4eab\u53d7100%\u7d14\u5929\u7136\u96ea\u3002",
  },
  courses: [
  {
    name: "Hakunori Family Course (\u306f\u304f\u306e\u308a\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9)",
    level: "beginner",
    tags: ["beginner-friendly", "gentle-slope"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Expert Course",
    level: "advanced",
    tags: ["steep", "un-groomed"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const HAKUBA_TSUGAIKE_KOGEN_RESORT: Resort = {
  resort_id: "hakuba_tsugaike_kogen",
  names: {
    zh: "\u767d\u99ac\u6802\u6c60\u9ad8\u539f\u6ed1\u96ea\u5834",
    en: "Hakuba Tsugaike Kogen Ski Resort",
    ja: "\u6802\u6c60\u9ad8\u539f\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.75056,
    lng: 137.86444,
  },
  snow_stats: {
    lifts: 19,
    courses_total: 10,
    beginner_ratio: 0.8,
    intermediate_ratio: 0.0,
    advanced_ratio: 0.2,
    longest_run: 4.9,
    vertical_drop: 904,
    night_ski: true,
  },
  description: {
    highlights: ["\u521d\u5b78\u8005\u5929\u5802", "\u53cb\u5584\u5de8\u4eba", "\u8d85\u5bec\u95ca\u96ea\u9053", "\u5bb6\u5ead\u53cb\u5584"],
    tagline: "\u5728\u5317\u963f\u723e\u5351\u65af\u7684\u53cb\u5584\u5de8\u4eba\u4e0a\uff0c\u9ad4\u9a57\u65e5\u672c\u6700\u5bec\u95ca\u7684\u521d\u5b78\u8005\u96ea\u9053\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u9418\u306e\u9cf4\u308b\u4e18\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u89aa\u306e\u539f\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u9418\u306e\u9cf4\u308b\u4e18\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u89aa\u306e\u539f\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u9418\u306e\u9cf4\u308b\u4e18\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  }
  ],
};

export const KARUIZAWA_PRINCE_RESORT: Resort = {
  resort_id: "nagano_karuizawa_prince",
  names: {
    zh: "\u8f15\u4e95\u6fa4\u738b\u5b50\u5927\u98ef\u5e97\u6ed1\u96ea\u5834",
    en: "Karuizawa Prince Hotel Ski Resort",
    ja: "\u8efd\u4e95\u6ca2\u30d7\u30ea\u30f3\u30b9\u30db\u30c6\u30eb\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.33611,
    lng: 138.64611,
  },
  snow_stats: {
    lifts: 9,
    courses_total: 17,
    beginner_ratio: 0.58,
    intermediate_ratio: 0.21,
    advanced_ratio: 0.21,
    longest_run: 1.5,
    vertical_drop: 215,
    night_ski: true,
  },
  description: {
    highlights: ["\u4ea4\u901a\u4fbf\u5229", "\u4eba\u5de5\u9020\u96ea", "\u5bb6\u5ead\u53cb\u5584", "Outlet\u8cfc\u7269", "\u6674\u5929\u7387\u9ad8"],
    tagline: "\u5f9e\u6771\u4eac\u642d\u4e58\u65b0\u5e79\u7dda\u7d041\u5c0f\u6642\uff0c\u4eab\u53d7\u8cfc\u7269\u8207\u6ed1\u96ea\u6a02\u8da3\u7684\u4fbf\u5229\u578b\u6ed1\u96ea\u5834\u3002",
  },
  courses: [
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u521d\u7d1a\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u304f\u308a\u306e\u6728\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30d7\u30ea\u30f3\u30b9\u30b2\u30ec\u30f3\u30c7",
    level: "intermediate",
    tags: [],
    avg_slope: 15.0,
    max_slope: 15.0,
    
  },
  {
    name: "\u30d1\u30e9\u30ec\u30eb\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30c1\u30e3\u30ec\u30f3\u30b8\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u30a2\u30ea\u30a8\u30b9\u30ab\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u6d45\u9593\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 16.0,
    max_slope: 16.0,
    
  },
  {
    name: "\u96e2\u5c71\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 25.0,
    max_slope: 25.0,
    
  },
  {
    name: "\u30c6\u30af\u30cb\u30ab\u30eb\u30d0\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u6025\u659c\u9762",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30b9\u30e9\u30ed\u30fc\u30e0\u30d0\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u6700\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30c0\u30a4\u30ca\u30df\u30c3\u30af\u30d0\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 24.0,
    max_slope: 24.0,
    
  }
  ],
};

export const KUROHIME_KOGEN_RESORT: Resort = {
  resort_id: "nagano_kurohime_kogen",
  names: {
    zh: "\u9ed1\u59ec\u9ad8\u539f\u6ed1\u96ea\u516c\u5712",
    en: "Kurohime Kogen Snow Park",
    ja: "\u9ed2\u59eb\u9ad8\u539f\u30b9\u30ce\u30fc\u30d1\u30fc\u30af",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.82583,
    lng: 138.15778,
  },
  snow_stats: {
    lifts: 6,
    courses_total: 11,
    beginner_ratio: 0.45,
    intermediate_ratio: 0.35,
    advanced_ratio: 0.2,
    longest_run: 2.6,
    vertical_drop: 0,
    night_ski: true,
  },
  description: {
    highlights: ["\u5bb6\u5ead\u53cb\u5584", "\u5152\u7ae5\u516c\u5712", "\u72d7\u72d7\u53cb\u5584", "100%\u5929\u7136\u96ea"],
    tagline: "\u9577\u91ce\u9996\u5c48\u4e00\u6307\u7684\u5bb6\u5ead\u51b0\u96ea\u8056\u5730\uff0c\u8a2d\u6709\u5c08\u70ba\u72ac\u96bb\u8a2d\u8a08\u7684\u6ed1\u96ea\u5340\u3002",
  },
  courses: [

  ],
};

export const MADARAO_KOGEN_RESORT: Resort = {
  resort_id: "nagano_madarao_kogen",
  names: {
    zh: "\u6591\u5c3e\u9ad8\u539f\u6ed1\u96ea\u5834",
    en: "Madarao Mountain Resort",
    ja: "\u6591\u5c3e\u9ad8\u539f\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.8525,
    lng: 138.28972,
  },
  snow_stats: {
    lifts: 11,
    courses_total: 31,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.35,
    advanced_ratio: 0.35,
    longest_run: 2.5,
    vertical_drop: 440,
    night_ski: true,
  },
  description: {
    highlights: ["Madapow\u7c89\u96ea", "\u6a39\u6797\u6ed1\u96ea", "\u975e\u58d3\u96ea", "\u5bb6\u5ead\u53cb\u5584"],
    tagline: "\u65e5\u672c\u6a39\u6797\u6ed1\u9053\u6578\u91cf\u7b2c\u4e00\u7684\u7c89\u96ea\u8056\u5730\uff0c60%\u7684\u5340\u57df\u70ba\u975e\u58d3\u96ea\u3002",
  },
  courses: [
  {
    name: "SAWA - Natural Pipe",
    level: "advanced",
    tags: ["powder", "tree-run", "natural-pipe"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "NINJA",
    level: "advanced",
    tags: ["powder", "tree-run", "jump"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Powder Wave II",
    level: "advanced",
    tags: ["powder", "long-run"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Crystal Bowl",
    level: "advanced",
    tags: ["powder", "steep", "bowl"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Kamoshika Course",
    level: "beginner",
    tags: ["tree-run", "family-friendly", "beginner-friendly"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const NOZAWA_ONSEN_RESORT: Resort = {
  resort_id: "nagano_nozawa_onsen",
  names: {
    zh: "\u91ce\u6fa4\u6eab\u6cc9\u6ed1\u96ea\u5834",
    en: "Nozawa Onsen Snow Resort",
    ja: "\u91ce\u6ca2\u6e29\u6cc9\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.920031,
    lng: 138.451976,
  },
  snow_stats: {
    lifts: 20,
    courses_total: 39,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.3,
    advanced_ratio: 0.3,
    longest_run: 10.0,
    vertical_drop: 1085,
    night_ski: true,
  },
  description: {
    highlights: ["\u96ea\u570b\u4e4b\u9b42", "\u6eab\u6cc9\u6587\u5316", "\u9053\u7956\u795e\u706b\u796d", "\u7c89\u96ea"],
    tagline: "\u5728\u64c1\u6709\u5343\u5e74\u6b77\u53f2\u7684\u6eab\u6cc9\u6751\u843d\uff0c\u9ad4\u9a57\u6700\u5730\u9053\u7684\u65e5\u672c\u6ed1\u96ea\u6587\u5316\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u65e5\u5f71\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u67c4\u6ca2\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u4e0a\u30ce\u5e73\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u3084\u307e\u3073\u3053\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 9.0,
    max_slope: 9.0,
    
  },
  {
    name: "\u9577\u5742\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30d1\u30e9\u30c0\u30a4\u30b9\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u30d6\u30ca\u5e73\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30b9\u30ab\u30a4\u30e9\u30a4\u30f3\u30b3\u30fc\u30b9\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u65e5\u5f71\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u67c4\u6ca2\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u4e0a\u30ce\u5e73\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u3084\u307e\u3073\u3053\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u9577\u5742\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30d1\u30e9\u30c0\u30a4\u30b9\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30d6\u30ca\u5e73\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u30b9\u30ab\u30a4\u30e9\u30a4\u30f3\u30b3\u30fc\u30b9\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 16.0,
    max_slope: 16.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 15.0,
    max_slope: 15.0,
    
  },
  {
    name: "\u30c0\u30a6\u30f3\u30d2\u30eb\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30e6\u30fc\u30c8\u30d4\u30a2\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30b7\u30e5\u30ca\u30a4\u30c0\u30fc\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u30c1\u30e3\u30ec\u30f3\u30b8\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u65e5\u5f71\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u67c4\u6ca2\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u4e0a\u30ce\u5e73\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 29.0,
    max_slope: 29.0,
    
  },
  {
    name: "\u3084\u307e\u3073\u3053\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 27.0,
    max_slope: 27.0,
    
  },
  {
    name: "\u9577\u5742\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30d1\u30e9\u30c0\u30a4\u30b9\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30d6\u30ca\u5e73\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30b9\u30ab\u30a4\u30e9\u30a4\u30f3\u30b3\u30fc\u30b9\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30c1\u30e3\u30ec\u30f3\u30b839",
    level: "advanced",
    tags: [],
    avg_slope: 39.0,
    max_slope: 39.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 33.0,
    max_slope: 33.0,
    
  },
  {
    name: "\u30b9\u30fc\u30d1\u30fc\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30d6\u30e9\u30c3\u30af\u30c0\u30a4\u30e4\u30e2\u30f3\u30c9",
    level: "advanced",
    tags: [],
    avg_slope: 35.0,
    max_slope: 35.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30c8\u30ea\u30fc\u30e0\u30be\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 38.0,
    max_slope: 38.0,
    
  }
  ],
};

export const RYUOO_SKI_PARK_RESORT: Resort = {
  resort_id: "nagano_ryuoo_ski_park",
  names: {
    zh: "\u7adc\u738b\u6ed1\u96ea\u516c\u5712",
    en: "Ryuoo Ski Park",
    ja: "\u7adc\u738b\u30b9\u30ad\u30fc\u30d1\u30fc\u30af",
  },
  country_code: "JP",
  region: "Nagano Prefecture",
  coordinates: {
    lat: 36.787377,
    lng: 138.448212,
  },
  snow_stats: {
    lifts: 8,
    courses_total: 12,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 1.37,
    vertical_drop: 1080,
    night_ski: true,
  },
  description: {
    highlights: ["\u96f2\u6d77", "SORA terrace", "\u7c89\u96ea", "\u6728\u843d\u3057\u30b3\u30fc\u30b9"],
    tagline: "\u5728\u6d77\u62d41,770\u516c\u5c3a\u7684\u96f2\u7aef\u5947\u666f\u4e2d\uff0c\u9ad4\u9a57\u6975\u81f4\u7c89\u96ea\u3002",
  },
  courses: [
  {
    name: "Kiotoshi Course (\u6728\u843d\u3057\u30b3\u30fc\u30b9)",
    level: "advanced",
    tags: ["powder", "un-groomed", "steep", "tree-run"],
    avg_slope: 0,
    max_slope: 0,
    notes: "\u5fc5\u9808\u4f69\u6234\u5b89\u5168\u5e3d\u65b9\u53ef\u9032\u5165\u3002",
  },
  {
    name: "A Course",
    level: "beginner",
    tags: ["long-run", "beginner-friendly"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Green Course",
    level: "intermediate",
    tags: ["cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const MYOKO_AKAKURA_KANKO_RESORT: Resort = {
  resort_id: "myoko_akakura_kanko",
  names: {
    zh: "\u8d64\u5009\u89c0\u5149\u96ea\u5834",
    en: "Akakura Kanko Resort",
    ja: "\u8d64\u5009\u89b3\u5149\u30ea\u30be\u30fc\u30c8\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.89519,
    lng: 138.17278,
  },
  snow_stats: {
    lifts: 7,
    courses_total: 10,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.3,
    advanced_ratio: 0.3,
    longest_run: 4.5,
    vertical_drop: 760,
    night_ski: false,
  },
  description: {
    highlights: ["Ski-in/Ski-out", "\u7c89\u96ea", "\u6eab\u6cc9", "\u9069\u5408\u5bb6\u5ead"],
    tagline: "\u6b77\u53f2\u8207\u9769\u65b0\u4ea4\u7e54\u7684\u6ed1\u96ea\u52dd\u5730\uff0c\u9ad4\u9a57100%\u5929\u7136\u7c89\u96ea\u3002",
  },
  courses: [
  {
    name: "Hotel Main Slope",
    level: "beginner",
    tags: ["beginner-friendly", "wide"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Hotel Beginner Course",
    level: "beginner",
    tags: ["beginner-friendly"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Champion A Course",
    level: "intermediate",
    tags: ["cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Champion B Course",
    level: "intermediate",
    tags: ["cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const MYOKO_AKAKURA_ONSEN_RESORT: Resort = {
  resort_id: "myoko_akakura_onsen",
  names: {
    zh: "\u8d64\u5009\u6eab\u6cc9\u6ed1\u96ea\u5834",
    en: "Akakura Onsen Ski Resort",
    ja: "\u8d64\u5009\u6e29\u6cc9\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.89195179,
    lng: 138.16327333,
  },
  snow_stats: {
    lifts: 14,
    courses_total: 17,
    beginner_ratio: 0.5,
    intermediate_ratio: 0.3,
    advanced_ratio: 0.2,
    longest_run: 0,
    vertical_drop: 0,
    night_ski: true,
  },
  description: {
    highlights: ["\u7c89\u96ea\u54c1\u8cea\u4f73", "\u9069\u5408\u65b0\u624b\u8207\u5bb6\u5ead", "\u591c\u9593\u6ed1\u96ea", "\u6eab\u6cc9\u8857\u9ad4\u9a57"],
    tagline: "\u65b0\u624b\u8207\u5bb6\u5ead\u7684\u7c89\u96ea\u5929\u5802\uff0c\u7d50\u5408\u767e\u5e74\u6eab\u6cc9\u9109\u8207\u53cb\u5584\u96ea\u9053",
  },
  courses: [
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9 (Panorama Course)",
    level: "beginner",
    tags: ["wide", "long", "night-skiing", "beginner-friendly"],
    avg_slope: 0,
    max_slope: 0,
    notes: "\u5999\u9ad8\u5730\u5340\u552f\u4e00\u6bcf\u65e5\u591c\u6ed1\u96ea\u9053",
  },
  {
    name: "\u30a8\u30ec\u30ac\u30f3\u30c8\u30b3\u30fc\u30b9 (Elegant Course)",
    level: "beginner",
    tags: ["tree-lined", "family-friendly"],
    avg_slope: 0,
    max_slope: 0,
    notes: "\u9069\u5408\u5bb6\u5ead\u5171\u540c\u6ed1\u884c",
  },
  {
    name: "\u95a2\u898b\u30b2\u30ec\u30f3\u30c7 (Sekimi Gelande)",
    level: "beginner",
    tags: ["gentle-slope", "practice-area"],
    avg_slope: 0,
    max_slope: 0,
    notes: "\u9069\u5408\u53cd\u8986\u7df4\u7fd2\u57fa\u672c\u6280\u5de7",
  },
  {
    name: "\u30e6\u30fc\u30c8\u30d4\u30a2A\u30b3\u30fc\u30b9 (Utopia A Course)",
    level: "intermediate",
    tags: ["groomed", "cruising", "intermediate"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30c1\u30e3\u30ec\u30f3\u30b8\u30b3\u30fc\u30b9 (Mogul Challenge Course)",
    level: "advanced",
    tags: ["moguls", "un-groomed", "steep", "powder", "advanced"],
    avg_slope: 0,
    max_slope: 0,
    notes: "\u9700\u5177\u5099\u9ad8\u7d1a\u6280\u5de7",
  }
  ],
};

export const MYOKO_IKENOTAIRA_RESORT: Resort = {
  resort_id: "myoko_ikenotaira",
  names: {
    zh: "\u5999\u9ad8\u6c60\u4e4b\u5e73\u6eab\u6cc9\u6ed1\u96ea\u5834",
    en: "Ikenotaira Onsen Alpenblick Ski Resort",
    ja: "\u6c60\u306e\u5e73\u6e29\u6cc9\u30a2\u30eb\u30da\u30f3\u30d6\u30ea\u30c3\u30af\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.8725,
    lng: 138.17194,
  },
  snow_stats: {
    lifts: 5,
    courses_total: 10,
    beginner_ratio: 0.5,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.1,
    longest_run: 4.0,
    vertical_drop: 0,
    night_ski: false,
  },
  description: {
    highlights: ["\u65b0\u624b\u5929\u5802", "\u8d85\u5bec\u5ee3\u96ea\u9053", "\u6eab\u6cc9", "\u5bb6\u5ead\u53cb\u5584"],
    tagline: "\u5c08\u70ba\u5efa\u7acb\u6ed1\u96ea\u4fe1\u5fc3\u800c\u751f\u7684\u65b0\u624b\u5929\u5802\uff0c\u64c1\u6709\u5168\u570b\u9802\u7d1a\u7684\u8d85\u5bec\u5ee3\u96ea\u9053\u3002",
  },
  courses: [
  {
    name: "Happy Gelande (\u30cf\u30c3\u30d4\u30fc\u30b2\u30ec\u30f3\u30c7)",
    level: "beginner",
    tags: ["beginner-friendly", "wide"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Dream Course (\u30c9\u30ea\u30fc\u30e0\u30b3\u30fc\u30b9)",
    level: "beginner",
    tags: ["beginner-friendly", "gentle-slope"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Yamabato Rinkan Course (\u3084\u307e\u3070\u3068\u6797\u9593\u30b3\u30fc\u30b9)",
    level: "beginner",
    tags: ["long-run", "tree-lined"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Kayaba Course (\u30ab\u30e4\u30d0\u30b3\u30fc\u30b9)",
    level: "intermediate",
    tags: ["wide", "cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const MYOKO_LOTTE_ARAI_RESORT: Resort = {
  resort_id: "myoko_lotte_arai",
  names: {
    zh: "\u6a02\u5929\u65b0\u4e95\u5ea6\u5047\u6751",
    en: "Lotte Arai Resort",
    ja: "\u30ed\u30c3\u30c6\u30a2\u30e9\u30a4\u30ea\u30be\u30fc\u30c8",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.990889,
    lng: 138.18139,
  },
  snow_stats: {
    lifts: 5,
    courses_total: 14,
    beginner_ratio: 0.36,
    intermediate_ratio: 0.36,
    advanced_ratio: 0.28,
    longest_run: 7.0,
    vertical_drop: 951,
    night_ski: false,
  },
  description: {
    highlights: ["\u8c6a\u83ef\u7c89\u96ea\u52dd\u5730", "\u4e94\u661f\u7d1a\u9152\u5e97\u9ad4\u9a57", "\u81ea\u7531\u6ed1\u96ea", "\u975e\u58d3\u96ea\u5340"],
    tagline: "\u5962\u83ef\u4eab\u53d7\u8207\u6975\u9650\u81ea\u7531\u6ed1\u96ea\u7684\u878d\u5408\uff0c\u4e00\u500b\u91cd\u751f\u5f8c\u7684\u8c6a\u83ef\u7c89\u96ea\u52dd\u5730\u3002",
  },
  courses: [
  {
    name: "Myoko Long Run",
    level: "beginner",
    tags: ["long-run", "beginner-friendly"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Be Free",
    level: "intermediate",
    tags: ["cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Mamushi Gaeshi",
    level: "advanced",
    tags: ["steep", "un-groomed"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Zendana Bowl",
    level: "advanced",
    tags: ["powder", "off-piste", "bowl"],
    avg_slope: 0,
    max_slope: 0,
    notes: "\u9700\u5177\u5099\u76f8\u61c9\u6280\u80fd\u548c\u5b89\u5168\u610f\u8b58\u3002",
  }
  ],
};

export const MYOKO_SUGINOHARA_RESORT: Resort = {
  resort_id: "myoko_suginohara",
  names: {
    zh: "\u5999\u9ad8\u6749\u4e4b\u539f\u6ed1\u96ea\u5834",
    en: "Myoko Suginohara Ski Resort",
    ja: "\u5999\u9ad8\u6749\u30ce\u539f\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.86346,
    lng: 138.13715,
  },
  snow_stats: {
    lifts: 5,
    courses_total: 17,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 8.5,
    vertical_drop: 0,
    night_ski: false,
  },
  description: {
    highlights: ["\u65e5\u672c\u6700\u9577\u96ea\u9053", "\u4e2d\u7d1a\u8005\u5929\u5802", "\u7c89\u96ea"],
    tagline: "\u7121\u76e1\u6ed1\u964d\u7684\u738b\u570b\uff0c\u9ad4\u9a578.5\u516c\u91cc\u7684\u71c3\u71d2\u5927\u817f\u76f4\u7dda\u6ed1\u964d\u5de1\u822a\u8def\u7dda",
  },
  courses: [
  {
    name: "\u675c\u9d51\u82b1\u96ea\u9053 (Shakunage Trail, E1)",
    level: "intermediate",
    tags: ["long-run-part"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "\u5168\u666f\u96ea\u9053 (Panorama Trail, D1/B2)",
    level: "beginner",
    tags: ["long-run-part", "cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "\u767d\u6a3a\u96ea\u9053 (Shirakaba Trail, A1)",
    level: "beginner",
    tags: ["long-run-part", "tree-lined"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "\u5bb6\u5ead\u96ea\u9053 (Family R Trail, B1)",
    level: "beginner",
    tags: ["long-run-part"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "\u8d85\u7d1a\u5de8\u4eba\u96ea\u9053 (Super Giant Trail)",
    level: "advanced",
    tags: ["steep"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const YUZAWA_GALA_RESORT: Resort = {
  resort_id: "yuzawa_gala",
  names: {
    zh: "GALA\u6e6f\u6fa4\u6ed1\u96ea\u5834",
    en: "GALA Yuzawa Snow Resort",
    ja: "GALA\u6e6f\u6ca2\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.95072,
    lng: 138.799437,
  },
  snow_stats: {
    lifts: 11,
    courses_total: 16,
    beginner_ratio: 0.35,
    intermediate_ratio: 0.5,
    advanced_ratio: 0.15,
    longest_run: 2.5,
    vertical_drop: 358,
    night_ski: false,
  },
  description: {
    highlights: ["\u65b0\u5e79\u7dda\u76f4\u9054", "\u4e00\u65e5\u6ed1\u96ea", "\u4ea4\u901a\u4fbf\u5229", "\u6eab\u6cc9"],
    tagline: "\u8207\u65b0\u5e79\u7dda\u8eca\u7ad9\u76f4\u63a5\u76f8\u9023\u7684\u7d42\u6975\u4e00\u65e5\u6ed1\u96ea\u76ee\u7684\u5730\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u5317\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u4e2d\u592e\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u5357\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u5317\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u4e2d\u592e\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u5357\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u30c0\u30a6\u30f3\u30d2\u30eb\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 16.0,
    max_slope: 16.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 25.0,
    max_slope: 25.0,
    
  },
  {
    name: "\u5317\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u4e2d\u592e\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u5357\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  }
  ],
};

export const YUZAWA_ISHIUCHI_MARUYAMA_RESORT: Resort = {
  resort_id: "yuzawa_ishiuchi_maruyama",
  names: {
    zh: "\u77f3\u6253\u4e38\u5c71\u6ed1\u96ea\u5834",
    en: "Ishiuchi Maruyama Ski Resort",
    ja: "\u77f3\u6253\u4e38\u5c71\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.97611,
    lng: 138.79472,
  },
  snow_stats: {
    lifts: 13,
    courses_total: 26,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 4.0,
    vertical_drop: 664,
    night_ski: true,
  },
  description: {
    highlights: ["\u6b77\u53f2\u60a0\u4e45", "\u7f8e\u98df\u5929\u5802", "\u591c\u6ed1", "\u5730\u5f62\u516c\u5712"],
    tagline: "\u64c1\u670970\u5e74\u6b77\u53f2\u7684\u6ed1\u96ea\u5834\uff0c\u7d50\u5408\u4e86\u50b3\u7d71\u8207\u73fe\u4ee3\u7684\u9b45\u529b\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u4e2d\u592e\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u30cf\u30c4\u30ab\u77f3\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u9280\u5ea7\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u30b5\u30f3\u30e9\u30a4\u30ba\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 9.0,
    max_slope: 9.0,
    
  },
  {
    name: "\u5317\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u4e2d\u592e\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u30cf\u30c4\u30ab\u77f3\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u9280\u5ea7\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30b5\u30f3\u30e9\u30a4\u30ba\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u5317\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 16.0,
    max_slope: 16.0,
    
  },
  {
    name: "\u30c0\u30a6\u30f3\u30d2\u30eb\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30c0\u30a4\u30ca\u30df\u30c3\u30af\u30d0\u30fc\u30f3",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u4e2d\u592e\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30cf\u30c4\u30ab\u77f3\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u9280\u5ea7\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 29.0,
    max_slope: 29.0,
    
  },
  {
    name: "\u30b5\u30f3\u30e9\u30a4\u30ba\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 27.0,
    max_slope: 27.0,
    
  },
  {
    name: "\u5317\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 33.0,
    max_slope: 33.0,
    
  },
  {
    name: "\u30b9\u30fc\u30d1\u30fc\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30d6\u30e9\u30c3\u30af\u30c0\u30a4\u30e4\u30e2\u30f3\u30c9",
    level: "advanced",
    tags: [],
    avg_slope: 35.0,
    max_slope: 35.0,
    
  }
  ],
};

export const YUZAWA_IWAPPARA_RESORT: Resort = {
  resort_id: "yuzawa_iwappara",
  names: {
    zh: "\u5ca9\u539f\u6ed1\u96ea\u5834",
    en: "Iwappara Ski Resort",
    ja: "\u5ca9\u539f\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.93889,
    lng: 138.84444,
  },
  snow_stats: {
    lifts: 9,
    courses_total: 20,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 4.0,
    vertical_drop: 400,
    night_ski: true,
  },
  description: {
    highlights: ["\u521d\u5b78\u8005\u5929\u5802", "\u8d85\u5bec\u95ca\u96ea\u9053", "\u5bb6\u5ead\u53cb\u5584", "\u591c\u6ed1"],
    tagline: "\u64c1\u6709\u9ad8\u901f\u516c\u8def\u822c\u5bec\u95ca\u7684\u4e3b\u96ea\u9053\uff0c\u662f\u65e5\u672c\u6700\u4f73\u7684\u6ed1\u96ea\u5b78\u7fd2\u5834\u5730\u4e4b\u4e00\u3002",
  },
  courses: [
  {
    name: "\u30e1\u30a4\u30f3\u30d0\u30fc\u30f3",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30b9\u30e9\u30ed\u30fc\u30e0\u30d0\u30fc\u30f3",
    level: "beginner",
    tags: [],
    avg_slope: 15.0,
    max_slope: 15.0,
    
  },
  {
    name: "\u30ed\u30de\u30f3\u30b9\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u521d\u5fc3\u8005\u5c08\u7528\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30b8\u30e3\u30a4\u30a2\u30f3\u30c8\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 15.0,
    max_slope: 15.0,
    
  },
  {
    name: "\u30d1\u30e9\u30ec\u30eb\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30c1\u30e3\u30ec\u30f3\u30b8\u30d0\u30fc\u30f3",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u30c0\u30a4\u30ca\u30df\u30c3\u30af\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 22.0,
    max_slope: 22.0,
    
  },
  {
    name: "\u30b9\u30d4\u30fc\u30c9\u30a6\u30a7\u30a4",
    level: "intermediate",
    tags: [],
    avg_slope: 15.0,
    max_slope: 15.0,
    
  },
  {
    name: "\u30a2\u30c9\u30d0\u30f3\u30b9\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u30c6\u30af\u30cb\u30ab\u30eb\u30d0\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 25.0,
    max_slope: 25.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u6025\u659c\u9762\u30c1\u30e3\u30ec\u30f3\u30b8",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30a6\u30a9\u30fc\u30eb",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30d6\u30e9\u30c3\u30af\u30c0\u30a4\u30e4\u30e2\u30f3\u30c9",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30de\u30b9\u30bf\u30fc\u30ba\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u30c1\u30e3\u30f3\u30d4\u30aa\u30f3\u30b7\u30c3\u30d7",
    level: "advanced",
    tags: [],
    avg_slope: 24.0,
    max_slope: 24.0,
    
  }
  ],
};

export const YUZAWA_JOETSU_KOKUSAI_RESORT: Resort = {
  resort_id: "yuzawa_joetsu_kokusai",
  names: {
    zh: "\u4e0a\u8d8a\u570b\u969b\u6ed1\u96ea\u5834",
    en: "Joetsu Kokusai Ski Resort",
    ja: "\u4e0a\u8d8a\u56fd\u969b\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 37.025112,
    lng: 138.806549,
  },
  snow_stats: {
    lifts: 25,
    courses_total: 22,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.5,
    advanced_ratio: 0.2,
    longest_run: 6.0,
    vertical_drop: 817,
    night_ski: true,
  },
  description: {
    highlights: ["\u56db\u5c71\u9023\u5cf0", "\u65e5\u672c\u6700\u5927\u7d1a\u5225", "\u5bb6\u5ead\u53cb\u5584", "\u8eca\u7ad9\u76f4\u7d50"],
    tagline: "\u6a6b\u8de8\u56db\u5ea7\u5c71\u7684\u5ee3\u95ca\u6ed1\u96ea\u806f\u5408\u9ad4\uff0c\u9069\u5408\u6240\u6709\u4eba\u7684\u96ea\u570b\u3002",
  },
  courses: [
  {
    name: "Panorama Course",
    level: "beginner",
    tags: ["long-run", "beginner-friendly"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "\u5927\u5225\u5f53\u30c1\u30e3\u30f3\u30d4\u30aa\u30f3\u30b3\u30fc\u30b9 (Osawa Champion Course)",
    level: "advanced",
    tags: ["steep", "moguls"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "\u9577\u5cf0\u30b3\u30fc\u30b9 (Nagamine Course)",
    level: "intermediate",
    tags: ["cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const YUZAWA_KAGURA_RESORT: Resort = {
  resort_id: "yuzawa_kagura",
  names: {
    zh: "\u795e\u6a02\u6ed1\u96ea\u5834",
    en: "Kagura Ski Resort",
    ja: "\u304b\u3050\u3089\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.892908,
    lng: 138.775558,
  },
  snow_stats: {
    lifts: 24,
    courses_total: 11,
    beginner_ratio: 0.35,
    intermediate_ratio: 0.35,
    advanced_ratio: 0.3,
    longest_run: 6.0,
    vertical_drop: 1225,
    night_ski: false,
  },
  description: {
    highlights: ["\u7c89\u96ea\u5929\u5802", "\u8d85\u9577\u96ea\u5b63", "\u91ce\u96ea", "\u4e09\u5927\u5340\u57df"],
    tagline: "\u7531\u4e09\u500b\u5340\u57df\u7d44\u6210\u7684\u5ee3\u95ca\u7c89\u96ea\u5929\u5802\uff0c\u4eab\u53d7\u65e5\u672c\u6700\u9577\u7684\u96ea\u5b63\u4e4b\u4e00\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u7530\u4ee3\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u304b\u3050\u3089\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u7530\u4ee3\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u304b\u3050\u3089\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u7530\u4ee3\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u304b\u3050\u3089\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 35.0,
    max_slope: 35.0,
    
  }
  ],
};

export const YUZAWA_KANDATSU_RESORT: Resort = {
  resort_id: "yuzawa_kandatsu",
  names: {
    zh: "\u795e\u7acb\u9ad8\u539f\u6ed1\u96ea\u5834",
    en: "Kandatsu Snow Resort",
    ja: "\u795e\u7acb\u30b9\u30ce\u30fc\u30ea\u30be\u30fc\u30c8",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.91139,
    lng: 138.8125,
  },
  snow_stats: {
    lifts: 5,
    courses_total: 15,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 3.5,
    vertical_drop: 440,
    night_ski: true,
  },
  description: {
    highlights: ["\u65e5\u591c\u6ed1\u96ea\u5a1b\u6a02\u4e2d\u5fc3", "\u4ea4\u901a\u4fbf\u5229", "\u6eab\u6cc9", "\u5730\u5f62\u516c\u5712"],
    tagline: "\u5c08\u70ba\u73fe\u4ee3\u90fd\u5e02\u751f\u6d3b\u65b9\u5f0f\u8a2d\u8a08\u768424\u5c0f\u6642\u5a1b\u6a02\u4e2d\u5fc3\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u30d3\u30ae\u30ca\u30fc\u30ba\u30d1\u30e9\u30c0\u30a4\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u3084\u307e\u3070\u3068\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30e1\u30eb\u30d8\u30f3\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30e1\u30a4\u30f3\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u30b9\u30ab\u30a4\u30e9\u30a4\u30f3\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30d0\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u6025\u659c\u9762\u30c1\u30e3\u30ec\u30f3\u30b8",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30b9\u30fc\u30d1\u30fc\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30d6\u30e9\u30c3\u30af\u30c0\u30a4\u30e4\u30e2\u30f3\u30c9",
    level: "advanced",
    tags: [],
    avg_slope: 35.0,
    max_slope: 35.0,
    
  }
  ],
};

export const YUZAWA_MAIKO_KOGEN_RESORT: Resort = {
  resort_id: "yuzawa_maiko_kogen",
  names: {
    zh: "\u821e\u5b50\u9ad8\u539f\u6ed1\u96ea\u5834",
    en: "Maiko Snow Resort",
    ja: "\u821e\u5b50\u30b9\u30ce\u30fc\u30ea\u30be\u30fc\u30c8",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.97442,
    lng: 138.83576,
  },
  snow_stats: {
    lifts: 10,
    courses_total: 25,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 6.0,
    vertical_drop: 660,
    night_ski: true,
  },
  description: {
    highlights: ["\u4ea4\u901a\u4fbf\u5229", "\u5bb6\u5ead\u53cb\u5584", "\u9577\u8ddd\u96e2\u6ed1\u9053", "\u6eab\u6cc9"],
    tagline: "\u99b3\u9a01\u65b0\u6f5f\u9996\u5c48\u4e00\u6307\u7684\u5168\u80fd\u96ea\u5834\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u821e\u5b50\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u9577\u5cf0\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u5965\u6dfb\u5730\u30a8\u30ea\u30a2\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u821e\u5b50\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u9577\u5cf0\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u5965\u6dfb\u5730\u30a8\u30ea\u30a2\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 16.0,
    max_slope: 16.0,
    
  },
  {
    name: "\u30c0\u30a6\u30f3\u30d2\u30eb\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30c0\u30a4\u30ca\u30df\u30c3\u30af\u30d0\u30fc\u30f3",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u821e\u5b50\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u9577\u5cf0\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u5965\u6dfb\u5730\u30a8\u30ea\u30a2\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 29.0,
    max_slope: 29.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 33.0,
    max_slope: 33.0,
    
  },
  {
    name: "\u30b9\u30fc\u30d1\u30fc\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30d6\u30e9\u30c3\u30af\u30c0\u30a4\u30e4\u30e2\u30f3\u30c9",
    level: "advanced",
    tags: [],
    avg_slope: 35.0,
    max_slope: 35.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30c8\u30ea\u30fc\u30e0\u30be\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 37.0,
    max_slope: 37.0,
    
  },
  {
    name: "\u30c1\u30e3\u30f3\u30d4\u30aa\u30f3\u30b7\u30c3\u30d7",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30de\u30b9\u30bf\u30fc\u30ba\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30c6\u30af\u30cb\u30ab\u30eb\u30d0\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30c1\u30e3\u30ec\u30f3\u30b8\u30be\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 34.0,
    max_slope: 34.0,
    
  }
  ],
};

export const YUZAWA_NAEBA_RESORT: Resort = {
  resort_id: "yuzawa_naeba",
  names: {
    zh: "\u82d7\u5834\u6ed1\u96ea\u5834",
    en: "Naeba Ski Resort",
    ja: "\u82d7\u5834\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.791,
    lng: 138.785,
  },
  snow_stats: {
    lifts: 13,
    courses_total: 24,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 4.0,
    vertical_drop: 889,
    night_ski: true,
  },
  description: {
    highlights: ["\u4fbf\u6377\u5de8\u64d8", "\u96d9\u5cf0\u9b45\u529b", "\u5bb6\u5ead\u6a02\u5712", "\u9f8d\u4e4b\u7e9c\u8eca"],
    tagline: "\u900f\u904e\u9f8d\u4e4b\u7e9c\u8eca\u8207\u795e\u6a02\u76f8\u9023\uff0c\u9ad4\u9a57\u82d7\u5834\u7684\u73fe\u4ee3\u4fbf\u5229\u8207\u795e\u6a02\u7684\u539f\u59cb\u58ef\u9e97\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u7b2c1\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u7b2c2\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u7b2c3\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 11.0,
    max_slope: 11.0,
    
  },
  {
    name: "\u7b2c4\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 9.0,
    max_slope: 9.0,
    
  },
  {
    name: "\u7b4d\u5c71\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u7b2c1\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u7b2c2\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u7b2c3\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u7b2c4\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u7b4d\u5c71\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 16.0,
    max_slope: 16.0,
    
  },
  {
    name: "\u30c0\u30a6\u30f3\u30d2\u30eb\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30c0\u30a4\u30ca\u30df\u30c3\u30af\u30d0\u30fc\u30f3",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u7b2c1\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u7b2c2\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u7b2c3\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 29.0,
    max_slope: 29.0,
    
  },
  {
    name: "\u7b2c4\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 27.0,
    max_slope: 27.0,
    
  },
  {
    name: "\u7b4d\u5c71\u30b2\u30ec\u30f3\u30c7\u4e0a\u7d1a",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 33.0,
    max_slope: 33.0,
    
  }
  ],
};

export const YUZAWA_NAKAZATO_RESORT: Resort = {
  resort_id: "yuzawa_nakazato",
  names: {
    zh: "\u6e6f\u6fa4\u4e2d\u91cc\u6ed1\u96ea\u5ea6\u5047\u6751",
    en: "Yuzawa Nakazato Snow Resort",
    ja: "\u6e6f\u6ca2\u4e2d\u91cc\u30b9\u30ce\u30fc\u30ea\u30be\u30fc\u30c8",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.90972,
    lng: 138.84889,
  },
  snow_stats: {
    lifts: 7,
    courses_total: 10,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 2.0,
    vertical_drop: 281,
    night_ski: false,
  },
  description: {
    highlights: ["\u5bb6\u5ead\u6ed1\u96ea\u7470\u5bf6", "\u8eca\u7ad9\u76f4\u7d50", "\u85cd\u8272\u5217\u8eca\u4f11\u606f\u5ba4", "\u6eab\u6cc9"],
    tagline: "\u5c07\u4fbf\u5229\u6027\u3001\u61f7\u820a\u60c5\u61f7\u8207\u5bb6\u5ead\u540c\u6a02\u5b8c\u7f8e\u878d\u5408\u7684\u6ed1\u96ea\u52dd\u5730\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30b9\u30de\u30a4\u30eb\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u30ad\u30c3\u30ba\u30d1\u30fc\u30af",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 16.0,
    max_slope: 16.0,
    
  },
  {
    name: "\u30c0\u30a4\u30ca\u30df\u30c3\u30af\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 20.0,
    max_slope: 20.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30d0\u30fc\u30f3",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30c1\u30e3\u30ec\u30f3\u30b8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  }
  ],
};

export const YUZAWA_NASPA_SKI_GARDEN_RESORT: Resort = {
  resort_id: "yuzawa_naspa_ski_garden",
  names: {
    zh: "NASPA\u6ed1\u96ea\u82b1\u5712",
    en: "NASPA Ski Garden",
    ja: "NASPA\u30b9\u30ad\u30fc\u30ac\u30fc\u30c7\u30f3",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.926483,
    lng: 138.808487,
  },
  snow_stats: {
    lifts: 5,
    courses_total: 8,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.5,
    advanced_ratio: 0.1,
    longest_run: 2.2,
    vertical_drop: 260,
    night_ski: false,
  },
  description: {
    highlights: ["\u50c5\u9650\u6ed1\u96ea\u8005 (Skiers-Only)", "\u5bb6\u5ead\u53cb\u5584", "\u5b89\u5168", "Pingu\u5408\u4f5c"],
    tagline: "\u5c08\u70ba\u50b3\u7d71\u6ed1\u96ea\u8005\u3001\u5bb6\u5ead\u53ca\u91cd\u8996\u5be7\u975c\u548c\u9ad8\u54c1\u8cea\u670d\u52d9\u9ad4\u9a57\u5ba2\u7fa4\u7684\u5c08\u5c6c\u907f\u98a8\u6e2f\u3002",
  },
  courses: [
  {
    name: "F Course",
    level: "beginner",
    tags: ["beginner-friendly"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "H Course",
    level: "beginner",
    tags: ["long-run", "cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "G Course",
    level: "intermediate",
    tags: ["wide", "moguls"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "C/D Courses",
    level: "advanced",
    tags: ["un-groomed", "steep", "moguls"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const YUZAWA_PARK_RESORT: Resort = {
  resort_id: "yuzawa_park",
  names: {
    zh: "\u6e6f\u6fa4\u516c\u5712\u6ed1\u96ea\u5834",
    en: "Yuzawa Park Resort",
    ja: "\u6e6f\u6ca2\u30d1\u30fc\u30af\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Niigata Prefecture",
  coordinates: {
    lat: 36.926857,
    lng: 138.855754,
  },
  snow_stats: {
    lifts: 3,
    courses_total: 11,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 0.58,
    vertical_drop: 210,
    night_ski: false,
  },
  description: {
    highlights: ["\u79c1\u623f\u666f\u9ede", "\u4eba\u6f6e\u7a00\u5c11", "\u5bb6\u5ead\u53cb\u5584", "\u9ad8CP\u503c"],
    tagline: "\u8d8a\u5f8c\u6e6f\u6fa4\u975c\u8b10\u89d2\u843d\u7684\u6ed1\u96ea\u79c1\u623f\u666f\u9ede\uff0c\u4eab\u53d7\u7121\u58d3\u529b\u7684\u6ed1\u96ea\u9ad4\u9a57\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u30d3\u30ae\u30ca\u30fc\u30d1\u30e9\u30c0\u30a4\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u30d1\u30ce\u30e9\u30de\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 17.0,
    max_slope: 17.0,
    
  },
  {
    name: "\u30c0\u30a4\u30ca\u30df\u30c3\u30af\u30d0\u30fc\u30f3",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30e2\u30fc\u30b0\u30eb\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 30.0,
    max_slope: 30.0,
    
  },
  {
    name: "\u30b9\u30fc\u30d1\u30fc\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  },
  {
    name: "\u30d6\u30e9\u30c3\u30af\u30c0\u30a4\u30e4\u30e2\u30f3\u30c9",
    level: "advanced",
    tags: [],
    avg_slope: 31.0,
    max_slope: 31.0,
    
  }
  ],
};

export const EDELWEISS_RESORT: Resort = {
  resort_id: "tochigi_edelweiss",
  names: {
    zh: "\u30a8\u30fc\u30c7\u30eb\u30ef\u30a4\u30b9\u30b9\u30ad\u30fc\u30ea\u30be\u30fc\u30c8",
    en: "Edelweiss Ski Resort",
    ja: "\u30a8\u30fc\u30c7\u30eb\u30ef\u30a4\u30b9\u30b9\u30ad\u30fc\u30ea\u30be\u30fc\u30c8",
  },
  country_code: "JP",
  region: "Tochigi Prefecture",
  coordinates: {
    lat: 36.925031,
    lng: 139.748848,
  },
  snow_stats: {
    lifts: 5,
    courses_total: 10,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 1.8,
    vertical_drop: 280,
    night_ski: false,
  },
  description: {
    highlights: ["\u5bb6\u5ead\u6ed1\u96ea\u5929\u5802", "\u4eba\u6f6e\u7a00\u5c11", "\u9ad8CP\u503c", "\u6eab\u6cc9"],
    tagline: "\u65e5\u5149\u5730\u5340\u975c\u8b10\u7684\u5bb6\u5ead\u6ed1\u96ea\u5929\u5802\uff0c\u4eab\u53d7\u7121\u58d3\u529b\u7684\u6ed1\u96ea\u6c1b\u570d\u3002",
  },
  courses: [
  {
    name: "Family Gelande (\u30d5\u30a1\u30df\u30ea\u30fc\u30b2\u30ec\u30f3\u30c7)",
    level: "beginner",
    tags: ["beginner-friendly", "wide", "gentle-slope"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Center Course (\u30bb\u30f3\u30bf\u30fc\u30b3\u30fc\u30b9)",
    level: "intermediate",
    tags: ["cruising"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Dynamic Course (\u30c0\u30a4\u30ca\u30df\u30c3\u30af\u30b3\u30fc\u30b9)",
    level: "advanced",
    tags: ["steep"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const HUNTER_MOUNTAIN_SHIOBARA_RESORT: Resort = {
  resort_id: "tochigi_hunter_mountain_shiobara",
  names: {
    zh: "\u7375\u4eba\u5c71\u9e7d\u539f\u6ed1\u96ea\u5834",
    en: "Hunter Mountain Shiobara",
    ja: "\u30cf\u30f3\u30bf\u30fc\u30de\u30a6\u30f3\u30c6\u30f3\u5869\u539f",
  },
  country_code: "JP",
  region: "Tochigi Prefecture",
  coordinates: {
    lat: 36.93806,
    lng: 139.75278,
  },
  snow_stats: {
    lifts: 6,
    courses_total: 12,
    beginner_ratio: 0.3,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.3,
    longest_run: 3.0,
    vertical_drop: 500,
    night_ski: false,
  },
  description: {
    highlights: ["\u9996\u90fd\u5708\u6700\u5927\u7d1a", "\u4ea4\u901a\u4fbf\u5229", "\u5bb6\u5ead\u53cb\u5584", "\u4eba\u5de5\u9020\u96ea"],
    tagline: "\u9996\u90fd\u5708\u5c45\u6c11\u53ca\u570b\u969b\u65c5\u5ba2\u9032\u884c\u7576\u65e5\u5f80\u8fd4\u6216\u77ed\u9014\u6ed1\u96ea\u65c5\u884c\u7684\u9996\u9078\u76ee\u7684\u5730\u3002",
  },
  courses: [
  {
    name: "Broadway",
    level: "beginner",
    tags: ["beginner-friendly", "wide", "gentle-slope"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Madison Avenue",
    level: "intermediate",
    tags: ["cruising", "wide"],
    avg_slope: 0,
    max_slope: 0,
    
  },
  {
    name: "Wall Street",
    level: "advanced",
    tags: ["steep", "moguls", "un-groomed"],
    avg_slope: 0,
    max_slope: 0,
    
  }
  ],
};

export const ZAO_ONSEN_RESORT: Resort = {
  resort_id: "yamagata_zao_onsen",
  names: {
    zh: "\u85cf\u738b\u6eab\u6cc9\u6ed1\u96ea\u5834",
    en: "Zao Onsen Ski Resort",
    ja: "\u8535\u738b\u6e29\u6cc9\u30b9\u30ad\u30fc\u5834",
  },
  country_code: "JP",
  region: "Yamagata Prefecture",
  coordinates: {
    lat: 38.164649,
    lng: 140.401617,
  },
  snow_stats: {
    lifts: 35,
    courses_total: 10,
    beginner_ratio: 0.4,
    intermediate_ratio: 0.4,
    advanced_ratio: 0.2,
    longest_run: 9.0,
    vertical_drop: 881,
    night_ski: true,
  },
  description: {
    highlights: ["\u96ea\u602a (Juhyo)", "\u5f37\u9178\u6027\u6eab\u6cc9", "\u6b77\u53f2\u60a0\u4e45", "\u6a39\u51b0\u9ede\u71c8"],
    tagline: "\u5728\u96ea\u602a\u7684\u795e\u79d8\u738b\u570b\u4e2d\u6ed1\u884c\uff0c\u9ad4\u9a57\u7368\u4e00\u7121\u4e8c\u7684\u81ea\u7136\u5947\u89c0\u8207\u7642\u7652\u6eab\u6cc9\u3002",
  },
  courses: [
  {
    name: "\u30d5\u30a1\u30df\u30ea\u30fc\u30b3\u30fc\u30b9",
    level: "beginner",
    tags: [],
    avg_slope: 8.0,
    max_slope: 8.0,
    
  },
  {
    name: "\u521d\u7d1a\u30a8\u30ea\u30a2",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u4e2d\u592e\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 12.0,
    max_slope: 12.0,
    
  },
  {
    name: "\u6a2a\u5009\u30b2\u30ec\u30f3\u30c7\u521d\u7d1a",
    level: "beginner",
    tags: [],
    avg_slope: 10.0,
    max_slope: 10.0,
    
  },
  {
    name: "\u4e2d\u7d1a\u30b3\u30fc\u30b9",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u4e2d\u592e\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 19.0,
    max_slope: 19.0,
    
  },
  {
    name: "\u6a2a\u5009\u30b2\u30ec\u30f3\u30c7\u4e2d\u7d1a",
    level: "intermediate",
    tags: [],
    avg_slope: 18.0,
    max_slope: 18.0,
    
  },
  {
    name: "\u4e0a\u7d1a\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 26.0,
    max_slope: 26.0,
    
  },
  {
    name: "\u6a39\u6c37\u539f\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 28.0,
    max_slope: 28.0,
    
  },
  {
    name: "\u30a8\u30ad\u30b9\u30d1\u30fc\u30c8\u30b3\u30fc\u30b9",
    level: "advanced",
    tags: [],
    avg_slope: 32.0,
    max_slope: 32.0,
    
  }
  ],
};

// 所有雪場列表
export const RESORTS: Resort[] = [
  INAWASHIRO_RESORT,
  NEKOMA_MOUNTAIN_RESORT,
  MARUNUMA_KOGEN_RESORT,
  MINAKAMI_KOGEN_RESORT,
  OZE_IWAKURA_RESORT,
  WHITE_VALLEY_RESORT,
  FURANO_RESORT,
  NISEKO_MOIWA_RESORT,
  RUSUTSU_RESORT,
  SAPPORO_TEINE_RESORT,
  TOMAMU_RESORT,
  APPI_KOGEN_RESORT,
  SHIZUKUISHI_RESORT,
  HAKUBA_CORTINA_RESORT,
  HAKUBA_GORYU_47_RESORT,
  HAKUBA_HAPPO_ONE_RESORT,
  HAKUBA_IWATAKE_RESORT,
  HAKUBA_NORIKURA_RESORT,
  HAKUBA_TSUGAIKE_KOGEN_RESORT,
  KARUIZAWA_PRINCE_RESORT,
  KUROHIME_KOGEN_RESORT,
  MADARAO_KOGEN_RESORT,
  NOZAWA_ONSEN_RESORT,
  RYUOO_SKI_PARK_RESORT,
  MYOKO_AKAKURA_KANKO_RESORT,
  MYOKO_AKAKURA_ONSEN_RESORT,
  MYOKO_IKENOTAIRA_RESORT,
  MYOKO_LOTTE_ARAI_RESORT,
  MYOKO_SUGINOHARA_RESORT,
  YUZAWA_GALA_RESORT,
  YUZAWA_ISHIUCHI_MARUYAMA_RESORT,
  YUZAWA_IWAPPARA_RESORT,
  YUZAWA_JOETSU_KOKUSAI_RESORT,
  YUZAWA_KAGURA_RESORT,
  YUZAWA_KANDATSU_RESORT,
  YUZAWA_MAIKO_KOGEN_RESORT,
  YUZAWA_NAEBA_RESORT,
  YUZAWA_NAKAZATO_RESORT,
  YUZAWA_NASPA_SKI_GARDEN_RESORT,
  YUZAWA_PARK_RESORT,
  EDELWEISS_RESORT,
  HUNTER_MOUNTAIN_SHIOBARA_RESORT,
  ZAO_ONSEN_RESORT
];

// 根據 ID 獲取雪場
export const getResortById = (resortId: string): Resort | undefined => {
  return RESORTS.find((r) => r.resort_id === resortId);
};

// 獲取所有雪場
export const getAllResorts = (): Resort[] => {
  return RESORTS;
};
