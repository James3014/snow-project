/**
 * 動態牆主頁面
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
          // 取消點讚
          const result = await activityFeedApi.unlikeActivity(activityId);
          updateItem(activityId, {
            is_liked: false,
            likes_count: result.likes_count,
          });
        } else {
          // 點讚
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
  const handleComment = useCallback((activityId: string) => {
    // TODO: 打開評論彈窗或展開評論區
    console.log('打開評論:', activityId);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 頂部 Tab 切換 */}
      <div className="mb-6">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setFeedType('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              feedType === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            所有動態
          </button>
          <button
            onClick={() => setFeedType('following')}
            className={`px-4 py-2 font-medium transition-colors ${
              feedType === 'following'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            關注的人
          </button>
          <button
            onClick={() => setFeedType('popular')}
            className={`px-4 py-2 font-medium transition-colors ${
              feedType === 'popular'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            熱門
          </button>
        </div>
      </div>

      {/* 刷新按鈕 */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          自動刷新中 • 每 30 秒更新一次
        </p>
        <button
          onClick={refresh}
          className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          🔄 手動刷新
        </button>
      </div>

      {/* 動態列表 */}
      <FeedList
        items={items}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onLike={handleLike}
        onComment={handleComment}
      />
    </div>
  );
};

export default FeedPage;
