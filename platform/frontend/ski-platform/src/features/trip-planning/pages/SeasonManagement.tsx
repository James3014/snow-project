/**
 * Season Management Page - Glacial Futurism Design
 * 我的滑雪行程 - 冰川未來主義設計
 *
 * Mobile-First | Season Groups | Date View
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import TripCreateModal from '../components/TripCreateModal';
import { groupTripsBySeasons, formatDateRange, getStatusBadge } from '../utils/seasonUtils';
import type { TripCreate, Trip } from '../types';
import type { Resort } from '@/shared/data/resorts';
import type { SeasonGroup } from '../utils/seasonUtils';

export default function SeasonManagement() {
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [seasonGroups, setSeasonGroups] = useState<SeasonGroup[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'season' | 'date'>('date');

  const loadTripsAndGroup = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const [tripsData, resortsData] = await Promise.all([
        tripPlanningApi.getTrips(userId),
        resortApiService.getAllResorts(),
      ]);

      setResorts(resortsData.items);

      const sortedTrips = [...tripsData].sort((a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      setAllTrips(sortedTrips);

      const groups = groupTripsBySeasons(tripsData);
      setSeasonGroups(groups);

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
      await Promise.all(
        trips.map(trip => tripPlanningApi.createTrip(userId, trip))
      );

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
      setExpandedSeasons(new Set());
    } else {
      setExpandedSeasons(new Set(seasonGroups.map(g => g.seasonId)));
    }
  };

  const resortsMap = resorts.reduce((acc, resort) => {
    acc[resort.resort_id] = resort;
    return acc;
  }, {} as Record<string, Resort>);

  const getResortName = (resortId: string) => {
    const resort = resortsMap[resortId];
    if (resort) {
      return `${resort.names.zh} ${resort.names.en}`;
    }
    return resortId;
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入行程中...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Lock Screen
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-5">
          {['🎿', '✈️', '🏔️', '📅', '⛷️', '🗺️'].map((emoji, i) => (
            <div
              key={i}
              className="absolute text-6xl animate-slide-up"
              style={{
                left: `${(i * 15) + 5}%`,
                top: `${(i * 20) % 80}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: '3s',
                opacity: 0.3,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Lock Content */}
        <div className="relative z-10 text-center max-w-md w-full animate-slide-up">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-8 glass-card pulse-glow">
            <svg className="w-12 h-12 text-ice-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gradient-glacier mb-4">
            我的滑雪行程
          </h1>
          <p className="text-crystal-blue mb-8 text-balance">
            登入後即可創建行程、記錄雪道、追蹤進度
            <br />
            開始規劃您的滑雪之旅
          </p>

          <button onClick={() => navigate('/login')} className="btn-neon ski-trail w-full">
            前往登入
          </button>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen pb-20">
        <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
              我的滑雪行程
            </h1>
          </div>
        </div>

        <div className="px-4 max-w-md mx-auto">
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="text-6xl mb-6">⚠️</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">載入失敗</h3>
            <p className="text-crystal-blue mb-8">{error}</p>
            <button onClick={loadTripsAndGroup} className="btn-neon w-full">
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
                我的滑雪行程
              </h1>
              <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
                {viewMode === 'date' ? '按日期排序，最新的行程在前' : '按雪季自動分組，輕鬆管理您的滑雪記錄'}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap animate-slide-up stagger-2">
              {allTrips.length > 0 && (
                <div className="flex glass-card p-1 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('date')}
                    className={`px-4 py-2 font-medium transition-all rounded ${
                      viewMode === 'date'
                        ? 'bg-gradient-glacier text-frost-white'
                        : 'text-crystal-blue hover:text-ice-primary'
                    }`}
                  >
                    📅 按日期
                  </button>
                  <button
                    onClick={() => setViewMode('season')}
                    className={`px-4 py-2 font-medium transition-all rounded ${
                      viewMode === 'season'
                        ? 'bg-gradient-glacier text-frost-white'
                        : 'text-crystal-blue hover:text-ice-primary'
                    }`}
                  >
                    ❄️ 按雪季
                  </button>
                </div>
              )}
              {seasonGroups.length > 0 && viewMode === 'season' && (
                <button
                  onClick={toggleAllSeasons}
                  className="glass-card px-4 py-2 text-crystal-blue hover:text-ice-primary transition-colors font-medium"
                >
                  {expandedSeasons.size === seasonGroups.length ? '收合全部' : '展開全部'}
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-neon ski-trail flex-shrink-0"
              >
                + 新增行程
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto">
        {/* Empty State */}
        {allTrips.length === 0 ? (
          <div className="glass-card p-12 text-center animate-slide-up max-w-md mx-auto">
            <div className="text-6xl mb-6">🎿</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">
              還沒有任何行程
            </h3>
            <p className="text-crystal-blue mb-8 text-balance">
              創建您的第一個滑雪行程，開始記錄美好的回憶
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn-neon w-full">
              創建第一個行程
            </button>
          </div>
        ) : viewMode === 'date' ? (
          /* Date View */
          <div className="space-y-4">
            {allTrips.map((trip, index) => {
              const resort = resortsMap[trip.resort_id];
              const statusBadge = getStatusBadge(trip.trip_status);

              // Map status badge classes to Glacial Futurism style
              let badgeClass = 'bg-glass-bg border border-glacier text-crystal-blue';
              if (statusBadge.class.includes('green')) {
                badgeClass = 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300';
              } else if (statusBadge.class.includes('blue')) {
                badgeClass = 'bg-gradient-to-r from-ice-primary/20 to-ice-secondary/20 border border-ice-primary/30 text-ice-accent';
              } else if (statusBadge.class.includes('gray')) {
                badgeClass = 'bg-glass-bg border border-glacier/50 text-crystal-blue/70';
              }

              return (
                <div
                  key={trip.trip_id}
                  className="glass-card p-5 group cursor-pointer relative overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => navigate(`/trips/${trip.trip_id}`)}
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gradient-glacier">
                          {resort ? `${resort.names.zh} ${resort.names.en}` : trip.resort_id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                          {statusBadge.text}
                        </span>
                      </div>
                      {trip.title && (
                        <p className="text-crystal-blue mb-3">{trip.title}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-crystal-blue/70 flex-wrap">
                        <span>📅 {formatDateRange(trip.start_date, trip.end_date)}</span>
                        {trip.current_buddies > 0 && (
                          <span>👥 {trip.current_buddies} 位雪伴</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/trips/${trip.trip_id}`);
                        }}
                        className="text-ice-primary hover:text-ice-accent font-medium transition-colors"
                      >
                        查看詳情 →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Season View */
          <div className="space-y-4">
            {seasonGroups.map((group, groupIndex) => {
              const isExpanded = expandedSeasons.has(group.seasonId);

              return (
                <div
                  key={group.seasonId}
                  className="glass-card overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${groupIndex * 0.05}s` }}
                >
                  {/* Season Header */}
                  <div
                    onClick={() => toggleSeason(group.seasonId)}
                    className="p-5 md:p-6 cursor-pointer group relative overflow-hidden"
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-gradient-glacier mb-3">
                          📅 {group.seasonTitle} 雪季
                        </h3>
                        <div className="flex gap-4 text-sm text-crystal-blue flex-wrap">
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

                      <button className="text-crystal-blue hover:text-ice-primary transition-colors flex-shrink-0">
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
                      <div className="border-t border-glacier divide-y divide-glacier">
                        {group.trips.map((trip) => {
                          const displayName = trip.title || getResortName(trip.resort_id);
                          const statusBadge = getStatusBadge(trip.trip_status);

                          let badgeClass = 'bg-glass-bg border border-glacier text-crystal-blue';
                          if (statusBadge.class.includes('green')) {
                            badgeClass = 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300';
                          } else if (statusBadge.class.includes('blue')) {
                            badgeClass = 'bg-gradient-to-r from-ice-primary/20 to-ice-secondary/20 border border-ice-primary/30 text-ice-accent';
                          } else if (statusBadge.class.includes('gray')) {
                            badgeClass = 'bg-glass-bg border border-glacier/50 text-crystal-blue/70';
                          }

                          return (
                            <div
                              key={trip.trip_id}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/trips/${trip.trip_id}`);
                              }}
                              className="p-4 hover:bg-glass-bg/50 cursor-pointer transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <h4 className="font-medium text-frost-white mb-1">
                                    {displayName}
                                  </h4>
                                  <p className="text-sm text-crystal-blue/70">
                                    {formatDateRange(trip.start_date, trip.end_date)}
                                  </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                                  {statusBadge.text}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick Actions */}
                      <div className="p-4 bg-glass-bg/30 border-t border-glacier flex gap-3 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/seasons/${group.seasonId}`);
                          }}
                          className="flex-1 min-w-[160px] glass-card px-4 py-2 text-crystal-blue hover:text-ice-primary transition-colors font-medium"
                        >
                          📊 查看詳細統計
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`分享 ${group.seasonTitle} 雪季功能開發中...`);
                          }}
                          className="flex-1 min-w-[160px] btn-neon"
                        >
                          📤 分享這個雪季
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
