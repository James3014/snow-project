/**
 * 動態牆數據獲取 Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { activityFeedApi } from '../api/activityFeedApi';
import type { FeedItem, FeedType } from '../types/feed.types';

export const useActivityFeed = (feedType: FeedType = 'all') => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // 獲取動態
  const fetchFeed = useCallback(
    async (reset = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await activityFeedApi.getFeed({
          feed_type: feedType,
          cursor: reset ? null : cursor,
          limit: 20,
        });

        if (reset) {
          setItems(response.items);
        } else {
          setItems((prev) => [...prev, ...response.items]);
        }

        setCursor(response.next_cursor);
        setHasMore(response.has_more);
      } catch (err: any) {
        setError(err.message || '獲取動態失敗');
      } finally {
        setIsLoading(false);
      }
    },
    [feedType, cursor]
  );

  // 刷新（重置到第一頁）
  const refresh = useCallback(() => {
    setCursor(null);
    fetchFeed(true);
  }, [fetchFeed]);

  // 加載更多
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchFeed(false);
    }
  }, [fetchFeed, isLoading, hasMore]);

  // 初始加載
  useEffect(() => {
    refresh();
  }, [feedType]);

  // 更新單個項目（用於點讚後更新）
  const updateItem = useCallback((itemId: string, updates: Partial<FeedItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
  }, []);

  return {
    items,
    isLoading,
    error,
    hasMore,
    refresh,
    loadMore,
    updateItem,
  };
};
