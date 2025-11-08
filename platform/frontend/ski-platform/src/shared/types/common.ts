/**
 * Shared Common Types
 * 共享的通用类型定义
 */

// ==================== 用户相关 ====================

export interface User {
  user_id: string;
  bio?: string;
  roles?: string[];
  status: string;
  preferred_language?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  locale_profiles?: LocaleProfile[];
  legal_consent?: LegalConsent;
}

export interface LocaleProfile {
  country_code: string;
  local_identifier?: string;
  verification_status?: string;
}

export interface LegalConsent {
  privacy_version?: string;
  marketing_opt_in?: boolean;
}

// ==================== 雪场相关 ====================

export interface Resort {
  id: string;
  name: string;
  name_zh?: string;
  location: string;
  region: string;
  country: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  courses?: any[]; // 详细类型在 course-tracking 中定义
  facilities?: Facility[];
  operating_hours?: OperatingHours;
  lift_passes?: LiftPass[];
  contact?: Contact;
}

export interface Facility {
  name: string;
  type: string;
  description?: string;
}

export interface OperatingHours {
  start_date?: string;
  end_date?: string;
  daily_hours?: string;
}

export interface LiftPass {
  type: string;
  price: number;
  currency: string;
  duration?: string;
}

export interface Contact {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

// ==================== API 相关 ====================

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ApiErrorResponse {
  detail: string;
  status?: number;
}

// ==================== UI 状态相关 ====================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// ==================== 配置相关 ====================

export interface AppConfig {
  apiBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    enableSharing: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
  };
}
