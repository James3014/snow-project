/**
 * Leaderboard Page - Glacial Futurism Design
 * 全球排行榜頁面
 */
import { useLeaderboard } from '../hooks/useCourseTracking';
import { useAppSelector } from '@/store/hooks';
import Card from '@/shared/components/Card';

export default function Leaderboard() {
  const { leaderboard, loading } = useLeaderboard();
  const currentUserId = useAppSelector(state => state.auth.user?.user_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入排行榜中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            🏆 全球排行榜
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            與全球滑雪愛好者競爭，成為排行榜頂級高手
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {leaderboard.length === 0 ? (
          <Card variant="glass" className="animate-slide-up stagger-2">
            <Card.Body className="text-center py-12">
              <div className="text-6xl mb-4">🏔️</div>
              <h3 className="text-2xl font-bold text-frost-white mb-2">排行榜尚無數據</h3>
              <p className="text-crystal-blue">開始紀錄雪道、獲得成就來累積積分，成為第一個上榜的滑雪高手！</p>
            </Card.Body>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, idx) => {
              const isCurrentUser = entry.user_id === currentUserId;
              const medalEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';

              return (
                <Card
                  key={entry.user_id}
                  variant="glass"
                  hover
                  className={`animate-slide-up ${isCurrentUser ? 'ring-2 ring-ice-primary/50' : ''}`}
                  style={{ animationDelay: `${(idx + 2) * 0.05}s` }}
                >
                  <Card.Body className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-ice-primary/20 to-neon-purple/20 border border-ice-primary/30">
                        <span className="text-lg font-bold">
                          {medalEmoji || `#${entry.rank}`}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isCurrentUser ? 'text-ice-primary' : 'text-frost-white'}`}>
                          {entry.user_display_name}
                          {isCurrentUser && <span className="ml-2 text-xs text-crystal-blue">(你)</span>}
                        </h3>
                        <p className="text-xs text-crystal-blue mt-1">
                          {entry.resorts_count} 雪場 · {entry.courses_count} 雪道
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gradient-glacier">
                        {entry.total_points}
                      </div>
                      <div className="text-xs text-ice-accent">積分</div>
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
