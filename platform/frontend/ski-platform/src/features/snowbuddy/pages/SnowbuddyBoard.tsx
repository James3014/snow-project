/**
 * Snowbuddy Board Page
 * 雪伴公佈欄頁面 - 顯示所有公開的行程
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import TripBoardCard from '../components/TripBoardCard';
import Card from '@/shared/components/Card';
import type { TripSummary, BuddyStatus } from '@/features/trip-planning/types';
import type { Resort } from '@/shared/data/resorts';

// 擴展 TripSummary 類型以包含申請狀態
interface TripWithBuddyStatus extends TripSummary {
  myBuddyStatus?: BuddyStatus | null;
  myBuddyId?: string | null;
  user_id?: string; // 添加 user_id 用於判斷是否為行程主人
  pendingRequestCount?: number; // 自己的行程有多少待處理申請
  hasNewRequests?: boolean; // 是否有新的申請需要處理
}

export default function SnowbuddyBoard() {
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [trips, setTrips] = useState<TripWithBuddyStatus[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingTripId, setApplyingTripId] = useState<string | null>(null);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number | null>(null); // null=全部, 0=本月, 1=下月...
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, available, applied, joined, full, declined
  const [resortFilter, setResortFilter] = useState<string>('all'); // all or resort_id
  const [itemsToShow, setItemsToShow] = useState<number>(12); // 每次顯示的卡片數量

  // Linus 原則：簡單直接，只執行一次
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 獲取所有公開的行程
        const publicTrips = await tripPlanningApi.getPublicTrips();
        if (cancelled) return;

        // 獲取每個行程的申請狀態
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

        // 排序：我申請的 > 我的（有申請） > 其他
        const sortedTrips = tripsWithStatus.sort((a, b) => {
          if (a.myBuddyStatus && !b.myBuddyStatus) return -1;
          if (!a.myBuddyStatus && b.myBuddyStatus) return 1;
          if (a.hasNewRequests && !b.hasNewRequests) return -1;
          if (!a.hasNewRequests && b.hasNewRequests) return 1;
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        });

        setTrips(sortedTrips);

        // 載入雪場資料
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
  }, []); // 只執行一次

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
      // Linus 原則：簡單直接
      window.location.reload();
    } catch (err) {
      console.error('申請失敗:', err);

      // 檢查是否是重複申請錯誤
      const error = err as { response?: { data?: { detail?: string }; status?: number }; message?: string };
      const errorMessage = error?.response?.data?.detail || error?.message || '';

      if (errorMessage.includes('already have a pending or active request')) {
        alert('您已經申請過這個行程了\n\n請到「我申請的行程」區查看申請狀態');
      } else if (error?.response?.status === 400) {
        alert(`申請失敗：${errorMessage}`);
      } else {
        alert('申請失敗，請稍後再試');
      }
    } finally {
      setApplyingTripId(null);
    }
  };

  const handleCancelApply = async (tripId: string, buddyId: string) => {
    if (!userId) {
      return;
    }

    if (!confirm('確定要取消申請嗎？')) {
      return;
    }

    try {
      setApplyingTripId(tripId);
      await tripPlanningApi.cancelBuddyRequest(tripId, buddyId, userId);
      alert('已取消申請');
      // Linus 原則：簡單直接
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

  // 計算指定月的日期範圍（月初到月底）
  const getMonthRange = (monthOffset: number): { start: Date; end: Date } => {
    const today = new Date();

    const monthStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    return { start: monthStart, end: monthEnd };
  };

  // 過濾行程：按月、雪場和狀態過濾
  const getFilteredTrips = (): TripWithBuddyStatus[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return trips.filter(trip => {
      // 1. 月過濾（null = 全部未來行程）
      const tripStart = new Date(trip.start_date);

      if (selectedMonthOffset === null) {
        // 全部：顯示所有未來的行程
        if (tripStart < today) {
          return false;
        }
      } else {
        // 特定月份
        const { start, end } = getMonthRange(selectedMonthOffset);
        if (tripStart < start || tripStart > end) {
          return false;
        }
      }

      // 2. 雪場過濾
      if (resortFilter !== 'all' && trip.resort_id !== resortFilter) {
        return false;
      }

      // 3. 狀態過濾
      if (statusFilter === 'all') {
        return true;
      }

      const isOwner = trip.user_id === userId;
      const isFull = trip.current_buddies >= trip.max_buddies;
      const hasStatus = trip.myBuddyStatus;

      if (statusFilter === 'available') {
        // 可申請：還有名額、不是自己的、未申請過
        return !isOwner && !isFull && !hasStatus;
      } else if (statusFilter === 'applied') {
        // 申請中：狀態為 pending
        return trip.myBuddyStatus === 'pending';
      } else if (statusFilter === 'joined') {
        // 已加入：狀態為 accepted
        return trip.myBuddyStatus === 'accepted';
      } else if (statusFilter === 'full') {
        // 已額滿：沒有剩餘名額
        return isFull;
      } else if (statusFilter === 'declined') {
        // 已拒絕：狀態為 declined
        return trip.myBuddyStatus === 'declined';
      }

      return true;
    });
  };

  // 格式化月份顯示
  const formatMonthLabel = (monthOffset: number): string => {
    const { start } = getMonthRange(monthOffset);
    const year = start.getFullYear();
    const month = start.getMonth() + 1;
    return `${year}/${month}`;
  };

  // 獲取有行程的雪場列表（按行程數量排序）
  const getAvailableResorts = (): Array<{ resort: Resort; count: number }> => {
    const resortCounts = new Map<string, number>();

    // 計算每個雪場的行程數量
    trips.forEach(trip => {
      const count = resortCounts.get(trip.resort_id) || 0;
      resortCounts.set(trip.resort_id, count + 1);
    });

    // 建立雪場列表並排序（按行程數量降序）
    return Array.from(resortCounts.entries())
      .map(([resortId, count]) => ({
        resort: resorts.find(r => r.resort_id === resortId)!,
        count
      }))
      .filter(item => item.resort) // 過濾掉找不到的雪場
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重試
          </button>
        </Card>
      </div>
    );
  }

  const filteredTrips = getFilteredTrips();

  // 分頁邏輯
  const tripsToDisplay = filteredTrips.slice(0, itemsToShow);
  const hasMore = filteredTrips.length > itemsToShow;

  const handleLoadMore = () => {
    setItemsToShow(prev => prev + 12);
  };

  // 月份選項（全部 + 本月到未來5個月）
  const monthOptions = [
    { offset: null as number | null, label: '全部', monthLabel: '所有未來行程' },
    ...Array.from({ length: 6 }, (_, i) => ({
      offset: i,
      label: i === 0 ? '本月' : i === 1 ? '下月' : `${i}個月後`,
      monthLabel: formatMonthLabel(i)
    }))
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏔️ 雪伴公佈欄
        </h1>
        <p className="text-gray-600">
          尋找志同道合的滑雪夥伴，一起探索雪場！
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Month Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">📅 時間篩選：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {monthOptions.map(({ offset, label, monthLabel }) => (
              <button
                key={offset}
                onClick={() => setSelectedMonthOffset(offset)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMonthOffset === offset
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>{label}</span>
                  <span className="text-xs opacity-80">{monthLabel}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Resort Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">🏔️ 雪場篩選：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* 全部按鈕 */}
            <button
              onClick={() => setResortFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                resortFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部 ({trips.length})
            </button>

            {/* 有行程的雪場按鈕 */}
            {getAvailableResorts().map(({ resort, count }) => (
              <button
                key={resort.resort_id}
                onClick={() => setResortFilter(resort.resort_id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  resortFilter === resort.resort_id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {resort.names.zh} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">🎯 狀態篩選：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: '全部', icon: '📋' },
              { value: 'available', label: '可申請', icon: '✅' },
              { value: 'applied', label: '申請中', icon: '⏳' },
              { value: 'joined', label: '已加入', icon: '🎉' },
              { value: 'full', label: '已額滿', icon: '🈵' },
              { value: 'declined', label: '已拒絕', icon: '❌' }
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredTrips.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {trips.length === 0 ? '目前沒有公開的行程' : '這個月沒有公開的行程'}
          </h3>
          <p className="text-gray-600 mb-6">
            {trips.length === 0 ? '成為第一個發布行程的人吧！' : '試試選擇其他月份或建立新行程'}
          </p>
          <button
            onClick={() => navigate('/trips')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            前往我的行程
          </button>
        </Card>
      )}

      {/* Trip Cards Grid */}
      {filteredTrips.length > 0 && (
        <>
          {/* 我申請的行程區塊 */}
          {tripsToDisplay.some(t => t.myBuddyStatus) && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📌 我申請的行程</span>
                <span className="text-sm font-normal text-gray-600">
                  ({filteredTrips.filter(t => t.myBuddyStatus).length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tripsToDisplay
                  .filter(trip => trip.myBuddyStatus)
                  .map(trip => (
                    <TripBoardCard
                      key={trip.trip_id}
                      trip={trip}
                      resort={getResortForTrip(trip)}
                      onApply={handleApply}
                      onCancel={handleCancelApply}
                      isApplying={applyingTripId === trip.trip_id}
                      currentUserId={userId}
                      buddyStatus={trip.myBuddyStatus}
                      buddyId={trip.myBuddyId}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* 我的行程（有待處理申請）區塊 */}
          {tripsToDisplay.some(t => t.hasNewRequests && !t.myBuddyStatus) && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔔 我的行程（有新申請）</span>
                <span className="text-sm font-normal text-gray-600">
                  ({filteredTrips.filter(t => t.hasNewRequests && !t.myBuddyStatus).length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tripsToDisplay
                  .filter(trip => trip.hasNewRequests && !trip.myBuddyStatus)
                  .map(trip => (
                    <div key={trip.trip_id} className="relative">
                      {/* 待處理申請徽章 */}
                      <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                        {trip.pendingRequestCount}
                      </div>
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
            </div>
          )}

          {/* 其他公開行程區塊 */}
          {tripsToDisplay.some(t => !t.myBuddyStatus && !t.hasNewRequests) && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🏔️ 其他公開行程</span>
                <span className="text-sm font-normal text-gray-600">
                  ({filteredTrips.filter(t => !t.myBuddyStatus && !t.hasNewRequests).length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tripsToDisplay
                  .filter(trip => !trip.myBuddyStatus && !trip.hasNewRequests)
                  .map(trip => (
                    <TripBoardCard
                      key={trip.trip_id}
                      trip={trip}
                      resort={getResortForTrip(trip)}
                      onApply={handleApply}
                      onCancel={handleCancelApply}
                      isApplying={applyingTripId === trip.trip_id}
                      currentUserId={userId}
                      buddyStatus={trip.myBuddyStatus}
                      buddyId={trip.myBuddyId}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Load More 按鈕 */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                載入更多 ({filteredTrips.length - itemsToShow} 個剩餘)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
