/**
 * Resort Detail Page - 雪場詳情頁（核心頁面）
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { courseTrackingApi } from '../api/courseTrackingApi';
import { setProgress, setVisits, addVisit, addToast } from '@/store/slices/courseTrackingSlice';
import { resortApiService } from '@/shared/api/resortApi';
import type { Resort } from '@/shared/data/resorts';
import { getDifficultyLabel, getDifficultyEmoji } from '@/shared/utils/helpers';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import ProgressBar from '@/shared/components/ProgressBar';
import { ListSkeleton } from '@/shared/components/Skeleton';
import EmptyState, { ErrorEmptyState } from '@/shared/components/EmptyState';

export default function ResortDetail() {
  const { resortId } = useParams<{ resortId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const progress = useAppSelector((state) => state.courseTracking.progress[resortId || '']);
  const [loading, setLoading] = useState(false);
  const [resort, setResort] = useState<Resort | null>(null);
  const [resortLoading, setResortLoading] = useState(true);
  const [resortError, setResortError] = useState<string | null>(null);

  // 地區中英文映射表
  const regionNameMap: Record<string, string> = {
    'Hokkaido': '北海道',
    'Gunma Prefecture': '群馬縣',
    'Nagano Prefecture': '長野縣',
    'Niigata Prefecture': '新潟縣',
    'Yamagata Prefecture': '山形縣',
    'Fukushima Prefecture': '福島縣',
    'Gifu Prefecture': '岐阜縣',
    'Hyogo Prefecture': '兵庫縣',
  };

  // 將地區名稱轉換為中文
  const getRegionName = (region: string) => regionNameMap[region] || region;

  // 載入雪場資料
  useEffect(() => {
    const loadResort = async () => {
      if (!resortId) return;

      try {
        setResortLoading(true);
        setResortError(null);
        const resort = await resortApiService.getResort(resortId);
        setResort(resort);
      } catch (err) {
        console.error('載入雪場失敗:', err);
        setResortError('載入雪場資料失敗');
      } finally {
        setResortLoading(false);
      }
    };

    loadResort();
  }, [resortId]);

  useEffect(() => {
    if (userId && resortId && resort) {
      loadData();
    }
  }, [userId, resortId]);

  const loadData = async () => {
    if (!userId || !resortId || !resort) return;
    setLoading(true);
    try {
      const [progressData, visitsData] = await Promise.all([
        courseTrackingApi.progress.getResortProgress(userId, resortId, resort.snow_stats.courses_total),
        courseTrackingApi.visits.list(userId, resortId),
      ]);
      dispatch(setProgress({ resortId, progress: progressData }));
      dispatch(setVisits(visitsData));
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '載入失敗' }));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCourse = async (courseName: string, isCompleted: boolean) => {
    if (!userId || !resortId) return;
    try {
      if (isCompleted) {
        // TODO: 刪除記錄
      } else {
        const visit = await courseTrackingApi.visits.create(userId, {
          resort_id: resortId,
          course_name: courseName,
        });
        dispatch(addVisit(visit));
        dispatch(addToast({ type: 'success', message: `✓ 已完成 ${courseName}` }));
        loadData(); // 重新整理進度
      }
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '操作失敗' }));
    }
  };

  // 雪場載入中
  if (resortLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <Button onClick={() => navigate('/resorts')}>返回</Button>
        </div>
        <ListSkeleton count={8} />
      </div>
    );
  }

  // 雪場載入失敗
  if (resortError || !resort) {
    return (
      <ErrorEmptyState
        message={resortError || "未找到雪場資訊"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Loading State (for tracking data)
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <Button onClick={() => navigate('/resorts')}>返回</Button>
        </div>
        <ListSkeleton count={8} />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{resort.names.zh}</h1>
            <p className="text-gray-600">{resort.names.en}</p>
          </div>
          <Button onClick={() => navigate('/resorts')}>返回</Button>
        </div>
        <EmptyState
          icon="⚠️"
          title="載入失敗"
          description="無法載入雪場進度資料"
          action={{ label: '重試', onClick: loadData }}
        />
      </div>
    );
  }

  // 按難度分組課程
  const courses = resort.courses || [];
  const groupedCourses = courses.reduce(
    (acc, course) => {
      if (!acc[course.level]) {
        acc[course.level] = [];
      }
      acc[course.level].push(course);
      return acc;
    },
    {} as Record<string, typeof courses>
  );

  const levelOrder: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];
  const levelColors = {
    beginner: 'success',
    intermediate: 'info',
    advanced: 'danger',
  } as const;

  return (
    <div className="space-y-6">
      {/* 頂部資訊 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{resort.names.zh}</h1>
          <p className="text-gray-600">{resort.names.en}</p>
          <p className="text-sm text-gray-500 mt-1">📍 {getRegionName(resort.region)}</p>
        </div>
        <Button onClick={() => navigate('/resorts')}>返回</Button>
      </div>

      {/* 雪場資訊卡片 */}
      {resort.description && (
        <Card>
          <Card.Body>
            <p className="text-gray-700 mb-3">{resort.description.tagline}</p>
            <div className="flex flex-wrap gap-2">
              {resort.description.highlights.map((highlight, idx) => (
                <Badge key={idx} variant="info">
                  {highlight}
                </Badge>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* 進度卡片 */}
      <Card>
        <Card.Body>
          <div className="space-y-3">
            <ProgressBar
              percentage={progress.completion_percentage}
              label={`完成进度: ${progress.completed_courses.length} / ${resort.snow_stats.courses_total}`}
            />
            <div className="grid grid-cols-3 gap-4 text-center text-sm pt-2">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {groupedCourses.beginner?.length || 0}
                </div>
                <div className="text-gray-600">初級雪道</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {groupedCourses.intermediate?.length || 0}
                </div>
                <div className="text-gray-600">中級雪道</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {groupedCourses.advanced?.length || 0}
                </div>
                <div className="text-gray-600">高級雪道</div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* 按难度分组显示课程 */}
      {levelOrder.map((level) => {
        const courses = groupedCourses[level];
        if (!courses || courses.length === 0) return null;

        return (
          <div key={level}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant={levelColors[level]}>
                {getDifficultyEmoji(level)} {getDifficultyLabel(level)}
              </Badge>
              <span>{courses.length} 条雪道</span>
            </h3>
            <div className="grid gap-2">
              {courses.map((course) => {
                const isCompleted = progress.completed_courses.includes(course.name);
                return (
                  <Card
                    key={course.name}
                    hover
                    onClick={() => handleToggleCourse(course.name, isCompleted)}
                    className={isCompleted ? 'opacity-60' : ''}
                  >
                    <Card.Body className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <div className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                          {course.name}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            平均坡度: {course.avg_slope}°
                          </span>
                          <span className="text-xs text-gray-500">
                            最大坡度: {course.max_slope}°
                          </span>
                          {course.tags.length > 0 && (
                            <span className="text-xs text-primary-600">
                              {course.tags[0]}
                            </span>
                          )}
                        </div>
                        {course.notes && (
                          <div className="text-xs text-orange-600 mt-1">
                            ⚠️ {course.notes}
                          </div>
                        )}
                      </div>
                      {isCompleted && <span className="text-green-600 text-2xl">✓</span>}
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
