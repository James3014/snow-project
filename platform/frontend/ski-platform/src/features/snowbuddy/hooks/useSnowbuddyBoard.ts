/**
 * useSnowbuddyBoard - 雪伴公佈欄數據 hook
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import type { TripSummary, BuddyStatus } from '@/features/trip-planning/types';
import type { Resort } from '@/shared/data/resorts';

interface TripWithBuddyStatus extends TripSummary {
  myBuddyStatus?: BuddyStatus | null;
  myBuddyId?: string | null;
  user_id?: string;
  pendingRequestCount?: number;
  hasNewRequests?: boolean;
}

export function useSnowbuddyBoard() {
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [trips, setTrips] = useState<TripWithBuddyStatus[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingTripId, setApplyingTripId] = useState<string | null>(null);

  // Filters
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resortFilter, setResortFilter] = useState<string>('all');
  const [itemsToShow, setItemsToShow] = useState<number>(12);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const publicTrips = await tripPlanningApi.getPublicTrips();

      const tripsWithStatus: TripWithBuddyStatus[] = await Promise.all(
        publicTrips.map(async (trip) => {
          try {
            const buddies = await tripPlanningApi.getTripBuddies(trip.trip_id);
            const myRequest = buddies.find(b => b.user_id === userId);
            const isMyTrip = trip.owner_info.user_id === userId;
            const pendingCount = isMyTrip ? buddies.filter(b => b.status === 'pending').length : 0;

            return {
              ...trip,
              user_id: trip.owner_info.user_id,
              myBuddyStatus: (myRequest?.status as BuddyStatus) || null,
              myBuddyId: myRequest?.buddy_id || null,
              pendingRequestCount: pendingCount,
              hasNewRequests: pendingCount > 0
            };
          } catch {
            return {
              ...trip,
              user_id: trip.owner_info.user_id,
              myBuddyStatus: null,
              myBuddyId: null,
              pendingRequestCount: 0,
              hasNewRequests: false
            };
          }
        })
      );

      setTrips(tripsWithStatus);

      try {
        const resortsData = await resortApiService.getAllResorts();
        setResorts(resortsData.items);
      } catch {
        console.error('載入雪場資料失敗');
      }
    } catch (err) {
      console.error('載入公開行程失敗:', err);
      setError('載入公開行程失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleApply = useCallback(async (tripId: string) => {
    if (!userId) {
      alert('請先登入');
      return;
    }
    try {
      setApplyingTripId(tripId);
      await tripPlanningApi.requestToJoinTrip(tripId, userId);
      alert('申請成功！等待行程主人審核');
      await loadTrips();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || '申請失敗，請稍後再試');
    } finally {
      setApplyingTripId(null);
    }
  }, [userId, loadTrips]);

  const handleCancelApplication = useCallback(async (tripId: string, buddyId: string) => {
    if (!confirm('確定要取消申請嗎？')) return;
    try {
      setApplyingTripId(tripId);
      await tripPlanningApi.cancelBuddyRequest(tripId, buddyId, userId!);
      alert('已取消申請');
      await loadTrips();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || '取消失敗，請稍後再試');
    } finally {
      setApplyingTripId(null);
    }
  }, [userId, loadTrips]);

  // Filtered and sorted trips
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    // Month filter
    if (selectedMonthOffset !== null) {
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + selectedMonthOffset, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + selectedMonthOffset + 1, 1);
      result = result.filter(trip => {
        const startDate = new Date(trip.start_date);
        return startDate >= targetMonth && startDate < nextMonth;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(trip => {
        if (statusFilter === 'applied') return trip.myBuddyStatus === 'pending';
        if (statusFilter === 'joined') return trip.myBuddyStatus === 'accepted';
        if (statusFilter === 'available') return !trip.myBuddyStatus && trip.current_buddies < trip.max_buddies;
        return true;
      });
    }

    // Resort filter
    if (resortFilter !== 'all') {
      result = result.filter(trip => trip.resort_id === resortFilter);
    }

    // Sort: my trips with pending requests first, then applied, then by date
    result.sort((a, b) => {
      if (a.hasNewRequests && !b.hasNewRequests) return -1;
      if (!a.hasNewRequests && b.hasNewRequests) return 1;
      if (a.myBuddyStatus === 'pending' && b.myBuddyStatus !== 'pending') return -1;
      if (a.myBuddyStatus !== 'pending' && b.myBuddyStatus === 'pending') return 1;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });

    return result;
  }, [trips, selectedMonthOffset, statusFilter, resortFilter]);

  const displayedTrips = filteredTrips.slice(0, itemsToShow);
  const hasMore = filteredTrips.length > itemsToShow;

  const loadMore = useCallback(() => {
    setItemsToShow(prev => prev + 12);
  }, []);

  const uniqueResorts = useMemo(() => {
    const resortIds = [...new Set(trips.map(t => t.resort_id))];
    return resorts.filter(r => resortIds.includes(r.resort_id));
  }, [trips, resorts]);

  return {
    userId,
    trips: displayedTrips,
    allTrips: filteredTrips,
    resorts,
    uniqueResorts,
    loading,
    error,
    applyingTripId,
    selectedMonthOffset,
    statusFilter,
    resortFilter,
    hasMore,
    setSelectedMonthOffset,
    setStatusFilter,
    setResortFilter,
    handleApply,
    handleCancelApplication,
    loadMore,
  };
}
