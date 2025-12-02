/**
 * Smart Trip Recommendations Page - Glacial Futurism Design
 * 智能行程推薦頁面（顯示匹配分數）
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import type { TripRecommendation } from '../types';
import type { Resort } from '@/shared/data/resorts';

export default function TripRecommendations() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<TripRecommendation[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  useEffect(() => {
    const loadResorts = async () => {
      try {
        const response = await resortApiService.getAllResorts();
        setResorts(response.items);
      } catch (error) {
        console.error('載入雪場列表失敗:', error);
      }
    };
    loadResorts();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await tripPlanningApi.getRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error('載入推薦失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  // 建立雪場 ID 到雪場資料的映射
  const resortsMap = resorts.reduce((acc, resort) => {
    acc[resort.resort_id] = resort;
    return acc;
  }, {} as Record<string, Resort>);

  // 獲取雪場名稱（優先中文）
  const getResortName = (resortId: string) => {
    const resort = resortsMap[resortId];
    if (resort) {
      return `${resort.names.zh} ${resort.names.en}`;
    }
    return resortId;
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'ice';
    if (score >= 60) return 'accent';
    return 'pink';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">分析匹配中...</p>
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
            ✨ 智能推薦
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            根據您的行程和偏好，為您推薦最匹配的雪伴
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Empty State */}
        {recommendations.length === 0 ? (
          <Card variant="glass" className="animate-slide-up stagger-2">
            <Card.Body className="text-center py-12">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-2xl font-bold text-frost-white mb-2">目前沒有推薦的行程</h3>
              <p className="text-crystal-blue mb-6">創建您的第一個公開行程，讓系統為您尋找雪伴！</p>
              <Button
                variant="neon"
                onClick={() => navigate('/trips/create')}
              >
                建立我的第一個行程 →
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <div className="space-y-6">
            {recommendations.map((rec, idx) => {
              const displayName = rec.trip.title || getResortName(rec.trip.resort_id);
              const score = rec.match_score.total_score;

              return (
                <Card
                  key={rec.trip.trip_id}
                  variant="glass"
                  hover
                  className="animate-slide-up"
                  style={{ animationDelay: `${(idx + 1) * 0.05}s` }}
                >
                  <Card.Body className="space-y-6">
                    {/* Header with Title and Score */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-frost-white mb-2">
                          {displayName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-crystal-blue">
                          <span>👤 {rec.trip.owner_info.display_name}</span>
                          <span>📅 {new Date(rec.trip.start_date).toLocaleDateString('zh-TW')} - {new Date(rec.trip.end_date).toLocaleDateString('zh-TW')}</span>
                          <span>👥 {rec.trip.current_buddies}/{rec.trip.max_buddies}</span>
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-gradient-glacier">
                            {score}
                          </div>
                          <div className="text-xs text-crystal-blue mt-1">匹配分數</div>
                        </div>
                        <Badge variant={getScoreBadgeVariant(score as number)}>
                          {score >= 80 ? '⭐ 完美匹配' : score >= 60 ? '💫 良好匹配' : '✨ 有潛力'}
                        </Badge>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-ice-primary/10 rounded-lg p-4 text-center border border-ice-primary/20">
                        <div className="text-2xl font-bold text-ice-primary">{rec.match_score.time_score}</div>
                        <div className="text-xs text-crystal-blue mt-1">時間匹配</div>
                      </div>
                      <div className="bg-ice-accent/10 rounded-lg p-4 text-center border border-ice-accent/20">
                        <div className="text-2xl font-bold text-ice-accent">{rec.match_score.location_score}</div>
                        <div className="text-xs text-crystal-blue mt-1">地點匹配</div>
                      </div>
                      <div className="bg-neon-purple/10 rounded-lg p-4 text-center border border-neon-purple/20">
                        <div className="text-2xl font-bold text-neon-purple">{rec.match_score.experience_score}</div>
                        <div className="text-xs text-crystal-blue mt-1">經驗匹配</div>
                      </div>
                      <div className="bg-neon-pink/10 rounded-lg p-4 text-center border border-neon-pink/20">
                        <div className="text-2xl font-bold text-neon-pink">{rec.match_score.social_score}</div>
                        <div className="text-xs text-crystal-blue mt-1">社交因素</div>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    {rec.match_score.reasons.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-ice-accent mb-3">匹配原因：</h4>
                        <div className="flex flex-wrap gap-2">
                          {rec.match_score.reasons.map((reason, reasonIdx) => (
                            <Badge
                              key={reasonIdx}
                              variant="ice"
                              size="sm"
                            >
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="neon"
                        className="flex-1"
                        onClick={() => navigate(`/trips/${rec.trip.trip_id}`)}
                      >
                        查看詳情
                      </Button>
                      <Button
                        variant="glass"
                        className="flex-1"
                        onClick={() => {
                          /* TODO: Implement buddy request */
                          navigate(`/trips/${rec.trip.trip_id}?action=request`);
                        }}
                      >
                        申請加入
                      </Button>
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
