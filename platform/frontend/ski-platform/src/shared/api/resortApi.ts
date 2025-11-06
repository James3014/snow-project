/**
 * Resort API
 * 雪场API接口
 */
import { resortApi } from './client';
import type { Resort } from '../types/common';

/**
 * 雪场API
 */
export const resortApiService = {
  // 获取所有雪场列表
  getAllResorts: () => resortApi.get<Resort[]>('/resorts'),

  // 获取单个雪场详情
  getResort: (resortId: string) => resortApi.get<Resort>(`/resorts/${resortId}`),

  // 搜索雪场
  searchResorts: (query: string) =>
    resortApi.get<Resort[]>(`/resorts/search?q=${encodeURIComponent(query)}`),
};
