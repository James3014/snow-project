/**
 * Snowbuddy Board Page - Glacial Futurism Design
 * 雪伴公佈欄頁面 - 冰川未來主義設計
 *
 * Mobile-First | Horizontal Scroll Filters | Fluid Cards
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import TripBoardCard from '../components/TripBoardCard';
import type { TripSummary, BuddyStatus } from '@/features/trip-planning/types';
import type { Resort } from '@/shared/data/resorts';

interface TripWithBuddyStatus extends TripSummary {
  myBuddyStatus?: BuddyStatus | null;
  myBuddyId?: string | null;
  user_id?: string;
  pendingRequestCount?: number;
  hasNewRequests?: boolean;
}

export default function SnowbuddyBoard() {
  const navigate = useNavigate();
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const publicTrips = await tripPlanningApi.getPublicTrips();
        if (cancelled) return;

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

        if (cancelled) return;

        const sortedTrips = tripsWithStatus.sort((a, b) => {
          if (a.myBuddyStatus && !b.myBuddyStatus) return -1;
          if (!a.myBuddyStatus && b.myBuddyStatus) return 1;
          if (a.hasNewRequests && !b.hasNewRequests) return -1;
          if (!a.hasNewRequests && b.hasNewRequests) return 1;
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        });

        setTrips(sortedTrips);

        try {
          const resortsData = await resortApiService.getAllResorts();
          if (!cancelled) setResorts(resortsData.items);
        } catch (err) {
          console.error('載入雪場資料失敗:', err);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('載入公開行程失敗:', err);
          setError('載入公開行程失敗，請稍後再試');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleApply = async (tripId: string) => {
    if (!userId) {
      alert('請先登入');
      navigate('/login');
      return;
    }

    try {
      setApplyingTripId(tripId);
      await tripPlanningApi.requestToJoinTrip(tripId, userId);
      alert('申請成功！請等待行程主人回應');
      window.location.reload();
    } catch (err) {
      console.error('申請失敗:', err);
      const error = err as { response?: { data?: { detail?: string }; status?: number }; message?: string };
      const errorMessage = error?.response?.data?.detail || error?.message || '';

      if (errorMessage.includes('already have a pending or active request')) {
        alert('您已經申請過這個行程了');
      } else {
        alert('申請失敗，請稍後再試');
      }
    } finally {
      setApplyingTripId(null);
    }
  };

  const handleCancelApply = async (tripId: string, buddyId: string) => {
    if (!userId || !confirm('確定要取消申請嗎？')) return;

    try {
      setApplyingTripId(tripId);
      await tripPlanningApi.cancelBuddyRequest(tripId, buddyId, userId);
      alert('已取消申請');
      window.location.reload();
    } catch (err) {
      console.error('取消申請失敗:', err);
      alert('取消申請失敗，請稍後再試');
    } finally {
      setApplyingTripId(null);
    }
  };

  const getResortForTrip = (trip: TripSummary): Resort | null => {
    return resorts.find(r => r.resort_id === trip.resort_id) || null;
  };

  const getMonthRange = (monthOffset: number): { start: Date; end: Date } => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    return { start: monthStart, end: monthEnd };
  };

  const getFilteredTrips = (): TripWithBuddyStatus[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return trips.filter(trip => {
      const tripStart = new Date(trip.start_date);

      if (selectedMonthOffset === null) {
        if (tripStart < today) return false;
      } else {
        const { start, end } = getMonthRange(selectedMonthOffset);
        if (tripStart < start || tripStart > end) return false;
      }

      if (resortFilter !== 'all' && trip.resort_id !== resortFilter) return false;

      if (statusFilter === 'all') return true;

      const isOwner = trip.user_id === userId;
      const isFull = trip.current_buddies >= trip.max_buddies;
      const hasStatus = trip.myBuddyStatus;

      if (statusFilter === 'available') return !isOwner && !isFull && !hasStatus;
      if (statusFilter === 'applied') return trip.myBuddyStatus === 'pending';
      if (statusFilter === 'joined') return trip.myBuddyStatus === 'accepted';
      if (statusFilter === 'full') return isFull;
      if (statusFilter === 'declined') return trip.myBuddyStatus === 'declined';

      return true;
    });
  };

  const formatMonthLabel = (monthOffset: number): string => {
    const { start } = getMonthRange(monthOffset);
    return `${start.getMonth() + 1}月`;
  };

  const getAvailableResorts = (): Array<{ resort: Resort; count: number }> => {
    const resortCounts = new Map<string, number>();
    trips.forEach(trip => {
      const count = resortCounts.get(trip.resort_id) || 0;
      resortCounts.set(trip.resort_id, count + 1);
    });

    return Array.from(resortCounts.entries())
      .map(([resortId, count]) => ({
        resort: resorts.find(r => r.resort_id === resortId)!,
        count
      }))
      .filter(item => item.resort)
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-12 text-center">
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-neon"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  const filteredTrips = getFilteredTrips();
  const tripsToDisplay = filteredTrips.slice(0, itemsToShow);
  const hasMore = filteredTrips.length > itemsToShow;

  const monthOptions = [
    { offset: null as number | null, label: '全部' },
    ...Array.from({ length: 6 }, (_, i) => ({
      offset: i,
      label: i === 0 ? '本月' : formatMonthLabel(i)
    }))
  ];

  const statusOptions = [
    { value: 'all', label: '全部', icon: '📋' },
    { value: 'available', label: '可申請', icon: '✅' },
    { value: 'applied', label: '申請中', icon: '⏳' },
    { value: 'joined', label: '已加入', icon: '🎉' },
    { value: 'full', label: '已滿', icon: '🈵' },
    { value: 'declined', label: '已拒絕', icon: '❌' }
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            雪伴公佈欄
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1 mb-6">
            尋找志同道合的滑雪夥伴，一起探索雪場
          </p>
          
          {/* 導航按鈕 */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/snowbuddy/smart-matching')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all"
            >
              🧠 智慧媒合
            </button>
            <button
              onClick={() => navigate('/snowbuddy/requests')}
              className="px-6 py-3 bg-zinc-800/50 backdrop-blur-md text-cyan-400 font-medium rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 hover:bg-zinc-700/50 transition-all"
            >
              💌 媒合請求
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-6 space-y-4">
        {/* Time Filter - Horizontal Scroll */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-crystal-blue uppercase tracking-wide">📅 時間</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4">
            {monthOptions.map(({ offset, label }) => (
              <button
                key={`${offset}`}
                onClick={() => setSelectedMonthOffset(offset)}
                className={`filter-pill scroll-snap-item flex-shrink-0 ${
                  selectedMonthOffset === offset ? 'active' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Resort Filter - Horizontal Scroll */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-crystal-blue uppercase tracking-wide">🏔️ 雪場</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4">
            <button
              onClick={() => setResortFilter('all')}
              className={`filter-pill scroll-snap-item flex-shrink-0 ${
                resortFilter === 'all' ? 'active' : ''
              }`}
            >
              全部 ({trips.length})
            </button>
            {getAvailableResorts().map(({ resort, count }) => (
              <button
                key={resort.resort_id}
                onClick={() => setResortFilter(resort.resort_id)}
                className={`filter-pill scroll-snap-item flex-shrink-0 ${
                  resortFilter === resort.resort_id ? 'active' : ''
                }`}
              >
                {resort.names.zh} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter - Horizontal Scroll */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-crystal-blue uppercase tracking-wide">🎯 狀態</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4">
            {statusOptions.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`filter-pill scroll-snap-item flex-shrink-0 ${
                  statusFilter === value ? 'active' : ''
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trip Cards Grid */}
      <div className="px-4">
        {filteredTrips.length === 0 ? (
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-frost-white mb-2">
              {trips.length === 0 ? '目前沒有公開的行程' : '沒有符合條件的行程'}
            </h3>
            <p className="text-crystal-blue mb-6">
              {trips.length === 0 ? '成為第一個發布行程的人吧！' : '試試調整篩選條件或建立新行程'}
            </p>
            <button
              onClick={() => navigate('/trips')}
              className="btn-neon"
            >
              前往我的行程
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {tripsToDisplay.map((trip, index) => (
                <div
                  key={trip.trip_id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {trip.hasNewRequests && !trip.myBuddyStatus && (
                    <div className="relative">
                      <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg pulse-glow">
                        {trip.pendingRequestCount}
                      </div>
                    </div>
                  )}
                  <TripBoardCard
                    trip={trip}
                    resort={getResortForTrip(trip)}
                    onApply={handleApply}
                    onCancel={handleCancelApply}
                    isApplying={applyingTripId === trip.trip_id}
                    currentUserId={userId}
                    buddyStatus={trip.myBuddyStatus}
                    buddyId={trip.myBuddyId}
                  />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center animate-slide-up">
                <button
                  onClick={() => setItemsToShow(prev => prev + 12)}
                  className="btn-neon ski-trail"
                >
                  載入更多 ({filteredTrips.length - itemsToShow} 個剩餘)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
