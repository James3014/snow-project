/**
 * Season Detail Page with Calendar View
 * 雪季詳情頁面（含日曆視圖）
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import Card from '@/shared/components/Card';
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

  const handleCreateTrips = async (trips: Omit<TripCreate, 'season_id'>[]) => {
    if (!seasonId || !userId) return;

    try {
      // 為每個行程添加 season_id
      const tripsWithSeason = trips.map(trip => ({
        ...trip,
        season_id: seasonId,
      }));

      // 批次創建行程
      await Promise.all(
        tripsWithSeason.map(trip => tripPlanningApi.createTrip(userId, trip))
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/seasons')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回雪季列表
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{season.title}</h1>
            {season.description && (
              <p className="text-gray-600">{season.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {new Date(season.start_date).toLocaleDateString('zh-TW')} - {new Date(season.end_date).toLocaleDateString('zh-TW')}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + 新增行程
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">📍 雪場數</div>
            <div className="text-2xl font-bold text-gray-900">{stats.unique_resorts} 個</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">✈️ 行程數</div>
            <div className="text-2xl font-bold text-blue-600">{stats.trip_count} 趟</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">✅ 已完成</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed_trips} 趟</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">🎿 滑雪夥伴</div>
            <div className="text-2xl font-bold text-purple-600">{stats.total_buddies} 位</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'resorts', label: '雪場行程', icon: '🏔️' },
            { id: 'calendar', label: '日曆視圖', icon: '📅' },
            { id: 'stats', label: '統計', icon: '📊' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
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
          currentMonth={currentMonth}
          onMonthChange={changeMonth}
          onTripClick={(tripId) => navigate(`/trips/${tripId}`)}
        />
      )}

      {activeTab === 'stats' && stats && (
        <StatsView stats={stats} />
      )}

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
  currentMonth,
  onMonthChange,
  onTripClick,
}: {
  trips: CalendarTrip[];
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
    <Card className="p-6">
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => onMonthChange(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-900">
          {year} 年 {month + 1} 月
        </h2>

        <button
          onClick={() => onMonthChange(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
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
              className={`aspect-square border rounded-lg p-2 ${
                isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
              } hover:border-blue-400 transition-colors`}
            >
              <div className="text-sm font-medium mb-1">{day}</div>
              <div className="space-y-1">
                {dayTrips.slice(0, 2).map((trip) => (
                  <div
                    key={trip.trip_id}
                    onClick={() => onTripClick(trip.trip_id)}
                    className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded cursor-pointer hover:bg-blue-200 truncate"
                    title={trip.title || trip.resort_id}
                  >
                    {trip.title || trip.resort_id}
                  </div>
                ))}
                {dayTrips.length > 2 && (
                  <div className="text-xs text-gray-500">+{dayTrips.length - 2}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
      <Card className="p-12 text-center">
        <p className="text-gray-600">還沒有任何行程</p>
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

  // 獲取狀態樣式
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      completed: { class: 'bg-green-100 text-green-800', text: '✅ 已完成' },
      confirmed: { class: 'bg-blue-100 text-blue-800', text: '✈️ 已確認' },
      planning: { class: 'bg-gray-100 text-gray-800', text: '📋 規劃中' },
    };
    return badges[status] || badges.planning;
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
      {Object.entries(groupedByResort).map(([resortId, resortTrips]) => {
        const resortName = getResortName(resortId);
        const tripCount = resortTrips.length;

        return (
          <div key={resortId} className="border rounded-lg overflow-hidden">
            {/* 雪場標題 */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🏔️ {resortName}
                <span className="text-sm font-normal text-gray-600">({tripCount} 趟行程)</span>
              </h3>
            </div>

            {/* 行程列表 */}
            <div className="divide-y">
              {resortTrips.map((trip) => {
                const statusBadge = getStatusBadge(trip.trip_status);

                return (
                  <div
                    key={trip.trip_id}
                    onClick={() => onTripClick(trip.trip_id)}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                          {trip.title && (
                            <span className="text-sm text-gray-600">{trip.title}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center text-gray-700">
                        📅 {new Date(trip.start_date).toLocaleDateString('zh-TW')} - {new Date(trip.end_date).toLocaleDateString('zh-TW')}
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{getTransportIcon(trip.flight_status)} 機票</span>
                        <span>{getAccommodationIcon(trip.accommodation_status)} 住宿</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        👥 {trip.current_buddies}/{trip.max_buddies} 人
                      </div>
                    </div>

                    {trip.notes && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        📝 {trip.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">行程完成率</h3>
        <div className="text-center">
          <div className="text-5xl font-bold text-green-600 mb-2">{completionRate}%</div>
          <p className="text-gray-600">{stats.completed_trips} / {stats.trip_count} 趟已完成</p>
        </div>
      </Card>

      {/* 雪場統計 */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">雪場統計</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">總雪場數</span>
            <span className="text-2xl font-bold text-gray-900">{stats.unique_resorts}</span>
          </div>
          <div className="text-sm text-gray-500 text-center pt-2">
            本季探索了 {stats.unique_resorts} 個不同雪場
          </div>
        </div>
      </Card>

      {/* 社交統計 */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">社交統計</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">滑雪夥伴</span>
            <span className="text-2xl font-bold text-purple-600">{stats.total_buddies}</span>
          </div>
          <div className="text-sm text-gray-500 text-center pt-2">
            與 {stats.total_buddies} 位夥伴一起滑雪
          </div>
        </div>
      </Card>
    </div>
  );
}
