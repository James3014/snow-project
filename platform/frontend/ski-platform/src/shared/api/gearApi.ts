/**
 * Gear Operations API
 * 装备管理 API 接口
 *
 * Linus 原则：简单直接，可以工作就行
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

// Gear API 基础 URL（独立服务）
const GEAR_API_BASE = import.meta.env.VITE_GEAR_API_URL || 'http://localhost:8002/api/gear';

// 创建 axios 实例
const gearApiClient = axios.create({
  baseURL: GEAR_API_BASE,
});

// 添加认证拦截器
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
  // ==================== 装备管理 ====================

  /** 获取我的装备列表 */
  getMyGear: (filters?: { status?: string; role?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status_filter', filters.status);
    if (filters?.role) params.append('role', filters.role);
    return gearApiClient.get<GearItem[]>(`/items?${params}`);
  },

  /** 获取单个装备详情 */
  getGearItem: (itemId: string) =>
    gearApiClient.get<GearItem>(`/items/${itemId}`),

  /** 创建装备 */
  createGearItem: (data: GearItemCreate) =>
    gearApiClient.post<GearItem>('/items', data),

  /** 更新装备 */
  updateGearItem: (itemId: string, data: GearItemUpdate) =>
    gearApiClient.patch<GearItem>(`/items/${itemId}`, data),

  /** 删除装备（软删除） */
  deleteGearItem: (itemId: string) =>
    gearApiClient.delete(`/items/${itemId}`),

  // ==================== 检查记录 ====================

  /** 获取装备的检查历史 */
  getInspections: (itemId: string) =>
    gearApiClient.get<GearInspection[]>(`/inspections/items/${itemId}/inspections`),

  /** 创建检查记录 */
  createInspection: (itemId: string, data: GearInspectionCreate) =>
    gearApiClient.post<GearInspection>(`/inspections/items/${itemId}/inspections`, data),

  // ==================== 提醒管理 ====================

  /** 获取我的提醒 */
  getMyReminders: () =>
    gearApiClient.get<GearReminder[]>('/reminders'),

  /** 取消提醒 */
  cancelReminder: (reminderId: string) =>
    gearApiClient.patch(`/reminders/${reminderId}/cancel`),

  // ==================== 二手市场 ====================

  /** 搜索待售装备 */
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

  /** 联系卖家 */
  contactSeller: (itemId: string, message: string) =>
    gearApiClient.post(`/marketplace/items/${itemId}/contact-seller`, null, {
      params: { message },
    }),
};
