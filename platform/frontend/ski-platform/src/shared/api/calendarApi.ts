/**
 * Calendar API - 共用行事曆功能
 */
import { userCoreClient } from './client';

const USER_CORE_URL = import.meta.env.VITE_USER_CORE_API_URL || 'https://user-core.zeabur.app';

export interface PublicTrip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  resort_id?: string;
  resort_name?: string;
  region?: string;
  people_count?: number;
  max_buddies: number;
  current_buddies: number;
  owner_id: string;
}

export interface CalendarTrip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  timezone: string;
  visibility: 'private' | 'friends_only' | 'public';
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
}

export interface CalendarEvent {
  id: string;
  type: 'trip' | 'reminder' | 'matching';
  title: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
}

export interface SharedCalendar {
  trips: CalendarTrip[];
  events: CalendarEvent[];
}

export interface BuddyResponse {
  id: string;
  user_id: string;
  status: string;
}

// 公開行程 API
export const calendarApi = {
  // 取得公開行程列表
  getPublicTrips: async (params?: {
    resort_id?: string;
    region?: string;
    start_after?: string;
  }): Promise<PublicTrip[]> => {
    const searchParams = new URLSearchParams();
    if (params?.resort_id) searchParams.set('resort_id', params.resort_id);
    if (params?.region) searchParams.set('region', params.region);
    if (params?.start_after) searchParams.set('start_after', params.start_after);
    
    const url = `${USER_CORE_URL}/calendar/public/trips${searchParams.toString() ? '?' + searchParams : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch public trips');
    return res.json();
  },

  // 申請加入公開行程
  joinPublicTrip: async (tripId: string, message?: string): Promise<BuddyResponse> => {
    const res = await userCoreClient.post(`/calendar/public/trips/${tripId}/join`, { message });
    return res.data;
  },

  // 取得共享行事曆
  getSharedCalendar: async (): Promise<SharedCalendar> => {
    const res = await userCoreClient.get(`/calendar/shared`);
    return res.data;
  },

  // 取得行程的雪伴列表
  getTripBuddies: async (tripId: string): Promise<BuddyResponse[]> => {
    const res = await fetch(`${USER_CORE_URL}/calendar/trips/${tripId}/buddies`);
    if (!res.ok) throw new Error('Failed to fetch buddies');
    return res.json();
  },

  // 回應雪伴邀請
  respondToBuddy: async (buddyId: string, accept: boolean, message?: string): Promise<BuddyResponse> => {
    const res = await userCoreClient.post(`/calendar/trip-buddies/${buddyId}/respond`, { accept, message });
    return res.data;
  },
};
