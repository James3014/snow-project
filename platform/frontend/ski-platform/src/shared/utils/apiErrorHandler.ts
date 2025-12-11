/**
 * 統一 API 錯誤處理
 */
import type { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * 解析 API 錯誤
 */
export function parseApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { detail?: string; message?: string } | undefined;
    
    // 常見錯誤訊息
    const messages: Record<number, string> = {
      400: '請求格式錯誤',
      401: '請先登入',
      403: '沒有權限執行此操作',
      404: '找不到資源',
      409: '資源衝突',
      422: '資料驗證失敗',
      429: '請求過於頻繁，請稍後再試',
      500: '伺服器錯誤，請稍後再試',
      502: '服務暫時無法使用',
      503: '服務維護中',
    };

    return {
      message: data?.detail || data?.message || messages[status || 0] || '發生未知錯誤',
      status,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: '發生未知錯誤' };
}

/**
 * 類型守衛：檢查是否為 Axios 錯誤
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError)?.isAxiosError === true;
}

/**
 * 顯示錯誤訊息（可擴展為 toast）
 */
export function showApiError(error: unknown, fallbackMessage = '操作失敗，請稍後再試'): string {
  const { message } = parseApiError(error);
  return message || fallbackMessage;
}

/**
 * 處理 API 調用的包裝函數
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    onError?: (error: ApiError) => void;
    fallbackMessage?: string;
  }
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (err) {
    const error = parseApiError(err);
    options?.onError?.(error);
    return { data: null, error };
  }
}
