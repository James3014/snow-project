/**
 * 日本滑雪區域地圖 (SVG)
 */
import React from 'react';
import type { SkiMapData } from '../types/map.types';

interface Region {
  id: string;
  name: string;
  center: { x: number; y: number };
}

// 簡化的日本滑雪區域定義
const REGIONS: Region[] = [
  { id: '北海道', name: '北海道', center: { x: 200, y: 80 } },
  { id: '東北地方', name: '東北', center: { x: 220, y: 180 } },
  { id: '新潟縣', name: '新潟', center: { x: 200, y: 250 } },
  { id: '長野縣', name: '長野', center: { x: 180, y: 280 } },
  { id: '中部地方', name: '中部', center: { x: 150, y: 300 } },
];

interface JapanSkiRegionsMapProps {
  mapData: SkiMapData;
  onRegionClick: (regionId: string) => void;
}

const JapanSkiRegionsMap: React.FC<JapanSkiRegionsMapProps> = ({
  mapData,
  onRegionClick,
}) => {
  // 獲取區域統計
  const getRegionStats = (regionId: string) => {
    const stats = mapData.region_stats[regionId];
    if (!stats) {
      return { total: 0, visited: 0, percentage: 0 };
    }
    return {
      total: stats.total,
      visited: stats.visited,
      percentage: stats.completion_percentage,
    };
  };

  // 根據完成度選擇顏色
  const getRegionColor = (percentage: number) => {
    if (percentage === 100) return '#10b981'; // 綠色 - 全部完成
    if (percentage > 0) return '#f59e0b'; // 橙色 - 部分完成
    return '#e5e7eb'; // 灰色 - 未開始
  };

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-auto"
      style={{ maxWidth: '600px', margin: '0 auto' }}
    >
      {/* 背景 */}
      <rect width="400" height="400" fill="#f0f4f8" />

      {/* 標題 */}
      <text
        x="200"
        y="30"
        textAnchor="middle"
        className="text-2xl font-bold"
        fill="#1f2937"
      >
        我的滑雪地圖
      </text>

      {/* 繪製區域 */}
      {REGIONS.map((region) => {
        const stats = getRegionStats(region.id);
        const color = getRegionColor(stats.percentage);
        const isCompleted = stats.percentage === 100;

        return (
          <g
            key={region.id}
            onClick={() => onRegionClick(region.id)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {/* 區域圓圈 */}
            <circle
              cx={region.center.x}
              cy={region.center.y}
              r={40}
              fill={color}
              stroke="#ffffff"
              strokeWidth="3"
            />

            {/* 區域名稱 */}
            <text
              x={region.center.x}
              y={region.center.y - 5}
              textAnchor="middle"
              className="text-sm font-semibold pointer-events-none"
              fill="#ffffff"
            >
              {region.name}
            </text>

            {/* 完成度 */}
            <text
              x={region.center.x}
              y={region.center.y + 10}
              textAnchor="middle"
              className="text-xs pointer-events-none"
              fill="#ffffff"
            >
              {stats.visited}/{stats.total}
            </text>

            {/* 完成徽章 */}
            {isCompleted && (
              <text
                x={region.center.x + 35}
                y={region.center.y - 25}
                className="text-2xl pointer-events-none"
              >
                ✅
              </text>
            )}
          </g>
        );
      })}

      {/* 總體統計 */}
      <g transform="translate(20, 350)">
        <rect
          width="360"
          height="40"
          rx="8"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <text
          x="180"
          y="25"
          textAnchor="middle"
          className="text-sm font-semibold"
          fill="#374151"
        >
          總進度: {mapData.total_visited}/{mapData.total_resorts} 雪場
          （{Math.round(mapData.completion_percentage)}%）
        </text>
      </g>
    </svg>
  );
};

export default JapanSkiRegionsMap;
