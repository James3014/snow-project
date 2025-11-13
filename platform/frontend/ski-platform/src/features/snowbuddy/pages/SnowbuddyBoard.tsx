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

export default function SnowbuddyBoard() {
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [trips, setTrips] = useState<Trip[]>([]);
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

      // 獲取所有行程（後端需要支持過濾 visibility='public'）
      // 目前先獲取所有行程，前端過濾
      const allTrips = await tripPlanningApi.getTrips(userId || '');

      // 過濾出公開的行程（包含自己的，但不能申請加入自己的）
      const publicTrips = allTrips.filter(
        trip => trip.visibility === 'public'
      );

      setTrips(publicTrips);

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
      // 可選：重新載入列表或更新狀態
    } catch (err) {
      console.error('申請失敗:', err);
      alert('申請失敗，請稍後再試');
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => (
            <TripBoardCard
              key={trip.trip_id}
              trip={trip}
              resort={getResortForTrip(trip)}
              onApply={handleApply}
              isApplying={applyingTripId === trip.trip_id}
              currentUserId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
