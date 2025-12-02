/**
 * Course History Page - Glacial Futurism Design
 * 雪道紀錄歷史 - 冰川未來主義設計
 *
 * Mobile-First | Timeline View | Stats Dashboard
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { courseTrackingApi } from '../api/courseTrackingApi';
import { setVisits, addToast } from '@/store/slices/courseTrackingSlice';
import type { CourseVisit } from '../types';
import { formatDate } from '@/shared/utils/helpers';
import EnhancedCourseRecordModal, { type CourseRecordData } from '../components/EnhancedCourseRecordModal';
import { useDebounce } from '@/shared/hooks/useDebounce';

export default function CourseHistory() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const visits = useAppSelector((state) => state.courseTracking.visits);
  const [loading, setLoading] = useState(false);
  const [editingVisit, setEditingVisit] = useState<CourseVisit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterSnowCondition, setFilterSnowCondition] = useState<string>('');
  const [filterWeather, setFilterWeather] = useState<string>('');

  const loadVisits = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await courseTrackingApi.visits.list(userId);
      dispatch(setVisits(data));
    } catch {
      dispatch(addToast({ type: 'error', message: '載入紀錄失敗' }));
    } finally {
      setLoading(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (userId) {
      loadVisits();
    }
  }, [userId, loadVisits]);

  const handleEdit = (visit: CourseVisit) => {
    setEditingVisit(visit);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: CourseRecordData) => {
    if (!userId || !editingVisit) return;

    try {
      await courseTrackingApi.visits.update(userId, editingVisit.id, data);
      dispatch(addToast({ type: 'success', message: '✓ 紀錄已更新' }));
      setIsEditModalOpen(false);
      setEditingVisit(null);
      loadVisits();
    } catch (err: unknown) {
      console.error('編輯紀錄錯誤:', err);
      dispatch(addToast({ type: 'error', message: '更新失敗，請稍後再試' }));
    }
  };

  const handleDelete = async (visitId: string) => {
    if (!userId) return;
    if (!confirm('確定要刪除這筆紀錄嗎？\n\n⚠️ 此操作無法復原，紀錄的評分、雪況等資訊將永久刪除。')) return;

    try {
      await courseTrackingApi.visits.delete(userId, visitId);
      dispatch(addToast({ type: 'success', message: '✓ 紀錄已刪除' }));
      loadVisits();
    } catch {
      dispatch(addToast({ type: 'error', message: '刪除失敗，請稍後再試' }));
    }
  };

  // Filter logic
  const filteredVisits = visits.filter(visit => {
    if (debouncedSearchQuery && !visit.course_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) &&
        !visit.resort_id.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
      return false;
    }
    if (filterRating !== null && visit.rating !== filterRating) {
      return false;
    }
    if (filterSnowCondition && visit.snow_condition !== filterSnowCondition) {
      return false;
    }
    if (filterWeather && visit.weather !== filterWeather) {
      return false;
    }
    return true;
  });

  // Group by date
  const groupedVisits = filteredVisits.reduce((acc, visit) => {
    const date = new Date(visit.visited_date).toLocaleDateString('zh-TW');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(visit);
    return acc;
  }, {} as Record<string, CourseVisit[]>);

  const sortedDates = Object.keys(groupedVisits).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Statistics
  const totalVisits = filteredVisits.length;
  const totalRatings = filteredVisits.filter(v => v.rating).length;
  const avgRating = totalRatings > 0
    ? (filteredVisits.reduce((sum, v) => sum + (v.rating || 0), 0) / totalRatings).toFixed(1)
    : '0';

  // Course rankings
  const courseStats = filteredVisits.reduce((acc, visit) => {
    const key = `${visit.resort_id}|${visit.course_name}`;
    if (!acc[key]) {
      acc[key] = {
        resort_id: visit.resort_id,
        course_name: visit.course_name,
        count: 0,
        totalRating: 0,
        ratings: [],
      };
    }
    acc[key].count += 1;
    if (visit.rating) {
      acc[key].totalRating += visit.rating;
      acc[key].ratings.push(visit.rating);
    }
    return acc;
  }, {} as Record<string, {
    resort_id: string;
    course_name: string;
    count: number;
    totalRating: number;
    ratings: number[];
  }>);

  const courseRankings = Object.values(courseStats)
    .filter(stat => stat.ratings.length > 0)
    .map(stat => ({
      ...stat,
      avgRating: stat.totalRating / stat.ratings.length,
    }))
    .sort((a, b) => b.avgRating - a.avgRating);

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入紀錄中...</p>
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
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-6xl animate-slide-up"
              style={{
                left: `${(i * 12) + 5}%`,
                top: `${(i * 15) % 70}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '3s',
                opacity: 0.2,
              }}
            >
              📝
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
            紀錄歷史
          </h1>
          <p className="text-crystal-blue mb-8 text-balance">
            登入後即可查看您的滑雪紀錄、統計數據和評分排行
            <br />
            每一次征服雪道都值得被紀錄
          </p>

          <button onClick={() => navigate('/login')} className="btn-neon ski-trail w-full">
            前往登入
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (visits.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        {/* Hero Header */}
        <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
              紀錄歷史
            </h1>
            <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
              開始紀錄您的滑雪征程
            </p>
          </div>
        </div>

        <div className="px-4 max-w-md mx-auto">
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="text-6xl mb-6">📝</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">
              還沒有紀錄
            </h3>
            <p className="text-crystal-blue mb-8 text-balance">
              開始紀錄您的滑雪體驗，追蹤每一次進步
            </p>
            <button onClick={() => navigate('/resorts')} className="btn-neon ski-trail w-full">
              前往雪場列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters = searchQuery || filterRating !== null || filterSnowCondition || filterWeather;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            紀錄歷史
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            {totalVisits > 0 ? `共 ${totalVisits} 筆紀錄 • 持續追蹤您的成長軌跡` : '開始紀錄您的滑雪征程'}
          </p>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto">
        {/* Search & Filters */}
        <div className="glass-card p-5 md:p-6 mb-8 animate-slide-up stagger-2">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="搜尋雪道或雪場..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-glacier pl-11"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-crystal-blue/50 text-lg">
                🔍
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-crystal-blue/50 hover:text-ice-primary transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Mobile-First Filter Pills */}
          <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4">
            <button
              onClick={() => setFilterRating(null)}
              className={`filter-pill scroll-snap-item flex-shrink-0 ${filterRating === null ? 'active' : ''}`}
            >
              全部評分
            </button>
            {[5, 4, 3, 2, 1].map(rating => (
              <button
                key={rating}
                onClick={() => setFilterRating(rating)}
                className={`filter-pill scroll-snap-item flex-shrink-0 ${filterRating === rating ? 'active' : ''}`}
              >
                {'⭐'.repeat(rating)}
              </button>
            ))}
          </div>

          {/* Additional Filters Row */}
          <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4 mt-2">
            <button
              onClick={() => setFilterSnowCondition('')}
              className={`filter-pill scroll-snap-item flex-shrink-0 ${!filterSnowCondition ? 'active' : ''}`}
            >
              全部雪況
            </button>
            {['粉雪', '壓雪', '冰面', '融雪'].map(condition => (
              <button
                key={condition}
                onClick={() => setFilterSnowCondition(condition)}
                className={`filter-pill scroll-snap-item flex-shrink-0 ${filterSnowCondition === condition ? 'active' : ''}`}
              >
                {condition}
              </button>
            ))}
          </div>

          {/* Weather Filters */}
          <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4 mt-2">
            <button
              onClick={() => setFilterWeather('')}
              className={`filter-pill scroll-snap-item flex-shrink-0 ${!filterWeather ? 'active' : ''}`}
            >
              全部天氣
            </button>
            {['晴天', '陰天', '下雪', '暴風雪'].map(weather => (
              <button
                key={weather}
                onClick={() => setFilterWeather(weather)}
                className={`filter-pill scroll-snap-item flex-shrink-0 ${filterWeather === weather ? 'active' : ''}`}
              >
                {weather}
              </button>
            ))}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-ice-accent pulse-glow" />
              <span className="text-ice-accent font-semibold">
                找到 {filteredVisits.length} 筆紀錄
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterRating(null);
                  setFilterSnowCondition('');
                  setFilterWeather('');
                }}
                className="ml-auto text-crystal-blue hover:text-ice-primary transition-colors text-xs underline"
              >
                清除全部篩選
              </button>
            </div>
          )}
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { value: totalVisits, label: '完成雪道', color: 'ice-primary', icon: '⛷️' },
            { value: avgRating, label: '平均評分', color: 'ice-accent', icon: '⭐' },
            { value: new Set(visits.map(v => v.resort_id)).size, label: '滑過雪場', color: 'neon-purple', icon: '🏔️' },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="glass-card p-6 text-center group cursor-pointer animate-slide-up"
              style={{ animationDelay: `${(index + 3) * 0.1}s` }}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className={`text-3xl md:text-4xl font-bold text-${stat.color} mb-2 group-hover:scale-110 transition-transform`}>
                {stat.value}
              </div>
              <div className="text-xs text-crystal-blue uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Course Rankings */}
        {courseRankings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-frost-white mb-6 animate-slide-up stagger-4">
              雪道評分排名
            </h2>
            <div className="glass-card p-0 overflow-hidden animate-slide-up stagger-5">
              <div className="divide-y divide-glacier">
                {courseRankings.slice(0, 5).map((stat, index) => (
                  <div
                    key={`${stat.resort_id}|${stat.course_name}`}
                    className="p-5 group cursor-pointer relative overflow-hidden"
                    onClick={() => navigate(`/resorts/${stat.resort_id}`)}
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`text-2xl font-bold flex-shrink-0 ${
                        index === 0 ? 'text-ice-accent' :
                        index === 1 ? 'text-crystal-blue' :
                        'text-frost-white/50'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-frost-white truncate">{stat.course_name}</h3>
                        <p className="text-sm text-crystal-blue/70">🏔️ {stat.resort_id}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-ice-accent">
                            {stat.avgRating.toFixed(1)}
                          </div>
                          <div className="text-xs text-crystal-blue">評分</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-frost-white">
                            {stat.count}
                          </div>
                          <div className="text-xs text-crystal-blue">次數</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {courseRankings.length > 5 && (
              <p className="text-sm text-crystal-blue/50 text-center mt-2">
                顯示前 5 名，共 {courseRankings.length} 個已評分雪道
              </p>
            )}
          </div>
        )}

        {/* Timeline Records */}
        {sortedDates.length === 0 ? (
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">沒有符合的紀錄</h3>
            <p className="text-crystal-blue mb-8">試試調整搜尋或篩選條件</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterRating(null);
                setFilterSnowCondition('');
                setFilterWeather('');
              }}
              className="btn-neon"
            >
              清除篩選
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date, dateIndex) => (
              <div key={date}>
                <h2 className="text-lg font-semibold text-gradient-glacier mb-4 animate-slide-up" style={{ animationDelay: `${dateIndex * 0.05}s` }}>
                  📅 {date}
                </h2>
                <div className="space-y-4">
                  {groupedVisits[date].map((visit, visitIndex) => (
                    <div
                      key={visit.id}
                      className="glass-card p-5 group relative overflow-hidden animate-slide-up"
                      style={{ animationDelay: `${(dateIndex * 0.05) + (visitIndex * 0.02)}s` }}
                    >
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold text-gradient-glacier">{visit.course_name}</h3>
                            {visit.rating && (
                              <div className="flex items-center text-ice-accent">
                                {'★'.repeat(visit.rating)}
                                {'☆'.repeat(5 - visit.rating)}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-crystal-blue mb-4">
                            🏔️ {visit.resort_id}
                          </p>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {visit.snow_condition && (
                              <span className="px-3 py-1 bg-gradient-to-r from-ice-primary/20 to-ice-secondary/20 border border-ice-primary/30 text-ice-accent rounded-full text-xs font-medium">
                                ❄️ {visit.snow_condition}
                              </span>
                            )}
                            {visit.weather && (
                              <span className="px-3 py-1 bg-gradient-to-r from-ice-primary/20 to-ice-secondary/20 border border-ice-primary/30 text-ice-accent rounded-full text-xs font-medium">
                                ☀️ {visit.weather}
                              </span>
                            )}
                            {visit.difficulty_feeling && (
                              <span className="px-3 py-1 bg-gradient-to-r from-neon-purple/20 to-ice-secondary/20 border border-neon-purple/30 text-crystal-blue rounded-full text-xs font-medium">
                                💪 {visit.difficulty_feeling}
                              </span>
                            )}
                          </div>

                          {/* Mood Tags */}
                          {visit.mood_tags && visit.mood_tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {visit.mood_tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-glass-bg border border-glacier text-crystal-blue rounded-full text-xs font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Notes */}
                          {visit.notes && (
                            <div className="mt-3 p-4 bg-glass-bg rounded-lg border border-glacier">
                              <p className="text-sm text-frost-white italic">
                                💭 {visit.notes}
                              </p>
                            </div>
                          )}

                          {/* Timestamp */}
                          <p className="text-xs text-crystal-blue/50 mt-3">
                            紀錄於 {formatDate(visit.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                          <button
                            onClick={() => navigate(`/resorts/${visit.resort_id}`)}
                            className="text-sm text-ice-primary hover:text-ice-accent transition-colors underline"
                          >
                            查看
                          </button>
                          <button
                            onClick={() => handleEdit(visit)}
                            className="text-sm text-crystal-blue hover:text-frost-white transition-colors underline"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDelete(visit.id)}
                            className="text-sm text-neon-pink hover:text-red-400 transition-colors underline"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingVisit && (
        <EnhancedCourseRecordModal
          isOpen={isEditModalOpen}
          courseName={editingVisit.course_name}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingVisit(null);
          }}
          onSubmit={handleEditSubmit}
          initialData={{
            rating: editingVisit.rating,
            snow_condition: editingVisit.snow_condition,
            weather: editingVisit.weather,
            difficulty_feeling: editingVisit.difficulty_feeling,
            mood_tags: editingVisit.mood_tags,
            notes: editingVisit.notes,
          }}
          mode="edit"
        />
      )}
    </div>
  );
}
