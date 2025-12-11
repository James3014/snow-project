/**
 * Trip Detail Page - Glacial Futurism Design
 * 行程詳情頁面
 */
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import TripEditModal from '../components/TripEditModal';
import { useTripDetail } from '../hooks/useTripDetail';

const STATUS_MAP: Record<string, { variant: 'ice' | 'accent' | 'pink'; text: string }> = {
  completed: { variant: 'ice', text: '✅ 已完成' },
  confirmed: { variant: 'accent', text: '✈️ 已確認' },
  planning: { variant: 'accent', text: '📋 規劃中' },
  cancelled: { variant: 'pink', text: '❌ 已取消' },
};

const BOOKING_STATUS: Record<string, string> = {
  not_planned: '未規劃', researching: '研究中', ready_to_book: '準備預訂', booked: '已預訂', confirmed: '已確認',
};

export default function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const {
    trip, resort, loading, error, buddies, loadingBuddies,
    showEditModal, showDeleteConfirm, isDeleting, respondingBuddyId,
    isOwner, resortName, userId,
    setShowEditModal, setShowDeleteConfirm,
    handleUpdateTrip, handleDeleteTrip, handleToggleVisibility, handleRespondToBuddy, calculateDays,
  } = useTripDetail(tripId);

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
          <Button variant="neon" onClick={() => navigate('/trips')} className="w-full">返回我的行程</Button>
        </div>
      </div>
    );
  }

  const statusBadge = STATUS_MAP[trip.trip_status] || { variant: 'accent' as const, text: trip.trip_status };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <button onClick={() => navigate(isOwner ? `/seasons/${trip.season_id}` : '/snowbuddy')} className="text-crystal-blue hover:text-ice-primary mb-6 flex items-center transition-colors animate-slide-up">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {isOwner ? '← 返回雪季' : '← 返回公佈欄'}
          </button>

          <div className="flex justify-between items-start animate-slide-up stagger-1">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4">{trip.title || `${resortName} 行程`}</h1>
              <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
            </div>
            {isOwner && (
              <div className="flex gap-3 flex-col md:flex-row animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Button variant="glass" onClick={handleToggleVisibility}>{trip.visibility === 'public' ? '🔒 設為私密' : '📢 發布'}</Button>
                <Button variant="neon" onClick={() => setShowEditModal(true)}>✏️ 編輯</Button>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="border-neon-pink text-neon-pink">🗑️ 刪除</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="glass" className="animate-slide-up stagger-2">
              <Card.Body className="space-y-4">
                <h2 className="text-xl font-bold text-gradient-glacier">基本資訊</h2>
                <div className="space-y-4">
                  <div><label className="text-sm font-medium text-ice-accent">雪場</label><p className="text-lg text-frost-white mt-1">🏔️ {resortName}</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-ice-accent">開始日期</label><p className="text-lg text-frost-white mt-1">📅 {new Date(trip.start_date).toLocaleDateString('zh-TW')}</p></div>
                    <div><label className="text-sm font-medium text-ice-accent">結束日期</label><p className="text-lg text-frost-white mt-1">📅 {new Date(trip.end_date).toLocaleDateString('zh-TW')}</p></div>
                  </div>
                  <div><label className="text-sm font-medium text-ice-accent">天數</label><p className="text-lg text-frost-white mt-1">⏱️ {calculateDays()} 天</p></div>
                </div>
              </Card.Body>
            </Card>

            <Card variant="glass" className="animate-slide-up stagger-3">
              <Card.Body className="space-y-4">
                <h2 className="text-xl font-bold text-gradient-glacier">行程規劃</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-ice-accent">✈️ 機票狀態</label><p className="text-lg text-frost-white mt-1">{BOOKING_STATUS[trip.flight_status] || trip.flight_status}</p></div>
                  <div><label className="text-sm font-medium text-ice-accent">🏨 住宿狀態</label><p className="text-lg text-frost-white mt-1">{BOOKING_STATUS[trip.accommodation_status] || trip.accommodation_status}</p></div>
                </div>
              </Card.Body>
            </Card>

            {trip.notes && (
              <Card variant="glass" className="animate-slide-up stagger-4">
                <Card.Body className="space-y-4">
                  <h2 className="text-xl font-bold text-gradient-glacier">備註</h2>
                  <p className="text-crystal-blue whitespace-pre-wrap">{trip.notes}</p>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card variant="glass" className="animate-slide-up stagger-3">
              <Card.Body className="space-y-4">
                <h2 className="text-lg font-bold text-gradient-glacier">👥 同行夥伴</h2>
                <div className="text-center">
                  <div className="text-3xl font-bold text-ice-primary">{trip.current_buddies}/{trip.max_buddies}</div>
                  <p className="text-sm text-crystal-blue mt-2">人</p>
                </div>
                {buddies.filter(b => b.status === 'accepted').length > 0 && (
                  <div className="mt-4 pt-4 border-t border-glacier">
                    <h3 className="text-sm font-semibold text-ice-primary mb-3">已加入：</h3>
                    <div className="space-y-2">
                      {buddies.filter(b => b.status === 'accepted').map(buddy => (
                        <div key={buddy.buddy_id} className="flex items-center gap-2">
                          {buddy.user_avatar_url ? (
                            <img src={buddy.user_avatar_url} alt={buddy.user_display_name || '用戶'} className="w-8 h-8 rounded-full object-cover border border-ice-primary/30" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-ice-primary/20 flex items-center justify-center text-crystal-blue text-sm font-medium border border-ice-primary/30">{(buddy.user_display_name || '?')[0]}</div>
                          )}
                          <span className="text-sm text-frost-white">{buddy.user_display_name || '匿名用戶'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {trip.user_id === userId && buddies.length > 0 && (
              <Card variant="glass" className="animate-slide-up stagger-4">
                <Card.Body className="space-y-4">
                  <h2 className="text-lg font-bold text-gradient-glacier">🔔 雪伴申請</h2>
                  {loadingBuddies ? (
                    <div className="text-center py-4"><div className="spinner-glacier" /></div>
                  ) : (
                    <div className="space-y-3">
                      {buddies.filter(b => b.status === 'pending').map(buddy => (
                        <div key={buddy.buddy_id} className="border border-glacier rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-frost-white">{buddy.user_display_name || '匿名用戶'}</p>
                              <p className="text-xs text-crystal-blue">{new Date(buddy.requested_at).toLocaleDateString('zh-TW')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="neon" size="sm" onClick={() => handleRespondToBuddy(buddy.buddy_id, 'accepted')} disabled={respondingBuddyId === buddy.buddy_id} className="flex-1">✅ 接受</Button>
                            <Button variant="glass" size="sm" onClick={() => handleRespondToBuddy(buddy.buddy_id, 'declined')} disabled={respondingBuddyId === buddy.buddy_id} className="flex-1">❌ 拒絕</Button>
                          </div>
                        </div>
                      ))}
                      {buddies.filter(b => b.status === 'pending').length === 0 && <p className="text-crystal-blue text-sm text-center py-2">暫無待處理的申請</p>}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            <Card variant="glass" className="animate-slide-up stagger-5">
              <Card.Body className="space-y-3">
                <h2 className="text-lg font-bold text-gradient-glacier">行程資訊</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-crystal-blue">建立時間</span><span className="text-frost-white">{new Date(trip.created_at).toLocaleDateString('zh-TW')}</span></div>
                  {trip.updated_at && <div className="flex justify-between"><span className="text-crystal-blue">更新時間</span><span className="text-frost-white">{new Date(trip.updated_at).toLocaleDateString('zh-TW')}</span></div>}
                </div>
              </Card.Body>
            </Card>

            {resort && (
              <Card variant="glass" className="animate-slide-up stagger-6">
                <Card.Body className="space-y-3">
                  <h2 className="text-lg font-bold text-gradient-glacier">雪場資訊</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-crystal-blue">國家</span><span className="text-frost-white">{resort.country_code}</span></div>
                    <div className="flex justify-between"><span className="text-crystal-blue">地區</span><span className="text-frost-white">{resort.region || '-'}</span></div>
                    {resort.snow_stats && (
                      <>
                        <div className="flex justify-between"><span className="text-crystal-blue">雪道數量</span><span className="text-frost-white">{resort.snow_stats.courses_total} 條</span></div>
                        <div className="flex justify-between"><span className="text-crystal-blue">垂直落差</span><span className="text-frost-white">{resort.snow_stats.vertical_drop}m</span></div>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showEditModal && trip && <TripEditModal trip={trip} onClose={() => setShowEditModal(false)} onUpdate={handleUpdateTrip} />}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gradient-glacier mb-4">確認刪除行程</h3>
            <p className="text-crystal-blue mb-6">確定要刪除「{trip?.title || '此行程'}」嗎？此操作無法復原。</p>
            <div className="flex gap-3 justify-end">
              <Button variant="glass" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>取消</Button>
              <Button variant="outline" onClick={handleDeleteTrip} disabled={isDeleting} className="border-neon-pink text-neon-pink">{isDeleting ? '刪除中...' : '確認刪除'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
