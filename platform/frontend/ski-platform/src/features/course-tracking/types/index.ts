/**
 * Course Tracking - TypeScript Type Definitions
 * 雪道追踪系统的类型定义
 */

// ==================== 基础类型 ====================

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type RecommendationStatus = 'pending_review' | 'approved' | 'rejected';

export type AchievementCategory = 'basic' | 'advanced' | 'expert' | 'special';

// ==================== 雪道相关 ====================

export interface Course {
  name: string;
  level: DifficultyLevel;
  tags?: string[];
  length?: number;
  elevation_diff?: number;
  avg_slope?: number;
  max_slope?: number;
  description?: string;
  notes?: string;
}

export interface CourseVisit {
  id: string;
  user_id: string;
  resort_id: string;
  course_name: string;
  visited_date: string; // ISO date string
  notes?: string;
  // Enhanced experience fields
  snow_condition?: string;
  weather?: string;
  difficulty_feeling?: string;
  rating?: number; // 1-5 stars
  mood_tags?: string[];
  created_at: string;
}

export interface CourseVisitCreate {
  resort_id: string;
  course_name: string;
  visited_date?: string;
  notes?: string | null;
  // Enhanced experience fields
  snow_condition?: string | null;
  weather?: string | null;
  difficulty_feeling?: string | null;
  rating?: number | null; // 1-5 stars
  mood_tags?: string[] | null;
}

// ==================== 推荐相关 ====================

export interface CourseRecommendation {
  id: string;
  user_id: string;
  resort_id: string;
  course_name: string;
  rank: number; // 1, 2, or 3
  reason?: string;
  status: RecommendationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseRecommendationCreate {
  resort_id: string;
  course_name: string;
  rank: number;
  reason?: string;
}

export interface CourseRecommendationUpdate {
  course_name?: string;
  rank?: number;
  reason?: string;
}

// ==================== 排名相关 ====================

export interface CourseRanking {
  rank?: number;
  course_name: string;
  visit_count: number;
  recommendation_count: number;
  popularity_score: number;
}

// ==================== 进度相关 ====================

export interface ResortProgress {
  resort_id: string;
  completed_courses: string[];
  total_courses: number;
  completion_percentage: number;
  recommendations: CourseRecommendation[];
}

// ==================== 成就相关 ====================

export interface AchievementDefinition {
  achievement_type: string;
  name_zh: string;
  name_en: string;
  description_zh?: string;
  description_en?: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requirements: Record<string, any>;
  is_hidden: boolean;
  display_order: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  achievement_data?: Record<string, any>;
  points: number;
  earned_at: string;
}

export interface UserAchievementWithDetails extends UserAchievement {
  name_zh: string;
  name_en: string;
  description?: string;
  icon: string;
  category: string;
}

export interface AchievementSummary {
  total_points: number;
  achievement_count: number;
  total_available: number;
  completion_percentage: number;
  category_breakdown: Record<string, number>;
}

// ==================== 排行榜相关 ====================

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_display_name: string;
  total_points: number;
  resorts_count: number;
  courses_count: number;
}

export interface UserRank {
  user_id: string;
  rank: number | null;
}

// ==================== UI 状态相关 ====================

export interface CourseTrackingState {
  visits: CourseVisit[];
  recommendations: CourseRecommendation[];
  achievements: UserAchievementWithDetails[];
  progress: Record<string, ResortProgress>; // key: resort_id
  rankings: Record<string, CourseRanking[]>; // key: resort_id
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status: number;
}
