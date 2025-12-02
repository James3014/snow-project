/**
 * Rankings Page - Glacial Futurism Design
 * 排行版頁面 - 冰川未來主義設計
 */
import { useParams } from 'react-router-dom';
import { useCourseRankings } from '../hooks/useCourseTracking';
import Card from '@/shared/components/Card';
import Badge from '@/shared/components/Badge';

export default function Rankings() {
  const { resortId } = useParams();
  const { rankings, loading } = useCourseRankings(resortId || 'rusutsu');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入排名中...</p>
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
            🏆 雪道人氣排名
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            查看最受歡迎的雪道和社群推薦
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="space-y-3">
          {rankings.map((ranking, idx) => (
            <Card
              key={ranking.course_name}
              variant="glass"
              hover
              className="animate-slide-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <Card.Body className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-ice-primary to-neon-purple">
                      <span className="text-lg font-bold text-frost-white">#{idx + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-frost-white">
                      {ranking.course_name}
                    </h3>
                    <p className="text-xs text-crystal-blue mt-1">
                      人氣指數: {ranking.popularity_score}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="ice">
                    🏔️ {ranking.visit_count}
                  </Badge>
                  <Badge variant="accent">
                    💡 {ranking.recommendation_count}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>

        {rankings.length === 0 && (
          <div className="glass-card p-12 text-center max-w-md mx-auto">
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">暫無排名資料</h3>
            <p className="text-crystal-blue">還沒有足夠的訪問記錄來生成排名</p>
          </div>
        )}
      </div>
    </div>
  );
}
