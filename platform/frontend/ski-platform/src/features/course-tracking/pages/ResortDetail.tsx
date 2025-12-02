/**
 * Resort Detail Page - 雪場詳情頁（核心頁面）
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
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
      } catch (err: unknown) {
        console.error('載入雪場失敗 - resortId:', resortId);
        console.error('錯誤詳情:', err);
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status?: number; data?: unknown } };
          console.error('錯誤狀態碼:', axiosErr.response?.status);
          console.error('錯誤訊息:', axiosErr.response?.data);
        }

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

  const loadData = useCallback(async () => {
    if (!userId || !resortId || !resort) return;
    setLoading(true);
    try {
      const [progressData, visitsData] = await Promise.all([
        courseTrackingApi.progress.getResortProgress(userId, resortId, resort.snow_stats.courses_total),
        courseTrackingApi.visits.list(userId, resortId),
      ]);
      dispatch(setProgress({ resortId, progress: progressData }));
      dispatch(setVisits(visitsData));
    } catch {
      console.error('載入進度資料錯誤');
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
  }, [userId, resortId, resort, dispatch]);

  useEffect(() => {
    if (userId && resortId && resort) {
      loadData();
    }
  }, [userId, resortId, resort, loadData]);

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
    } catch {
      dispatch(addToast({ type: 'error', message: '記錄失敗，請稍後再試' }));
    }
  };

  // 雪場載入中
  if (resortLoading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="px-4 pt-8 pb-12">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-glacier/20 rounded-lg w-48 animate-pulse"></div>
              <div className="h-4 bg-glacier/20 rounded-lg w-32 animate-pulse"></div>
            </div>
            <Button variant="glass" onClick={() => navigate('/resorts')}>← 返回</Button>
          </div>
        </div>
        <ListSkeleton count={8} />
      </div>
    );
  }

  // 雪場載入失敗
  if (resortError || !resort) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center px-4">
        <div className="glass-card p-12 text-center max-w-md w-full">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gradient-glacier mb-4">載入失敗</h2>
          <p className="text-crystal-blue mb-8">{resortError || "未找到雪場資訊"}</p>
          <Button variant="neon" onClick={() => window.location.reload()} className="w-full">
            重新載入
          </Button>
        </div>
      </div>
    );
  }

  // Loading State (for tracking data)
  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="px-4 pt-8 pb-12">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-glacier/20 rounded-lg w-48 animate-pulse"></div>
              <div className="h-4 bg-glacier/20 rounded-lg w-32 animate-pulse"></div>
            </div>
            <Button variant="glass" onClick={() => navigate('/resorts')}>← 返回</Button>
          </div>
        </div>
        <ListSkeleton count={8} />
      </div>
    );
  }

  // 未登入用戶：顯示基本資訊，提示登入以追蹤進度
  if (!userId) {
    return (
      <div className="min-h-screen pb-20">
        {/* Hero Header */}
        <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={getResortLogoUrl(resort.resort_id)}
                    alt={`${resort.names.zh} Logo`}
                    loading="lazy"
                    className="w-20 h-20 object-contain rounded-lg"
                    onError={(e) => {
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
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-2 animate-slide-up">
                    {resort.names.zh}
                  </h1>
                  <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
                    {resort.names.en}
                  </p>
                  <p className="text-ice-accent text-sm mt-2">📍 {getRegionName(resort.region)}</p>
                </div>
              </div>
              <Button variant="glass" onClick={() => navigate('/resorts')}>← 返回</Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 space-y-6">
          {/* 雪場基本資訊 */}
          <Card variant="glass" className="animate-slide-up stagger-2">
            <Card.Body className="space-y-4">
              <h3 className="font-semibold text-lg text-gradient-glacier">雪場資訊</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-crystal-blue">地區：</span>
                  <div className="font-medium text-frost-white">{getRegionName(resort.region)}</div>
                </div>
                <div>
                  <span className="text-crystal-blue">總雪道數：</span>
                  <div className="font-medium text-ice-accent">{resort.snow_stats.courses_total} 條</div>
                </div>
                <div>
                  <span className="text-crystal-blue">初級雪道：</span>
                  <div className="font-medium text-green-400">{Math.round(resort.snow_stats.courses_total * resort.snow_stats.beginner_ratio)} 條</div>
                </div>
                <div>
                  <span className="text-crystal-blue">中級雪道：</span>
                  <div className="font-medium text-ice-primary">{Math.round(resort.snow_stats.courses_total * resort.snow_stats.intermediate_ratio)} 條</div>
                </div>
                <div>
                  <span className="text-crystal-blue">高級雪道：</span>
                  <div className="font-medium text-neon-pink">{Math.round(resort.snow_stats.courses_total * resort.snow_stats.advanced_ratio)} 條</div>
                </div>
                <div>
                  <span className="text-crystal-blue">纜車數：</span>
                  <div className="font-medium text-frost-white">{resort.snow_stats.lifts} 條</div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* 登入提示 */}
          <div className="glass-card p-12 text-center max-w-md mx-auto animate-slide-up stagger-3">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-2xl font-bold text-gradient-glacier mb-4">登入以追蹤進度</h2>
            <p className="text-crystal-blue mb-8">登入後即可記錄完成的雪道、查看個人進度、獲得成就！</p>
            <Button variant="neon" onClick={() => navigate('/login')} className="w-full">
              前往登入
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 已登入但載入失敗
  if (!progress) {
    return (
      <div className="min-h-screen pb-20">
        {/* Hero Header */}
        <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-2">
                  {resort.names.zh}
                </h1>
                <p className="text-crystal-blue">{resort.names.en}</p>
              </div>
              <Button variant="glass" onClick={() => navigate('/resorts')}>← 返回</Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="glass-card p-12 text-center max-w-md mx-auto">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-gradient-glacier mb-4">載入失敗</h2>
            <p className="text-crystal-blue mb-8">無法載入雪場進度資料</p>
            <Button variant="neon" onClick={loadData} className="w-full">
              重試
            </Button>
          </div>
        </div>
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
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img
                  src={getResortLogoUrl(resort.resort_id)}
                  alt={`${resort.names.zh} Logo`}
                  loading="lazy"
                  className="w-20 h-20 object-contain rounded-lg"
                  onError={(e) => {
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
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-2 animate-slide-up">
                  {resort.names.zh}
                </h1>
                <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
                  {resort.names.en}
                </p>
                <p className="text-ice-accent text-sm mt-2">📍 {getRegionName(resort.region)}</p>
              </div>
            </div>
            <Button variant="glass" onClick={() => navigate('/resorts')}>← 返回</Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* 雪場資訊卡片 */}
        {resort.description && (
          <Card variant="glass" className="animate-slide-up stagger-2">
            <Card.Body className="space-y-3">
              <p className="text-crystal-blue text-lg font-medium">{resort.description.tagline}</p>
              <div className="flex flex-wrap gap-2">
                {resort.description.highlights.map((highlight, idx) => (
                  <Badge key={idx} variant="ice">
                    ✨ {highlight}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* 進度卡片 */}
        <Card variant="glass" className="animate-slide-up stagger-3">
          <Card.Body className="space-y-4">
            <h3 className="font-semibold text-lg text-gradient-glacier">完成進度</h3>
            <ProgressBar
              percentage={progress.completion_percentage}
              label={`${progress.completed_courses.length} / ${resort.snow_stats.courses_total}`}
            />
            <div className="grid grid-cols-3 gap-4 text-center pt-2">
              <div className="glass-card p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {groupedCourses.beginner?.length || 0}
                </div>
                <div className="text-xs text-crystal-blue mt-1">初級雪道</div>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <div className="text-2xl font-bold text-ice-primary">
                  {groupedCourses.intermediate?.length || 0}
                </div>
                <div className="text-xs text-crystal-blue mt-1">中級雪道</div>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <div className="text-2xl font-bold text-neon-pink">
                  {groupedCourses.advanced?.length || 0}
                </div>
                <div className="text-xs text-crystal-blue mt-1">高級雪道</div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* 按难度分组顯示课程 */}
        {levelOrder.map((level, sectionIndex) => {
          const courses = groupedCourses[level];
          if (!courses || courses.length === 0) return null;

          const difficultyColors = {
            beginner: { badge: 'text-green-400', text: '初級雪道' },
            intermediate: { badge: 'text-ice-primary', text: '中級雪道' },
            advanced: { badge: 'text-neon-pink', text: '高級雪道' },
          };

          return (
            <div key={level} className={`animate-slide-up`} style={{ animationDelay: `${(sectionIndex + 4) * 0.1}s` }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Badge variant={level === 'beginner' ? 'ice' : level === 'intermediate' ? 'accent' : 'pink'}>
                  {getDifficultyEmoji(level)} {getDifficultyLabel(level)}
                </Badge>
                <span className="text-crystal-blue text-sm">{courses.length} 條雪道</span>
              </h3>
              <div className="grid gap-3">
                {courses.map((course, index) => {
                  const isCompleted = progress.completed_courses.includes(course.name);
                  return (
                    <Card
                      key={course.name}
                      variant="glass"
                      hover
                      onClick={() => handleToggleCourse(course.name, isCompleted)}
                      className={`${isCompleted ? 'opacity-60' : ''} animate-slide-up`}
                      style={{ animationDelay: `${(index + (sectionIndex * 10)) * 0.02}s` }}
                    >
                      <Card.Body className="flex items-center justify-between py-3">
                        <div className="flex-1">
                          <div className={`font-medium ${isCompleted ? 'line-through text-crystal-blue/50' : 'text-frost-white'}`}>
                            {course.name}
                          </div>
                          <div className="flex gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-crystal-blue">
                              📐 {course.avg_slope}° avg
                            </span>
                            <span className="text-xs text-crystal-blue">
                              🔺 {course.max_slope}° max
                            </span>
                            {course.tags.length > 0 && (
                              <Badge variant="accent" size="sm">
                                {course.tags[0]}
                              </Badge>
                            )}
                          </div>
                          {course.notes && (
                            <div className="text-xs text-neon-pink mt-1">
                              ⚠️ {course.notes}
                            </div>
                          )}
                        </div>
                        {isCompleted && <span className="text-green-400 text-2xl ml-4">✓</span>}
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

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
