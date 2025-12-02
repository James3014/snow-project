/**
 * Resort List Page - Glacial Futurism Design
 * 雪場列表首頁 - 冰川未來主義設計
 *
 * Mobile-First | Hero Layout | Immersive Cards
 */
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { resortApiService } from '@/shared/api/resortApi';
import type { Resort } from '@/shared/data/resorts';
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

  useEffect(() => {
    const loadResorts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await resortApiService.getAllResorts();
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

  const filteredResorts = resorts.filter((resort) => {
    const matchesSearch =
      searchQuery === '' ||
      resort.names.zh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resort.names.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resort.region.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = selectedRegion === 'all' || resort.region === selectedRegion;

    return matchesSearch && matchesRegion;
  });

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

  const getRegionName = (region: string) => regionNameMap[region] || region;
  const getResortLogoUrl = (resortId: string) => `/logos/${resortId}.png`;
  const regions = Array.from(new Set(resorts.map((r) => r.region))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入雪場資料中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-12 text-center max-w-md mx-auto">
          <div className="text-6xl mb-6">⚠️</div>
          <h3 className="text-2xl font-bold text-frost-white mb-4">載入失敗</h3>
          <p className="text-crystal-blue mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-neon"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  if (resorts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-12 text-center max-w-md mx-auto">
          <div className="text-6xl mb-6">🏔️</div>
          <h3 className="text-2xl font-bold text-frost-white mb-4">暫無雪場資料</h3>
          <p className="text-crystal-blue">請稍後再試</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-12 pb-16 mb-8">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 via-neon-purple/5 to-transparent opacity-50" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient-glacier mb-6 animate-slide-up">
            探索雪場
          </h1>
          <p className="text-crystal-blue text-base md:text-lg max-w-2xl mx-auto animate-slide-up stagger-1">
            選擇一個雪場開始紀錄你的滑雪征程
            <br className="hidden md:block" />
            每條雪道都是你成長的見證
          </p>
        </div>
      </div>

      <div className="px-4 max-w-7xl mx-auto">
        {/* Search & Filter */}
        <div className="glass-card p-5 md:p-6 mb-8 animate-slide-up stagger-2">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="搜尋雪場名稱或地區..."
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

            {/* Region Filter */}
            <div className="w-full md:w-56">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="input-glacier"
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

          {/* Search Result Count */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-ice-accent pulse-glow" />
            <span className="text-ice-accent font-semibold">
              找到 {filteredResorts.length} 個雪場
            </span>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: stats.visitedResorts, label: '已訪問雪場', color: 'ice-primary', icon: '🏔️' },
            { value: stats.completedCourses, label: '完成雪道', color: 'ice-accent', icon: '⛷️' },
            { value: stats.totalResorts, label: '總雪場數', color: 'neon-purple', icon: '🗺️' },
            { value: stats.totalCourses, label: '總雪道數', color: 'frost-white', icon: '📊' },
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

        {/* Resort Grid */}
        {filteredResorts.length === 0 ? (
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">找不到符合條件的雪場</h3>
            <p className="text-crystal-blue mb-8">試試調整搜尋條件</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRegion('all');
              }}
              className="btn-neon"
            >
              清除篩選
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredResorts.map((resort, index) => {
              const progressPercent = getResortProgress(resort.resort_id);
              const completed = getCompletedCount(resort.resort_id);
              const totalCourses = resort.snow_stats?.courses_total || 0;

              return (
                <div
                  key={resort.resort_id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <ResortCard
                    resort={resort}
                    progressPercent={progressPercent}
                    completed={completed}
                    totalCourses={totalCourses}
                    getResortLogoUrl={getResortLogoUrl}
                    getRegionName={getRegionName}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
