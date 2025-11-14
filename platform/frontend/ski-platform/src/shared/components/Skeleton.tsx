/**
 * Skeleton Loading Component
 * 骨架屏加载组件
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export default function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';
  const animateClasses = animate ? 'animate-pulse' : '';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '200px'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animateClasses} ${className}`}
      style={style}
    />
  );
}

/**
 * Card Skeleton
 * 卡片骨架
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <Skeleton variant="rectangular" height={48} />
      <div className="space-y-2">
        <Skeleton />
        <Skeleton width="80%" />
        <Skeleton width="60%" />
      </div>
    </div>
  );
}

/**
 * List Skeleton
 * 列表骨架
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Table Skeleton
 * 表格骨架
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex space-x-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton height={20} />
          </div>
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <Skeleton />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Resort Card Skeleton
 * 雪場卡片骨架
 */
export function ResortCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <Skeleton variant="circular" width={80} height={80} className="mx-auto" />
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto" width="70%" />
        <Skeleton className="mx-auto" width="50%" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton width={80} />
          <Skeleton width={60} />
        </div>
        <Skeleton variant="rounded" height={8} />
      </div>
    </div>
  );
}

/**
 * Achievement Card Skeleton
 * 成就卡片骨架
 */
export function AchievementCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
      <Skeleton variant="circular" width={64} height={64} className="mx-auto" />
      <div className="space-y-2">
        <Skeleton className="mx-auto" width="80%" />
        <Skeleton className="mx-auto" width="60%" />
      </div>
      <Skeleton variant="rounded" height={32} className="mx-auto" width={100} />
    </div>
  );
}
