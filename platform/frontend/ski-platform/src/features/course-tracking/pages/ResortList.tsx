/**
 * Resort List Page
 * 雪场列表首页
 */
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import Card from '@/shared/components/Card';
import ProgressBar from '@/shared/components/ProgressBar';
import { getAllResorts } from '@/shared/data/resorts';

export default function ResortList() {
  const navigate = useNavigate();
  const progress = useAppSelector((state) => state.courseTracking.progress);
  const resorts = getAllResorts();
  const [stats, setStats] = useState({
    totalResorts: 0,
    visitedResorts: 0,
    totalCourses: 0,
    completedCourses: 0,
  });

  useEffect(() => {
    // 计算统计数据
    const visitedResorts = Object.keys(progress).length;
    const completedCourses = Object.values(progress).reduce(
      (sum, p) => sum + p.completed_courses.length,
      0
    );
    const totalCourses = resorts.reduce((sum, r) => sum + r.snow_stats.courses_total, 0);

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

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">雪场列表</h1>
        <p className="mt-2 text-gray-600">选择一个雪场开始记录你的滑雪旅程</p>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{stats.visitedResorts}</div>
            <div className="text-sm text-gray-600 mt-1">已访问雪场</div>
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
            <div className="text-sm text-gray-600 mt-1">总雪场数</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalCourses}</div>
            <div className="text-sm text-gray-600 mt-1">总雪道数</div>
          </div>
        </Card>
      </div>

      {/* 雪场列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resorts.map((resort) => {
          const progressPercent = getResortProgress(resort.resort_id);
          const completed = getCompletedCount(resort.resort_id);
          const totalCourses = resort.snow_stats.courses_total;

          return (
            <Card
              key={resort.resort_id}
              hover
              onClick={() => navigate(`/resorts/${resort.resort_id}`)}
            >
              <Card.Body className="space-y-4">
                {/* 图标 */}
                <div className="text-6xl text-center">🏔️</div>

                {/* 雪场名称 */}
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">{resort.names.zh}</h3>
                  <p className="text-sm text-gray-600">{resort.names.en}</p>
                  <p className="text-xs text-gray-500 mt-1">📍 {resort.region}</p>
                </div>

                {/* 雪场亮点 */}
                {resort.description && (
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

                {/* 进度 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">完成进度</span>
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
                  <span>🎿 {totalCourses} 条雪道</span>
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

      {/* 提示信息 */}
      {resorts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏔️</div>
          <p className="text-gray-600">暂无雪场数据</p>
        </div>
      )}
    </div>
  );
}
