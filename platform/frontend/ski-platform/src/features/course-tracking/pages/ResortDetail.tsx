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
import EnhancedCourseRecordModal, { type CourseRecordData } from '../components/EnhancedCourseRecordModal';
import ShareCardPreviewModal from '../components/ShareCardPreviewModal';

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

  // Enhanced recording modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');

  // Share card modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lastCompletedVisit, setLastCompletedVisit] = useState<{
    visitId: string;
    courseName: string;
  } | null>(null);

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

  // 雪場 Logo URL 生成器（使用本地官方 Logo）
  const getResortLogoUrl = (resortId: string) => {
    // 嘗試載入本地 Logo（支援多種格式）
    // 優先順序: PNG > JPG > SVG
    return `/logos/${resortId}.png`;
  };

  // 載入雪場資料
  useEffect(() => {
    const loadResort = async () => {
      if (!resortId) return;

      try {
        setResortLoading(true);
        setResortError(null);
        console.log('正在載入雪場:', resortId);
        const resort = await resortApiService.getResort(resortId);
        console.log('雪場載入成功:', resort);
        setResort(resort);
      } catch (err: any) {
        console.error('載入雪場失敗 - resortId:', resortId);
        console.error('錯誤詳情:', err);
        console.error('錯誤狀態碼:', err?.response?.status);
        console.error('錯誤訊息:', err?.response?.data);

        // 無論什麼錯誤，都不阻擋用戶，只在控制台記錄
        // 暫時不設置錯誤，讓頁面繼續載入
        setResortError(null);

        // 如果是網絡問題或 API 暫時無法使用，創建一個基本的降級雪場對象
        console.warn('API 暫時無法載入雪場資料，使用降級模式');
        const fallbackResort = {
          resort_id: resortId,
          names: {
            zh: resortId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            en: resortId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            ja: resortId,
          },
          country_code: 'JP',
          region: 'Unknown',
          coordinates: { lat: 0, lng: 0 },
          snow_stats: {
            lifts: 0,
            courses_total: 0,
            beginner_ratio: 0,
            intermediate_ratio: 0,
            advanced_ratio: 0,
            longest_run: 0,
            vertical_drop: 0,
            night_ski: false,
          },
          courses: [],
        };
        setResort(fallbackResort as Resort);
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
  }, [userId, resortId, resort]); // ✅ 添加 resort 依賴

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
      console.error('載入進度資料錯誤:', error);
      // 無論任何錯誤（404, 403, 網絡錯誤等），都創建初始進度讓用戶可以繼續使用
      // 這樣即使後端 API 暫時無法訪問，前端仍能正常顯示雪場資訊
      const initialProgress = {
        resort_id: resortId,
        completed_courses: [],
        total_courses: resort.snow_stats.courses_total,
        completion_percentage: 0,
        recommendations: [],
      };
      dispatch(setProgress({ resortId, progress: initialProgress }));
      dispatch(setVisits([]));

      // 僅在控制台記錄警告，不中斷用戶體驗
      console.warn('使用初始進度資料，進度追蹤功能可能暫時無法使用');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCourse = async (courseName: string, isCompleted: boolean) => {
    if (!userId || !resortId) return;

    if (isCompleted) {
      // TODO: 刪除記錄
      return;
    }

    // Open enhanced recording modal
    setSelectedCourseName(courseName);
    setIsRecordModalOpen(true);
  };

  const handleEnhancedRecordSubmit = async (data: CourseRecordData) => {
    if (!userId || !resortId || !selectedCourseName) return;

    try {
      const visit = await courseTrackingApi.visits.create(userId, {
        resort_id: resortId,
        course_name: selectedCourseName,
        ...data, // Include all enhanced fields
      });
      dispatch(addVisit(visit));

      // 保存最後完成的記錄，用於分享
      setLastCompletedVisit({
        visitId: visit.id,
        courseName: selectedCourseName,
      });

      // 顯示成功訊息（帶分享提示）
      dispatch(addToast({
        type: 'success',
        message: `✓ 已完成 ${selectedCourseName}！${data.rating ? ` 評分：${'⭐'.repeat(data.rating)}` : ''}`
      }));

      loadData(); // 重新整理進度

      // 詢問是否要分享（延遲顯示，讓用戶先看到成功訊息）
      setTimeout(() => {
        if (window.confirm('🎉 恭喜完成！要生成分享卡片嗎？\n\n可以分享到社交媒體炫耀你的成就！')) {
          setIsShareModalOpen(true);
        }
      }, 500);
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '記錄失敗，請稍後再試' }));
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

  // 未登入用戶：顯示基本資訊，提示登入以追蹤進度
  if (!userId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{resort.names.zh}</h1>
            <p className="text-gray-600">{resort.names.en}</p>
          </div>
          <Button onClick={() => navigate('/resorts')}>返回</Button>
        </div>

        {/* 雪場基本資訊 */}
        <Card>
          <Card.Body>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">雪場資訊</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">地區：</span>
                    <span className="font-medium">{getRegionName(resort.region)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">總雪道數：</span>
                    <span className="font-medium">{resort.snow_stats.courses_total} 條</span>
                  </div>
                  <div>
                    <span className="text-gray-500">初級雪道：</span>
                    <span className="font-medium text-green-600">{Math.round(resort.snow_stats.courses_total * resort.snow_stats.beginner_ratio)} 條</span>
                  </div>
                  <div>
                    <span className="text-gray-500">中級雪道：</span>
                    <span className="font-medium text-blue-600">{Math.round(resort.snow_stats.courses_total * resort.snow_stats.intermediate_ratio)} 條</span>
                  </div>
                  <div>
                    <span className="text-gray-500">高級雪道：</span>
                    <span className="font-medium text-red-600">{Math.round(resort.snow_stats.courses_total * resort.snow_stats.advanced_ratio)} 條</span>
                  </div>
                  <div>
                    <span className="text-gray-500">纜車數：</span>
                    <span className="font-medium">{resort.snow_stats.lifts} 條</span>
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* 登入提示 */}
        <EmptyState
          icon="🔐"
          title="登入以追蹤進度"
          description="登入後即可記錄完成的雪道、查看個人進度、獲得成就！"
          action={{ label: '前往登入', onClick: () => navigate('/login') }}
        />
      </div>
    );
  }

  // 已登入但載入失敗
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
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {/* Logo 圖片 */}
          <div className="flex-shrink-0">
            <img
              src={getResortLogoUrl(resort.resort_id)}
              alt={`${resort.names.zh} Logo`}
              loading="lazy"
              className="w-20 h-20 object-contain rounded-lg"
              onError={(e) => {
                // 如果圖片載入失敗，顯示預設 emoji
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.fallback-emoji')) {
                  const emoji = document.createElement('div');
                  emoji.className = 'fallback-emoji text-5xl';
                  emoji.textContent = '🏔️';
                  parent.appendChild(emoji);
                }
              }}
            />
          </div>
          {/* 雪場資訊 */}
          <div>
            <h1 className="text-2xl font-bold">{resort.names.zh}</h1>
            <p className="text-gray-600">{resort.names.en}</p>
            <p className="text-sm text-gray-500 mt-1">📍 {getRegionName(resort.region)}</p>
          </div>
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

      {/* Enhanced Course Record Modal */}
      <EnhancedCourseRecordModal
        isOpen={isRecordModalOpen}
        courseName={selectedCourseName}
        onClose={() => setIsRecordModalOpen(false)}
        onSubmit={handleEnhancedRecordSubmit}
      />

      {/* Share Card Preview Modal */}
      {lastCompletedVisit && (
        <ShareCardPreviewModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          type="course"
          data={{
            visitId: lastCompletedVisit.visitId,
            courseName: lastCompletedVisit.courseName,
            resortName: resort?.names.zh,
          }}
        />
      )}
    </div>
  );
}
