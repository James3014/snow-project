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
    }
  }, [tripId, loadTripData]);

  const handleUpdateTrip = async (tripId: string, data: TripUpdate) => {
    if (!userId) return;

    await tripPlanningApi.updateTrip(tripId, userId, data);
    // 重新載入資料
    await loadTripData();
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
            onClick={() => navigate('/seasons')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回雪季列表
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/seasons/${trip.season_id}`)}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回雪季
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

          <button
            onClick={() => setShowEditModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ✏️ 編輯
          </button>
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
    </div>
  );
}
