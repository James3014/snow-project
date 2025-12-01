/**
 * Empty State Component
 * 空狀態組件
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
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-zinc-400 mb-6 max-w-md mx-auto">{description}</p>
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

export function NoDataEmptyState({ message = '暫無資料' }: { message?: string }) {
  return <EmptyState icon="📊" title={message} />;
}

export function NoResortsEmptyState() {
  return (
    <EmptyState
      icon="🏔️"
      title="暫無雪場資料"
      description="目前還沒有可用的雪場資訊"
    />
  );
}

export function NoCoursesEmptyState() {
  return (
    <EmptyState
      icon="⛷️"
      title="還沒有完成任何雪道"
      description="開始你的滑雪之旅，記錄第一條雪道吧！"
    />
  );
}

export function NoAchievementsEmptyState() {
  return (
    <EmptyState
      icon="🏆"
      title="還沒有獲得任何成就"
      description="完成更多雪道，解鎖精彩成就！"
    />
  );
}

export function NoRecommendationsEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="⭐"
      title="還沒有推薦任何雪道"
      description="發現了喜歡的雪道？快來推薦給大家吧！"
      action={onAction ? { label: '新增推薦', onClick: onAction } : undefined}
    />
  );
}

export function ErrorEmptyState({
  message = '載入失敗',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="⚠️"
      title={message}
      description="請檢查網路連線或稍後重試"
      action={onRetry ? { label: '重試', onClick: onRetry } : undefined}
    />
  );
}
