/**
 * useTripDetail - 行程詳情數據 hook
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import type { Trip, TripUpdate, BuddyInfo } from '../types';
import type { Resort } from '@/shared/data/resorts';

export function useTripDetail(tripId: string | undefined) {
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

  useEffect(() => {
    if (tripId) {
      loadTripData();
      loadTripBuddies();
    }
  }, [tripId, loadTripData, loadTripBuddies]);

  const handleUpdateTrip = useCallback(async (id: string, data: TripUpdate) => {
    if (!userId) return;
    await tripPlanningApi.updateTrip(id, userId, data);
    await loadTripData();
  }, [userId, loadTripData]);

  const handleDeleteTrip = useCallback(async () => {
    if (!userId || !tripId) return;
    try {
      setIsDeleting(true);
      await tripPlanningApi.deleteTrip(tripId, userId);
      navigate(trip?.season_id ? `/seasons/${trip.season_id}` : '/trips');
    } catch (err) {
      console.error('刪除行程失敗:', err);
      alert('刪除行程失敗，請稍後再試');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [userId, tripId, trip?.season_id, navigate]);

  const handleToggleVisibility = useCallback(async () => {
    if (!userId || !tripId || !trip) return;
    const newVisibility = trip.visibility === 'public' ? 'private' : 'public';
    const confirmMessage = newVisibility === 'public' ? '確定要將此行程發布到公佈欄嗎？' : '確定要將此行程設為私密嗎？';
    if (!confirm(confirmMessage)) return;
    try {
      await handleUpdateTrip(tripId, { visibility: newVisibility });
      alert(newVisibility === 'public' ? '已發布到公佈欄！' : '已設為私密');
    } catch {
      alert('操作失敗，請稍後再試');
    }
  }, [userId, tripId, trip, handleUpdateTrip]);

  const handleRespondToBuddy = useCallback(async (buddyId: string, status: 'accepted' | 'declined') => {
    if (!userId || !tripId) return;
    try {
      setRespondingBuddyId(buddyId);
      await tripPlanningApi.respondToBuddyRequest(tripId, buddyId, userId, { status });
      alert(status === 'accepted' ? '已接受申請！' : '已拒絕申請');
      await loadTripData();
      await loadTripBuddies();
    } catch {
      alert('操作失敗，請稍後再試');
    } finally {
      setRespondingBuddyId(null);
    }
  }, [userId, tripId, loadTripData, loadTripBuddies]);

  const isOwner = trip?.user_id === userId;
  const resortName = resort ? `${resort.names.zh} ${resort.names.en}` : trip?.resort_id || '';

  const calculateDays = useCallback(() => {
    if (trip?.start_date && trip?.end_date) {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  }, [trip?.start_date, trip?.end_date]);

  return {
    trip,
    resort,
    loading,
    error,
    buddies,
    loadingBuddies,
    showEditModal,
    showDeleteConfirm,
    isDeleting,
    respondingBuddyId,
    isOwner,
    resortName,
    userId,
    setShowEditModal,
    setShowDeleteConfirm,
    handleUpdateTrip,
    handleDeleteTrip,
    handleToggleVisibility,
    handleRespondToBuddy,
    calculateDays,
  };
}
