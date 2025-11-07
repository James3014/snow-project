/**
 * API Client Configuration
 * API 客戶端配置
 */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

// API 基礎配置
const API_CONFIG = {
  USER_CORE: import.meta.env.VITE_USER_CORE_API || 'http://localhost:8000',
  RESORT_API: import.meta.env.VITE_RESORT_API || 'http://localhost:8001',
  TIMEOUT: 10000,
};

/**
 * 建立 Axios 實例
 */
function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 請求攔截器
  client.interceptors.request.use(
    (config) => {
      // 從 localStorage 獲取認證 token
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 回應攔截器
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // 統一錯誤處理
      if (error.response) {
        // 伺服器返回錯誤
        const { status, data, config } = error.response;

        // 對於 auth 相關的 401 錯誤，不顯示錯誤訊息（由 authSlice 處理）
        const isAuthEndpoint = config?.url?.includes('/auth/');
        const shouldLogError = !(status === 401 && isAuthEndpoint);

        if (shouldLogError) {
          switch (status) {
            case 401:
              console.error('未授權，請登入');
              break;
            case 403:
              console.error('無權限存取');
              break;
            case 404:
              console.error('資源不存在');
              break;
            case 500:
              console.error('伺服器錯誤');
              break;
            default:
              console.error(`請求失敗: ${status}`, data);
          }
        }

        return Promise.reject({
          status,
          message: data.detail || '請求失敗',
        });
      } else if (error.request) {
        // 請求發出但沒有收到回應
        console.error('網路錯誤，請檢查連線');
        return Promise.reject({
          status: 0,
          message: '網路錯誤，請檢查連線',
        });
      } else {
        // 請求配置錯誤
        console.error('請求配置錯誤', error.message);
        return Promise.reject({
          status: -1,
          message: error.message,
        });
      }
    }
  );

  return client;
}

// 建立不同服務的 API 客戶端
export const userCoreClient = createApiClient(API_CONFIG.USER_CORE);
export const resortApiClient = createApiClient(API_CONFIG.RESORT_API);

/**
 * 通用 API 请求方法
 */
export class ApiClient {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// 导出客户端实例
export const userCoreApi = new ApiClient(userCoreClient);
export const resortApi = new ApiClient(resortApiClient);
