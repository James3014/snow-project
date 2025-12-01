/**
 * Resort Types
 * 雪場類型定義
 *
 * 數據來源：Resort API (https://resort-api.zeabur.app/)
 */

export interface Course {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  avg_slope?: number;
  max_slope?: number;
  length?: number;
  elevation_diff?: number;
  description?: string;
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
    elevation_range?: { min: number; max: number };
    park_features?: string[];
    notes?: string;
  };
  courses: Course[];
  description?: {
    highlights: string[];
    tagline: string;
    resort_type?: string;
    snow_quality?: string;
  };
  season?: {
    estimated_open: string;
    estimated_close: string;
    season_notes?: string;
  };
  official_site?: string;
  amenities?: string[];
  timezone?: string;
}
