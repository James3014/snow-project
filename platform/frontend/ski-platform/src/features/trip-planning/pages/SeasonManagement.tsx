/**
 * My Trips Page (Auto-grouped Seasons)
 * 我的滑雪行程（自動分組雪季）
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import Card from '@/shared/components/Card';
import EmptyState, { ErrorEmptyState } from '@/shared/components/EmptyState';
import TripCreateModal from '../components/TripCreateModal';
import { groupTripsBySeasons, formatDateRange, getStatusBadge } from '../utils/seasonUtils';
import type { TripCreate } from '../types';
import type { Resort } from '@/shared/data/resorts';
import type { SeasonGroup } from '../utils/seasonUtils';

export default function SeasonManagement() {
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [seasonGroups, setSeasonGroups] = useState<SeasonGroup[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());

  const loadTripsAndGroup = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // 載入所有行程和雪場資料
      const [tripsData, resortsData] = await Promise.all([
        tripPlanningApi.getTrips(userId),
        resortApiService.getAllResorts(),
      ]);

      setResorts(resortsData.items);

      // 按雪季分組
      const groups = groupTripsBySeasons(tripsData);
      setSeasonGroups(groups);

      // 預設展開最新的雪季
      if (groups.length > 0 && expandedSeasons.size === 0) {
        setExpandedSeasons(new Set([groups[0].seasonId]));
      }
    } catch (err) {
      console.error('載入行程失敗:', err);
      setError('載入行程資料失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  }, [userId, expandedSeasons.size]);

  useEffect(() => {
    if (userId) {
      loadTripsAndGroup();
    } else {
      setLoading(false);
    }
  }, [userId, loadTripsAndGroup]);

  const handleCreateTrips = async (trips: TripCreate[]) => {
    if (!userId) return;

    try {
      // 批次創建行程
      await Promise.all(
        trips.map(trip => tripPlanningApi.createTrip(userId, trip))
      );

      // 重新載入數據
      await loadTripsAndGroup();
      setShowCreateModal(false);
    } catch (err) {
      console.error('創建行程失敗:', err);
      alert('創建行程失敗，請重試');
    }
  };

  const toggleSeason = (seasonId: string) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonId)) {
      newExpanded.delete(seasonId);
    } else {
      newExpanded.add(seasonId);
    }
    setExpandedSeasons(newExpanded);
  };

  const toggleAllSeasons = () => {
    if (expandedSeasons.size === seasonGroups.length) {
      // 全部收合
      setExpandedSeasons(new Set());
    } else {
      // 全部展開
      setExpandedSeasons(new Set(seasonGroups.map(g => g.seasonId)));
    }
  };

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 未登入用戶提示
  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">我的滑雪行程</h1>
          <p className="text-gray-600">記錄和管理您的滑雪行程</p>
        </div>
        <EmptyState
          icon="🔐"
          title="需要登入"
          description="登入後即可創建行程、記錄雪道、追蹤進度！開始記錄您的滑雪之旅。"
          action={{ label: '前往登入', onClick: () => navigate('/login') }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorEmptyState message={error} onRetry={loadTripsAndGroup} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">我的滑雪行程</h1>
          <p className="text-gray-600">按雪季自動分組，輕鬆管理您的滑雪記錄</p>
        </div>
        <div className="flex gap-3">
          {seasonGroups.length > 0 && (
            <button
              onClick={toggleAllSeasons}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {expandedSeasons.size === seasonGroups.length ? '收合全部' : '展開全部'}
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + 新增行程
          </button>
        </div>
      </div>

      {/* Season Groups List */}
      {seasonGroups.length === 0 ? (
        <EmptyState
          icon="🎿"
          title="還沒有任何行程"
          description="創建您的第一個滑雪行程，開始記錄美好的回憶"
          action={{ label: '創建第一個行程', onClick: () => setShowCreateModal(true) }}
        />
      ) : (
        <div className="space-y-4">
          {seasonGroups.map((group) => {
            const isExpanded = expandedSeasons.has(group.seasonId);

            return (
              <Card key={group.seasonId} className="overflow-hidden">
                {/* Season Header (clickable) */}
                <div
                  onClick={() => toggleSeason(group.seasonId)}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        📅 {group.seasonId} 雪季
                      </h3>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span>✈️</span>
                          <span>{group.stats.tripCount} 趟行程</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🏔️</span>
                          <span>{group.stats.resortCount} 個雪場</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>📅</span>
                          <span>{group.stats.totalDays} 天</span>
                        </span>
                        {group.stats.completedTrips > 0 && (
                          <span className="flex items-center gap-1">
                            <span>✅</span>
                            <span>{group.stats.completedTrips} 已完成</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button className="text-gray-500 hover:text-gray-700 transition-colors">
                      {isExpanded ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Trip List */}
                {isExpanded && (
                  <>
                    <div className="border-t divide-y">
                      {group.trips.map((trip) => {
                        const displayName = trip.title || getResortName(trip.resort_id);
                        const statusBadge = getStatusBadge(trip.trip_status);

                        return (
                          <div
                            key={trip.trip_id}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/trips/${trip.trip_id}`);
                            }}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {displayName}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {formatDateRange(trip.start_date, trip.end_date)}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.class}`}>
                                {statusBadge.text}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Actions */}
                    <div className="p-4 bg-gray-50 border-t flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/seasons/${group.seasonId}`);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
                      >
                        📊 查看詳細統計
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: 實現分享功能
                          alert(`分享 ${group.seasonId} 雪季功能開發中...`);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        📤 分享這個雪季
                      </button>
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Trip Create Modal */}
      {showCreateModal && (
        <TripCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTrips}
        />
      )}
    </div>
  );
}
