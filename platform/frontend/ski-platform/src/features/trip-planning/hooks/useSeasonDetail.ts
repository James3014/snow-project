/**
 * useSeasonDetail - 雪季詳情數據 hook
 */
import { useState, useEffect, useCallback } from 'react';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import type { Season, SeasonStats, CalendarTrip, Trip, TripCreate } from '../types';
import type { Resort } from '@/shared/data/resorts';

interface UseSeasonDetailOptions {
  seasonId: string | undefined;
  userId: string | undefined;
}

export function useSeasonDetail({ seasonId, userId }: UseSeasonDetailOptions) {
  const [season, setSeason] = useState<Season | null>(null);
  const [stats, setStats] = useState<SeasonStats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [calendarTrips, setCalendarTrips] = useState<CalendarTrip[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadSeasonData = useCallback(async () => {
    if (!seasonId || !userId) return;

    try {
      setLoading(true);
      const [seasonData, statsData, tripsData, resortsData] = await Promise.all([
        tripPlanningApi.getSeason(seasonId, userId),
        tripPlanningApi.getSeasonStats(seasonId, userId),
        tripPlanningApi.getTrips(userId, { season_id: seasonId }),
        resortApiService.getAllResorts(),
      ]);

      setSeason(seasonData);
      setStats(statsData);
      setTrips(tripsData);
      setResorts(resortsData.items);
    } catch (err) {
      console.error('載入雪季資料失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [seasonId, userId]);

  const loadCalendarData = useCallback(async () => {
    if (!seasonId || !userId) return;

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const data = await tripPlanningApi.getCalendarTrips(userId, year, month);
      setCalendarTrips(data);
    } catch (err) {
      console.error('載入日曆資料失敗:', err);
    }
  }, [seasonId, userId, currentMonth]);

  const changeMonth = useCallback((offset: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + offset);
      return newMonth;
    });
  }, []);

  const createTrips = useCallback(async (newTrips: TripCreate[]) => {
    if (!seasonId || !userId) return;

    await Promise.all(newTrips.map(trip => tripPlanningApi.createTrip(userId, trip)));
    await loadSeasonData();
  }, [seasonId, userId, loadSeasonData]);

  useEffect(() => {
    if (seasonId && userId) loadSeasonData();
  }, [seasonId, userId, loadSeasonData]);

  return {
    season,
    stats,
    trips,
    calendarTrips,
    resorts,
    loading,
    currentMonth,
    changeMonth,
    createTrips,
    loadCalendarData,
  };
}
