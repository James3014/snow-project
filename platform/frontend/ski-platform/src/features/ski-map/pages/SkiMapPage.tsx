/**
 * 滑雪地圖主頁面
 */
import React from 'react';
import { useSkiMap } from '../hooks/useSkiMap';
import JapanSkiRegionsMap from '../components/JapanSkiRegionsMap';

// TODO: 從認證上下文獲取當前用戶 ID
const CURRENT_USER_ID = 'test-user-id';

const SkiMapPage: React.FC = () => {
  const { mapData, isLoading, error } = useSkiMap(CURRENT_USER_ID);

  const handleRegionClick = (regionId: string) => {
    // TODO: 顯示區域詳情彈窗或導航到詳情頁面
    console.log('點擊區域:', regionId);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加載地圖數據中...</p>
        </div>
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">
            {error || '無法載入地圖數據'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 頂部統計 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          我的滑雪征服地圖
        </h1>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {mapData.total_visited}
            </div>
            <div className="text-sm text-gray-600">已征服雪場</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-400">
              {mapData.total_resorts - mapData.total_visited}
            </div>
            <div className="text-sm text-gray-600">待征服雪場</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {Math.round(mapData.completion_percentage)}%
            </div>
            <div className="text-sm text-gray-600">完成度</div>
          </div>
        </div>
      </div>

      {/* 地圖 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <JapanSkiRegionsMap mapData={mapData} onRegionClick={handleRegionClick} />
      </div>

      {/* 區域詳情列表 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">區域詳情</h2>

        <div className="space-y-4">
          {Object.entries(mapData.region_stats).map(([region, stats]) => (
            <div
              key={region}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleRegionClick(region)}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{region}</h3>
                <span className="text-sm text-gray-600">
                  {stats.visited}/{stats.total} ({Math.round(stats.completion_percentage)}%)
                </span>
              </div>

              {/* 進度條 */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.completion_percentage}%` }}
                />
              </div>

              {/* 雪場列表 */}
              <div className="grid grid-cols-2 gap-2">
                {stats.resorts.slice(0, 6).map((resort) => (
                  <div
                    key={resort.id}
                    className={`text-sm px-2 py-1 rounded ${
                      resort.visited
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {resort.visited ? '✅' : '⬜'} {resort.name_zh || resort.name_en}
                  </div>
                ))}
                {stats.resorts.length > 6 && (
                  <div className="text-sm text-gray-500 px-2 py-1">
                    還有 {stats.resorts.length - 6} 個雪場...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkiMapPage;
