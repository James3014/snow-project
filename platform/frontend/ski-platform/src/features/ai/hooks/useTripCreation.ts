/**
 * useTripCreation Hook
 *
 * 提取行程創建業務邏輯，遵循 Linus 原則：
 * - 職責單一：只處理行程創建
 * - 可測試：獨立於組件的業務邏輯
 * - 可複用：其他組件也可使用此 hook
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
  visibility?: 'public' | 'private';
  maxBuddies?: number;
}

export interface TripCreationResult {
  tripId: string;
  seasonId: string;
  duration: number;
}

/**
 * 行程創建 Hook
 */
export function useTripCreation(userId: string | undefined) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 創建行程
   */
  /**
   * 計算日期範圍內的天數（包括起始日和結束日）
   *
   * @example
   * calculateDaysInRange(3月4日, 3月9日) => 6天 (4,5,6,7,8,9)
   * calculateDaysInRange(12月3日, 12月12日) => 10天
   */
  const calculateDaysInRange = (start: Date, end: Date): number => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.round(timeDiff / MS_PER_DAY);
    // 包括起始日和結束日，所以要 +1
    // 例如：從4日到9日 = 9-4 = 5天差距，但實際是6天
    return daysDiff + 1;
  };

  /**
   * 格式化日期為本地日期字符串 (YYYY-MM-DD)
   * 避免使用 toISOString() 造成的時區偏移問題
   */
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const createTrip = async (data: TripCreationData): Promise<TripCreationResult> => {
    const { resort, startDate, endDate: providedEndDate, duration: providedDuration, visibility, maxBuddies } = data;

    // 1. 參數驗證
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
      // 2. 日期和天數計算
      let endDate: Date;
      let duration: number;

      if (providedEndDate) {
        endDate = providedEndDate;
        duration = calculateDaysInRange(startDate, endDate);
      } else {
        // 使用 duration 計算 endDate
        duration = providedDuration!;
        endDate = calculateEndDate(startDate, duration);
      }

      // 3. 雪季處理（檢查或創建）
      const seasonName = calculateSeasonId(formatLocalDate(startDate));
      let actualSeasonId: string;

      try {
        const seasons = await tripPlanningApi.getSeasons(userId);
        const existingSeason = seasons.find(s => s.title === seasonName);

        if (existingSeason) {
          // 使用现有雪季
          actualSeasonId = existingSeason.season_id;
        } else {
          // 創建新雪季
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

      // 4. 創建行程
      const response = await tripPlanningApi.createTrip(userId, {
        season_id: actualSeasonId,
        resort_id: resort.resort.resort_id,
        start_date: formatLocalDate(startDate),
        end_date: formatLocalDate(endDate),
        title: `${resort.resort.names.zh} ${duration}日遊`,
        trip_status: 'planning',
        visibility: visibility || 'private',
        max_buddies: maxBuddies || 0,
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
