/**
 * TypeScript 類型定義 - 滑雪地圖
 */

export interface ResortInfo {
  id: string;
  name_zh: string | null;
  name_en: string | null;
  visited: boolean;
}

export interface RegionStats {
  total: number;
  visited: number;
  completion_percentage: number;
  resorts: ResortInfo[];
}

export interface SkiMapData {
  user_id: string;
  visited_resort_ids: string[];
  total_resorts: number;
  total_visited: number;
  completion_percentage: number;
  region_stats: Record<string, RegionStats>;
}
