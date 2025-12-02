/**
 * Recommendations Page - Glacial Futurism Design
 * 我的推薦頁面
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useRecommendations } from '../hooks/useCourseTracking';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';

export default function Recommendations() {
  const { resortId } = useParams();
  const navigate = useNavigate();
  const { recommendations, loading } = useRecommendations(resortId);
  const resortRecs = recommendations.filter(r => r.resort_id === resortId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入推薦中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(`/resorts/${resortId}`)}
              className="flex items-center gap-2 text-crystal-blue hover:text-ice-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回雪場
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            💡 我的推薦
          </h1>
          <p className="text-crystal-blue animate-slide-up stagger-1">
            查看您推薦的雪道和社群反饋
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {resortRecs.length === 0 ? (
          <Card variant="glass" className="animate-slide-up stagger-2">
            <Card.Body className="text-center py-12">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-2xl font-bold text-frost-white mb-2">還沒有推薦</h3>
              <p className="text-crystal-blue">發現一條好雪道嗎？立即推薦給其他滑雪愛好者！</p>
            </Card.Body>
          </Card>
        ) : (
          <div className="space-y-4">
            {resortRecs.map((rec, idx) => (
              <Card
                key={rec.id}
                variant="glass"
                hover
                className="animate-slide-up"
                style={{ animationDelay: `${(idx + 2) * 0.05}s` }}
              >
                <Card.Body className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="ice" size="sm">
                          #{rec.rank}
                        </Badge>
                        <h3 className="text-lg font-semibold text-frost-white">
                          {rec.course_name}
                        </h3>
                      </div>
                      {rec.reason && (
                        <p className="text-sm text-crystal-blue mt-3">
                          {rec.reason}
                        </p>
                      )}
                    </div>

                    <Badge
                      variant={rec.status === 'approved' ? 'ice' : rec.status === 'pending_review' ? 'accent' : 'pink'}
                      size="sm"
                    >
                      {rec.status === 'approved' ? '✅ 已通過' : rec.status === 'pending_review' ? '⏳ 審核中' : '❌ 未通過'}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
