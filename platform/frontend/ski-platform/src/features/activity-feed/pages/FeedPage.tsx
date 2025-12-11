/**
 * Feed Page - Glacial Futurism Design
 * 動態牆主頁面 - 冰川未來主義設計
 *
 * Mobile-First | Real-time Feed | Social Interaction
 */
import React, { useState, useCallback } from 'react';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { useFeedPolling } from '../hooks/useFeedPolling';
import { activityFeedApi } from '../api/activityFeedApi';
import FeedList from '../components/FeedList';
import type { FeedType } from '../types/feed.types';

const FeedPage: React.FC = () => {
  const [feedType, setFeedType] = useState<FeedType>('all');
  const { items, isLoading, hasMore, refresh, loadMore, updateItem } =
    useActivityFeed(feedType);

  // 啟用自動輪詢（每 30 秒刷新）
  useFeedPolling({
    onRefresh: refresh,
    interval: 30000,
    enabled: true,
  });

  // 處理點讚
  const handleLike = useCallback(
    async (activityId: string) => {
      const item = items.find((i) => i.id === activityId);
      if (!item) return;

      try {
        if (item.is_liked) {
          const result = await activityFeedApi.unlikeActivity(activityId);
          updateItem(activityId, {
            is_liked: false,
            likes_count: result.likes_count,
          });
        } else {
          const result = await activityFeedApi.likeActivity(activityId);
          updateItem(activityId, {
            is_liked: true,
            likes_count: result.likes_count,
          });
        }
      } catch (error) {
        console.error('點讚操作失敗:', error);
      }
    },
    [items, updateItem]
  );

  // 處理評論點擊
  const handleComment = useCallback((_activityId: string) => {
    // Intentionally no-op: modal handling is deferred to parent for security/log cleanliness
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            動態牆
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            即時追蹤滑雪社群的最新動態與精彩時刻
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Filter Tabs - Mobile-First Horizontal Scroll */}
        <div className="mb-6 animate-slide-up stagger-2">
          <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4 border-b border-glacier">
            <button
              onClick={() => setFeedType('all')}
              className={`filter-pill scroll-snap-item flex-shrink-0 ${
                feedType === 'all' ? 'active' : ''
              }`}
            >
              所有動態
            </button>
            <button
              onClick={() => setFeedType('following')}
              className={`filter-pill scroll-snap-item flex-shrink-0 ${
                feedType === 'following' ? 'active' : ''
              }`}
            >
              關注的人
            </button>
            <button
              onClick={() => setFeedType('popular')}
              className={`filter-pill scroll-snap-item flex-shrink-0 ${
                feedType === 'popular' ? 'active' : ''
              }`}
            >
              🔥 熱門
            </button>
          </div>
        </div>

        {/* Refresh Status Bar */}
        <div className="mb-6 glass-card p-4 flex justify-between items-center animate-slide-up stagger-3">
          <div className="flex items-center gap-2 text-sm text-crystal-blue">
            <div className="w-2 h-2 rounded-full bg-ice-accent pulse-glow" />
            <span>自動刷新中 • 每 30 秒更新一次</span>
          </div>
          <button
            onClick={refresh}
            className="text-sm text-ice-primary hover:text-ice-accent transition-colors flex items-center gap-2 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            手動刷新
          </button>
        </div>

        {/* Feed List */}
        <div className="animate-slide-up stagger-4">
          <FeedList
            items={items}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onLike={handleLike}
            onComment={handleComment}
          />
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
