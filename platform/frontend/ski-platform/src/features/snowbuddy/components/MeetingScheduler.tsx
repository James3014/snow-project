/**
 * Meeting Scheduler Component - 約定時間安排
 */
import { useState } from 'react';
import { calendarApi } from '@/shared/api/calendarApi';

interface MeetingSchedulerProps {
  matchId: string;
  buddyId: string;
  buddyName: string;
  onScheduled: () => void;
  onCancel: () => void;
}

export default function MeetingScheduler({
  matchId,
  buddyId,
  buddyName,
  onScheduled,
  onCancel
}: MeetingSchedulerProps) {
  const [meetingData, setMeetingData] = useState({
    date: '',
    time: '',
    location: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingData.date || !meetingData.time) {
      alert('請選擇日期和時間');
      return;
    }

    try {
      setLoading(true);
      
      // 組合日期時間
      const meetingDateTime = new Date(`${meetingData.date}T${meetingData.time}`);
      const endDateTime = new Date(meetingDateTime.getTime() + 2 * 60 * 60 * 1000); // 2小時後

      // 創建行事曆事件
      await calendarApi.createEvent({
        user_id: buddyId, // 這裡需要當前用戶ID，實際應該從context獲取
        type: 'MATCHING',
        title: `雪伴約定 - ${buddyName}`,
        start_date: meetingDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        all_day: false,
        timezone: 'Asia/Taipei',
        source_app: 'snowbuddy',
        source_id: matchId,
        description: `地點: ${meetingData.location}\n備註: ${meetingData.notes}`,
        matching_id: matchId
      });

      onScheduled();
    } catch (err) {
      console.error('安排約定失敗:', err);
      alert('安排約定失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-deep-space/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="glass-card p-6 md:p-8 w-full max-w-md animate-slide-up">
        <h2 className="text-2xl font-bold text-gradient-glacier mb-6">
          安排約定時間
        </h2>
        
        <div className="mb-4 p-4 bg-ice-primary/10 rounded-lg">
          <p className="text-sm text-crystal-blue">
            與 <span className="text-ice-accent font-medium">{buddyName}</span> 安排會面時間
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-crystal-blue mb-2">
              日期 *
            </label>
            <input
              type="date"
              value={meetingData.date}
              onChange={(e) => setMeetingData(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="input-glacier"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-crystal-blue mb-2">
              時間 *
            </label>
            <input
              type="time"
              value={meetingData.time}
              onChange={(e) => setMeetingData(prev => ({ ...prev, time: e.target.value }))}
              className="input-glacier"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-crystal-blue mb-2">
              地點
            </label>
            <input
              type="text"
              value={meetingData.location}
              onChange={(e) => setMeetingData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="例如：苗場雪場入口"
              className="input-glacier"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-crystal-blue mb-2">
              備註
            </label>
            <textarea
              value={meetingData.notes}
              onChange={(e) => setMeetingData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="其他注意事項..."
              rows={3}
              className="input-glacier resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 glass-card px-4 py-3 text-crystal-blue hover:text-ice-primary transition-colors font-medium disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-neon disabled:opacity-50"
            >
              {loading ? '安排中...' : '確認約定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
