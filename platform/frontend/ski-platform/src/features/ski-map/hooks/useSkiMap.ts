/**
 * 滑雪地圖數據 Hook
 */
import { useState, useEffect } from 'react';
import { skiMapApi } from '../api/skiMapApi';
import type { SkiMapData } from '../types/map.types';

export const useSkiMap = (userId: string) => {
  const [mapData, setMapData] = useState<SkiMapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await skiMapApi.getSkiMapData(userId);
        setMapData(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '獲取地圖數據失敗';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchMapData();
    }
  }, [userId]);

  return { mapData, isLoading, error };
};
