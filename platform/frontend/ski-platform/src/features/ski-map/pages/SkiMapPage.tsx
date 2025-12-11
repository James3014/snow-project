/**
 * Ski Map Page - Glacial Futurism Design
 * 滑雪征服地圖 - 冰川未來主義設計
 *
 * Mobile-First | Interactive Map | Progress Visualization
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useSkiMap } from '../hooks/useSkiMap';
import JapanSkiRegionsMap from '../components/JapanSkiRegionsMap';
import { useAppSelector } from '@/store/hooks';

const SkiMapPage: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { mapData, isLoading, error } = useSkiMap(user?.user_id || '');

  const handleRegionClick = (_region: string) => {
    // TODO: 實作區域點擊導航
  };

  // Locked State for Unauthenticated Users
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background Map Pattern */}
        <div className="absolute inset-0 z-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <path d="M20,50 Q30,30 40,50 T60,50 T80,50" stroke="currentColor" fill="none" strokeWidth="0.5" className="text-ice-primary" />
            <path d="M10,70 Q25,55 40,70 T70,70 T90,70" stroke="currentColor" fill="none" strokeWidth="0.5" className="text-neon-purple" />
          </svg>
        </div>

        {/* Lock Screen Content */}
        <div className="relative z-10 text-center max-w-md w-full animate-slide-up">
          {/* Map Icon with Glow */}
          <div className="inline-flex items-center justify-center w-24 h-24 mb-8 glass-card pulse-glow">
            <svg className="w-12 h-12 text-ice-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gradient-glacier mb-4">
            滑雪征服地圖
          </h1>
          <p className="text-crystal-blue mb-8 text-balance">
            登入後即可查看您的滑雪征服地圖
            <br />
            追蹤您在日本各地雪場的足跡
          </p>

          <Link to="/login" className="btn-neon ski-trail w-full inline-block text-center">
            前往登入
          </Link>

          {/* Preview Stats (Blurred) */}
          <div className="mt-12 grid grid-cols-3 gap-4 opacity-50 blur-sm pointer-events-none">
            {[
              { icon: '🏔️', value: '12', label: '已征服' },
              { icon: '🗺️', value: '48', label: '待探索' },
              { icon: '📊', value: '25%', label: '完成度' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-bold text-ice-primary mb-1">{stat.value}</div>
                <div className="text-xs text-crystal-blue">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入地圖資料中...</p>
        </div>
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-12 text-center max-w-md mx-auto">
          <div className="text-6xl mb-6">❌</div>
          <h3 className="text-2xl font-bold text-frost-white mb-4">載入失敗</h3>
          <p className="text-crystal-blue mb-8">{error || '無法載入地圖數據'}</p>
          <button onClick={() => window.location.reload()} className="btn-neon">
            重試
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            我的滑雪征服地圖
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            追蹤您在日本各地雪場的滑雪足跡
          </p>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              value: mapData.total_visited,
              label: '已征服雪場',
              color: 'ice-primary',
              icon: '🏔️',
            },
            {
              value: mapData.total_resorts - mapData.total_visited,
              label: '待征服雪場',
              color: 'crystal-blue',
              icon: '🗺️',
            },
            {
              value: `${Math.round(mapData.completion_percentage)}%`,
              label: '完成度',
              color: 'ice-accent',
              icon: '📊',
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="glass-card p-6 text-center group cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className={`text-3xl md:text-4xl font-bold text-${stat.color} mb-2 group-hover:scale-110 transition-transform`}>
                {stat.value}
              </div>
              <div className="text-xs text-crystal-blue uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Map Card */}
        <div className="glass-card p-6 mb-8 animate-slide-up stagger-3">
          <JapanSkiRegionsMap mapData={mapData} onRegionClick={handleRegionClick} />
        </div>

        {/* Region Details */}
        <div>
          <h2 className="text-2xl font-bold text-frost-white mb-6 animate-slide-up stagger-4">
            區域詳情
          </h2>

          <div className="space-y-4">
            {Object.entries(mapData.region_stats).map(([region, stats], index) => (
              <div
                key={region}
                className="glass-card p-5 group cursor-pointer animate-slide-up"
                style={{ animationDelay: `${(index + 5) * 0.05}s` }}
                onClick={() => handleRegionClick(region)}
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gradient-glacier">{region}</h3>
                  <span className="text-sm font-semibold text-crystal-blue">
                    {stats.visited}/{stats.total} ({Math.round(stats.completion_percentage)}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-glass-bg rounded-full overflow-hidden border border-glacier mb-4">
                  <div
                    className="h-full bg-gradient-glacier rounded-full transition-all duration-500"
                    style={{ width: `${stats.completion_percentage}%` }}
                  />
                </div>

                {/* Resort Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {stats.resorts.slice(0, 6).map((resort) => (
                    <div
                      key={resort.id}
                      className={`text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                        resort.visited
                          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300'
                          : 'bg-glass-bg border border-glacier text-crystal-blue/60'
                      }`}
                    >
                      <span className="mr-1">{resort.visited ? '✅' : '⬜'}</span>
                      {resort.name_zh || resort.name_en}
                    </div>
                  ))}
                  {stats.resorts.length > 6 && (
                    <div className="text-xs text-crystal-blue/50 px-3 py-2 flex items-center justify-center">
                      還有 {stats.resorts.length - 6} 個...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkiMapPage;
