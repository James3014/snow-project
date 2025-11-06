/**
 * Resort List Page
 * 雪场列表首页
 */
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import Card from '@/shared/components/Card';
import ProgressBar from '@/shared/components/ProgressBar';
import { resortApiService } from '@/shared/api/resortApi';
import type { Resort } from '@/shared/data/resorts';
import { ErrorEmptyState, NoDataEmptyState } from '@/shared/components/EmptyState';

export default function ResortList() {
  const navigate = useNavigate();
  const progress = useAppSelector((state) => state.courseTracking.progress);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalResorts: 0,
    visitedResorts: 0,
    totalCourses: 0,
    completedCourses: 0,
  });

  // 載入雪場資料
  useEffect(() => {
    const loadResorts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await resortApiService.getAllResorts();
        // API 回應格式: { items: [...], total: ..., limit: ..., offset: ... }
        setResorts(response.items || []);
      } catch (err) {
        console.error('載入雪場失敗:', err);
        setError('載入雪場資料失敗，請稍後重試');
      } finally {
        setLoading(false);
      }
    };

    loadResorts();
  }, []);

  useEffect(() => {
    // 計算統計資料
    const visitedResorts = Object.keys(progress).length;
    const completedCourses = Object.values(progress).reduce(
      (sum, p) => sum + p.completed_courses.length,
      0
    );
    const totalCourses = resorts.reduce((sum, r) => sum + (r.snow_stats?.courses_total || 0), 0);

    setStats({
      totalResorts: resorts.length,
      visitedResorts,
      totalCourses,
      completedCourses,
    });
  }, [progress, resorts]);

  const getResortProgress = (resortId: string) => {
    const resortProgress = progress[resortId];
    if (!resortProgress) return 0;
    return resortProgress.completion_percentage;
  };

  const getCompletedCount = (resortId: string) => {
    const resortProgress = progress[resortId];
    if (!resortProgress) return 0;
    return resortProgress.completed_courses.length;
  };

  // 載入中
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-2">⛷️</div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return <ErrorEmptyState message={error} onRetry={() => window.location.reload()} />;
  }

  // 無資料
  if (resorts.length === 0) {
    return <NoDataEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">雪場列表</h1>
        <p className="mt-2 text-gray-600">選擇一個雪場開始記錄你的滑雪旅程</p>
      </div>

      {/* 統計資料 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{stats.visitedResorts}</div>
            <div className="text-sm text-gray-600 mt-1">已訪問雪場</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{stats.completedCourses}</div>
            <div className="text-sm text-gray-600 mt-1">完成雪道</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalResorts}</div>
            <div className="text-sm text-gray-600 mt-1">總雪場數</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalCourses}</div>
            <div className="text-sm text-gray-600 mt-1">總雪道數</div>
          </div>
        </Card>
      </div>

      {/* 雪場列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resorts.map((resort) => {
          const progressPercent = getResortProgress(resort.resort_id);
          const completed = getCompletedCount(resort.resort_id);
          const totalCourses = resort.snow_stats?.courses_total || 0;

          return (
            <Card
              key={resort.resort_id}
              hover
              onClick={() => navigate(`/resorts/${resort.resort_id}`)}
            >
              <Card.Body className="space-y-4">
                {/* 圖示 */}
                <div className="text-6xl text-center">🏔️</div>

                {/* 雪場名稱 */}
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">{resort.names.zh}</h3>
                  <p className="text-sm text-gray-600">{resort.names.en}</p>
                  <p className="text-xs text-gray-500 mt-1">📍 {resort.region}</p>
                </div>

                {/* 雪場亮點 */}
                {resort.description && resort.description.highlights && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {resort.description.highlights.slice(0, 2).map((highlight, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}

                {/* 進度 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">完成進度</span>
                    <span className="font-semibold">
                      {completed} / {totalCourses}
                    </span>
                  </div>
                  <ProgressBar
                    percentage={progressPercent}
                    showLabel={false}
                    color={progressPercent === 100 ? 'green' : 'blue'}
                  />
                </div>

                {/* 快速操作 */}
                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>🎿 {totalCourses} 條雪道</span>
                  {progressPercent > 0 && (
                    <span className="text-primary-600 font-medium">
                      {progressPercent.toFixed(0)}% 完成
                    </span>
                  )}
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
