/**
 * useTripCreation Hook
 *
 * 提取行程创建业务逻辑，遵循 Linus 原则：
 * - 职责单一：只处理行程创建
 * - 可测试：独立于组件的业务逻辑
 * - 可复用：其他组件也可使用此 hook
 */

import { useState } from 'react';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { calculateSeasonId } from '@/features/trip-planning/utils/seasonUtils';
import { calculateEndDate } from '../utils/durationParser';
import type { ResortMatch } from '../utils/resortMatcher';

export interface TripCreationData {
  resort: ResortMatch;
  startDate: Date;
  endDate?: Date;
  duration?: number;
}

export interface TripCreationResult {
  tripId: string;
  seasonId: string;
  duration: number;
}

/**
 * 行程创建 Hook
 */
export function useTripCreation(userId: string | undefined) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 创建行程
   */
  const createTrip = async (data: TripCreationData): Promise<TripCreationResult> => {
    const { resort, startDate, endDate: providedEndDate, duration: providedDuration } = data;

    // 1. 参数验证
    if (!userId) {
      throw new Error('用戶未登入');
    }

    if (!resort || !startDate) {
      throw new Error('缺少必要資訊');
    }

    if (!providedEndDate && !providedDuration) {
      throw new Error('缺少日期範圍或天數');
    }

    setIsCreating(true);
    setError(null);

    try {
      // 2. 日期和天数计算
      let endDate: Date;
      let duration: number;

      if (providedEndDate) {
        endDate = providedEndDate;
        // 从 startDate 到 endDate 计算天数
        const diffTime = endDate.getTime() - startDate.getTime();
        duration = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      } else {
        // 使用 duration 计算 endDate
        duration = providedDuration!;
        endDate = calculateEndDate(startDate, duration);
      }

      // 3. 雪季处理（检查或创建）
      const seasonName = calculateSeasonId(startDate.toISOString().split('T')[0]);
      let actualSeasonId: string;

      try {
        const seasons = await tripPlanningApi.getSeasons(userId);
        const existingSeason = seasons.find(s => s.title === seasonName);

        if (existingSeason) {
          // 使用现有雪季
          actualSeasonId = existingSeason.season_id;
        } else {
          // 创建新雪季
          const [startYear, endYear] = seasonName.split('-').map(Number);
          const newSeason = await tripPlanningApi.createSeason(userId, {
            title: seasonName,
            description: `${startYear}-${endYear} 滑雪季`,
            start_date: `${startYear}-11-01`,
            end_date: `${endYear}-04-30`,
          });
          actualSeasonId = newSeason.season_id;
        }
      } catch (seasonError) {
        console.error('處理雪季失敗:', seasonError);
        throw new Error('無法創建或獲取雪季');
      }

      // 4. 创建行程
      const response = await tripPlanningApi.createTrip(userId, {
        season_id: actualSeasonId,
        resort_id: resort.resort.resort_id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        title: `${resort.resort.names.zh} ${duration}日遊`,
        trip_status: 'planning',
      });

      return {
        tripId: response.trip_id,
        seasonId: actualSeasonId,
        duration,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立行程失敗，請稍後再試';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createTrip,
    isCreating,
    error,
  };
}
