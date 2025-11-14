/**
 * Gear Operations API
 * 裝備管理 API 接口
 *
 * Linus 原則：簡單直接，可以工作就行
 */
import axios from 'axios';
import type {
  GearItem,
  GearItemCreate,
  GearItemUpdate,
  GearInspection,
  GearInspectionCreate,
  GearReminder,
} from '@/features/gear/types';

// Gear API 基礎 URL（獨立服務）
const GEAR_API_BASE = import.meta.env.VITE_GEAR_API_URL || 'http://localhost:8002/api/gear';

// 建立 axios 實例
const gearApiClient = axios.create({
  baseURL: GEAR_API_BASE,
});

// 添加認證攔截器
gearApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Gear Operations API Service
 */
export const gearApi = {
  // ==================== 裝備管理 ====================

  /** 取得我的裝備列表 */
  getMyGear: (filters?: { status?: string; role?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status_filter', filters.status);
    if (filters?.role) params.append('role', filters.role);
    return gearApiClient.get<GearItem[]>(`/items?${params}`);
  },

  /** 取得單個裝備詳情 */
  getGearItem: (itemId: string) =>
    gearApiClient.get<GearItem>(`/items/${itemId}`),

  /** 建立裝備 */
  createGearItem: (data: GearItemCreate) =>
    gearApiClient.post<GearItem>('/items', data),

  /** 更新裝備 */
  updateGearItem: (itemId: string, data: GearItemUpdate) =>
    gearApiClient.patch<GearItem>(`/items/${itemId}`, data),

  /** 刪除裝備（软刪除） */
  deleteGearItem: (itemId: string) =>
    gearApiClient.delete(`/items/${itemId}`),

  // ==================== 檢查記錄 ====================

  /** 取得裝備的檢查歷史 */
  getInspections: (itemId: string) =>
    gearApiClient.get<GearInspection[]>(`/inspections/items/${itemId}/inspections`),

  /** 建立檢查記錄 */
  createInspection: (itemId: string, data: GearInspectionCreate) =>
    gearApiClient.post<GearInspection>(`/inspections/items/${itemId}/inspections`, data),

  // ==================== 提醒管理 ====================

  /** 取得我的提醒 */
  getMyReminders: () =>
    gearApiClient.get<GearReminder[]>('/reminders'),

  /** 取消提醒 */
  cancelReminder: (reminderId: string) =>
    gearApiClient.patch(`/reminders/${reminderId}/cancel`),

  // ==================== 二手市場 ====================

  /** 搜尋待售裝備 */
  searchMarketplace: (filters?: {
    category?: string;
    price_min?: number;
    price_max?: number;
    currency?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.price_min !== undefined) params.append('price_min', filters.price_min.toString());
    if (filters?.price_max !== undefined) params.append('price_max', filters.price_max.toString());
    if (filters?.currency) params.append('currency', filters.currency);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    return gearApiClient.get<GearItem[]>(`/marketplace?${params}`);
  },

  /** 聯繫賣家 */
  contactSeller: (itemId: string, message: string) =>
    gearApiClient.post(`/marketplace/items/${itemId}/contact-seller`, null, {
      params: { message },
    }),
};
