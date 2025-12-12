/**
 * 統一 API 客戶端
 * 整合 API Gateway，統一錯誤處理
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
}

export class ApiClient {
  private baseURL: string;
  private authToken?: string;

  constructor(baseURL = 'http://localhost:8080/api') {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiClientError(data, response.status);
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      
      throw new ApiClientError(
        { error: 'Network error', details: { message: (error as Error).message } },
        0
      );
    }
  }

  // 便捷方法
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly details: ApiError;

  constructor(errorData: ApiError, status: number) {
    super(errorData.error);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = errorData;
  }
}

// 全局 API 客戶端實例
export const apiClient = new ApiClient();

// 服務特定的 API 客戶端
export class AuthApi {
  constructor(private client: ApiClient) {}

  async login(credentials: { email: string; password: string }) {
    return this.client.post('/auth/login', credentials);
  }

  async logout() {
    return this.client.post('/auth/logout');
  }

  async getProfile() {
    return this.client.get('/users/profile');
  }
}

export class TripsApi {
  constructor(private client: ApiClient) {}

  async getTrips() {
    return this.client.get('/trips');
  }

  async createTrip(trip: any) {
    return this.client.post('/trips', trip);
  }

  async updateTrip(id: string, trip: any) {
    return this.client.put(`/trips/${id}`, trip);
  }

  async deleteTrip(id: string) {
    return this.client.delete(`/trips/${id}`);
  }
}

export class SocialApi {
  constructor(private client: ApiClient) {}

  async getFeed(userId: string) {
    return this.client.get(`/social/users/${userId}/feed`);
  }

  async createActivity(activity: any) {
    return this.client.post('/social/activities', activity);
  }

  async followUser(followData: any) {
    return this.client.post('/social/follows', followData);
  }
}

export class GearApi {
  constructor(private client: ApiClient) {}

  async getUserGear(userId: string) {
    return this.client.get(`/gear/users/${userId}/gear`);
  }

  async createGear(gear: any) {
    return this.client.post('/gear', gear);
  }

  async updateGear(id: string, gear: any) {
    return this.client.put(`/gear/${id}`, gear);
  }
}

// API 服務實例
export const authApi = new AuthApi(apiClient);
export const tripsApi = new TripsApi(apiClient);
export const socialApi = new SocialApi(apiClient);
export const gearApi = new GearApi(apiClient);
