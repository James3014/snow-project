/**
 * Resort Card Component - Alpine Velocity Style
 * 雪場卡片元件 - Mountain Ice 風格
 */
import { useNavigate } from 'react-router-dom';
import type { Resort } from '@/shared/data/resorts';
import ProgressBar from '@/shared/components/ProgressBar';

interface ResortCardProps {
  resort: Resort;
  progressPercent: number;
  completed: number;
  totalCourses: number;
  getResortLogoUrl: (id: string) => string;
  getRegionName: (region: string) => string;
}

export default function ResortCard({
  resort,
  progressPercent,
  completed,
  totalCourses,
  getResortLogoUrl,
  getRegionName,
}: ResortCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/resorts/${resort.resort_id}`)}
      className="block relative cursor-pointer mb-6"
    >
      <div
        className="
          velocity-shine resort-card-pulse relative rounded-2xl overflow-hidden
          bg-zinc-800 border-2 border-zinc-700 transition-all duration-200
          active:scale-[0.97] active:translate-y-1
        "
        style={{
          clipPath: 'polygon(0 12px, 12px 0, 100% 0, 100% calc(100%-12px), calc(100%-12px) 100%, 0 100%)',
        }}
      >
        {/* Logo 圖片區 */}
        <div className="relative h-32 bg-gradient-to-b from-zinc-700 to-zinc-800 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl">
            <img
              src={getResortLogoUrl(resort.resort_id)}
              alt={`${resort.names.zh} Logo`}
              className="max-h-20 max-w-full object-contain"
            onError={(e) => {
              const container = e.currentTarget.parentElement;
              if (container) {
                container.className = 'text-6xl';
                container.innerHTML = '🏔️';
              }
            }}
          />
          </div>
          {/* 漸層遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-800/50" />

          {/* 左上角高光 */}
          <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
        </div>

        {/* 內容區 */}
        <div className="p-5 relative">
          {/* 對角線裝飾 */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />

          {/* 標題 */}
          <h3
            className="resort-card-title text-xl font-bold text-gradient-velocity line-clamp-1 mb-1 tracking-wide transform -skew-x-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {resort.names.zh}
          </h3>

          <p className="text-xs text-zinc-400 mb-3 transform -skew-x-1">
            {resort.names.en} · 📍 {getRegionName(resort.region)}
          </p>

          {/* 亮點徽章 */}
          {resort.description && resort.description.highlights && (
            <div className="flex gap-2 flex-wrap mb-4 transform -skew-x-1">
              {resort.description.highlights.slice(0, 2).map((highlight, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-400/40 text-cyan-300 rounded text-xs font-bold tracking-wide backdrop-blur-sm skew-x-1"
                >
                  {highlight}
                </span>
              ))}
            </div>
          )}

          {/* 進度 */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">完成進度</span>
              <span className="font-semibold text-white">
                {completed} / {totalCourses}
              </span>
            </div>
            <ProgressBar
              percentage={progressPercent}
              showLabel={false}
              color={progressPercent === 100 ? 'green' : 'blue'}
            />
          </div>

          {/* 底部資訊 */}
          <div className="flex justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-700">
            <span>🎿 {totalCourses} 條雪道</span>
            {progressPercent > 0 && (
              <span className="text-cyan-400 font-medium">
                {progressPercent.toFixed(0)}% 完成
              </span>
            )}
          </div>

          {/* 底部速度條紋 */}
          <div className="absolute bottom-2 left-5 right-5 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  );
}
