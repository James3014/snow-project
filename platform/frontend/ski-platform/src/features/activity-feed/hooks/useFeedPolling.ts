/**
 * 動態牆輪詢 Hook - 自動刷新動態
 */
import { useEffect, useRef } from 'react';

interface UseFeedPollingOptions {
  onRefresh: () => void;
  interval?: number; // 毫秒，默認 30000 (30秒)
  enabled?: boolean; // 是否啟用輪詢
}

export const useFeedPolling = ({
  onRefresh,
  interval = 30000,
  enabled = true,
}: UseFeedPollingOptions) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 設置輪詢
    timerRef.current = setInterval(() => {
      console.log('[Polling] 刷新動態牆...');
      onRefresh();
    }, interval);

    // 清理
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [onRefresh, interval, enabled]);

  // 手動停止輪詢
  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 手動開始輪詢
  const start = () => {
    stop();
    timerRef.current = setInterval(onRefresh, interval);
  };

  return { stop, start };
};
