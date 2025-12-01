/**
 * Course History Filters - 篩選器組件
 */
import Button from '@/shared/components/Button';

interface CourseHistoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterRating: number | null;
  onRatingChange: (value: number | null) => void;
  filterSnowCondition: string;
  onSnowConditionChange: (value: string) => void;
  filterWeather: string;
  onWeatherChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const SNOW_CONDITIONS = ['粉雪', '壓雪', '濕雪', '冰面', '春雪'];
const WEATHER_OPTIONS = ['晴天', '多雲', '小雪', '大雪', '暴風雪'];

export default function CourseHistoryFilters({
  searchQuery, onSearchChange, filterRating, onRatingChange,
  filterSnowCondition, onSnowConditionChange, filterWeather, onWeatherChange,
  showFilters, onToggleFilters, onClearFilters, hasActiveFilters
}: CourseHistoryFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="搜尋雪道或雪場..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        <Button variant="secondary" onClick={onToggleFilters}>
          {showFilters ? '隱藏篩選' : '篩選'} {hasActiveFilters && '•'}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">評分</label>
              <select
                value={filterRating ?? ''}
                onChange={(e) => onRatingChange(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">全部</option>
                {[5, 4, 3, 2, 1].map(r => (
                  <option key={r} value={r}>{'⭐'.repeat(r)}</option>
                ))}
              </select>
            </div>

            {/* Snow Condition Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">雪況</label>
              <select
                value={filterSnowCondition}
                onChange={(e) => onSnowConditionChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">全部</option>
                {SNOW_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Weather Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">天氣</label>
              <select
                value={filterWeather}
                onChange={(e) => onWeatherChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">全部</option>
                {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              清除所有篩選
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
