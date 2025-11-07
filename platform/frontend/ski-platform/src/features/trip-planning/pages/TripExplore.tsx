/**
 * Public Trip Explore Page
 * 公開行程探索頁面（尋找雪伴）
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import Card from '@/shared/components/Card';
import type { Trip } from '../types';

export default function TripExplore() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    resort_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadTrips();
  }, [filters]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      // Note: API 尚未完全實現，使用臨時方案
      const data = await tripPlanningApi.exploreTrips({
        ...filters,
        limit: 50,
      });
      // 篩選出公開的行程
      setTrips(data.filter(t => t.visibility === 'public' && t.current_buddies < t.max_buddies));
    } catch (err) {
      console.error('載入行程失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">探索公開行程</h1>
        <p className="text-gray-600">尋找志同道合的雪伴，一起滑雪！</p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">雪場</label>
            <input
              type="text"
              value={filters.resort_id}
              onChange={(e) => setFilters({ ...filters, resort_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="例如：niseko"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">開始日期</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">結束日期</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </Card>

      {/* Trip List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      ) : trips.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600">沒有找到符合條件的公開行程</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Card key={trip.trip_id} className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {trip.title || trip.resort_id}
              </h3>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>📅 {new Date(trip.start_date).toLocaleDateString('zh-TW')} - {new Date(trip.end_date).toLocaleDateString('zh-TW')}</div>
                <div>👥 {trip.current_buddies}/{trip.max_buddies} 雪伴</div>
              </div>
              <button
                onClick={() => navigate(`/trips/${trip.trip_id}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                查看詳情
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
