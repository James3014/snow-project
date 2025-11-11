/**
 * Resort API
 * 雪場API接口
 */
import { resortApi } from './client';
import type { Resort } from '../data/resorts';

/**
 * API 回應格式
 */
export interface ResortListResponse {
  items: Resort[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * 雪場API
 */
export const resortApiService = {
  // 獲取所有雪場列表
  getAllResorts: () => resortApi.get<ResortListResponse>('/resorts?limit=100'),

  // 獲取單個雪場詳情
  getResort: (resortId: string) => resortApi.get<Resort>(`/resorts/${resortId}`),

  // 搜索雪場
  searchResorts: (query: string) =>
    resortApi.get<ResortListResponse>(`/resorts/search?q=${encodeURIComponent(query)}`),
};
