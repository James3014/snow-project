/**
 * Course History Page - 雪道記錄歷史
 * 查看所有完成的雪道記錄，可以編輯和刪除
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { courseTrackingApi } from '../api/courseTrackingApi';
import { setVisits, addToast } from '@/store/slices/courseTrackingSlice';
import type { CourseVisit } from '../types';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import { ListSkeleton } from '@/shared/components/Skeleton';
import EmptyState from '@/shared/components/EmptyState';
import { formatDate } from '@/shared/utils/helpers';
import EnhancedCourseRecordModal, { type CourseRecordData } from '../components/EnhancedCourseRecordModal';

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
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterSnowCondition, setFilterSnowCondition] = useState<string>('');
  const [filterWeather, setFilterWeather] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (userId) {
      loadVisits();
    }
  }, [userId]);

  const loadVisits = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await courseTrackingApi.visits.list(userId);
      dispatch(setVisits(data));
    } catch (error) {
      dispatch(addToast({ type: 'error', message: '載入記錄失敗' }));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (visit: CourseVisit) => {
    setEditingVisit(visit);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: CourseRecordData) => {
    if (!userId || !editingVisit) return;

    const oldVisitId = editingVisit.id;
    let newVisitCreated = false;

    try {
      // 步驟 1: 先創建新記錄（避免資料丟失）
      await courseTrackingApi.visits.create(userId, {
        resort_id: editingVisit.resort_id,
        course_name: editingVisit.course_name,
        visited_date: editingVisit.visited_date,
        ...data,
      });
      newVisitCreated = true;

      // 步驟 2: 創建成功後再刪除舊記錄
      try {
        await courseTrackingApi.visits.delete(userId, oldVisitId);
      } catch (deleteError) {
        // 如果刪除失敗，至少新記錄已經創建，用戶資料不會丟失
        console.error('刪除舊記錄失敗，但新記錄已創建:', deleteError);
        dispatch(addToast({
          type: 'warning',
          message: '記錄已更新，但舊記錄刪除失敗，請手動刪除重複記錄'
        }));
        setIsEditModalOpen(false);
        setEditingVisit(null);
        loadVisits();
        return;
      }

      // 兩步都成功
      dispatch(addToast({ type: 'success', message: '記錄已更新' }));
      setIsEditModalOpen(false);
      setEditingVisit(null);
      loadVisits();
    } catch (error) {
      // 如果創建新記錄失敗，舊記錄仍然存在，不會丟失資料
      if (!newVisitCreated) {
        dispatch(addToast({ type: 'error', message: '更新失敗，請稍後再試' }));
      } else {
        // 這種情況理論上不會發生，因為已經在 try 裡處理了
        dispatch(addToast({ type: 'error', message: '更新過程出現異常' }));
      }
      console.error('編輯記錄錯誤:', error);
    }
  };

  const handleDelete = async (visitId: string) => {
    if (!userId) return;
    if (!confirm('確定要刪除這筆記錄嗎？')) return;

    try {
      await courseTrackingApi.visits.delete(userId, visitId);
      dispatch(addToast({ type: 'success', message: '記錄已刪除' }));
      loadVisits();
    } catch (error) {
      dispatch(addToast({ type: 'error', message: '刪除失敗' }));
    }
  };

  // 搜尋和篩選
  const filteredVisits = visits.filter(visit => {
    // Search by course name or resort
    if (searchQuery && !visit.course_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !visit.resort_id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Filter by rating
    if (filterRating !== null && visit.rating !== filterRating) {
      return false;
    }
    // Filter by snow condition
    if (filterSnowCondition && visit.snow_condition !== filterSnowCondition) {
      return false;
    }
    // Filter by weather
    if (filterWeather && visit.weather !== filterWeather) {
      return false;
    }
    return true;
  });

  // 按日期分組
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

  // 統計數據（基於篩選後的結果）
  const totalVisits = filteredVisits.length;
  const totalRatings = filteredVisits.filter(v => v.rating).length;
  const avgRating = totalRatings > 0
    ? (filteredVisits.reduce((sum, v) => sum + (v.rating || 0), 0) / totalRatings).toFixed(1)
    : '未評分';

  // 雪道評分統計 - 按雪道名稱分組計算平均評分
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

  // 轉換為陣列並計算平均分，只顯示有評分的雪道
  const courseRankings = Object.values(courseStats)
    .filter(stat => stat.ratings.length > 0)
    .map(stat => ({
      ...stat,
      avgRating: stat.totalRating / stat.ratings.length,
    }))
    .sort((a, b) => b.avgRating - a.avgRating); // 按平均評分降序排列

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">記錄歷史</h1>
        <ListSkeleton count={5} />
      </div>
    );
  }

  // 未登入用戶提示
  if (!userId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">記錄歷史</h1>
        <EmptyState
          icon="🔐"
          title="需要登入"
          description="登入後即可查看您的滑雪記錄、統計數據和評分排行！"
          actionText="前往登入"
          actionLink="/login"
        />
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">記錄歷史</h1>
          <Button onClick={() => navigate('/resorts')}>前往記錄</Button>
        </div>
        <EmptyState
          icon="📝"
          title="還沒有記錄"
          description="開始記錄你的滑雪體驗吧！"
          action={{ label: '前往雪場列表', onClick: () => navigate('/resorts') }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">記錄歷史</h1>
          <p className="text-gray-600 mt-1">共 {totalVisits} 筆記錄</p>
        </div>
        <Button onClick={() => navigate('/resorts')}>繼續記錄</Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <Card.Body>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="🔍 搜尋雪道或雪場..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? '隱藏篩選' : '顯示篩選'}
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">評分</label>
                  <select
                    value={filterRating ?? ''}
                    onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">全部</option>
                    <option value="5">⭐⭐⭐⭐⭐ (5星)</option>
                    <option value="4">⭐⭐⭐⭐ (4星)</option>
                    <option value="3">⭐⭐⭐ (3星)</option>
                    <option value="2">⭐⭐ (2星)</option>
                    <option value="1">⭐ (1星)</option>
                  </select>
                </div>

                {/* Snow Condition Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">雪況</label>
                  <select
                    value={filterSnowCondition}
                    onChange={(e) => setFilterSnowCondition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">全部</option>
                    <option value="粉雪">❄️ 粉雪</option>
                    <option value="壓雪">⛷️ 壓雪</option>
                    <option value="冰面">🧊 冰面</option>
                    <option value="融雪">💧 融雪</option>
                  </select>
                </div>

                {/* Weather Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">天氣</label>
                  <select
                    value={filterWeather}
                    onChange={(e) => setFilterWeather(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">全部</option>
                    <option value="晴天">☀️ 晴天</option>
                    <option value="陰天">☁️ 陰天</option>
                    <option value="下雪">🌨️ 下雪</option>
                    <option value="暴風雪">❄️ 暴風雪</option>
                  </select>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(searchQuery || filterRating !== null || filterSnowCondition || filterWeather) && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">已啟用篩選:</span>
                {searchQuery && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
                    搜尋: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="hover:text-primary-900">✕</button>
                  </span>
                )}
                {filterRating !== null && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
                    {filterRating} 星
                    <button onClick={() => setFilterRating(null)} className="hover:text-primary-900">✕</button>
                  </span>
                )}
                {filterSnowCondition && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
                    {filterSnowCondition}
                    <button onClick={() => setFilterSnowCondition('')} className="hover:text-primary-900">✕</button>
                  </span>
                )}
                {filterWeather && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
                    {filterWeather}
                    <button onClick={() => setFilterWeather('')} className="hover:text-primary-900">✕</button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterRating(null);
                    setFilterSnowCondition('');
                    setFilterWeather('');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  清除全部
                </button>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Body className="text-center">
            <div className="text-3xl font-bold text-primary-600">{totalVisits}</div>
            <div className="text-sm text-gray-600 mt-1">完成雪道</div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="text-center">
            <div className="text-3xl font-bold text-yellow-500">{avgRating}</div>
            <div className="text-sm text-gray-600 mt-1">平均評分</div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {new Set(visits.map(v => v.resort_id)).size}
            </div>
            <div className="text-sm text-gray-600 mt-1">滑過雪場</div>
          </Card.Body>
        </Card>
      </div>

      {/* Course Rating Rankings */}
      {courseRankings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 雪道評分排名</h2>
          <Card>
            <Card.Body className="p-0">
              <div className="divide-y divide-gray-200">
                {courseRankings.slice(0, 10).map((stat, index) => (
                  <div
                    key={`${stat.resort_id}|${stat.course_name}`}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/resorts/${stat.resort_id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank */}
                        <div className={`text-2xl font-bold ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-orange-600' :
                          'text-gray-500'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>

                        {/* Course Info */}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{stat.course_name}</h3>
                          <p className="text-sm text-gray-600">🏔️ {stat.resort_id}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6">
                          {/* Average Rating */}
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <span className="text-2xl font-bold text-yellow-500">
                                {stat.avgRating.toFixed(1)}
                              </span>
                              <span className="text-yellow-500">★</span>
                            </div>
                            <div className="text-xs text-gray-500">平均評分</div>
                          </div>

                          {/* Visit Count */}
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary-600">
                              {stat.count}
                            </div>
                            <div className="text-xs text-gray-500">完成次數</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
          {courseRankings.length > 10 && (
            <p className="text-sm text-gray-500 text-center mt-2">
              顯示前 10 名，共 {courseRankings.length} 個已評分雪道
            </p>
          )}
        </div>
      )}

      {/* Records by Date */}
      {sortedDates.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="沒有符合的記錄"
          description="試試調整搜尋或篩選條件"
          action={{ label: '清除篩選', onClick: () => {
            setSearchQuery('');
            setFilterRating(null);
            setFilterSnowCondition('');
            setFilterWeather('');
          }}}
        />
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
          <div key={date}>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">📅 {date}</h2>
            <div className="space-y-3">
              {groupedVisits[date].map(visit => (
                <Card key={visit.id} hover>
                  <Card.Body>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Course Name & Resort */}
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">{visit.course_name}</h3>
                          {visit.rating && (
                            <div className="flex items-center text-yellow-500">
                              {'★'.repeat(visit.rating)}
                              {'☆'.repeat(5 - visit.rating)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          🏔️ {visit.resort_id}
                        </p>

                        {/* Details */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {visit.snow_condition && (
                            <Badge variant="info">❄️ {visit.snow_condition}</Badge>
                          )}
                          {visit.weather && (
                            <Badge variant="info">☀️ {visit.weather}</Badge>
                          )}
                          {visit.difficulty_feeling && (
                            <Badge variant="info">💪 {visit.difficulty_feeling}</Badge>
                          )}
                        </div>

                        {/* Mood Tags */}
                        {visit.mood_tags && visit.mood_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {visit.mood_tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {visit.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 italic">
                              💭 {visit.notes}
                            </p>
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400 mt-3">
                          記錄於 {formatDate(visit.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => navigate(`/resorts/${visit.resort_id}`)}
                          className="text-sm text-primary-600 hover:text-primary-700 underline"
                        >
                          查看雪場
                        </button>
                        <button
                          onClick={() => handleEdit(visit)}
                          className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(visit.id)}
                          className="text-sm text-red-600 hover:text-red-700 underline"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
        ))}
        </div>
      )}

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
