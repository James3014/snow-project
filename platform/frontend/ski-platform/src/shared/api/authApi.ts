/**
 * Authentication API Client
 * 認證 API 客戶端
 */
import { userCoreApi } from './client';

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
  preferred_language?: string;
  experience_level?: string;
  captcha_token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  captcha_token?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  display_name: string;
  email: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  preferred_language: string;
  experience_level: string;
  roles: string[];
  bio?: string;
  created_at: string;
}

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return userCoreApi.post<AuthResponse>('/auth/register', data);
  },

  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return userCoreApi.post<AuthResponse>('/auth/login', data);
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    return userCoreApi.get<UserProfile>('/auth/me');
  },

  /**
   * Validate current token
   */
  validateToken: async (): Promise<{ user_id: string; email: string; display_name: string; status: string }> => {
    return userCoreApi.get('/auth/validate');
  },
};
