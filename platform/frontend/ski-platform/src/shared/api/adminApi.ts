/**
 * Admin API Client
 * 管理員 API 客戶端
 */
import { userCoreApi } from './client';

export interface UserListItem {
  user_id: string;
  email: string;
  display_name: string | null;
  roles: string[];
  status: string;
  experience_level: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserDetail {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_language: string | null;
  experience_level: string | null;
  roles: string[];
  status: string;
  bio: string | null;
  coach_cert_level: string | null;
  preferred_resorts: any[] | null;
  teaching_languages: any[] | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserRequest {
  display_name?: string;
  avatar_url?: string;
  preferred_language?: string;
  experience_level?: string;
  bio?: string;
  coach_cert_level?: string;
}

export interface UpdateUserRolesRequest {
  roles: string[];
}

export interface UpdateUserStatusRequest {
  status: string;
}

export interface Statistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  new_users_last_7_days: number;
  new_users_last_30_days: number;
  users_by_experience_level: Record<string, number>;
  users_by_role: Record<string, number>;
}

export const adminApi = {
  /**
   * 獲取用戶列表
   */
  listUsers: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    status_filter?: string;
    role_filter?: string;
  }): Promise<UserListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params.role_filter) queryParams.append('role_filter', params.role_filter);

    return userCoreApi.get<UserListResponse>(
      `/admin/users?${queryParams.toString()}`
    );
  },

  /**
   * 獲取單個用戶詳情
   */
  getUserDetail: async (userId: string): Promise<UserDetail> => {
    return userCoreApi.get<UserDetail>(`/admin/users/${userId}`);
  },

  /**
   * 更新用戶資料
   */
  updateUser: async (
    userId: string,
    data: UpdateUserRequest
  ): Promise<UserDetail> => {
    return userCoreApi.patch<UserDetail>(`/admin/users/${userId}`, data);
  },

  /**
   * 更新用戶狀態
   */
  updateUserStatus: async (
    userId: string,
    status: string
  ): Promise<{ message: string; user_id: string; status: string }> => {
    return userCoreApi.patch(`/admin/users/${userId}/status`, { status });
  },

  /**
   * 更新用戶角色
   */
  updateUserRoles: async (
    userId: string,
    roles: string[]
  ): Promise<{ message: string; user_id: string; roles: string[] }> => {
    return userCoreApi.patch(`/admin/users/${userId}/roles`, { roles });
  },

  /**
   * 刪除用戶
   */
  deleteUser: async (
    userId: string
  ): Promise<{ message: string; user_id: string }> => {
    return userCoreApi.delete(`/admin/users/${userId}`);
  },

  /**
   * 獲取統計資訊
   */
  getStatistics: async (): Promise<Statistics> => {
    return userCoreApi.get<Statistics>('/admin/statistics');
  },
};
