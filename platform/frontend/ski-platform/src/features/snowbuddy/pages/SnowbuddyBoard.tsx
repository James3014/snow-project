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
import type { Trip } from '@/features/trip-planning/types';
import type { Resort } from '@/shared/data/resorts';

// 擴展 Trip 類型以包含申請狀態
interface TripWithBuddyStatus extends Trip {
  myBuddyStatus?: 'pending' | 'accepted' | 'declined' | null;
  myBuddyId?: string | null;
}

export default function SnowbuddyBoard() {
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [trips, setTrips] = useState<TripWithBuddyStatus[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingTripId, setApplyingTripId] = useState<string | null>(null);

  useEffect(() => {
    loadPublicTrips();
  }, []);

  const loadPublicTrips = async () => {
    try {
      setLoading(true);
      setError(null);

      // 獲取所有公開的行程（使用後端的 /trips/public API）
      const publicTrips = await tripPlanningApi.getPublicTrips();

      // 獲取每個行程的申請狀態
      const tripsWithStatus: TripWithBuddyStatus[] = await Promise.all(
        publicTrips.map(async (trip) => {
          try {
            // 獲取行程的所有雪伴申請
            const buddies = await tripPlanningApi.getTripBuddies(trip.trip_id);
            // 查找當前用戶的申請
            const myRequest = buddies.find(b => b.user_id === userId);
            return {
              ...trip,
              myBuddyStatus: myRequest?.status as any || null,
              myBuddyId: myRequest?.buddy_id || null
            };
          } catch (err) {
            // 如果獲取失敗，返回原始行程
            return { ...trip, myBuddyStatus: null, myBuddyId: null };
          }
        })
      );

      // 排序：申請過的行程置頂
      const sortedTrips = tripsWithStatus.sort((a, b) => {
        // 有申請狀態的排前面
        if (a.myBuddyStatus && !b.myBuddyStatus) return -1;
        if (!a.myBuddyStatus && b.myBuddyStatus) return 1;
        // 都有申請或都沒申請，按日期排序（最近的在前）
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      });

      setTrips(sortedTrips);

      // 載入雪場資料
      try {
        const resortsData = await resortApiService.getAllResorts();
        setResorts(resortsData.items);
      } catch (err) {
        console.error('載入雪場資料失敗:', err);
      }
    } catch (err) {
      console.error('載入公開行程失敗:', err);
      setError('載入公開行程失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

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
      // 重新載入列表以更新申請狀態
      await loadPublicTrips();
    } catch (err: any) {
      console.error('申請失敗:', err);

      // 檢查是否是重複申請錯誤
      const errorMessage = err?.response?.data?.detail || err?.message || '';

      if (errorMessage.includes('already have a pending or active request')) {
        alert('您已經申請過這個行程了\n\n請到「我申請的行程」區查看申請狀態');
      } else if (err?.response?.status === 400) {
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
      // 重新載入列表以更新申請狀態
      await loadPublicTrips();
    } catch (err: any) {
      console.error('取消申請失敗:', err);
      alert('取消申請失敗，請稍後再試');
    } finally {
      setApplyingTripId(null);
    }
  };

  const getResortForTrip = (trip: Trip): Resort | null => {
    return resorts.find(r => r.resort_id === trip.resort_id) || null;
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
            onClick={loadPublicTrips}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重試
          </button>
        </Card>
      </div>
    );
  }

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

      {/* Empty State */}
      {trips.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            目前沒有公開的行程
          </h3>
          <p className="text-gray-600 mb-6">
            成為第一個發布行程的人吧！
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
      {trips.length > 0 && (
        <>
          {/* 我申請的行程區塊 */}
          {trips.some(t => t.myBuddyStatus) && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📌 我申請的行程</span>
                <span className="text-sm font-normal text-gray-600">
                  ({trips.filter(t => t.myBuddyStatus).length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips
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

          {/* 其他公開行程區塊 */}
          {trips.some(t => !t.myBuddyStatus) && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🏔️ 其他公開行程</span>
                <span className="text-sm font-normal text-gray-600">
                  ({trips.filter(t => !t.myBuddyStatus).length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips
                  .filter(trip => !trip.myBuddyStatus)
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
        </>
      )}
    </div>
  );
}
