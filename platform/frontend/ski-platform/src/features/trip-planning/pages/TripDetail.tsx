/**
 * Trip Detail Page - Glacial Futurism Design
 * 行程詳情頁面 - 冰川未來主義設計
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import TripEditModal from '../components/TripEditModal';
import type { Trip, TripUpdate, BuddyInfo } from '../types';
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
  const [buddies, setBuddies] = useState<BuddyInfo[]>([]);
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

  // 函數定義前置 - 遵循依賴順序
  const loadTripBuddies = useCallback(async () => {
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
  }, [tripId]);

  // 效果執行 - 依賴明確
  useEffect(() => {
    if (tripId) {
      loadTripData();
      loadTripBuddies();
    }
  }, [tripId, loadTripData, loadTripBuddies]);

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
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入行程中...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center px-4">
        <div className="glass-card p-12 text-center max-w-md w-full">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gradient-glacier mb-4">載入失敗</h2>
          <p className="text-crystal-blue mb-8">{error || '找不到行程'}</p>
          <Button variant="neon" onClick={() => navigate('/trips')} className="w-full">
            返回我的行程
          </Button>
        </div>
      </div>
    );
  }

  // 獲取狀態樣式
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: 'ice' | 'accent' | 'pink' }> = {
      completed: { variant: 'ice' },
      confirmed: { variant: 'accent' },
      planning: { variant: 'accent' },
      cancelled: { variant: 'pink' },
    };
    const texts: Record<string, string> = {
      completed: '✅ 已完成',
      confirmed: '✈️ 已確認',
      planning: '📋 規劃中',
      cancelled: '❌ 已取消',
    };
    return { variant: badges[status]?.variant || 'accent', text: texts[status] || status };
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
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <button
            onClick={() => navigate(isOwner ? `/seasons/${trip.season_id}` : '/snowbuddy')}
            className="text-crystal-blue hover:text-ice-primary mb-6 flex items-center transition-colors animate-slide-up"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {isOwner ? '← 返回雪季' : '← 返回公佈欄'}
          </button>

          <div className="flex justify-between items-start animate-slide-up stagger-1">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4">
                {trip.title || `${resortName} 行程`}
              </h1>
              <Badge variant={statusBadge.variant}>
                {statusBadge.text}
              </Badge>
            </div>

            {/* 只有行程擁有者可以編輯 */}
            {isOwner && (
              <div className="flex gap-3 flex-col md:flex-row animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Button variant="glass" onClick={handleToggleVisibility}>
                  {trip.visibility === 'public' ? '🔒 設為私密' : '📢 發布'}
                </Button>
                <Button variant="neon" onClick={() => setShowEditModal(true)}>
                  ✏️ 編輯
                </Button>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="border-neon-pink text-neon-pink">
                  🗑️ 刪除
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本資訊 */}
            <Card variant="glass" className="animate-slide-up stagger-2">
              <Card.Body className="space-y-4">
                <h2 className="text-xl font-bold text-gradient-glacier">基本資訊</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-ice-accent">雪場</label>
                    <p className="text-lg text-frost-white mt-1">🏔️ {resortName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-ice-accent">開始日期</label>
                      <p className="text-lg text-frost-white mt-1">
                        📅 {new Date(trip.start_date).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-ice-accent">結束日期</label>
                      <p className="text-lg text-frost-white mt-1">
                        📅 {new Date(trip.end_date).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ice-accent">天數</label>
                    <p className="text-lg text-frost-white mt-1">⏱️ {calculateDays()} 天</p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* 行程規劃 */}
            <Card variant="glass" className="animate-slide-up stagger-3">
              <Card.Body className="space-y-4">
                <h2 className="text-xl font-bold text-gradient-glacier">行程規劃</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-ice-accent">✈️ 機票狀態</label>
                      <p className="text-lg text-frost-white mt-1">
                        {getFlightStatusText(trip.flight_status)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-ice-accent">🏨 住宿狀態</label>
                      <p className="text-lg text-frost-white mt-1">
                        {getAccommodationStatusText(trip.accommodation_status)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* 備註 */}
            {trip.notes && (
              <Card variant="glass" className="animate-slide-up stagger-4">
                <Card.Body className="space-y-4">
                  <h2 className="text-xl font-bold text-gradient-glacier">備註</h2>
                  <p className="text-crystal-blue whitespace-pre-wrap">{trip.notes}</p>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Right Column - Side Info */}
          <div className="space-y-6">
            {/* 同行夥伴 */}
            <Card variant="glass" className="animate-slide-up stagger-3">
              <Card.Body className="space-y-4">
                <h2 className="text-lg font-bold text-gradient-glacier">👥 同行夥伴</h2>
                <div className="text-center">
                  <div className="text-3xl font-bold text-ice-primary">
                    {trip.current_buddies}/{trip.max_buddies}
                  </div>
                  <p className="text-sm text-crystal-blue mt-2">人</p>
                </div>

                {/* 已加入的雪伴列表 */}
                {buddies.filter(b => b.status === 'accepted').length > 0 && (
                  <div className="mt-4 pt-4 border-t border-glacier">
                    <h3 className="text-sm font-semibold text-ice-primary mb-3">已加入：</h3>
                    <div className="space-y-2">
                      {buddies
                        .filter(b => b.status === 'accepted')
                        .map(buddy => (
                          <div key={buddy.buddy_id} className="flex items-center gap-2">
                            {buddy.user_avatar_url ? (
                              <img
                                src={buddy.user_avatar_url}
                                alt={buddy.user_display_name || '用戶'}
                                className="w-8 h-8 rounded-full object-cover border border-ice-primary/30"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-ice-primary/20 flex items-center justify-center text-crystal-blue text-sm font-medium border border-ice-primary/30">
                                {(buddy.user_display_name || '?')[0]}
                              </div>
                            )}
                            <span className="text-sm text-frost-white">
                              {buddy.user_display_name || '匿名用戶'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* 雪伴申請列表（只有行程主人可見） */}
            {trip.user_id === userId && buddies.length > 0 && (
              <Card variant="glass" className="animate-slide-up stagger-4">
                <Card.Body className="space-y-4">
                  <h2 className="text-lg font-bold text-gradient-glacier">🔔 雪伴申請</h2>
                  {loadingBuddies ? (
                    <div className="text-center py-4">
                      <div className="spinner-glacier" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {buddies
                        .filter(buddy => buddy.status === 'pending')
                        .map(buddy => (
                          <div key={buddy.buddy_id} className="border border-glacier rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-medium text-frost-white">
                                  {buddy.user_display_name || '匿名用戶'}
                                </p>
                                <p className="text-xs text-crystal-blue">
                                  {new Date(buddy.requested_at).toLocaleDateString('zh-TW')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="neon"
                                size="sm"
                                onClick={() => handleRespondToBuddy(buddy.buddy_id, 'accepted')}
                                disabled={respondingBuddyId === buddy.buddy_id}
                                className="flex-1"
                              >
                                ✅ 接受
                              </Button>
                              <Button
                                variant="glass"
                                size="sm"
                                onClick={() => handleRespondToBuddy(buddy.buddy_id, 'declined')}
                                disabled={respondingBuddyId === buddy.buddy_id}
                                className="flex-1"
                              >
                                ❌ 拒絕
                              </Button>
                            </div>
                          </div>
                        ))}
                      {buddies.filter(buddy => buddy.status === 'pending').length === 0 && (
                        <p className="text-crystal-blue text-sm text-center py-2">暫無待處理的申請</p>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* 行程資訊 */}
            <Card variant="glass" className="animate-slide-up stagger-5">
              <Card.Body className="space-y-3">
                <h2 className="text-lg font-bold text-gradient-glacier">行程資訊</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-crystal-blue">建立時間</span>
                    <span className="text-frost-white">
                      {new Date(trip.created_at).toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                  {trip.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-crystal-blue">更新時間</span>
                      <span className="text-frost-white">
                        {new Date(trip.updated_at).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* 雪場資訊 */}
            {resort && (
              <Card variant="glass" className="animate-slide-up stagger-6">
                <Card.Body className="space-y-3">
                  <h2 className="text-lg font-bold text-gradient-glacier">雪場資訊</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-crystal-blue">國家</span>
                      <span className="text-frost-white">{resort.country_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-crystal-blue">地區</span>
                      <span className="text-frost-white">{resort.region || '-'}</span>
                    </div>
                    {resort.snow_stats && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-crystal-blue">雪道數量</span>
                          <span className="text-frost-white">{resort.snow_stats.courses_total} 條</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-crystal-blue">垂直落差</span>
                          <span className="text-frost-white">{resort.snow_stats.vertical_drop}m</span>
                        </div>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gradient-glacier mb-4">確認刪除行程</h3>
            <p className="text-crystal-blue mb-6">
              確定要刪除「{trip?.title || '此行程'}」嗎？此操作無法復原。
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="glass"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteTrip}
                disabled={isDeleting}
                className="border-neon-pink text-neon-pink"
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
