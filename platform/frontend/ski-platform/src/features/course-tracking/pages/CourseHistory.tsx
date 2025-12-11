/**
 * Course History Page - Glacial Futurism Design
 * 雪道紀錄歷史
 */
import { useNavigate } from 'react-router-dom';
import { useCourseHistory } from '../hooks/useCourseHistory';
import { formatDate } from '@/shared/utils/helpers';
import EnhancedCourseRecordModal from '../components/EnhancedCourseRecordModal';
import CourseHistoryFilters from '../components/CourseHistoryFilters';

export default function CourseHistory() {
  const navigate = useNavigate();
  const {
    userId,
    loading,
    visits,
    filteredVisits,
    groupedVisits,
    sortedDates,
    stats,
    courseRankings,
    editingVisit,
    isEditModalOpen,
    searchQuery,
    filterRating,
    filterSnowCondition,
    filterWeather,
    hasActiveFilters,
    setSearchQuery,
    setFilterRating,
    setFilterSnowCondition,
    setFilterWeather,
    handleEdit,
    handleEditSubmit,
    handleDelete,
    closeEditModal,
    clearFilters,
  } = useCourseHistory();

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入紀錄中...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Lock Screen
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute text-6xl animate-slide-up" style={{ left: `${(i * 12) + 5}%`, top: `${(i * 15) % 70}%`, animationDelay: `${i * 0.3}s`, opacity: 0.2 }}>📝</div>
          ))}
        </div>
        <div className="relative z-10 text-center max-w-md w-full animate-slide-up">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-8 glass-card pulse-glow">
            <svg className="w-12 h-12 text-ice-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient-glacier mb-4">紀錄歷史</h1>
          <p className="text-crystal-blue mb-8 text-balance">登入後即可查看您的滑雪紀錄、統計數據和評分排行</p>
          <button onClick={() => navigate('/login')} className="btn-neon ski-trail w-full">前往登入</button>
        </div>
      </div>
    );
  }

  // Empty State
  if (visits.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">紀錄歷史</h1>
            <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">開始紀錄您的滑雪征程</p>
          </div>
        </div>
        <div className="px-4 max-w-md mx-auto">
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="text-6xl mb-6">📝</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">還沒有紀錄</h3>
            <p className="text-crystal-blue mb-8 text-balance">開始紀錄您的滑雪體驗，追蹤每一次進步</p>
            <button onClick={() => navigate('/resorts')} className="btn-neon ski-trail w-full">前往雪場列表</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">紀錄歷史</h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            {stats.totalVisits > 0 ? `共 ${stats.totalVisits} 筆紀錄 • 持續追蹤您的成長軌跡` : '開始紀錄您的滑雪征程'}
          </p>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto">
        {/* Filters */}
        <CourseHistoryFilters
          searchQuery={searchQuery}
          filterRating={filterRating}
          filterSnowCondition={filterSnowCondition}
          filterWeather={filterWeather}
          filteredCount={filteredVisits.length}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearchQuery}
          onRatingChange={setFilterRating}
          onSnowConditionChange={setFilterSnowCondition}
          onWeatherChange={setFilterWeather}
          onClearFilters={clearFilters}
        />

        {/* Stats Dashboard */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { value: stats.totalVisits, label: '完成雪道', color: 'ice-primary', icon: '⛷️' },
            { value: stats.avgRating, label: '平均評分', color: 'ice-accent', icon: '⭐' },
            { value: stats.uniqueResorts, label: '滑過雪場', color: 'neon-purple', icon: '🏔️' },
          ].map((stat, index) => (
            <div key={stat.label} className="glass-card p-6 text-center group cursor-pointer animate-slide-up" style={{ animationDelay: `${(index + 3) * 0.1}s` }}>
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className={`text-3xl md:text-4xl font-bold text-${stat.color} mb-2 group-hover:scale-110 transition-transform`}>{stat.value}</div>
              <div className="text-xs text-crystal-blue uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Course Rankings */}
        {courseRankings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-frost-white mb-6 animate-slide-up stagger-4">雪道評分排名</h2>
            <div className="glass-card p-0 overflow-hidden animate-slide-up stagger-5">
              <div className="divide-y divide-glacier">
                {courseRankings.slice(0, 5).map((stat, index) => (
                  <div key={`${stat.resort_id}|${stat.course_name}`} className="p-5 group cursor-pointer relative overflow-hidden" onClick={() => navigate(`/resorts/${stat.resort_id}`)}>
                    <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className={`text-2xl font-bold flex-shrink-0 ${index === 0 ? 'text-ice-accent' : index === 1 ? 'text-crystal-blue' : 'text-frost-white/50'}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-frost-white truncate">{stat.course_name}</h3>
                        <p className="text-sm text-crystal-blue/70">🏔️ {stat.resort_id}</p>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-ice-accent">{stat.avgRating.toFixed(1)}</div>
                          <div className="text-xs text-crystal-blue">評分</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-frost-white">{stat.count}</div>
                          <div className="text-xs text-crystal-blue">次數</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Records */}
        {sortedDates.length === 0 ? (
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">沒有符合的紀錄</h3>
            <p className="text-crystal-blue mb-8">試試調整搜尋或篩選條件</p>
            <button onClick={clearFilters} className="btn-neon">清除篩選</button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date, dateIndex) => (
              <div key={date}>
                <h2 className="text-lg font-semibold text-gradient-glacier mb-4 animate-slide-up" style={{ animationDelay: `${dateIndex * 0.05}s` }}>📅 {date}</h2>
                <div className="space-y-4">
                  {groupedVisits[date].map((visit, visitIndex) => (
                    <div key={visit.id} className="glass-card p-5 group relative overflow-hidden animate-slide-up" style={{ animationDelay: `${(dateIndex * 0.05) + (visitIndex * 0.02)}s` }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold text-gradient-glacier">{visit.course_name}</h3>
                            {visit.rating && <div className="flex items-center text-ice-accent">{'★'.repeat(visit.rating)}{'☆'.repeat(5 - visit.rating)}</div>}
                          </div>
                          <p className="text-sm text-crystal-blue mb-4">🏔️ {visit.resort_id}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {visit.snow_condition && <span className="px-3 py-1 bg-gradient-to-r from-ice-primary/20 to-ice-secondary/20 border border-ice-primary/30 text-ice-accent rounded-full text-xs font-medium">❄️ {visit.snow_condition}</span>}
                            {visit.weather && <span className="px-3 py-1 bg-gradient-to-r from-ice-primary/20 to-ice-secondary/20 border border-ice-primary/30 text-ice-accent rounded-full text-xs font-medium">☀️ {visit.weather}</span>}
                            {visit.difficulty_feeling && <span className="px-3 py-1 bg-gradient-to-r from-neon-purple/20 to-ice-secondary/20 border border-neon-purple/30 text-crystal-blue rounded-full text-xs font-medium">💪 {visit.difficulty_feeling}</span>}
                          </div>
                          {visit.mood_tags && visit.mood_tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {visit.mood_tags.map((tag, idx) => <span key={idx} className="px-3 py-1 bg-glass-bg border border-glacier text-crystal-blue rounded-full text-xs font-medium">{tag}</span>)}
                            </div>
                          )}
                          {visit.notes && <div className="mt-3 p-4 bg-glass-bg rounded-lg border border-glacier"><p className="text-sm text-frost-white italic">💭 {visit.notes}</p></div>}
                          <p className="text-xs text-crystal-blue/50 mt-3">紀錄於 {formatDate(visit.created_at)}</p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                          <button onClick={() => navigate(`/resorts/${visit.resort_id}`)} className="text-sm text-ice-primary hover:text-ice-accent transition-colors underline">查看</button>
                          <button onClick={() => handleEdit(visit)} className="text-sm text-crystal-blue hover:text-frost-white transition-colors underline">編輯</button>
                          <button onClick={() => handleDelete(visit.id)} className="text-sm text-neon-pink hover:text-red-400 transition-colors underline">刪除</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingVisit && (
        <EnhancedCourseRecordModal
          isOpen={isEditModalOpen}
          courseName={editingVisit.course_name}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          initialData={{
            rating: editingVisit.rating,
            snow_condition: editingVisit.snow_condition,
            weather: editingVisit.weather,
            difficulty_feeling: editingVisit.difficulty_feeling,
            mood_tags: editingVisit.mood_tags,
            notes: editingVisit.notes,
          }}
          mode="edit"
        />
      )}
    </div>
  );
}
