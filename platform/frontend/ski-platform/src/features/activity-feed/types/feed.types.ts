/**
 * TypeScript 類型定義 - 社交動態牆
 */

export interface UserInfo {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  experience_level: string | null;
}

export interface FeedItem {
  id: string;
  user_id: string;
  activity_type: 'course_visit' | 'achievement_earned' | 'recommendation_created';
  entity_type: string | null;
  entity_id: string | null;
  content_json: Record<string, any>;
  visibility: 'public' | 'followers' | 'private';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  is_liked: boolean;
  user: UserInfo | null;
}

export interface FeedResponse {
  items: FeedItem[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface Comment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  user: UserInfo | null;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export type FeedType = 'all' | 'following' | 'popular';
