/**
 * Season Utilities
 * 雪季相關工具函數
 */
import type { Trip } from '../types';

/**
 * 根據日期自動計算雪季 ID
 * 雪季定義：11月-4月為一個雪季
 *
 * 範例：
 * - 2024/11 → "2024-2025"
 * - 2025/01 → "2024-2025"
 * - 2025/04 → "2024-2025"
 * - 2024/08 → "2024-2025"（室內雪場、南半球）
 */
export function calculateSeasonId(date: string): string {
  const d = new Date(date);
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();

  // 5月-10月：歸類到下一個雪季
  if (month >= 5 && month <= 10) {
    return `${year}-${year + 1}`;
  }

  // 11月-12月：當年雪季
  if (month >= 11) {
    return `${year}-${year + 1}`;
  }

  // 1月-4月：上一年的雪季
  return `${year - 1}-${year}`;
}

/**
 * 計算行程天數
 */
export function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return days > 0 ? days : 0;
}

/**
 * 雪季統計資料
 */
export interface SeasonStats {
  tripCount: number;
  resortCount: number;
  totalDays: number;
  completedTrips: number;
}

/**
 * 雪季分組資料
 */
export interface SeasonGroup {
  seasonId: string;
  trips: Trip[];
  stats: SeasonStats;
}

/**
 * 計算單個雪季的統計資料
 */
function calculateSeasonStats(trips: Trip[]): SeasonStats {
  return {
    tripCount: trips.length,
    resortCount: new Set(trips.map(t => t.resort_id)).size,
    totalDays: trips.reduce((sum, t) => sum + calculateDays(t.start_date, t.end_date), 0),
    completedTrips: trips.filter(t => t.trip_status === 'completed').length,
  };
}

/**
 * 將行程按雪季分組
 * @param trips 所有行程列表
 * @returns 按雪季分組的資料，最新的雪季在前
 */
export function groupTripsBySeasons(trips: Trip[]): SeasonGroup[] {
  const groups: Record<string, Trip[]> = {};

  // 按雪季分組
  trips.forEach(trip => {
    const seasonId = trip.season_id || calculateSeasonId(trip.start_date);
    if (!groups[seasonId]) {
      groups[seasonId] = [];
    }
    groups[seasonId].push(trip);
  });

  // 轉換為陣列並排序（最新的雪季在前）
  return Object.entries(groups)
    .map(([seasonId, trips]) => ({
      seasonId,
      trips: trips.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
      stats: calculateSeasonStats(trips),
    }))
    .sort((a, b) => b.seasonId.localeCompare(a.seasonId));
}

/**
 * 格式化日期範圍
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = calculateDays(startDate, endDate);

  const startStr = start.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
  const endStr = end.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });

  return `${startStr} - ${endStr} (${days}天)`;
}

/**
 * 獲取狀態樣式
 */
export function getStatusBadge(status: string): { class: string; text: string } {
  const badges: Record<string, { class: string; text: string }> = {
    completed: { class: 'bg-green-100 text-green-800', text: '✅ 已完成' },
    confirmed: { class: 'bg-blue-100 text-blue-800', text: '✈️ 已確認' },
    planning: { class: 'bg-gray-100 text-gray-800', text: '📋 規劃中' },
    cancelled: { class: 'bg-red-100 text-red-800', text: '❌ 已取消' },
  };
  return badges[status] || badges.planning;
}
