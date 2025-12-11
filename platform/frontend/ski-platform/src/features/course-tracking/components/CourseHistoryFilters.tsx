/**
 * 雪道紀錄篩選組件
 */
interface FiltersProps {
  searchQuery: string;
  filterRating: number | null;
  filterSnowCondition: string;
  filterWeather: string;
  filteredCount: number;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onRatingChange: (value: number | null) => void;
  onSnowConditionChange: (value: string) => void;
  onWeatherChange: (value: string) => void;
  onClearFilters: () => void;
}

const SNOW_CONDITIONS = ['粉雪', '壓雪', '冰面', '融雪'];
const WEATHER_OPTIONS = ['晴天', '陰天', '下雪', '暴風雪'];

export default function CourseHistoryFilters({
  searchQuery,
  filterRating,
  filterSnowCondition,
  filterWeather,
  filteredCount,
  hasActiveFilters,
  onSearchChange,
  onRatingChange,
  onSnowConditionChange,
  onWeatherChange,
  onClearFilters,
}: FiltersProps) {
  return (
    <div className="glass-card p-5 md:p-6 mb-8 animate-slide-up stagger-2">
      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="搜尋雪道或雪場..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-glacier pl-11"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-crystal-blue/50 text-lg">🔍</div>
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-crystal-blue/50 hover:text-ice-primary transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4">
        <button
          onClick={() => onRatingChange(null)}
          className={`filter-pill scroll-snap-item flex-shrink-0 ${filterRating === null ? 'active' : ''}`}
        >
          全部評分
        </button>
        {[5, 4, 3, 2, 1].map(rating => (
          <button
            key={rating}
            onClick={() => onRatingChange(rating)}
            className={`filter-pill scroll-snap-item flex-shrink-0 ${filterRating === rating ? 'active' : ''}`}
          >
            {'⭐'.repeat(rating)}
          </button>
        ))}
      </div>

      {/* Snow Condition Filter */}
      <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4 mt-2">
        <button
          onClick={() => onSnowConditionChange('')}
          className={`filter-pill scroll-snap-item flex-shrink-0 ${!filterSnowCondition ? 'active' : ''}`}
        >
          全部雪況
        </button>
        {SNOW_CONDITIONS.map(condition => (
          <button
            key={condition}
            onClick={() => onSnowConditionChange(condition)}
            className={`filter-pill scroll-snap-item flex-shrink-0 ${filterSnowCondition === condition ? 'active' : ''}`}
          >
            {condition}
          </button>
        ))}
      </div>

      {/* Weather Filter */}
      <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4 mt-2">
        <button
          onClick={() => onWeatherChange('')}
          className={`filter-pill scroll-snap-item flex-shrink-0 ${!filterWeather ? 'active' : ''}`}
        >
          全部天氣
        </button>
        {WEATHER_OPTIONS.map(weather => (
          <button
            key={weather}
            onClick={() => onWeatherChange(weather)}
            className={`filter-pill scroll-snap-item flex-shrink-0 ${filterWeather === weather ? 'active' : ''}`}
          >
            {weather}
          </button>
        ))}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-ice-accent pulse-glow" />
          <span className="text-ice-accent font-semibold">找到 {filteredCount} 筆紀錄</span>
          <button
            onClick={onClearFilters}
            className="ml-auto text-crystal-blue hover:text-ice-primary transition-colors text-xs underline"
          >
            清除全部篩選
          </button>
        </div>
      )}
    </div>
  );
}
