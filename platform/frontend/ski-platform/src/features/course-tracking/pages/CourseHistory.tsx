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

    try {
      // 先刪除舊記錄
      await courseTrackingApi.visits.delete(userId, editingVisit.id);

      // 創建新記錄（包含更新的數據）
      await courseTrackingApi.visits.create(userId, {
        resort_id: editingVisit.resort_id,
        course_name: editingVisit.course_name,
        visited_date: editingVisit.visited_date,
        ...data,
      });

      dispatch(addToast({ type: 'success', message: '記錄已更新' }));
      setIsEditModalOpen(false);
      setEditingVisit(null);
      loadVisits();
    } catch (error) {
      dispatch(addToast({ type: 'error', message: '更新失敗' }));
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

  // 按日期分組
  const groupedVisits = visits.reduce((acc, visit) => {
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

  // 統計數據
  const totalVisits = visits.length;
  const totalRatings = visits.filter(v => v.rating).length;
  const avgRating = totalRatings > 0
    ? (visits.reduce((sum, v) => sum + (v.rating || 0), 0) / totalRatings).toFixed(1)
    : '未評分';

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">記錄歷史</h1>
        <ListSkeleton count={5} />
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

      {/* Records by Date */}
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
