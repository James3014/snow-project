/**
 * 滑雪地圖 API 調用
 */
import { userCoreClient } from '@/shared/api/client';
import type { SkiMapData } from '../types/map.types';

const BASE_URL = '/ski-map';

export const skiMapApi = {
  /**
   * 獲取用戶的滑雪地圖數據
   */
  getSkiMapData: async (userId: string): Promise<SkiMapData> => {
    const response = await userCoreClient.get(`${BASE_URL}/users/${userId}/ski-map`);
    return response.data;
  },

  /**
   * 獲取區域詳情
   */
  getRegionDetail: async (userId: string, region: string): Promise<any> => {
    const response = await userCoreClient.get(
      `${BASE_URL}/users/${userId}/ski-map/regions/${encodeURIComponent(region)}`
    );
    return response.data;
  },
};
