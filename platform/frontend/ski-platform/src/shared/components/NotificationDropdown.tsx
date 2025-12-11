/**
 * 通知下拉選單組件
 * 顯示所有待處理的雪伴申請
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { useAppSelector } from '@/store/hooks';

interface BuddyRequest {
  buddy_id: string;
  trip_id: string;
  trip_title: string;
  resort_id: string;
  start_date: string;
  end_date: string;
  user_display_name: string;
  requested_at: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<BuddyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const userId = useAppSelector((state) => state.auth.user?.user_id);

  // 獲取待處理申請
  const fetchPendingRequests = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // 獲取用戶所有行程
      const trips = await tripPlanningApi.getTrips(userId);

      // 獲取每個行程的待處理申請
      const allRequests: BuddyRequest[] = [];
      for (const trip of trips) {
        const buddies = await tripPlanningApi.getTripBuddies(trip.trip_id);
        const pendingBuddies = buddies
          .filter(b => b.status === 'pending')
          .map(b => ({
            buddy_id: b.buddy_id,
            trip_id: trip.trip_id,
            trip_title: trip.title || '未命名行程',
            resort_id: trip.resort_id,
            start_date: trip.start_date,
            end_date: trip.end_date,
            user_display_name: b.user_display_name || '匿名用戶',
            requested_at: b.requested_at,
          }));
        allRequests.push(...pendingBuddies);
      }

      // 按時間排序（最新的在前）
      allRequests.sort((a, b) =>
        new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
      );

      setRequests(allRequests);
    } catch (error) {
      console.error('獲取申請失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 處理申請
  const handleRespond = async (buddyId: string, tripId: string, status: 'accepted' | 'declined') => {
    if (!userId) return;

    setResponding(buddyId);
    try {
      await tripPlanningApi.respondToBuddyRequest(tripId, buddyId, userId, { status });

      // 移除已處理的申請
      setRequests(prev => prev.filter(r => r.buddy_id !== buddyId));

      // 顯示提示
      alert(status === 'accepted' ? '✅ 已接受申請' : '❌ 已拒絕申請');
    } catch (error) {
      console.error('處理申請失敗:', error);
      alert('操作失敗，請稍後再試');
    } finally {
      setResponding(null);
    }
  };

  // 首次載入時獲取待處理申請數量
  useEffect(() => {
    fetchPendingRequests();

    // 每 30 秒自動更新一次
    const interval = setInterval(() => {
      fetchPendingRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, fetchPendingRequests]);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      fetchPendingRequests();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, fetchPendingRequests]);

  const pendingCount = requests.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-800 hover:text-primary-600 transition-colors"
        aria-label="通知"
      >
        <span className="text-xl">🔔</span>
        {pendingCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {pendingCount}
          </span>
        )}
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* 標題 */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              🔔 雪伴申請 {pendingCount > 0 && `(${pendingCount})`}
            </h3>
          </div>

          {/* 內容 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-700">載入中...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-700">暫無待處理的申請</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {requests.map((request) => (
                  <div key={request.buddy_id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    {/* 申請人資訊 */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          👤 {request.user_display_name}
                        </p>
                        <p className="text-xs text-gray-700 mt-1">
                          {new Date(request.requested_at).toLocaleDateString('zh-TW', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* 行程資訊 */}
                    <div
                      className="mb-2 cursor-pointer"
                      onClick={() => {
                        navigate(`/trip-planning/trips/${request.trip_id}`);
                        setIsOpen(false);
                      }}
                    >
                      <p className="text-xs text-gray-800 line-clamp-1">
                        📍 {request.trip_title}
                      </p>
                      <p className="text-xs text-gray-700">
                        📅 {new Date(request.start_date).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })} - {new Date(request.end_date).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                      </p>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleRespond(request.buddy_id, request.trip_id, 'accepted')}
                        disabled={responding === request.buddy_id}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {responding === request.buddy_id ? '處理中...' : '✅ 接受'}
                      </button>
                      <button
                        onClick={() => handleRespond(request.buddy_id, request.trip_id, 'declined')}
                        disabled={responding === request.buddy_id}
                        className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {responding === request.buddy_id ? '處理中...' : '❌ 拒絕'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部 - 查看所有 */}
          {pendingCount > 3 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  navigate('/trip-planning');
                  setIsOpen(false);
                }}
                className="w-full text-xs text-center text-primary-600 hover:text-primary-700 font-medium"
              >
                查看所有行程
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
