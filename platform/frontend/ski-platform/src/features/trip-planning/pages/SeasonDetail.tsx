/**
 * Season Detail Page with Calendar View - Glacial Futurism Design
 * 雪季詳情頁面（含日曆視圖）
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import TripCreateModal from '../components/TripCreateModal';
import type { Season, SeasonStats, CalendarTrip, Trip, TripCreate } from '../types';
import type { Resort } from '@/shared/data/resorts';

export default function SeasonDetail() {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [season, setSeason] = useState<Season | null>(null);
  const [stats, setStats] = useState<SeasonStats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [calendarTrips, setCalendarTrips] = useState<CalendarTrip[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resorts' | 'calendar' | 'stats'>('resorts');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadSeasonData = useCallback(async () => {
    if (!seasonId || !userId) return;

    try {
      setLoading(true);
      const [seasonData, statsData, tripsData, resortsData] = await Promise.all([
        tripPlanningApi.getSeason(seasonId, userId),
        tripPlanningApi.getSeasonStats(seasonId, userId),
        tripPlanningApi.getTrips(userId, { season_id: seasonId }),
        resortApiService.getAllResorts(),
      ]);

      setSeason(seasonData);
      setStats(statsData);
      setTrips(tripsData);
      setResorts(resortsData.items);
    } catch (err) {
      console.error('載入雪季資料失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [seasonId, userId]);

  const loadCalendarData = useCallback(async () => {
    if (!seasonId || !userId) return;

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const data = await tripPlanningApi.getCalendarTrips(userId, year, month);
      setCalendarTrips(data);
    } catch (err) {
      console.error('載入日曆資料失敗:', err);
    }
  }, [seasonId, userId, currentMonth]);

  useEffect(() => {
    if (seasonId && userId) {
      loadSeasonData();
    }
  }, [seasonId, userId, loadSeasonData]);

  useEffect(() => {
    if (activeTab === 'calendar' && seasonId && userId) {
      loadCalendarData();
    }
  }, [activeTab, currentMonth, seasonId, userId, loadCalendarData]);

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const handleCreateTrips = async (trips: TripCreate[]) => {
    if (!seasonId || !userId) return;

    try {
      // 批次創建行程
      await Promise.all(
        trips.map(trip => tripPlanningApi.createTrip(userId, trip))
      );

      // 重新載入數據
      await loadSeasonData();
      if (activeTab === 'calendar') {
        await loadCalendarData();
      }

      setShowCreateModal(false);
    } catch (err) {
      console.error('創建行程失敗:', err);
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

            <Button
              variant="neon"
              onClick={() => setShowCreateModal(true)}
            >
              + 新增行程
            </Button>
          </div>

          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
              📅 {season.title} 雪季
            </h1>
            <p className="text-crystal-blue animate-slide-up stagger-1">
              查看這個雪季的所有行程和統計資料
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card
              variant="glass"
              className="animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            >
              <Card.Body className="text-center py-6">
                <div className="text-sm text-crystal-blue mb-2">📍 雪場數</div>
                <div className="text-3xl font-bold text-ice-primary">{stats.unique_resorts}</div>
              </Card.Body>
            </Card>

            <Card
              variant="glass"
              className="animate-slide-up"
              style={{ animationDelay: '0.15s' }}
            >
              <Card.Body className="text-center py-6">
                <div className="text-sm text-crystal-blue mb-2">✈️ 行程數</div>
                <div className="text-3xl font-bold text-ice-accent">{stats.trip_count}</div>
              </Card.Body>
            </Card>

            <Card
              variant="glass"
              className="animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              <Card.Body className="text-center py-6">
                <div className="text-sm text-crystal-blue mb-2">✅ 已完成</div>
                <div className="text-3xl font-bold text-neon-pink">{stats.completed_trips}</div>
              </Card.Body>
            </Card>

            <Card
              variant="glass"
              className="animate-slide-up"
              style={{ animationDelay: '0.25s' }}
            >
              <Card.Body className="text-center py-6">
                <div className="text-sm text-crystal-blue mb-2">🎿 滑雪夥伴</div>
                <div className="text-3xl font-bold text-neon-purple">{stats.total_buddies}</div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scroll-snap-x">
          {[
            { id: 'resorts', label: '🏔️ 雪場行程', icon: '🏔️' },
            { id: 'calendar', label: '📅 日曆視圖', icon: '📅' },
            { id: 'stats', label: '📊 統計', icon: '📊' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
          <ResortGroupedTripsView
            trips={trips}
            resorts={resorts}
            onTripClick={(tripId) => navigate(`/trips/${tripId}`)}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            trips={calendarTrips}
            resorts={resorts}
            currentMonth={currentMonth}
            onMonthChange={changeMonth}
            onTripClick={(tripId) => navigate(`/trips/${tripId}`)}
          />
        )}

        {activeTab === 'stats' && stats && (
          <StatsView stats={stats} />
        )}
      </div>

      {/* Trip Create Modal */}
      {showCreateModal && (
        <TripCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTrips}
        />
      )}
    </div>
  );
}

