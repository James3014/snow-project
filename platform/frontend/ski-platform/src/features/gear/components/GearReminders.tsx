/**
 * Gear Reminders Component - 裝備提醒管理
 */
import { useState, useEffect } from 'react';
import { gearApi } from '@/shared/api/gearApi';
import type { GearReminder } from '../types';

interface GearRemindersProps {
  userId: string;
}

export default function GearReminders({ userId }: GearRemindersProps) {
  const [reminders, setReminders] = useState<GearReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReminders();
  }, [userId]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gearApi.getMyReminders();
      setReminders(data.data || data); // 處理 AxiosResponse
    } catch (err) {
      console.error('載入提醒失敗:', err);
      setError('載入提醒失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReminder = async (reminderId: string) => {
    try {
      await gearApi.cancelReminder(reminderId);
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (err) {
      console.error('取消提醒失敗:', err);
      alert('取消提醒失敗，請稍後重試');
    }
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'inspection': return '🔍';
      case 'maintenance': return '🛠️';
      case 'general': return '⏰';
      default: return '⏰';
    }
  };

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case 'inspection': return '檢查提醒';
      case 'maintenance': return '維護提醒';
      case 'general': return '一般提醒';
      default: return '提醒';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner-glacier mb-4"></div>
        <p className="text-crystal-blue">載入提醒中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-frost-white mb-2">載入失敗</h3>
        <p className="text-crystal-blue mb-6">{error}</p>
        <button onClick={loadReminders} className="btn-neon">
          重新載入
        </button>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-6">📅</div>
        <h3 className="text-2xl font-bold text-frost-white mb-4">沒有提醒</h3>
        <p className="text-crystal-blue">目前沒有裝備提醒事項</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder, index) => (
        <div
          key={reminder.id}
          className="glass-card p-6 animate-slide-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="text-3xl">{getReminderIcon(reminder.reminder_type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gradient-glacier">
                    {getReminderTypeLabel(reminder.reminder_type)}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    reminder.status === 'pending' 
                      ? 'bg-ice-accent/20 text-ice-accent' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {reminder.status === 'pending' ? '待處理' : reminder.status === 'sent' ? '已發送' : '已取消'}
                  </span>
                </div>
                
                <p className="text-sm text-crystal-blue mb-2">
                  📅 {formatDate(reminder.scheduled_at)}
                </p>
                
                {reminder.message && (
                  <p className="text-sm text-frost-white bg-ice-primary/10 rounded-lg p-3">
                    {reminder.message}
                  </p>
                )}
              </div>
            </div>
            
            {reminder.status === 'pending' && (
              <button
                onClick={() => handleCancelReminder(reminder.id)}
                className="px-3 py-2 text-sm glass-card text-neon-pink hover:text-red-400 transition-colors font-medium"
              >
                取消提醒
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
