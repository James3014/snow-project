/**
 * Achievements Page - Glacial Futurism Design
 * 成就頁面 - 冰川未來主義設計
 *
 * Mobile-First | Immersive Lock State | Trophy Showcase
 */
import { useAchievements } from '../hooks/useCourseTracking';
import { useAppSelector } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';

export default function Achievements() {
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const { achievements, loading } = useAchievements();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入中...</p>
        </div>
      </div>
    );
  }

  // Locked State for Unauthenticated Users
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background Floating Trophies */}
        <div className="absolute inset-0 z-0 opacity-10">
          {['🏆', '🥇', '🎖️', '⭐', '🎯', '🔥'].map((emoji, i) => (
            <div
              key={i}
              className="absolute text-6xl animate-slide-up"
              style={{
                left: `${(i * 15) + 5}%`,
                top: `${(i * 20) % 80}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '3s',
                opacity: 0.3,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Lock Screen Content */}
        <div className="relative z-10 text-center max-w-md w-full animate-slide-up">
          {/* Lock Icon with Glow */}
          <div className="inline-flex items-center justify-center w-24 h-24 mb-8 glass-card pulse-glow">
            <svg className="w-12 h-12 text-ice-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gradient-glacier mb-4">
            我的成就
          </h1>
          <p className="text-crystal-blue mb-8 text-balance">
            登入後即可查看您獲得的成就和積分！
            <br />
            開始記錄您的滑雪之旅，解鎖專屬榮耀。
          </p>

          <button
            onClick={() => navigate('/login')}
            className="btn-neon ski-trail w-full"
          >
            前往登入
          </button>

          {/* Decorative Elements */}
          <div className="mt-12 grid grid-cols-3 gap-4 opacity-50">
            {[
              { icon: '🏔️', label: '探險者' },
              { icon: '⚡', label: '速度王' },
              { icon: '🌟', label: '冰川之星' },
            ].map((achievement, i) => (
              <div
                key={i}
                className="glass-card p-4 opacity-60 blur-sm"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className="text-xs text-crystal-blue/50">{achievement.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - Show Achievements
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            我的成就
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            {achievements.length > 0
              ? `已解鎖 ${achievements.length} 個成就 • 繼續探索更多榮耀`
              : '開始您的滑雪征程，解鎖專屬成就'}
          </p>
        </div>
      </div>

      <div className="px-4">
        {achievements.length === 0 ? (
          // Empty State
          <div className="glass-card p-12 text-center animate-slide-up max-w-md mx-auto">
            <div className="text-6xl mb-6">🏆</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">
              還沒有獲得成就
            </h3>
            <p className="text-crystal-blue mb-8 text-balance">
              開始記錄滑雪、完成挑戰來獲得成就和積分！
              每一次征服雪道都是您成長的見證。
            </p>
            <button
              onClick={() => navigate('/resorts')}
              className="btn-neon ski-trail"
            >
              前往記錄
            </button>
          </div>
        ) : (
          // Achievement Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {achievements.map((ach, index) => (
              <div
                key={ach.id}
                className="glass-card p-6 group cursor-pointer relative overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-ice-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-16 h-16 mb-4 mx-auto bg-gradient-glacier rounded-full text-4xl">
                    {ach.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gradient-glacier mb-1 text-center">
                    {ach.name_zh}
                  </h3>
                  <p className="text-xs text-crystal-blue/70 text-center uppercase tracking-wider mb-4">
                    {ach.name_en}
                  </p>

                  {/* Points & Date */}
                  <div className="flex items-center justify-between pt-4 border-t border-glacier">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-ice-accent pulse-glow" />
                      <span className="text-ice-accent font-bold text-sm">+{ach.points} 積分</span>
                    </div>
                    <span className="text-xs text-crystal-blue/50">
                      {new Date(ach.earned_at).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Shine Effect */}
                <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div
                    className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary (if has achievements) */}
        {achievements.length > 0 && (
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="glass-card p-6 md:p-8 animate-slide-up stagger-3">
              <h2 className="text-xl font-bold text-frost-white mb-6 text-center">
                總覽統計
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gradient-glacier mb-2">
                    {achievements.length}
                  </div>
                  <p className="text-xs text-crystal-blue uppercase tracking-wide">成就總數</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gradient-glacier mb-2">
                    {achievements.reduce((sum, a) => sum + a.points, 0)}
                  </div>
                  <p className="text-xs text-crystal-blue uppercase tracking-wide">總積分</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gradient-glacier mb-2">
                    {achievements.filter(a => a.points >= 100).length}
                  </div>
                  <p className="text-xs text-crystal-blue uppercase tracking-wide">高級成就</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gradient-glacier mb-2">
                    {achievements.length > 0
                      ? new Date(achievements[achievements.length - 1].earned_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
                      : '-'}
                  </div>
                  <p className="text-xs text-crystal-blue uppercase tracking-wide">最新解鎖</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
