/**
 * Trip Detail Page
 * 行程詳情頁面
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import Card from '@/shared/components/Card';
import TripEditModal from '../components/TripEditModal';
import type { Trip, TripUpdate } from '../types';
import type { Resort } from '@/shared/data/resorts';

export default function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [resort, setResort] = useState<Resort | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [buddies, setBuddies] = useState<any[]>([]);
  const [loadingBuddies, setLoadingBuddies] = useState(false);
  const [respondingBuddyId, setRespondingBuddyId] = useState<string | null>(null);

  const loadTripData = useCallback(async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      setError(null);

      const tripData = await tripPlanningApi.getTrip(tripId, userId);
      setTrip(tripData);

      // 載入雪場資料
      try {
        const resortsData = await resortApiService.getAllResorts();
        const resortData = resortsData.items.find(r => r.resort_id === tripData.resort_id);
        setResort(resortData || null);
      } catch (err) {
        console.error('載入雪場資料失敗:', err);
      }
    } catch (err) {
      console.error('載入行程資料失敗:', err);
      setError('載入行程資料失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [tripId, userId]);

  useEffect(() => {
    if (tripId) {
      loadTripData();
      loadTripBuddies();
    }
  }, [tripId, loadTripData]);

  const loadTripBuddies = async () => {
    if (!tripId) return;

    try {
      setLoadingBuddies(true);
      const buddiesData = await tripPlanningApi.getTripBuddies(tripId);
      setBuddies(buddiesData);
    } catch (err) {
      console.error('載入雪伴列表失敗:', err);
    } finally {
      setLoadingBuddies(false);
    }
  };

  const handleUpdateTrip = async (tripId: string, data: TripUpdate) => {
    if (!userId) return;

    await tripPlanningApi.updateTrip(tripId, userId, data);
    // 重新載入資料
    await loadTripData();
  };

  const handleDeleteTrip = async () => {
    if (!userId || !tripId) return;

    try {
      setIsDeleting(true);
      await tripPlanningApi.deleteTrip(tripId, userId);
      // 刪除成功，返回到雪季頁面或行程列表
      navigate(trip?.season_id ? `/seasons/${trip.season_id}` : '/trips');
    } catch (err) {
      console.error('刪除行程失敗:', err);
      alert('刪除行程失敗，請稍後再試');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!userId || !tripId || !trip) return;

    const newVisibility = trip.visibility === 'public' ? 'private' : 'public';
    const confirmMessage = newVisibility === 'public'
      ? '確定要將此行程發布到公佈欄嗎？'
      : '確定要將此行程設為私密嗎？';

    if (!confirm(confirmMessage)) return;

    try {
      await handleUpdateTrip(tripId, { visibility: newVisibility });
      alert(newVisibility === 'public' ? '已發布到公佈欄！' : '已設為私密');
    } catch (err) {
      console.error('更新可見性失敗:', err);
      alert('操作失敗，請稍後再試');
    }
  };

  const handleRespondToBuddy = async (buddyId: string, status: 'accepted' | 'declined') => {
    if (!userId || !tripId) return;

    try {
      setRespondingBuddyId(buddyId);
      await tripPlanningApi.respondToBuddyRequest(tripId, buddyId, userId, { status });
      alert(status === 'accepted' ? '已接受申請！' : '已拒絕申請');
      // 重新載入資料
      await loadTripData();
      await loadTripBuddies();
    } catch (err) {
      console.error('回應申請失敗:', err);
      alert('操作失敗，請稍後再試');
    } finally {
      setRespondingBuddyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <p className="text-red-600 mb-4">{error || '找不到行程'}</p>
          <button
            onClick={() => navigate('/trips')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回我的行程
          </button>
        </Card>
      </div>
    );
  }

  // 獲取狀態樣式
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      completed: { class: 'bg-green-100 text-green-800', text: '✅ 已完成' },
      confirmed: { class: 'bg-blue-100 text-blue-800', text: '✈️ 已確認' },
      planning: { class: 'bg-gray-100 text-gray-800', text: '📋 規劃中' },
      cancelled: { class: 'bg-red-100 text-red-800', text: '❌ 已取消' },
    };
    return badges[status] || badges.planning;
  };

  const getFlightStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      not_planned: '未規劃',
      researching: '研究中',
      ready_to_book: '準備預訂',
      booked: '已預訂',
      confirmed: '已確認',
    };
    return statuses[status] || status;
  };

  const getAccommodationStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      not_planned: '未規劃',
      researching: '研究中',
      ready_to_book: '準備預訂',
      booked: '已預訂',
      confirmed: '已確認',
    };
    return statuses[status] || status;
  };

  const calculateDays = () => {
    if (trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const statusBadge = getStatusBadge(trip.trip_status);
  const resortName = resort ? `${resort.names.zh} ${resort.names.en}` : trip.resort_id;
  const isOwner = trip.user_id === userId;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(isOwner ? `/seasons/${trip.season_id}` : '/snowbuddy')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isOwner ? '返回雪季' : '返回公佈欄'}
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {trip.title || `${resortName} 行程`}
            </h1>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.class}`}>
              {statusBadge.text}
            </span>
          </div>

          {/* 只有行程擁有者可以編輯 */}
          {isOwner && (
            <div className="flex gap-3">
              <button
                onClick={handleToggleVisibility}
                className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                  trip.visibility === 'public'
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {trip.visibility === 'public' ? '🔒 設為私密' : '📢 發布到公佈欄'}
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ✏️ 編輯
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                🗑️ 刪除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本資訊 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">基本資訊</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">雪場</label>
                <p className="text-lg text-gray-900 mt-1">🏔️ {resortName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">開始日期</label>
                  <p className="text-lg text-gray-900 mt-1">
                    📅 {new Date(trip.start_date).toLocaleDateString('zh-TW')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">結束日期</label>
                  <p className="text-lg text-gray-900 mt-1">
                    📅 {new Date(trip.end_date).toLocaleDateString('zh-TW')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">天數</label>
                <p className="text-lg text-gray-900 mt-1">⏱️ {calculateDays()} 天</p>
              </div>
            </div>
          </Card>

          {/* 行程規劃 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">行程規劃</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">✈️ 機票狀態</label>
                  <p className="text-lg text-gray-900 mt-1">
                    {getFlightStatusText(trip.flight_status)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">🏨 住宿狀態</label>
                  <p className="text-lg text-gray-900 mt-1">
                    {getAccommodationStatusText(trip.accommodation_status)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 備註 */}
          {trip.notes && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">備註</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{trip.notes}</p>
            </Card>
          )}
        </div>

        {/* Right Column - Side Info */}
        <div className="space-y-6">
          {/* 同行夥伴 */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">👥 同行夥伴</h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {trip.current_buddies}/{trip.max_buddies}
              </div>
              <p className="text-sm text-gray-600 mt-2">人</p>
            </div>

            {/* 已加入的雪伴列表 */}
            {buddies.filter(b => b.status === 'accepted').length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">已加入：</h3>
                <div className="space-y-2">
                  {buddies
                    .filter(b => b.status === 'accepted')
                    .map(buddy => (
                      <div key={buddy.buddy_id} className="flex items-center gap-2">
                        {buddy.user_avatar_url ? (
                          <img
                            src={buddy.user_avatar_url}
                            alt={buddy.user_display_name || '用戶'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                            {(buddy.user_display_name || '?')[0]}
                          </div>
                        )}
                        <span className="text-sm text-gray-900">
                          {buddy.user_display_name || '匿名用戶'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </Card>

          {/* 雪伴申請列表（只有行程主人可見） */}
          {trip.user_id === userId && buddies.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🔔 雪伴申請</h2>
              {loadingBuddies ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {buddies
                    .filter(buddy => buddy.status === 'pending')
                    .map(buddy => (
                      <div key={buddy.buddy_id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {buddy.user_display_name || '匿名用戶'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(buddy.requested_at).toLocaleDateString('zh-TW')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespondToBuddy(buddy.buddy_id, 'accepted')}
                            disabled={respondingBuddyId === buddy.buddy_id}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            ✅ 接受
                          </button>
                          <button
                            onClick={() => handleRespondToBuddy(buddy.buddy_id, 'declined')}
                            disabled={respondingBuddyId === buddy.buddy_id}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            ❌ 拒絕
                          </button>
                        </div>
                      </div>
                    ))}
                  {buddies.filter(buddy => buddy.status === 'pending').length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-2">暫無待處理的申請</p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* 可見性狀態 */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">可見性</h2>
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                trip.visibility === 'public'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {trip.visibility === 'public' ? '📢 公開' : '🔒 私密'}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {trip.visibility === 'public' ? '此行程已發布到公佈欄' : '此行程僅自己可見'}
              </p>
            </div>
          </Card>

          {/* 行程資訊 */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">行程資訊</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">建立時間</span>
                <span className="text-gray-900">
                  {new Date(trip.created_at).toLocaleDateString('zh-TW')}
                </span>
              </div>
              {trip.updated_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">更新時間</span>
                  <span className="text-gray-900">
                    {new Date(trip.updated_at).toLocaleDateString('zh-TW')}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* 雪場資訊 */}
          {resort && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">雪場資訊</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">國家</span>
                  <span className="text-gray-900">{resort.country_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">地區</span>
                  <span className="text-gray-900">{resort.region || '-'}</span>
                </div>
                {resort.snow_stats && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">雪道數量</span>
                      <span className="text-gray-900">{resort.snow_stats.courses_total} 條</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">垂直落差</span>
                      <span className="text-gray-900">{resort.snow_stats.vertical_drop}m</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Trip Edit Modal */}
      {showEditModal && trip && (
        <TripEditModal
          trip={trip}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdateTrip}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">確認刪除行程</h3>
            <p className="text-gray-700 mb-6">
              確定要刪除「{trip?.title || '此行程'}」嗎？此操作無法復原。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteTrip}
                disabled={isDeleting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    刪除中...
                  </>
                ) : (
                  '確認刪除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
