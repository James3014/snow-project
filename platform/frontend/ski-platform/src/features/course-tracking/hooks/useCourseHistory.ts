/**
 * useCourseHistory - 雪道紀錄數據 hook
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { courseTrackingApi } from '../api/courseTrackingApi';
import { setVisits, addToast } from '@/store/slices/courseTrackingSlice';
import type { CourseVisit } from '../types';
import type { CourseRecordData } from '../components/EnhancedCourseRecordModal';
import { useDebounce } from '@/shared/hooks/useDebounce';

export function useCourseHistory() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const visits = useAppSelector((state) => state.courseTracking.visits);
  const [loading, setLoading] = useState(false);
  const [editingVisit, setEditingVisit] = useState<CourseVisit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterSnowCondition, setFilterSnowCondition] = useState('');
  const [filterWeather, setFilterWeather] = useState('');

  const loadVisits = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await courseTrackingApi.visits.list(userId);
      dispatch(setVisits(data));
    } catch {
      dispatch(addToast({ type: 'error', message: '載入紀錄失敗' }));
    } finally {
      setLoading(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (userId) loadVisits();
  }, [userId, loadVisits]);

  const handleEdit = useCallback((visit: CourseVisit) => {
    setEditingVisit(visit);
    setIsEditModalOpen(true);
  }, []);

  const handleEditSubmit = useCallback(async (data: CourseRecordData) => {
    if (!userId || !editingVisit) return;
    try {
      await courseTrackingApi.visits.update(userId, editingVisit.id, data);
      dispatch(addToast({ type: 'success', message: '✓ 紀錄已更新' }));
      setIsEditModalOpen(false);
      setEditingVisit(null);
      loadVisits();
    } catch {
      dispatch(addToast({ type: 'error', message: '更新失敗，請稍後再試' }));
    }
  }, [userId, editingVisit, dispatch, loadVisits]);

  const handleDelete = useCallback(async (visitId: string) => {
    if (!userId) return;
    if (!confirm('確定要刪除這筆紀錄嗎？\n\n⚠️ 此操作無法復原')) return;
    try {
      await courseTrackingApi.visits.delete(userId, visitId);
      dispatch(addToast({ type: 'success', message: '✓ 紀錄已刪除' }));
      loadVisits();
    } catch {
      dispatch(addToast({ type: 'error', message: '刪除失敗，請稍後再試' }));
    }
  }, [userId, dispatch, loadVisits]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingVisit(null);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterRating(null);
    setFilterSnowCondition('');
    setFilterWeather('');
  }, []);

  // Filtered visits
  const filteredVisits = useMemo(() => visits.filter(visit => {
    if (debouncedSearchQuery && 
        !visit.course_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) &&
        !visit.resort_id.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
      return false;
    }
    if (filterRating !== null && visit.rating !== filterRating) return false;
    if (filterSnowCondition && visit.snow_condition !== filterSnowCondition) return false;
    if (filterWeather && visit.weather !== filterWeather) return false;
    return true;
  }), [visits, debouncedSearchQuery, filterRating, filterSnowCondition, filterWeather]);

  // Grouped by date
  const groupedVisits = useMemo(() => {
    const grouped = filteredVisits.reduce((acc, visit) => {
      const date = new Date(visit.visited_date).toLocaleDateString('zh-TW');
      if (!acc[date]) acc[date] = [];
      acc[date].push(visit);
      return acc;
    }, {} as Record<string, CourseVisit[]>);
    return grouped;
  }, [filteredVisits]);

  const sortedDates = useMemo(() => 
    Object.keys(groupedVisits).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [groupedVisits]
  );

  // Stats
  const stats = useMemo(() => {
    const totalVisits = filteredVisits.length;
    const totalRatings = filteredVisits.filter(v => v.rating).length;
    const avgRating = totalRatings > 0
      ? (filteredVisits.reduce((sum, v) => sum + (v.rating || 0), 0) / totalRatings).toFixed(1)
      : '0';
    const uniqueResorts = new Set(visits.map(v => v.resort_id)).size;
    return { totalVisits, avgRating, uniqueResorts };
  }, [filteredVisits, visits]);

  // Course rankings
  const courseRankings = useMemo(() => {
    const courseStats = filteredVisits.reduce((acc, visit) => {
      const key = `${visit.resort_id}|${visit.course_name}`;
      if (!acc[key]) {
        acc[key] = { resort_id: visit.resort_id, course_name: visit.course_name, count: 0, totalRating: 0, ratings: [] as number[] };
      }
      acc[key].count += 1;
      if (visit.rating) {
        acc[key].totalRating += visit.rating;
        acc[key].ratings.push(visit.rating);
      }
      return acc;
    }, {} as Record<string, { resort_id: string; course_name: string; count: number; totalRating: number; ratings: number[] }>);

    return Object.values(courseStats)
      .filter(stat => stat.ratings.length > 0)
      .map(stat => ({ ...stat, avgRating: stat.totalRating / stat.ratings.length }))
      .sort((a, b) => b.avgRating - a.avgRating);
  }, [filteredVisits]);

  const hasActiveFilters = !!(searchQuery || filterRating !== null || filterSnowCondition || filterWeather);

  return {
    userId,
    loading,
    visits,
    filteredVisits,
    groupedVisits,
    sortedDates,
    stats,
    courseRankings,
    editingVisit,
    isEditModalOpen,
    searchQuery,
    filterRating,
    filterSnowCondition,
    filterWeather,
    hasActiveFilters,
    setSearchQuery,
    setFilterRating,
    setFilterSnowCondition,
    setFilterWeather,
    handleEdit,
    handleEditSubmit,
    handleDelete,
    closeEditModal,
    clearFilters,
  };
}
