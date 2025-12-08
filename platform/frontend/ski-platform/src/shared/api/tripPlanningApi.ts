/**
 * Trip Planning API
 * 行程規劃 API 接口
 */
import { userCoreApi } from './client';
import { ensureUUIDSafe } from '@/shared/utils/idConverter';
import type {
  Season,
  SeasonCreate,
  SeasonUpdate,
  SeasonStats,
  Trip,
  TripSummary,
  TripCreate,
  TripBatchCreate,
  TripUpdate,
  BuddyInfo,
  BuddyResponse,
  ShareLinkResponse,
  TripRecommendation,
  CalendarTrip,
  YearOverview,
} from '@/features/trip-planning/types';

/**
 * 行程規劃 API Service
 */
export const tripPlanningApi = {
  // ==================== Season 相關 ====================

  /** 創建雪季 */
  createSeason: (userId: string, data: SeasonCreate) => {
    const uuid = ensureUUIDSafe(userId) || userId;
    return userCoreApi.post<Season>(`/trip-planning/seasons?user_id=${uuid}`, data);
  },

  /** 獲取用戶的所有雪季 */
  getSeasons: (userId: string, status?: string) => {
    const uuid = ensureUUIDSafe(userId) || userId;
    const params = new URLSearchParams({ user_id: uuid });
    if (status) params.append('status', status);
    return userCoreApi.get<Season[]>(`/trip-planning/seasons?${params}`);
  },

  /** 獲取單個雪季 */
  getSeason: (seasonId: string, userId: string) => {
    const userUuid = ensureUUIDSafe(userId) || userId;
    const seasonUuid = ensureUUIDSafe(seasonId) || seasonId;
    return userCoreApi.get<Season>(`/trip-planning/seasons/${seasonUuid}?user_id=${userUuid}`);
  },

  /** 更新雪季 */
  updateSeason: (seasonId: string, userId: string, data: SeasonUpdate) => {
    const userUuid = ensureUUIDSafe(userId) || userId;
    const seasonUuid = ensureUUIDSafe(seasonId) || seasonId;
    return userCoreApi.patch<Season>(`/trip-planning/seasons/${seasonUuid}?user_id=${userUuid}`, data);
  },

  /** 刪除雪季 */
  deleteSeason: (seasonId: string, userId: string) => {
    const userUuid = ensureUUIDSafe(userId) || userId;
    const seasonUuid = ensureUUIDSafe(seasonId) || seasonId;
    return userCoreApi.delete(`/trip-planning/seasons/${seasonUuid}?user_id=${userUuid}`);
  },

  /** 獲取雪季統計 */
  getSeasonStats: (seasonId: string, userId: string) => {
    const userUuid = ensureUUIDSafe(userId) || userId;
    const seasonUuid = ensureUUIDSafe(seasonId) || seasonId;
    return userCoreApi.get<SeasonStats>(`/trip-planning/seasons/${seasonUuid}/stats?user_id=${userUuid}`);
  },

  // ==================== Trip 相關 ====================

  /** 創建行程 */
  createTrip: (userId: string, data: TripCreate) => {
    const userUuid = ensureUUIDSafe(userId) || userId;
    // Also ensure season_id in data is UUID format
    const tripData = {
      ...data,
      season_id: ensureUUIDSafe(data.season_id) || data.season_id,
    };
    return userCoreApi.post<Trip>(`/trip-planning/trips?user_id=${userUuid}`, tripData);
  },

  /** 批次創建行程 */
  createTripsBatch: (userId: string, data: TripBatchCreate) => {
    const userUuid = ensureUUIDSafe(userId) || userId;
    const batchData = {
      ...data,
      season_id: ensureUUIDSafe(data.season_id) || data.season_id,
    };
    return userCoreApi.post<Trip[]>(`/trip-planning/trips/batch?user_id=${userUuid}`, batchData);
  },

  /** 獲取行程列表 */
  getTrips: (userId: string, filters?: { season_id?: string; status?: string }) => {
    const userUuid = ensureUUIDSafe(userId) || userId;
    const params = new URLSearchParams({ user_id: userUuid });
    if (filters?.season_id) {
      const seasonUuid = ensureUUIDSafe(filters.season_id) || filters.season_id;
      params.append('season_id', seasonUuid);
    }
    if (filters?.status) params.append('status', filters.status);
    return userCoreApi.get<Trip[]>(`/trip-planning/trips?${params}`);
  },

  /** 獲取所有公開行程（用於雪伴公佈欄） */
  getPublicTrips: (skip: number = 0, limit: number = 100) => {
    const params = new URLSearchParams();
    if (skip > 0) params.append('skip', skip.toString());
    if (limit !== 100) params.append('limit', limit.toString());
    return userCoreApi.get<TripSummary[]>(`/trip-planning/trips/public${params.toString() ? '?' + params : ''}`);
  },

  /** 獲取單個行程 */
  getTrip: (tripId: string, userId?: string) => {
    const tripUuid = ensureUUIDSafe(tripId) || tripId;
    const params = userId ? `?user_id=${ensureUUIDSafe(userId) || userId}` : '';
    return userCoreApi.get<Trip>(`/trip-planning/trips/${tripUuid}${params}`);
  },

  /** 更新行程 */
  updateTrip: (tripId: string, userId: string, data: TripUpdate) => {
    const tripUuid = ensureUUIDSafe(tripId) || tripId;
    const userUuid = ensureUUIDSafe(userId) || userId;
    const updateData = {
      ...data,
      season_id: data.season_id ? (ensureUUIDSafe(data.season_id) || data.season_id) : undefined,
    };
    return userCoreApi.patch<Trip>(`/trip-planning/trips/${tripUuid}?user_id=${userUuid}`, updateData);
  },

  /** 刪除行程 */
  deleteTrip: (tripId: string, userId: string) => {
    const tripUuid = ensureUUIDSafe(tripId) || tripId;
    const userUuid = ensureUUIDSafe(userId) || userId;
    return userCoreApi.delete(`/trip-planning/trips/${tripUuid}?user_id=${userUuid}`);
  },

  /** 標記行程完成 */
  completeTrip: (tripId: string, userId: string, createCourseVisit: boolean = true) => {
    const tripUuid = ensureUUIDSafe(tripId) || tripId;
    const userUuid = ensureUUIDSafe(userId) || userId;
    return userCoreApi.post<Trip>(
      `/trip-planning/trips/${tripUuid}/complete?user_id=${userUuid}&create_course_visit=${createCourseVisit}`
    );
  },

  /** 產生分享連結 */
  generateShareLink: (tripId: string, userId: string) => {
    const tripUuid = ensureUUIDSafe(tripId) || tripId;
    const userUuid = ensureUUIDSafe(userId) || userId;
    return userCoreApi.get<ShareLinkResponse>(`/trip-planning/trips/${tripUuid}/share-link?user_id=${userUuid}`);
  },

  /** 透過分享連結訪問行程 */
  getTripByShareToken: (shareToken: string) =>
    userCoreApi.get<Trip>(`/trip-planning/trips/shared/${shareToken}`),

  // ==================== Buddy 相關 ====================

  /** 申請加入行程 */
  requestToJoinTrip: (tripId: string, userId: string, message?: string) => {
    const tripUuid = ensureUUIDSafe(tripId) || tripId;
    const userUuid = ensureUUIDSafe(userId) || userId;
    const params = new URLSearchParams({ user_id: userUuid });
    if (message) params.append('request_message', message);
    return userCoreApi.post<BuddyInfo>(`/trip-planning/trips/${tripUuid}/buddy-requests?${params}`);
  },

  /** 回應雪伴申請 */
  respondToBuddyRequest: (tripId: string, buddyId: string, userId: string, response: BuddyResponse) => {
    const tripUuid = ensureUUIDSafe(tripId) || tripId;
    const buddyUuid = ensureUUIDSafe(buddyId) || buddyId;
    const userUuid = ensureUUIDSafe(userId) || userId;
    return userCoreApi.patch<BuddyInfo>(
      `/trip-planning/trips/${tripUuid}/buddy-requests/${buddyUuid}?user_id=${userUuid}`,
      response
    );
  },

  /** 獲取行程的所有雪伴 */
  getTripBuddies: (tripId: string) => {
    const tripUuid = ensureUUIDSafe(tripId) || tripId;
    return userCoreApi.get<BuddyInfo[]>(`/trip-planning/trips/${tripUuid}/buddies`);
  },

  /** 取消雪伴申請 */
  cancelBuddyRequest: (tripId: string, buddyId: string, userId: string) => {
    const tripUuid = ensureUUIDSafe(tripId) || tripId;
    const buddyUuid = ensureUUIDSafe(buddyId) || buddyId;
    const userUuid = ensureUUIDSafe(userId) || userId;
    return userCoreApi.delete(`/trip-planning/trips/${tripUuid}/buddy-requests/${buddyUuid}?user_id=${userUuid}`);
  },

  // ==================== 探索和推薦 ====================

  /** 探索公開行程（待實現完整功能） */
  exploreTrips: (filters: {
    resort_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters.resort_id) params.append('resort_id', filters.resort_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', filters.limit.toString());
    // TODO: 實現完整的探索 API
    return userCoreApi.get<Trip[]>(`/trip-planning/trips?${params}`);
  },

  /** 獲取推薦行程（待實現完整功能） */
  getRecommendations: () => {
    // TODO: 實現完整的推薦算法 API
    return Promise.resolve([]) as Promise<TripRecommendation[]>;
  },

  // ==================== 日曆相關 ====================

  /** 獲取日曆視圖的行程 */
  getCalendarTrips: (userId: string, year: number, month?: number) => {
    const userUuid = ensureUUIDSafe(userId) || userId;
    const params = new URLSearchParams({ user_id: userUuid, year: year.toString() });
    if (month) params.append('month', month.toString());
    return userCoreApi.get<CalendarTrip[]>(`/trip-planning/calendar/trips?${params}`);
  },

  /** 獲取年度概覽 */
  getYearOverview: (userId: string, year: number) => {
    const userUuid = ensureUUIDSafe(userId) || userId;
    return userCoreApi.get<YearOverview>(`/trip-planning/calendar/year-overview?user_id=${userUuid}&year=${year}`);
  },
};
