/**
 * useSeasonDetail - 雪季詳情數據 hook
 */
import { useState, useEffect, useCallback } from 'react';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import { calendarApi } from '@/shared/api/calendarApi';
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
      // 使用統一行事曆 API 獲取所有事件
      const sharedCalendar = await calendarApi.getSharedCalendar();
      
      // 篩選當月事件並轉換為 CalendarTrip 格式
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      
      const monthEvents = sharedCalendar.trips.filter(trip => {
        const tripStart = new Date(trip.start_date);
        const tripEnd = new Date(trip.end_date);
        return (tripStart <= monthEnd && tripEnd >= monthStart);
      });
      
      // 轉換為本地 CalendarTrip 格式
      const convertedTrips: CalendarTrip[] = monthEvents.map(trip => ({
        trip_id: trip.id,
        user_id: userId,
        resort_id: '', // calendarApi 的 CalendarTrip 沒有 resort_id，使用空字符串
        title: trip.title,
        start_date: trip.start_date,
        end_date: trip.end_date,
        timezone: trip.timezone,
        visibility: trip.visibility,
        trip_status: trip.status,
        current_buddies: 0,
        max_buddies: 0
      }));
      
      setCalendarTrips(convertedTrips);
    } catch (err) {
      console.error('載入統一行事曆資料失敗:', err);
      // 降級到原有 API
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const data = await tripPlanningApi.getCalendarTrips(userId, year, month);
        setCalendarTrips(data);
      } catch (fallbackErr) {
        console.error('載入日曆資料失敗:', fallbackErr);
      }
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

    try {
      // 創建行程
      const createdTrips = await Promise.all(
        newTrips.map(trip => tripPlanningApi.createTrip(userId, trip))
      );

      // 為每個行程創建行事曆事件
      await Promise.all(
        createdTrips.map(async (trip) => {
          try {
            await calendarApi.createEvent({
              user_id: userId,
              type: 'TRIP_PLANNING',
              title: trip.title || `滑雪行程 - ${trip.resort_id}`,
              start_date: trip.start_date,
              end_date: trip.end_date,
              all_day: true,
              timezone: 'Asia/Taipei',
              source_app: 'ski-platform',
              source_id: trip.trip_id,
              related_trip_id: trip.trip_id,
              resort_id: trip.resort_id,
              description: trip.notes || '從 SnowTrace 平台創建的滑雪行程'
            });
          } catch (calendarErr) {
            console.error('創建行事曆事件失敗:', calendarErr);
            // 不影響行程創建
          }
        })
      );

      await loadSeasonData();
      await loadCalendarData();
    } catch (err) {
      console.error('創建行程失敗:', err);
      throw err;
    }
  }, [seasonId, userId, loadSeasonData, loadCalendarData]);

  useEffect(() => {
    if (seasonId && userId) {
      loadSeasonData();
      loadCalendarData();
    }
  }, [seasonId, userId, loadSeasonData, loadCalendarData]);

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
