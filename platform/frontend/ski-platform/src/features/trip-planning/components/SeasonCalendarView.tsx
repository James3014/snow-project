/**
 * 日曆視圖組件
 */
import Card from '@/shared/components/Card';
import type { CalendarTrip } from '../types';
import type { Resort } from '@/shared/data/resorts';

interface CalendarViewProps {
  trips: CalendarTrip[];
  resorts: Resort[];
  currentMonth: Date;
  onMonthChange: (offset: number) => void;
  onTripClick: (tripId: string) => void;
}

export default function SeasonCalendarView({
  trips,
  resorts,
  currentMonth,
  onMonthChange,
  onTripClick,
}: CalendarViewProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const resortsMap = resorts.reduce((acc, resort) => {
    acc[resort.resort_id] = resort;
    return acc;
  }, {} as Record<string, Resort>);

  const getResortName = (resortId: string) => resortsMap[resortId]?.names.zh || resortId;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getTripsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return trips.filter(trip => trip.start_date <= dateStr && trip.end_date >= dateStr);
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
            if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;

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
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-ice-primary' : 'text-crystal-blue'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayTrips.slice(0, 2).map((trip) => (
                    <div
                      key={trip.trip_id}
                      onClick={() => onTripClick(trip.trip_id)}
                      className="text-xs bg-ice-primary/30 text-ice-accent px-1 py-0.5 rounded cursor-pointer hover:bg-ice-primary/50 truncate transition-colors"
                      title={trip.title || getResortName(trip.resort_id)}
                    >
                      {trip.title || getResortName(trip.resort_id)}
                    </div>
                  ))}
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
