/**
 * Resort List Page - Alpine Velocity Style
 * 雪場列表首页 - Mountain Ice 風格
 */
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { resortApiService } from '@/shared/api/resortApi';
import type { Resort } from '@/shared/data/resorts';
import { ErrorEmptyState, NoDataEmptyState } from '@/shared/components/EmptyState';
import ResortCard from '../components/ResortCard';

export default function ResortList() {
  const progress = useAppSelector((state) => state.courseTracking.progress);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
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

  // 過濾雪場
  const filteredResorts = resorts.filter((resort) => {
    // 搜尋過濾
    const matchesSearch =
      searchQuery === '' ||
      resort.names.zh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resort.names.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resort.region.toLowerCase().includes(searchQuery.toLowerCase());

    // 地區過濾
    const matchesRegion = selectedRegion === 'all' || resort.region === selectedRegion;

    return matchesSearch && matchesRegion;
  });

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

  // 取得所有地區（用於過濾器）
  const regions = Array.from(new Set(resorts.map((r) => r.region))).sort();

  // 載入中
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-2">⛷️</div>
          <p className="text-zinc-400">載入中...</p>
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
        <h1 className="text-3xl font-bold text-gradient-velocity" style={{ fontFamily: 'var(--font-display)' }}>
          雪場列表
        </h1>
        <p className="mt-2 text-zinc-400">選擇一個雪場開始記錄你的滑雪旅程</p>
      </div>

      {/* 搜尋和過濾 */}
      <div className="bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜尋框 */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜尋雪場名稱或地區..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-11 bg-zinc-900 border-2 border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">
              🔍
            </div>
          </div>
          {/* 地區過濾 */}
          <div className="w-full md:w-48">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border-2 border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="all">全部地區</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {getRegionName(region)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-cyan-400">
          找到 {filteredResorts.length} 個雪場
        </div>
      </div>

      {/* 統計資料 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-cyan-400" style={{ fontFamily: 'var(--font-display)' }}>
            {stats.visitedResorts}
          </div>
          <div className="text-sm text-zinc-400 mt-1">已訪問雪場</div>
        </div>
        <div className="bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-cyan-400" style={{ fontFamily: 'var(--font-display)' }}>
            {stats.completedCourses}
          </div>
          <div className="text-sm text-zinc-400 mt-1">完成雪道</div>
        </div>
        <div className="bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400" style={{ fontFamily: 'var(--font-display)' }}>
            {stats.totalResorts}
          </div>
          <div className="text-sm text-zinc-400 mt-1">總雪場數</div>
        </div>
        <div className="bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400" style={{ fontFamily: 'var(--font-display)' }}>
            {stats.totalCourses}
          </div>
          <div className="text-sm text-zinc-400 mt-1">總雪道數</div>
        </div>
      </div>

      {/* 雪場列表 */}
      {filteredResorts.length === 0 ? (
        <div className="bg-zinc-800 border-2 border-zinc-700 rounded-xl text-center py-12">
          <div className="text-zinc-400 text-5xl mb-4">🔍</div>
          <p className="text-zinc-300">找不到符合條件的雪場</p>
          <p className="text-sm text-zinc-500 mt-2">試試調整搜尋條件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResorts.map((resort) => {
            const progressPercent = getResortProgress(resort.resort_id);
            const completed = getCompletedCount(resort.resort_id);
            const totalCourses = resort.snow_stats?.courses_total || 0;

            return (
              <ResortCard
                key={resort.resort_id}
                resort={resort}
                progressPercent={progressPercent}
                completed={completed}
                totalCourses={totalCourses}
                getResortLogoUrl={getResortLogoUrl}
                getRegionName={getRegionName}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
