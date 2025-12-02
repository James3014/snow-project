/**
 * Public Trip Explore Page - Glacial Futurism Design
 * 公開行程探索頁面（尋找雪伴）
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import type { Trip } from '../types';
import type { Resort } from '@/shared/data/resorts';

export default function TripExplore() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    resort_id: '',
    start_date: '',
    end_date: '',
  });

  const loadTrips = useCallback(async () => {
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
  }, [filters]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    const loadResorts = async () => {
      try {
        const response = await resortApiService.getAllResorts();
        setResorts(response.items);
      } catch (error) {
        console.error('載入雪場列表失敗:', error);
      }
    };
    loadResorts();
  }, []);

  // 建立雪場 ID 到雪場資料的映射
  const resortsMap = resorts.reduce((acc, resort) => {
    acc[resort.resort_id] = resort;
    return acc;
  }, {} as Record<string, Resort>);

  // 獲取雪場名稱（優先中文）
  const getResortName = (resortId: string) => {
    const resort = resortsMap[resortId];
    if (resort) {
      return `${resort.names.zh} ${resort.names.en}`;
    }
    return resortId;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入行程中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            🌍 探索公開行程
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            尋找志同道合的雪伴，一起滑雪冒險
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Filters Card */}
        <Card
          variant="glass"
          className="mb-8 animate-slide-up stagger-2"
        >
          <Card.Body className="space-y-6">
            <h2 className="text-xl font-semibold text-frost-white">篩選條件</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-crystal-blue mb-2">雪場</label>
                <input
                  type="text"
                  value={filters.resort_id}
                  onChange={(e) => setFilters({ ...filters, resort_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-frost-white/5 border border-ice-primary/30 text-frost-white placeholder-crystal-blue/50 focus:outline-none focus:border-ice-primary/60 focus:ring-1 focus:ring-ice-primary/40 transition-colors"
                  placeholder="例如：niseko"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-crystal-blue mb-2">開始日期</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-frost-white/5 border border-ice-primary/30 text-frost-white placeholder-crystal-blue/50 focus:outline-none focus:border-ice-primary/60 focus:ring-1 focus:ring-ice-primary/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-crystal-blue mb-2">結束日期</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-frost-white/5 border border-ice-primary/30 text-frost-white placeholder-crystal-blue/50 focus:outline-none focus:border-ice-primary/60 focus:ring-1 focus:ring-ice-primary/40 transition-colors"
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Trip List */}
        {trips.length === 0 ? (
          <Card variant="glass" className="animate-slide-up stagger-3">
            <Card.Body className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-frost-white mb-2">沒有找到符合條件的行程</h3>
              <p className="text-crystal-blue">試試調整篩選條件或建立您自己的公開行程</p>
            </Card.Body>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip, idx) => {
              const displayName = trip.title || getResortName(trip.resort_id);
              const buddySlots = trip.max_buddies - trip.current_buddies;
              const buddyPercentage = Math.round((trip.current_buddies / trip.max_buddies) * 100);

              return (
                <Card
                  key={trip.trip_id}
                  variant="glass"
                  hover
                  className="animate-slide-up flex flex-col"
                  style={{ animationDelay: `${(idx + 2) * 0.05}s` }}
                >
                  <Card.Body className="space-y-4 flex-1 flex flex-col">
                    <div>
                      <h3 className="text-lg font-semibold text-frost-white mb-2">
                        {displayName}
                      </h3>
                    </div>

                    {/* Trip Info */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 text-sm text-crystal-blue">
                        <span>📅</span>
                        <span>
                          {new Date(trip.start_date).toLocaleDateString('zh-TW')} - {new Date(trip.end_date).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-crystal-blue">
                        <span>👥</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span>{trip.current_buddies}/{trip.max_buddies} 人</span>
                            <span className="text-xs text-ice-accent">{buddySlots} 個名額</span>
                          </div>
                          <div className="w-full bg-ice-primary/10 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-ice-primary to-ice-accent h-2 rounded-full transition-all"
                              style={{ width: `${buddyPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      variant="neon"
                      className="w-full mt-4"
                      onClick={() => navigate(`/trips/${trip.trip_id}`)}
                    >
                      查看詳情 →
                    </Button>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
