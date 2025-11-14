/**
 * Course Tracking Slice
 * 雪道追踪狀態管理
 */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  CourseVisit,
  CourseRecommendation,
  UserAchievementWithDetails,
  ResortProgress,
  CourseRanking,
  LeaderboardEntry,
} from '@/features/course-tracking/types';
import type { Toast } from '@/shared/types/common';

interface CourseTrackingState {
  visits: CourseVisit[];
  recommendations: CourseRecommendation[];
  achievements: UserAchievementWithDetails[];
  progress: Record<string, ResortProgress>; // key: resort_id
  rankings: Record<string, CourseRanking[]>; // key: resort_id
  leaderboard: LeaderboardEntry[];
  toasts: Toast[];
  loading: {
    visits: boolean;
    recommendations: boolean;
    achievements: boolean;
    progress: boolean;
    rankings: boolean;
    leaderboard: boolean;
  };
  error: string | null;
}

const initialState: CourseTrackingState = {
  visits: [],
  recommendations: [],
  achievements: [],
  progress: {},
  rankings: {},
  leaderboard: [],
  toasts: [],
  loading: {
    visits: false,
    recommendations: false,
    achievements: false,
    progress: false,
    rankings: false,
    leaderboard: false,
  },
  error: null,
};

const courseTrackingSlice = createSlice({
  name: 'courseTracking',
  initialState,
  reducers: {
    // Visits
    setVisits: (state, action: PayloadAction<CourseVisit[]>) => {
      state.visits = action.payload;
      state.loading.visits = false;
    },
    addVisit: (state, action: PayloadAction<CourseVisit>) => {
      state.visits.unshift(action.payload);
    },
    removeVisit: (state, action: PayloadAction<string>) => {
      state.visits = state.visits.filter((v) => v.id !== action.payload);
    },

    // Recommendations
    setRecommendations: (state, action: PayloadAction<CourseRecommendation[]>) => {
      state.recommendations = action.payload;
      state.loading.recommendations = false;
    },
    addRecommendation: (state, action: PayloadAction<CourseRecommendation>) => {
      state.recommendations.push(action.payload);
    },
    updateRecommendation: (state, action: PayloadAction<CourseRecommendation>) => {
      const index = state.recommendations.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.recommendations[index] = action.payload;
      }
    },
    removeRecommendation: (state, action: PayloadAction<string>) => {
      state.recommendations = state.recommendations.filter((r) => r.id !== action.payload);
    },

    // Achievements
    setAchievements: (state, action: PayloadAction<UserAchievementWithDetails[]>) => {
      state.achievements = action.payload;
      state.loading.achievements = false;
    },

    // Progress
    setProgress: (state, action: PayloadAction<{ resortId: string; progress: ResortProgress }>) => {
      state.progress[action.payload.resortId] = action.payload.progress;
      state.loading.progress = false;
    },

    // Rankings
    setRankings: (state, action: PayloadAction<{ resortId: string; rankings: CourseRanking[] }>) => {
      state.rankings[action.payload.resortId] = action.payload.rankings;
      state.loading.rankings = false;
    },

    // Leaderboard
    setLeaderboard: (state, action: PayloadAction<LeaderboardEntry[]>) => {
      state.leaderboard = action.payload;
      state.loading.leaderboard = false;
    },

    // Loading states
    setLoadingVisits: (state, action: PayloadAction<boolean>) => {
      state.loading.visits = action.payload;
    },
    setLoadingRecommendations: (state, action: PayloadAction<boolean>) => {
      state.loading.recommendations = action.payload;
    },
    setLoadingAchievements: (state, action: PayloadAction<boolean>) => {
      state.loading.achievements = action.payload;
    },
    setLoadingProgress: (state, action: PayloadAction<boolean>) => {
      state.loading.progress = action.payload;
    },
    setLoadingRankings: (state, action: PayloadAction<boolean>) => {
      state.loading.rankings = action.payload;
    },
    setLoadingLeaderboard: (state, action: PayloadAction<boolean>) => {
      state.loading.leaderboard = action.payload;
    },

    // Error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Toasts (通知)
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  setVisits,
  addVisit,
  removeVisit,
  setRecommendations,
  addRecommendation,
  updateRecommendation,
  removeRecommendation,
  setAchievements,
  setProgress,
  setRankings,
  setLeaderboard,
  setLoadingVisits,
  setLoadingRecommendations,
  setLoadingAchievements,
  setLoadingProgress,
  setLoadingRankings,
  setLoadingLeaderboard,
  setError,
  addToast,
  removeToast,
} = courseTrackingSlice.actions;

export default courseTrackingSlice.reducer;
