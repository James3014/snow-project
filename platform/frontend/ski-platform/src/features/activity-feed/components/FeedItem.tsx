/**
 * 單個動態項目組件
 */
import React, { useState } from 'react';
import type { FeedItem as FeedItemType } from '../types/feed.types';

interface FeedItemProps {
  item: FeedItemType;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
}

const FeedItem: React.FC<FeedItemProps> = ({ item, onLike, onComment }) => {
  const [showComments, setShowComments] = useState(false);

  // 根據活動類型渲染內容
  const renderContent = () => {
    switch (item.activity_type) {
      case 'course_visit':
        return (
          <div>
            <p className="text-gray-800">
              剛完成了{' '}
              <span className="font-semibold text-blue-600">
                {item.content_json.course_name}
              </span>
              {' '}⛷️
            </p>
            {item.content_json.rating && (
              <div className="mt-2 flex items-center gap-1">
                {'⭐'.repeat(item.content_json.rating)}
                <span className="text-sm text-gray-800 ml-2">
                  {item.content_json.rating}/5
                </span>
              </div>
            )}
            {item.content_json.snow_condition && (
              <p className="text-sm text-gray-800 mt-1">
                雪況：{item.content_json.snow_condition}
              </p>
            )}
          </div>
        );

      case 'achievement_earned':
        return (
          <div>
            <p className="text-gray-800">
              解鎖了成就：
              <span className="font-semibold text-amber-600">
                {item.content_json.icon} {item.content_json.achievement_type}
              </span>
            </p>
            {item.content_json.points && (
              <p className="text-sm text-gray-800 mt-1">
                獲得 {item.content_json.points} 積分
              </p>
            )}
          </div>
        );

      case 'recommendation_created':
        return (
          <div>
            <p className="text-gray-800">
              推薦了{' '}
              <span className="font-semibold text-blue-600">
                {item.content_json.course_name}
              </span>
            </p>
            {item.content_json.reason && (
              <blockquote className="mt-2 pl-3 border-l-2 border-gray-300 text-gray-800 italic">
                "{item.content_json.reason}"
              </blockquote>
            )}
          </div>
        );

      default:
        return <p className="text-gray-800">{JSON.stringify(item.content_json)}</p>;
    }
  };

  // 格式化時間
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-TW');
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 mb-4">
      {/* 用戶資訊 */}
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
          {item.user?.display_name?.[0] || '?'}
        </div>
        <div className="ml-3 flex-1">
          <p className="font-semibold text-gray-900">
            {item.user?.display_name || '匿名用戶'}
          </p>
          <p className="text-sm text-gray-700">{formatTime(item.created_at)}</p>
        </div>

        {/* 隱私標記 */}
        {item.visibility === 'followers' && (
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
            🔒 僅關注者
          </span>
        )}
      </div>

      {/* 動態內容 */}
      <div className="mb-3">{renderContent()}</div>

      {/* 互動按鈕 */}
      <div className="flex gap-4 text-gray-800 border-t pt-3">
        <button
          onClick={() => onLike(item.id)}
          className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
            item.is_liked ? 'text-red-500' : ''
          }`}
        >
          <span>{item.is_liked ? '❤️' : '🤍'}</span>
          <span>{item.likes_count}</span>
        </button>

        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments) {
              onComment(item.id);
            }
          }}
          className="flex items-center gap-1 hover:text-blue-500 transition-colors"
        >
          <span>💬</span>
          <span>{item.comments_count}</span>
        </button>
      </div>

      {/* 評論區（展開後顯示） */}
      {showComments && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-700">評論功能開發中...</p>
        </div>
      )}
    </div>
  );
};

export default FeedItem;
