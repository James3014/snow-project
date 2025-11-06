/**
 * API Client Configuration
 * API 客户端配置
 */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

// API 基础配置
const API_CONFIG = {
  USER_CORE: import.meta.env.VITE_USER_CORE_API || 'http://localhost:8000',
  RESORT_API: import.meta.env.VITE_RESORT_API || 'http://localhost:8001',
  TIMEOUT: 10000,
};

/**
 * 创建 Axios 实例
 */
function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      // 可以在这里添加认证 token
      // const token = getAuthToken();
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // 统一错误处理
      if (error.response) {
        // 服务器返回错误
        const { status, data } = error.response;

        switch (status) {
          case 401:
            // 未授权，跳转到登录
            console.error('未授权，请登录');
            // TODO: 跳转到登录页
            break;
          case 403:
            console.error('无权限访问');
            break;
          case 404:
            console.error('资源不存在');
            break;
          case 500:
            console.error('服务器错误');
            break;
          default:
            console.error(`请求失败: ${status}`, data);
        }

        return Promise.reject({
          status,
          message: data.detail || '请求失败',
        });
      } else if (error.request) {
        // 请求发出但没有收到响应
        console.error('网络错误，请检查连接');
        return Promise.reject({
          status: 0,
          message: '网络错误，请检查连接',
        });
      } else {
        // 请求配置错误
        console.error('请求配置错误', error.message);
        return Promise.reject({
          status: -1,
          message: error.message,
        });
      }
    }
  );

  return client;
}

// 创建不同服务的 API 客户端
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
