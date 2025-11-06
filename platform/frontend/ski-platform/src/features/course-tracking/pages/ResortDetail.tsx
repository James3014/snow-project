/**
 * Resort Detail Page - 雪场详情页（核心页面）
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { courseTrackingApi } from '../api/courseTrackingApi';
import { setProgress, setVisits, addVisit, addToast } from '@/store/slices/courseTrackingSlice';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import ProgressBar from '@/shared/components/ProgressBar';

export default function ResortDetail() {
  const { resortId } = useParams<{ resortId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const progress = useAppSelector((state) => state.courseTracking.progress[resortId || '']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && resortId) {
      loadData();
    }
  }, [userId, resortId]);

  const loadData = async () => {
    if (!userId || !resortId) return;
    setLoading(true);
    try {
      const [progressData, visitsData] = await Promise.all([
        courseTrackingApi.progress.getResortProgress(userId, resortId, 37),
        courseTrackingApi.visits.list(userId, resortId),
      ]);
      dispatch(setProgress({ resortId, progress: progressData }));
      dispatch(setVisits(visitsData));
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '加载失败' }));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCourse = async (courseName: string, isCompleted: boolean) => {
    if (!userId || !resortId) return;
    try {
      if (isCompleted) {
        // TODO: 删除记录
      } else {
        const visit = await courseTrackingApi.visits.create(userId, {
          resort_id: resortId,
          course_name: courseName,
        });
        dispatch(addVisit(visit));
        dispatch(addToast({ type: 'success', message: `✓ 已完成 ${courseName}` }));
        loadData(); // 刷新进度
      }
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '操作失败' }));
    }
  };

  if (loading) return <div className="text-center py-12">加载中...</div>;
  if (!progress) return <div className="text-center py-12">暂无数据</div>;

  const groupedCourses = {
    beginner: ['Family Course / ファミリーコース', 'Isola Course / イゾラコース'],
    intermediate: ['Isola 2 Course / イゾラ2コース', 'Wonder Course / ワンダーコース'],
    advanced: ['Super East Course / スーパーイーストコース', 'White Lover Course / ホワイトラバーコース'],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">留寿都度假村</h1>
          <p className="text-gray-600">Rusutsu Resort</p>
        </div>
        <Button onClick={() => navigate('/resorts')}>返回</Button>
      </div>

      <Card>
        <Card.Body>
          <ProgressBar
            percentage={progress.completion_percentage}
            label={`完成进度: ${progress.completed_courses.length} / 37`}
          />
        </Card.Body>
      </Card>

      {Object.entries(groupedCourses).map(([level, courses]) => (
        <div key={level}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Badge variant={level as any}>{level === 'beginner' ? '初级' : level === 'intermediate' ? '中级' : '高级'}</Badge>
            <span>{courses.length} 条雪道</span>
          </h3>
          <div className="grid gap-2">
            {courses.map((course) => {
              const isCompleted = progress.completed_courses.includes(course);
              return (
                <Card key={course} hover onClick={() => handleToggleCourse(course, isCompleted)}>
                  <Card.Body className="flex items-center justify-between py-3">
                    <span className={isCompleted ? 'line-through text-gray-500' : ''}>{course}</span>
                    {isCompleted && <span className="text-green-600">✓</span>}
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
