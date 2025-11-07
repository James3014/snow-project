/**
 * Season Detail Page with Calendar View
 * 雪季詳情頁面（含日曆視圖）
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import Card from '@/shared/components/Card';
import type { Season, SeasonStats, CalendarTrip, Trip } from '../types';

export default function SeasonDetail() {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const [season, setSeason] = useState<Season | null>(null);
  const [stats, setStats] = useState<SeasonStats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [calendarTrips, setCalendarTrips] = useState<CalendarTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'stats'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const userId = localStorage.getItem('user_id') || 'test-user-id';

  useEffect(() => {
    if (seasonId) {
      loadSeasonData();
    }
  }, [seasonId]);

  useEffect(() => {
    if (activeTab === 'calendar' && seasonId) {
      loadCalendarData();
    }
  }, [activeTab, currentMonth, seasonId]);

  const loadSeasonData = async () => {
    if (!seasonId) return;

    try {
      setLoading(true);
      const [seasonData, statsData, tripsData] = await Promise.all([
        tripPlanningApi.getSeason(seasonId, userId),
        tripPlanningApi.getSeasonStats(seasonId, userId),
        tripPlanningApi.getTrips(userId, { season_id: seasonId }),
      ]);

      setSeason(seasonData);
      setStats(statsData);
      setTrips(tripsData);
    } catch (err) {
      console.error('載入雪季資料失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    if (!seasonId) return;

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const data = await tripPlanningApi.getCalendarTrips(userId, year, month);
      setCalendarTrips(data);
    } catch (err) {
      console.error('載入日曆資料失敗:', err);
    }
  };

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
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
            onClick={() => navigate(`/trips/create?season_id=${seasonId}`)}
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
            <div className="text-sm text-gray-600 mb-1">總行程數</div>
            <div className="text-2xl font-bold text-gray-900">{stats.trip_count}</div>
            {stats.goal_progress.trips.goal && (
              <div className="text-xs text-gray-500 mt-1">
                目標: {stats.goal_progress.trips.goal}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">已完成</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed_trips}</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">雪場數</div>
            <div className="text-2xl font-bold text-gray-900">{stats.unique_resorts}</div>
            {stats.goal_progress.resorts.goal && (
              <div className="text-xs text-gray-500 mt-1">
                目標: {stats.goal_progress.resorts.goal}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">雪伴總數</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total_buddies}</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'calendar', label: '日曆視圖', icon: '📅' },
            { id: 'list', label: '列表視圖', icon: '📋' },
            { id: 'stats', label: '統計分析', icon: '📊' },
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
      {activeTab === 'calendar' && (
        <CalendarView
          trips={calendarTrips}
          currentMonth={currentMonth}
          onMonthChange={changeMonth}
          onTripClick={(tripId) => navigate(`/trips/${tripId}`)}
        />
      )}

      {activeTab === 'list' && (
        <TripListView
          trips={trips}
          onTripClick={(tripId) => navigate(`/trips/${tripId}`)}
        />
      )}

      {activeTab === 'stats' && stats && (
        <StatsView season={season} stats={stats} />
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

// 列表視圖組件
function TripListView({
  trips,
  onTripClick,
}: {
  trips: Trip[];
  onTripClick: (tripId: string) => void;
}) {
  if (trips.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600">還沒有任何行程</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <Card
          key={trip.trip_id}
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onTripClick(trip.trip_id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {trip.title || trip.resort_id}
              </h3>
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <span>
                  📅 {new Date(trip.start_date).toLocaleDateString('zh-TW')} - {new Date(trip.end_date).toLocaleDateString('zh-TW')}
                </span>
                <span>
                  👥 {trip.current_buddies}/{trip.max_buddies} 雪伴
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  trip.trip_status === 'completed' ? 'bg-green-100 text-green-800' :
                  trip.trip_status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {trip.trip_status === 'completed' ? '已完成' :
                   trip.trip_status === 'confirmed' ? '已確認' : '規劃中'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// 統計視圖組件
function StatsView({ season, stats }: { season: Season; stats: SeasonStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 目標進度 */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">目標進度</h3>
        <div className="space-y-4">
          {stats.goal_progress.trips.goal && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>行程數</span>
                <span>{stats.goal_progress.trips.actual} / {stats.goal_progress.trips.goal}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (stats.goal_progress.trips.actual / stats.goal_progress.trips.goal) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {stats.goal_progress.resorts.goal && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>雪場數</span>
                <span>{stats.goal_progress.resorts.actual} / {stats.goal_progress.resorts.goal}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (stats.goal_progress.resorts.actual / stats.goal_progress.resorts.goal) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {stats.goal_progress.courses.goal && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>雪道數</span>
                <span>{stats.goal_progress.courses.actual} / {stats.goal_progress.courses.goal}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (stats.goal_progress.courses.actual / stats.goal_progress.courses.goal) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 完成率 */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">完成率</h3>
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {stats.trip_count > 0 ? Math.round((stats.completed_trips / stats.trip_count) * 100) : 0}%
          </div>
          <p className="text-gray-600">
            {stats.completed_trips} / {stats.trip_count} 行程已完成
          </p>
        </div>
      </Card>
    </div>
  );
}
