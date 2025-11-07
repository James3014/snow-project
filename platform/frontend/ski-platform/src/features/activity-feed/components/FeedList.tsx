/**
 * 動態列表組件
 */
import React from 'react';
import FeedItem from './FeedItem';
import type { FeedItem as FeedItemType } from '../types/feed.types';

interface FeedListProps {
  items: FeedItemType[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
}

const FeedList: React.FC<FeedListProps> = ({
  items,
  isLoading,
  hasMore,
  onLoadMore,
  onLike,
  onComment,
}) => {
  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-300"></div>
              <div className="ml-3 flex-1">
                <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-gray-600">還沒有動態</p>
        <p className="text-sm text-gray-500 mt-2">記錄你的滑雪活動，分享給雪友吧！</p>
      </div>
    );
  }

  return (
    <div>
      {/* 動態列表 */}
      <div className="space-y-4">
        {items.map((item) => (
          <FeedItem
            key={item.id}
            item={item}
            onLike={onLike}
            onComment={onComment}
          />
        ))}
      </div>

      {/* 加載更多按鈕 */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '加載中...' : '加載更多'}
          </button>
        </div>
      )}

      {/* 沒有更多了 */}
      {!hasMore && items.length > 0 && (
        <div className="mt-6 text-center text-gray-500 text-sm">
          沒有更多動態了 🎿
        </div>
      )}
    </div>
  );
};

export default FeedList;
