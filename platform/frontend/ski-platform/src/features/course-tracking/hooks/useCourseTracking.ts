/**
 * Custom Hooks for Course Tracking
 * 课程追踪自定义Hooks
 */
import { useEffect } from 'react';
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
 * 获取用户雪道访问记录
 */
export function useCourseVisits(resortId?: string) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const visits = useAppSelector((state) => state.courseTracking.visits);
  const loading = useAppSelector((state) => state.courseTracking.loading.visits);

  useEffect(() => {
    if (userId) {
      fetchVisits();
    }
  }, [userId, resortId]);

  const fetchVisits = async () => {
    if (!userId) return;
    dispatch(setLoadingVisits(true));
    try {
      const data = await courseTrackingApi.visits.list(userId, resortId);
      dispatch(setVisits(data));
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '加载访问记录失败' }));
    } finally {
      dispatch(setLoadingVisits(false));
    }
  };

  return { visits, loading, refetch: fetchVisits };
}

/**
 * 获取用户推荐
 */
export function useRecommendations(resortId?: string) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const recommendations = useAppSelector((state) => state.courseTracking.recommendations);
  const loading = useAppSelector((state) => state.courseTracking.loading.recommendations);

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, resortId]);

  const fetchRecommendations = async () => {
    if (!userId) return;
    dispatch(setLoadingRecommendations(true));
    try {
      const data = await courseTrackingApi.recommendations.list(userId, resortId);
      dispatch(setRecommendations(data));
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '加载推荐失败' }));
    } finally {
      dispatch(setLoadingRecommendations(false));
    }
  };

  return { recommendations, loading, refetch: fetchRecommendations };
}

/**
 * 获取雪场进度
 */
export function useResortProgress(resortId: string, totalCourses: number) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const progress = useAppSelector((state) => state.courseTracking.progress[resortId]);
  const loading = useAppSelector((state) => state.courseTracking.loading.progress);

  useEffect(() => {
    if (userId && resortId) {
      fetchProgress();
    }
  }, [userId, resortId, totalCourses]);

  const fetchProgress = async () => {
    if (!userId || !resortId) return;
    dispatch(setLoadingProgress(true));
    try {
      const data = await courseTrackingApi.progress.getResortProgress(userId, resortId, totalCourses);
      dispatch(setProgress({ resortId, progress: data }));
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '加载进度失败' }));
    } finally {
      dispatch(setLoadingProgress(false));
    }
  };

  return { progress, loading, refetch: fetchProgress };
}

/**
 * 获取雪道排名
 */
export function useCourseRankings(resortId: string) {
  const dispatch = useAppDispatch();
  const rankings = useAppSelector((state) => state.courseTracking.rankings[resortId] || []);
  const loading = useAppSelector((state) => state.courseTracking.loading.rankings);

  useEffect(() => {
    if (resortId) {
      fetchRankings();
    }
  }, [resortId]);

  const fetchRankings = async () => {
    if (!resortId) return;
    dispatch(setLoadingRankings(true));
    try {
      const data = await courseTrackingApi.rankings.getCourseRankings(resortId);
      dispatch(setRankings({ resortId, rankings: data }));
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '加载排名失败' }));
    } finally {
      dispatch(setLoadingRankings(false));
    }
  };

  return { rankings, loading, refetch: fetchRankings };
}

/**
 * 获取用户成就
 */
export function useAchievements() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const achievements = useAppSelector((state) => state.courseTracking.achievements);
  const loading = useAppSelector((state) => state.courseTracking.loading.achievements);

  useEffect(() => {
    if (userId) {
      fetchAchievements();
    }
  }, [userId]);

  const fetchAchievements = async () => {
    if (!userId) return;
    dispatch(setLoadingAchievements(true));
    try {
      const data = await courseTrackingApi.achievements.getUserAchievements(userId);
      dispatch(setAchievements(data));
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '加载成就失败' }));
    } finally {
      dispatch(setLoadingAchievements(false));
    }
  };

  return { achievements, loading, refetch: fetchAchievements };
}

/**
 * 获取排行榜
 */
export function useLeaderboard() {
  const dispatch = useAppDispatch();
  const leaderboard = useAppSelector((state) => state.courseTracking.leaderboard);
  const loading = useAppSelector((state) => state.courseTracking.loading.leaderboard);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    dispatch(setLoadingLeaderboard(true));
    try {
      const data = await courseTrackingApi.leaderboard.getLeaderboard();
      dispatch(setLeaderboard(data));
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: '加载排行榜失败' }));
    } finally {
      dispatch(setLoadingLeaderboard(false));
    }
  };

  return { leaderboard, loading, refetch: fetchLeaderboard };
}
