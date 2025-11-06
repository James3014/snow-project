/**
 * Progress Bar Component
 * 进度条组件
 */
interface ProgressBarProps {
  percentage: number;
  label?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({
  percentage,
  label,
  color = 'blue',
  showLabel = true,
  height = 'md',
}: ProgressBarProps) {
  const colors = {
    blue: 'bg-primary-600',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const heights = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          <span className="text-sm font-semibold text-gray-900">{clampedPercentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heights[height]}`}>
        <div
          className={`${colors[color]} ${heights[height]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
