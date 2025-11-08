/**
 * Custom Hooks for Course Tracking
 * 課程追蹤自訂 Hooks
 */
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { courseTrackingApi } from '../api/courseTrackingApi';
import {
  setVisits,
  setRecommendations,
  setProgress,
  setRankings,
  setAchievements,
  setLeaderboard,
  setLoadingVisits,
  setLoadingRecommendations,
  setLoadingProgress,
  setLoadingRankings,
  setLoadingAchievements,
  setLoadingLeaderboard,
  addToast,
} from '@/store/slices/courseTrackingSlice';

/**
 * 取得使用者雪道訪問記錄
 */
export function useCourseVisits(resortId?: string) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const visits = useAppSelector((state) => state.courseTracking.visits);
  const loading = useAppSelector((state) => state.courseTracking.loading.visits);

  const fetchVisits = useCallback(async () => {
    if (!userId) return;
    dispatch(setLoadingVisits(true));
    try {
      const data = await courseTrackingApi.visits.list(userId, resortId);
      dispatch(setVisits(data));
    } catch {
      dispatch(addToast({ type: 'error', message: '載入訪問記錄失敗' }));
    } finally {
      dispatch(setLoadingVisits(false));
    }
  }, [userId, resortId, dispatch]);

  useEffect(() => {
    if (userId) {
      fetchVisits();
    }
  }, [userId, fetchVisits]);

  return { visits, loading, refetch: fetchVisits };
}

/**
 * 取得使用者推薦
 */
export function useRecommendations(resortId?: string) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const recommendations = useAppSelector((state) => state.courseTracking.recommendations);
  const loading = useAppSelector((state) => state.courseTracking.loading.recommendations);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;
    dispatch(setLoadingRecommendations(true));
    try {
      const data = await courseTrackingApi.recommendations.list(userId, resortId);
      dispatch(setRecommendations(data));
    } catch {
      dispatch(addToast({ type: 'error', message: '載入推薦失敗' }));
    } finally {
      dispatch(setLoadingRecommendations(false));
    }
  }, [userId, resortId, dispatch]);

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, fetchRecommendations]);

  return { recommendations, loading, refetch: fetchRecommendations };
}

/**
 * 取得雪場進度
 */
export function useResortProgress(resortId: string, totalCourses: number) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const progress = useAppSelector((state) => state.courseTracking.progress[resortId]);
  const loading = useAppSelector((state) => state.courseTracking.loading.progress);

  const fetchProgress = useCallback(async () => {
    if (!userId || !resortId) return;
    dispatch(setLoadingProgress(true));
    try {
      const data = await courseTrackingApi.progress.getResortProgress(userId, resortId, totalCourses);
      dispatch(setProgress({ resortId, progress: data }));
    } catch {
      dispatch(addToast({ type: 'error', message: '載入進度失敗' }));
    } finally {
      dispatch(setLoadingProgress(false));
    }
  }, [userId, resortId, totalCourses, dispatch]);

  useEffect(() => {
    if (userId && resortId) {
      fetchProgress();
    }
  }, [userId, resortId, fetchProgress]);

  return { progress, loading, refetch: fetchProgress };
}

/**
 * 取得雪道排名
 */
export function useCourseRankings(resortId: string) {
  const dispatch = useAppDispatch();
  const rankings = useAppSelector((state) => state.courseTracking.rankings[resortId] || []);
  const loading = useAppSelector((state) => state.courseTracking.loading.rankings);

  const fetchRankings = useCallback(async () => {
    if (!resortId) return;
    dispatch(setLoadingRankings(true));
    try {
      const data = await courseTrackingApi.rankings.getCourseRankings(resortId);
      dispatch(setRankings({ resortId, rankings: data }));
    } catch {
      dispatch(addToast({ type: 'error', message: '載入排名失敗' }));
    } finally {
      dispatch(setLoadingRankings(false));
    }
  }, [resortId, dispatch]);

  useEffect(() => {
    if (resortId) {
      fetchRankings();
    }
  }, [resortId, fetchRankings]);

  return { rankings, loading, refetch: fetchRankings };
}

/**
 * 取得使用者成就
 */
export function useAchievements() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const achievements = useAppSelector((state) => state.courseTracking.achievements);
  const loading = useAppSelector((state) => state.courseTracking.loading.achievements);

  const fetchAchievements = useCallback(async () => {
    if (!userId) return;
    dispatch(setLoadingAchievements(true));
    try {
      const data = await courseTrackingApi.achievements.getUserAchievements(userId);
      dispatch(setAchievements(data));
    } catch {
      dispatch(addToast({ type: 'error', message: '載入成就失敗' }));
    } finally {
      dispatch(setLoadingAchievements(false));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (userId) {
      fetchAchievements();
    }
  }, [userId, fetchAchievements]);

  return { achievements, loading, refetch: fetchAchievements };
}

/**
 * 取得排行榜
 */
export function useLeaderboard() {
  const dispatch = useAppDispatch();
  const leaderboard = useAppSelector((state) => state.courseTracking.leaderboard);
  const loading = useAppSelector((state) => state.courseTracking.loading.leaderboard);

  const fetchLeaderboard = useCallback(async () => {
    dispatch(setLoadingLeaderboard(true));
    try {
      const data = await courseTrackingApi.leaderboard.getLeaderboard();
      dispatch(setLeaderboard(data));
    } catch {
      dispatch(addToast({ type: 'error', message: '載入排行榜失敗' }));
    } finally {
      dispatch(setLoadingLeaderboard(false));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { leaderboard, loading, refetch: fetchLeaderboard };
}
