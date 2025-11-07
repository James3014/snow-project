/**
 * Course Tracking API
 * 雪道追踪 API 接口
 */
import { userCoreApi } from '@/shared/api/client';
import type {
  CourseVisit,
  CourseVisitCreate,
  CourseRecommendation,
  CourseRecommendationCreate,
  CourseRecommendationUpdate,
  CourseRanking,
  ResortProgress,
  UserAchievementWithDetails,
  AchievementSummary,
  AchievementDefinition,
  LeaderboardEntry,
  UserRank,
} from '../types';

/**
 * 雪道访问相关 API
 */
export const courseVisitApi = {
  // 记录雪道访问
  create: (userId: string, data: CourseVisitCreate) =>
    userCoreApi.post<CourseVisit>(`/users/${userId}/course-visits`, data),

  // 获取用户的雪道访问记录
  list: (userId: string, resortId?: string) => {
    const params = resortId ? `?resort_id=${resortId}` : '';
    return userCoreApi.get<CourseVisit[]>(`/users/${userId}/course-visits${params}`);
  },

  // 更新雪道访问记录
  update: (userId: string, visitId: string, data: Partial<CourseVisitCreate>) =>
    userCoreApi.patch<CourseVisit>(`/users/${userId}/course-visits/${visitId}`, data),

  // 删除雪道访问记录
  delete: (userId: string, visitId: string) =>
    userCoreApi.delete(`/users/${userId}/course-visits/${visitId}`),
};

/**
 * 进度查询 API
 */
export const progressApi = {
  // 获取用户在某个雪场的进度
  getResortProgress: (userId: string, resortId: string, totalCourses: number) =>
    userCoreApi.get<ResortProgress>(
      `/users/${userId}/resorts/${resortId}/progress?total_courses=${totalCourses}`
    ),
};

/**
 * 推荐管理 API
 */
export const recommendationApi = {
  // 创建推荐
  create: (userId: string, data: CourseRecommendationCreate) =>
    userCoreApi.post<CourseRecommendation>(`/users/${userId}/recommendations`, data),

  // 获取用户的推荐
  list: (userId: string, resortId?: string) => {
    const params = resortId ? `?resort_id=${resortId}` : '';
    return userCoreApi.get<CourseRecommendation[]>(`/users/${userId}/recommendations${params}`);
  },

  // 更新推荐
  update: (userId: string, recommendationId: string, data: CourseRecommendationUpdate) =>
    userCoreApi.patch<CourseRecommendation>(
      `/users/${userId}/recommendations/${recommendationId}`,
      data
    ),

  // 删除推荐
  delete: (userId: string, recommendationId: string) =>
    userCoreApi.delete(`/users/${userId}/recommendations/${recommendationId}`),
};

/**
 * 雪道排名 API
 */
export const rankingApi = {
  // 获取雪场的雪道排名
  getCourseRankings: (resortId: string, limit: number = 50) =>
    userCoreApi.get<CourseRanking[]>(`/users/resorts/${resortId}/courses/rankings?limit=${limit}`),
};

/**
 * 成就系统 API
 */
export const achievementApi = {
  // 获取用户的成就
  getUserAchievements: (userId: string) =>
    userCoreApi.get<UserAchievementWithDetails[]>(`/users/${userId}/achievements`),

  // 获取用户的成就摘要
  getAchievementSummary: (userId: string) =>
    userCoreApi.get<AchievementSummary>(`/users/${userId}/achievements/summary`),

  // 获取所有成就定义
  getDefinitions: (includeHidden: boolean = false, category?: string) => {
    const params = new URLSearchParams();
    if (includeHidden) params.append('include_hidden', 'true');
    if (category) params.append('category', category);
    const queryString = params.toString();
    return userCoreApi.get<AchievementDefinition[]>(
      `/users/achievements/definitions${queryString ? '?' + queryString : ''}`
    );
  },
};

/**
 * 排行榜 API
 */
export const leaderboardApi = {
  // 获取全球排行榜
  getLeaderboard: (skip: number = 0, limit: number = 100) =>
    userCoreApi.get<LeaderboardEntry[]>(
      `/users/achievements/leaderboard?skip=${skip}&limit=${limit}`
    ),

  // 获取用户排名
  getUserRank: (userId: string) =>
    userCoreApi.get<UserRank>(`/users/${userId}/leaderboard-rank`),
};

/**
 * 分享卡片 API（使用 Google Imagen 3 生成）
 */
export const shareCardApi = {
  // 生成完成雪道分享卡
  generateCourseCompletionCard: async (visitId: string, includeStats: boolean = true): Promise<Blob> => {
    const response = await userCoreApi.post<Blob>(
      `/api/share-cards/course-completion`,
      { visit_id: visitId, include_stats: includeStats },
      { responseType: 'blob' }
    );
    return response;
  },

  // 生成解鎖成就分享卡
  generateAchievementCard: async (achievementId: string): Promise<Blob> => {
    const response = await userCoreApi.post<Blob>(
      `/api/share-cards/achievement`,
      { achievement_id: achievementId },
      { responseType: 'blob' }
    );
    return response;
  },

  // 生成進度里程碑分享卡
  generateProgressMilestoneCard: async (userId: string, resortId: string): Promise<Blob> => {
    const response = await userCoreApi.post<Blob>(
      `/api/share-cards/progress-milestone`,
      { user_id: userId, resort_id: resortId },
      { responseType: 'blob' }
    );
    return response;
  },
};

/**
 * 综合导出
 */
export const courseTrackingApi = {
  visits: courseVisitApi,
  progress: progressApi,
  recommendations: recommendationApi,
  rankings: rankingApi,
  achievements: achievementApi,
  leaderboard: leaderboardApi,
  shareCards: shareCardApi,
};
