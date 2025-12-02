/**
 * Resort Card Component - Glacial Futurism with Enhanced Logo Display
 * 雪場卡片元件 - 冰川未來主義風格，優化 Logo 顯示
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
      className="block relative cursor-pointer group animate-slide-up"
    >
      <div
        className="
          glass-card rounded-2xl overflow-hidden
          transition-all duration-300
          hover:scale-[1.02] hover:shadow-2xl hover:shadow-ice-primary/20
          active:scale-[0.98]
        "
      >
        {/* Enhanced Logo Section - Larger and More Prominent */}
        <div className="relative h-48 bg-gradient-to-br from-ice-primary/5 via-ice-accent/5 to-neon-purple/5 flex items-center justify-center p-6 overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,212,255,0.1),transparent_50%)]" />
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(0,212,255,0.05)_25%,rgba(0,212,255,0.05)_50%,transparent_50%,transparent_75%,rgba(0,212,255,0.05)_75%)] bg-[length:60px_60px]" />
          </div>

          {/* Logo Container with Uniform Background */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <div
              className="
                relative
                bg-gradient-to-br from-frost-white/95 to-frost-white/90
                backdrop-blur-md
                rounded-2xl
                p-6
                shadow-2xl
                border border-ice-primary/20
                group-hover:border-ice-primary/40
                transition-all duration-300
                group-hover:shadow-ice-primary/30
                w-full
                h-full
                flex items-center justify-center
              "
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-ice-primary/0 to-ice-accent/0 group-hover:from-ice-primary/5 group-hover:to-ice-accent/5 transition-all duration-500" />

              <img
                src={getResortLogoUrl(resort.resort_id)}
                alt={`${resort.names.zh} Logo`}
                className="
                  relative z-10
                  max-h-32 w-auto max-w-full
                  object-contain
                  drop-shadow-lg
                  transition-transform duration-300
                  group-hover:scale-105
                "
                onError={(e) => {
                  const target = e.currentTarget;
                  const container = target.parentElement;
                  if (container) {
                    // Replace with emoji fallback
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'text-8xl';
                    fallback.textContent = '🏔️';
                    container.appendChild(fallback);
                  }
                }}
              />
            </div>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/30 pointer-events-none" />

          {/* Corner Accent */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-ice-primary/10 to-transparent pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
        </div>

        {/* Content Section */}
        <div className="p-6 relative">
          {/* Diagonal Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-ice-accent/5 to-transparent pointer-events-none" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />

          {/* Title */}
          <h3 className="text-2xl font-bold text-gradient-glacier line-clamp-2 mb-2 leading-tight">
            {resort.names.zh}
          </h3>

          <p className="text-sm text-crystal-blue mb-4">
            {resort.names.en} · 📍 {getRegionName(resort.region)}
          </p>

          {/* Highlights */}
          {resort.description && resort.description.highlights && (
            <div className="flex gap-2 flex-wrap mb-5">
              {resort.description.highlights.slice(0, 2).map((highlight, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-gradient-to-r from-ice-primary/20 to-ice-accent/20 border border-ice-primary/30 text-ice-accent rounded-full text-xs font-semibold backdrop-blur-sm"
                >
                  ✨ {highlight}
                </span>
              ))}
            </div>
          )}

          {/* Progress */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-crystal-blue">完成進度</span>
              <span className="font-bold text-ice-primary">
                {completed} / {totalCourses}
              </span>
            </div>
            <div className="relative">
              <ProgressBar
                percentage={progressPercent}
                showLabel={false}
                color={progressPercent === 100 ? 'green' : 'blue'}
              />
              {/* Enhanced Progress Bar Glow */}
              {progressPercent > 0 && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-ice-primary/20 to-ice-accent/20 rounded-full blur-sm -z-10"
                  style={{ width: `${progressPercent}%` }}
                />
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex justify-between items-center text-sm pt-4 border-t border-ice-primary/20">
            <span className="text-crystal-blue flex items-center gap-1">
              🎿 <span className="font-medium">{totalCourses}</span> 條雪道
            </span>
            {progressPercent > 0 && (
              <span className="text-ice-accent font-bold text-lg">
                {progressPercent.toFixed(0)}%
              </span>
            )}
          </div>

          {/* Bottom Accent Line */}
          <div className="absolute bottom-3 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-ice-primary/30 to-transparent rounded-full group-hover:via-ice-primary/50 transition-all" />
        </div>
      </div>
    </div>
  );
}
