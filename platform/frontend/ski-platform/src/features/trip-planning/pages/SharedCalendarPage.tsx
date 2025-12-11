/**
 * 共享行事曆頁面 - 顯示自己和已加入的行程
 */
import { useState, useEffect } from 'react';
import { calendarApi } from '@/shared/api/calendarApi';
import type { SharedCalendar } from '@/shared/api/calendarApi';

export default function SharedCalendarPage() {
  const [calendar, setCalendar] = useState<SharedCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalendar();
  }, []);

  const loadCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calendarApi.getSharedCalendar();
      setCalendar(data);
    } catch (err) {
      setError('請先登入以查看共享行事曆');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400';
      case 'planning': return 'text-yellow-400';
      case 'completed': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '已確認';
      case 'planning': return '規劃中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-400">載入中...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400 mb-4">{error}</p>
        <a href="/login" className="text-cyan-400 hover:underline">
          前往登入
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">📅 我的行事曆</h1>

      {/* 行程列表 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">
          滑雪行程 ({calendar?.trips.length || 0})
        </h2>
        {calendar?.trips.length === 0 ? (
          <p className="text-gray-500">還沒有行程，去看看公開行程吧！</p>
        ) : (
          <div className="space-y-3">
            {calendar?.trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-white font-medium">{trip.title}</h3>
                  <p className="text-gray-400 text-sm">
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </p>
                </div>
                <span className={`text-sm ${getStatusColor(trip.status)}`}>
                  {getStatusText(trip.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 事件列表 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-4">
          提醒事項 ({calendar?.events.length || 0})
        </h2>
        {calendar?.events.length === 0 ? (
          <p className="text-gray-500">沒有提醒事項</p>
        ) : (
          <div className="space-y-2">
            {calendar?.events.map((event) => (
              <div
                key={event.id}
                className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50"
              >
                <p className="text-white text-sm">{event.title}</p>
                <p className="text-gray-500 text-xs">
                  {formatDate(event.start_date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
