/**
 * 公開行程頁面 - 瀏覽和加入其他人的滑雪行程
 */
import { useState, useEffect } from 'react';
import { calendarApi } from '@/shared/api/calendarApi';
import type { PublicTrip } from '@/shared/api/calendarApi';

export default function PublicTripsPage() {
  const [trips, setTrips] = useState<PublicTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ resort_id: '', region: '' });
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    loadTrips();
  }, [filter]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await calendarApi.getPublicTrips({
        resort_id: filter.resort_id || undefined,
        region: filter.region || undefined,
      });
      setTrips(data);
    } catch (err) {
      console.error('Failed to load public trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (tripId: string) => {
    setJoining(tripId);
    try {
      await calendarApi.joinPublicTrip(tripId, '想一起滑雪！');
      alert('已送出申請！等待行程主人審核');
      loadTrips();
    } catch (err) {
      alert('申請失敗，請稍後再試');
    } finally {
      setJoining(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">🎿 公開行程</h1>

      {/* 篩選器 */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter.region}
          onChange={(e) => setFilter({ ...filter, region: e.target.value })}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg"
        >
          <option value="">所有地區</option>
          <option value="北海道">北海道</option>
          <option value="長野">長野</option>
          <option value="新潟">新潟</option>
        </select>
      </div>

      {/* 行程列表 */}
      {loading ? (
        <div className="text-gray-400">載入中...</div>
      ) : trips.length === 0 ? (
        <div className="text-gray-400 text-center py-12">
          目前沒有公開行程，試試發布你的行程吧！
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">{trip.title}</h3>
                  <p className="text-cyan-400 text-sm mt-1">
                    {trip.resort_name || trip.resort_id || '未指定雪場'}
                    {trip.region && ` · ${trip.region}`}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    📅 {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    👥 {trip.current_buddies}/{trip.max_buddies} 人
                  </p>
                </div>
                <button
                  onClick={() => handleJoin(trip.id)}
                  disabled={joining === trip.id || trip.current_buddies >= trip.max_buddies}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    trip.current_buddies >= trip.max_buddies
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                  }`}
                >
                  {joining === trip.id
                    ? '申請中...'
                    : trip.current_buddies >= trip.max_buddies
                    ? '已額滿'
                    : '申請加入'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
