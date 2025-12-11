/**
 * Season Detail Page - Glacial Futurism Design
 * 雪季詳情頁面
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import TripCreateModal from '../components/TripCreateModal';
import SeasonCalendarView from '../components/SeasonCalendarView';
import SeasonResortTripsView from '../components/SeasonResortTripsView';
import SeasonStatsView from '../components/SeasonStatsView';
import { useSeasonDetail } from '../hooks/useSeasonDetail';

type TabId = 'resorts' | 'calendar' | 'stats';

const TABS = [
  { id: 'resorts' as TabId, label: '🏔️ 雪場行程' },
  { id: 'calendar' as TabId, label: '📅 日曆視圖' },
  { id: 'stats' as TabId, label: '📊 統計' },
];

export default function SeasonDetail() {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [activeTab, setActiveTab] = useState<TabId>('resorts');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    season,
    stats,
    trips,
    calendarTrips,
    resorts,
    loading,
    currentMonth,
    changeMonth,
    createTrips,
    loadCalendarData,
  } = useSeasonDetail({ seasonId, userId });

  useEffect(() => {
    if (activeTab === 'calendar') loadCalendarData();
  }, [activeTab, currentMonth, loadCalendarData]);

  const handleCreateTrips = async (newTrips: Parameters<typeof createTrips>[0]) => {
    try {
      await createTrips(newTrips);
      if (activeTab === 'calendar') await loadCalendarData();
      setShowCreateModal(false);
    } catch {
      alert('創建行程失敗，請重試');
    }
  };

  if (loading || !season) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入雪季資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <button
              onClick={() => navigate('/trips')}
              className="flex items-center gap-2 text-crystal-blue hover:text-ice-primary transition-colors w-fit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回我的行程
            </button>
            <Button variant="neon" onClick={() => setShowCreateModal(true)}>+ 新增行程</Button>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            📅 {season.title} 雪季
          </h1>
          <p className="text-crystal-blue animate-slide-up stagger-1">
            查看這個雪季的所有行程和統計資料
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: '📍 雪場數', value: stats.unique_resorts, color: 'text-ice-primary' },
              { label: '✈️ 行程數', value: stats.trip_count, color: 'text-ice-accent' },
              { label: '✅ 已完成', value: stats.completed_trips, color: 'text-neon-pink' },
              { label: '🎿 滑雪夥伴', value: stats.total_buddies, color: 'text-neon-purple' },
            ].map((stat, i) => (
              <Card key={stat.label} variant="glass" className="animate-slide-up" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                <Card.Body className="text-center py-6">
                  <div className="text-sm text-crystal-blue mb-2">{stat.label}</div>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-ice-primary to-ice-accent text-frost-white'
                  : 'bg-ice-primary/10 text-crystal-blue hover:bg-ice-primary/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'resorts' && (
          <SeasonResortTripsView trips={trips} resorts={resorts} onTripClick={(id) => navigate(`/trips/${id}`)} />
        )}
        {activeTab === 'calendar' && (
          <SeasonCalendarView
            trips={calendarTrips}
            resorts={resorts}
            currentMonth={currentMonth}
            onMonthChange={changeMonth}
            onTripClick={(id) => navigate(`/trips/${id}`)}
          />
        )}
        {activeTab === 'stats' && stats && <SeasonStatsView stats={stats} />}
      </div>

      {showCreateModal && (
        <TripCreateModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateTrips} />
      )}
    </div>
  );
}
