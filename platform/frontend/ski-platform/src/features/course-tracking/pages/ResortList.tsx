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

      {/* 搜尋和過濾 */}
      <Card>
        <Card.Body>
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜尋框 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜尋雪場名稱或地區..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {/* 地區過濾 */}
            <div className="w-full md:w-48">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          <div className="mt-3 text-sm text-gray-600">
            找到 {filteredResorts.length} 個雪場
          </div>
        </Card.Body>
      </Card>

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
      {filteredResorts.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">🔍</div>
            <p className="text-gray-600">找不到符合條件的雪場</p>
            <p className="text-sm text-gray-500 mt-2">試試調整搜尋條件</p>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResorts.map((resort) => {
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
                {/* Logo 圖片 */}
                <div className="flex justify-center items-center h-24">
                  <img
                    src={getResortLogoUrl(resort.resort_id)}
                    alt={`${resort.names.zh} Logo`}
                    className="max-h-20 max-w-full object-contain rounded-lg"
                    onError={(e) => {
                      // 如果圖片載入失敗，顯示預設 emoji
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.fallback-emoji')) {
                        const emoji = document.createElement('div');
                        emoji.className = 'fallback-emoji text-6xl';
                        emoji.textContent = '🏔️';
                        parent.appendChild(emoji);
                      }
                    }}
                  />
                </div>

                {/* 雪場名稱 */}
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">{resort.names.zh}</h3>
                  <p className="text-sm text-gray-600">{resort.names.en}</p>
                  <p className="text-xs text-gray-500 mt-1">📍 {getRegionName(resort.region)}</p>
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
      )}
    </div>
  );
}