// 日曆視圖組件
function CalendarView({
  trips,
  resorts,
  currentMonth,
  onMonthChange,
  onTripClick,
}: {
  trips: CalendarTrip[];
  resorts: Resort[];
  currentMonth: Date;
  onMonthChange: (offset: number) => void;
  onTripClick: (tripId: string) => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // 建立雪場 ID 到雪場資料的映射
  const resortsMap = resorts.reduce((acc, resort) => {
    acc[resort.resort_id] = resort;
    return acc;
  }, {} as Record<string, Resort>);

  // 獲取雪場名稱（優先中文）
  const getResortName = (resortId: string) => {
    const resort = resortsMap[resortId];
    if (resort) {
      return resort.names.zh;
    }
    return resortId;
  };

  // 生成日曆格子
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // 獲取某天的行程
  const getTripsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return trips.filter(trip => {
      return trip.start_date <= dateStr && trip.end_date >= dateStr;
    });
  };

  return (
    <Card variant="glass" className="animate-slide-up">
      <Card.Body className="space-y-6">
        {/* Month Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => onMonthChange(-1)}
            className="p-2 hover:bg-ice-primary/20 rounded-lg transition-colors text-crystal-blue"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-gradient-glacier">
            {year} 年 {month + 1} 月
          </h2>

          <button
            onClick={() => onMonthChange(1)}
            className="p-2 hover:bg-ice-primary/20 rounded-lg transition-colors text-crystal-blue"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-crystal-blue py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayTrips = getTripsForDay(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            return (
              <div
                key={day}
                className={`aspect-square border rounded-lg p-2 transition-all ${
                  isToday
                    ? 'bg-ice-primary/20 border-ice-primary/50'
                    : 'bg-ice-primary/5 border-ice-primary/20 hover:border-ice-primary/40'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-ice-primary' : 'text-crystal-blue'
                }`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayTrips.slice(0, 2).map((trip) => {
                    const displayName = trip.title || getResortName(trip.resort_id);
                    return (
                      <div
                        key={trip.trip_id}
                        onClick={() => onTripClick(trip.trip_id)}
                        className="text-xs bg-ice-primary/30 text-ice-accent px-1 py-0.5 rounded cursor-pointer hover:bg-ice-primary/50 truncate transition-colors"
                        title={displayName}
                      >
                        {displayName}
                      </div>
                    );
                  })}
                  {dayTrips.length > 2 && (
                    <div className="text-xs text-crystal-blue/70">+{dayTrips.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
}

// 按雪場分組的行程視圖組件
function ResortGroupedTripsView({
  trips,
  resorts,
  onTripClick,
}: {
  trips: Trip[];
  resorts: Resort[];
  onTripClick: (tripId: string) => void;
}) {
  if (trips.length === 0) {
    return (
      <Card variant="glass" className="animate-slide-up">
        <Card.Body className="text-center py-12">
          <div className="text-6xl mb-4">🏔️</div>
          <h3 className="text-2xl font-bold text-frost-white mb-2">還沒有任何行程</h3>
          <p className="text-crystal-blue">建立您的第一個行程，開始規劃雪季冒險！</p>
        </Card.Body>
      </Card>
    );
  }

  // 建立雪場 ID 到雪場資料的映射
  const resortsMap = resorts.reduce((acc, resort) => {
    acc[resort.resort_id] = resort;
    return acc;
  }, {} as Record<string, Resort>);

  // 獲取雪場名稱（優先中文）
  const getResortName = (resortId: string) => {
    const resort = resortsMap[resortId];
    if (resort) {
      return `${resort.names.zh} ${resort.names.en}`;
    }
    // 降級方案：格式化 resort_id
    return resortId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // 按雪場分組
  const groupedByResort = trips.reduce((acc, trip) => {
    const resortKey = trip.resort_id;
    if (!acc[resortKey]) {
      acc[resortKey] = [];
    }
    acc[resortKey].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  // 獲取狀態徽章變體
  const getStatusBadgeVariant = (status: string): 'ice' | 'accent' | 'pink' => {
    if (status === 'completed') return 'ice';
    if (status === 'confirmed') return 'accent';
    return 'pink';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      completed: '✅ 已完成',
      confirmed: '✈️ 已確認',
      planning: '📋 規劃中',
    };
    return statusMap[status] || '📋 規劃中';
  };

  const getTransportIcon = (status: string) => {
    if (status === 'confirmed' || status === 'booked') return '✈️';
    if (status === 'ready_to_book') return '🔖';
    if (status === 'researching') return '🔍';
    return '📝';
  };

  const getAccommodationIcon = (status: string) => {
    if (status === 'confirmed' || status === 'booked') return '🏨';
    if (status === 'ready_to_book') return '🔖';
    if (status === 'researching') return '🔍';
    return '📝';
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedByResort).map(([resortId, resortTrips], resortIdx) => {
        const resortName = getResortName(resortId);
        const tripCount = resortTrips.length;

        return (
          <Card
            key={resortId}
            variant="glass"
            className="animate-slide-up overflow-hidden"
            style={{ animationDelay: `${(resortIdx + 1) * 0.05}s` }}
          >
            {/* 雪場標題 */}
            <div className="relative overflow-hidden px-6 py-4 border-b border-ice-primary/20">
              <div className="absolute inset-0 bg-gradient-to-r from-ice-primary/10 to-ice-accent/5" />
              <h3 className="relative text-xl font-bold text-gradient-glacier flex items-center gap-3">
                🏔️ {resortName}
                <Badge variant="ice" size="sm">
                  {tripCount} 趟
                </Badge>
              </h3>
            </div>

            {/* 行程列表 */}
            <Card.Body className="p-0">
              <div className="divide-y divide-ice-primary/10">
                {resortTrips.map((trip, tripIdx) => (
                  <div
                    key={trip.trip_id}
                    onClick={() => onTripClick(trip.trip_id)}
                    className="p-6 hover:bg-ice-primary/5 cursor-pointer transition-colors border-0 animate-slide-up"
                    style={{ animationDelay: `${(resortIdx * 10 + tripIdx + 2) * 0.02}s` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <Badge variant={getStatusBadgeVariant(trip.trip_status)}>
                            {getStatusText(trip.trip_status)}
                          </Badge>
                          {trip.visibility === 'public' && (
                            <Badge variant="accent">
                              📢 已發布
                            </Badge>
                          )}
                          {trip.title && (
                            <span className="text-sm text-crystal-blue">{trip.title}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-crystal-blue">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>
                          {new Date(trip.start_date).toLocaleDateString('zh-TW')} - {new Date(trip.end_date).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{getTransportIcon(trip.flight_status)} 機票</span>
                        <span>{getAccommodationIcon(trip.accommodation_status)} 住宿</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{trip.current_buddies}/{trip.max_buddies} 人</span>
                          </div>
                          <div className="w-full bg-ice-primary/10 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-gradient-to-r from-ice-primary to-ice-accent h-1.5 rounded-full"
                              style={{ width: `${Math.round((trip.current_buddies / trip.max_buddies) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {trip.notes && (
                      <div className="mt-3 text-sm text-crystal-blue bg-ice-primary/10 p-3 rounded border border-ice-primary/20">
                        📝 {trip.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
}

// 統計視圖組件
function StatsView({ stats }: { stats: SeasonStats }) {
  const completionRate = stats.trip_count > 0 ? Math.round((stats.completed_trips / stats.trip_count) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 行程完成率 */}
      <Card
        variant="glass"
        className="animate-slide-up"
        style={{ animationDelay: '0.1s' }}
      >
        <Card.Body className="text-center py-8">
          <h3 className="text-lg font-bold text-frost-white mb-6">行程完成率</h3>
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-ice-primary/20 to-ice-accent/20 border-2 border-ice-primary/40" />
            <div className="text-4xl font-bold text-gradient-glacier">{completionRate}%</div>
          </div>
          <p className="text-crystal-blue text-sm">{stats.completed_trips} / {stats.trip_count} 趟已完成</p>
        </Card.Body>
      </Card>

      {/* 雪場統計 */}
      <Card
        variant="glass"
        className="animate-slide-up"
        style={{ animationDelay: '0.15s' }}
      >
        <Card.Body className="space-y-4 py-8">
          <h3 className="text-lg font-bold text-frost-white text-center">🏔️ 雪場統計</h3>
          <div className="flex items-center justify-between">
            <span className="text-crystal-blue">本季探索雪場</span>
            <span className="text-3xl font-bold text-ice-primary">{stats.unique_resorts}</span>
          </div>
          <div className="h-2 bg-ice-primary/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-ice-primary to-ice-accent" style={{ width: '100%' }} />
          </div>
        </Card.Body>
      </Card>

      {/* 社交統計 */}
      <Card
        variant="glass"
        className="animate-slide-up"
        style={{ animationDelay: '0.2s' }}
      >
        <Card.Body className="space-y-4 py-8">
          <h3 className="text-lg font-bold text-frost-white text-center">👥 社交統計</h3>
          <div className="flex items-center justify-between">
            <span className="text-crystal-blue">滑雪夥伴</span>
            <span className="text-3xl font-bold text-neon-pink">{stats.total_buddies}</span>
          </div>
          <p className="text-xs text-crystal-blue text-center">與 {stats.total_buddies} 位夥伴一起滑雪</p>
        </Card.Body>
      </Card>
    </div>
  );
}
