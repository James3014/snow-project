/**
 * 社交動態牆 API 調用
 */
import { userCoreClient } from '@/shared/api/client';
import type { FeedResponse, FeedType, CommentsResponse, FollowStats } from '../types/feed.types';

const BASE_URL = '/social';

export const activityFeedApi = {
  /**
   * 獲取動態牆
   */
  getFeed: async (params: {
    feed_type?: FeedType;
    cursor?: string | null;
    limit?: number;
  }): Promise<FeedResponse> => {
    const { feed_type = 'all', cursor, limit = 20 } = params;
    const queryParams = new URLSearchParams({
      feed_type,
      limit: limit.toString(),
    });

    if (cursor) {
      queryParams.append('cursor', cursor);
    }

    const response = await userCoreClient.get(`${BASE_URL}/feed?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 獲取用戶的個人動態
   */
  getUserFeed: async (userId: string, cursor?: string | null): Promise<FeedResponse> => {
    const queryParams = cursor ? `?cursor=${cursor}` : '';
    const response = await userCoreClient.get(`${BASE_URL}/users/${userId}/feed${queryParams}`);
    return response.data;
  },

  /**
   * 點讚動態
   */
  likeActivity: async (activityId: string): Promise<{ activity_id: string; liked: boolean; likes_count: number }> => {
    const response = await userCoreClient.post(`${BASE_URL}/feed/${activityId}/like`);
    return response.data;
  },

  /**
   * 取消點讚
   */
  unlikeActivity: async (activityId: string): Promise<{ activity_id: string; liked: boolean; likes_count: number }> => {
    const response = await userCoreClient.delete(`${BASE_URL}/feed/${activityId}/like`);
    return response.data;
  },

  /**
   * 獲取評論列表
   */
  getComments: async (activityId: string, skip = 0, limit = 50): Promise<CommentsResponse> => {
    const response = await userCoreClient.get(
      `${BASE_URL}/feed/${activityId}/comments?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * 發表評論
   */
  createComment: async (activityId: string, content: string): Promise<Comment> => {
    const response = await userCoreClient.post(`${BASE_URL}/feed/${activityId}/comments`, { content });
    return response.data;
  },

  /**
   * 刪除評論
   */
  deleteComment: async (commentId: string): Promise<void> => {
    await userCoreClient.delete(`${BASE_URL}/feed/comments/${commentId}`);
  },

  /**
   * 關注用戶
   */
  followUser: async (userId: string): Promise<void> => {
    await userCoreClient.post(`${BASE_URL}/users/${userId}/follow`);
  },

  /**
   * 取消關注
   */
  unfollowUser: async (userId: string): Promise<void> => {
    await userCoreClient.delete(`${BASE_URL}/users/${userId}/follow`);
  },

  /**
   * 獲取關注統計
   */
  getFollowStats: async (userId: string): Promise<FollowStats> => {
    const response = await userCoreClient.get(`${BASE_URL}/users/${userId}/follow-stats`);
    return response.data;
  },

  /**
   * 獲取粉絲列表
   */
  getFollowers: async (userId: string, skip = 0, limit = 50): Promise<{ followers: any[]; total: number }> => {
    const response = await userCoreClient.get(
      `${BASE_URL}/users/${userId}/followers?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * 獲取關注列表
   */
  getFollowing: async (userId: string, skip = 0, limit = 50): Promise<{ following: any[]; total: number }> => {
    const response = await userCoreClient.get(
      `${BASE_URL}/users/${userId}/following?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },
};
