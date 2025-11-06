/**
 * Empty State Component
 * 空状态组件
 */
import type { ReactNode } from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {/* Icon */}
      <div className="mb-4">
        {typeof icon === 'string' ? (
          <div className="text-6xl">{icon}</div>
        ) : (
          icon
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      )}

      {/* Action Button */}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Predefined Empty States
 */

export function NoDataEmptyState({ message = '暂无数据' }: { message?: string }) {
  return <EmptyState icon="📊" title={message} />;
}

export function NoResortsEmptyState() {
  return (
    <EmptyState
      icon="🏔️"
      title="暂无雪场数据"
      description="目前还没有可用的雪场信息"
    />
  );
}

export function NoCoursesEmptyState() {
  return (
    <EmptyState
      icon="⛷️"
      title="还没有完成任何雪道"
      description="开始你的滑雪之旅，记录第一条雪道吧！"
    />
  );
}

export function NoAchievementsEmptyState() {
  return (
    <EmptyState
      icon="🏆"
      title="还没有获得任何成就"
      description="完成更多雪道，解锁精彩成就！"
    />
  );
}

export function NoRecommendationsEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="⭐"
      title="还没有推荐任何雪道"
      description="发现了喜欢的雪道？快来推荐给大家吧！"
      action={onAction ? { label: '添加推荐', onClick: onAction } : undefined}
    />
  );
}

export function ErrorEmptyState({
  message = '加载失败',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="⚠️"
      title={message}
      description="请检查网络连接或稍后重试"
      action={onRetry ? { label: '重试', onClick: onRetry } : undefined}
    />
  );
}
