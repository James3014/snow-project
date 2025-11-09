/**
 * Smart Trip Recommendations Page
 * 智能行程推薦頁面（顯示匹配分數）
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import { resortApiService } from '@/shared/api/resortApi';
import Card from '@/shared/components/Card';
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-gray-100';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">智能推薦</h1>
        <p className="text-gray-600">根據您的行程和偏好，為您推薦最匹配的雪伴</p>
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">分析匹配中...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🤔</div>
          <p className="text-gray-600 mb-4">目前沒有推薦的行程</p>
          <p className="text-sm text-gray-500">創建您的第一個公開行程，讓系統為您尋找雪伴！</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec) => {
            const displayName = rec.trip.title || getResortName(rec.trip.resort_id);
            return (
              <Card key={rec.trip.trip_id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {displayName}
                    </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📅 {new Date(rec.trip.start_date).toLocaleDateString('zh-TW')} - {new Date(rec.trip.end_date).toLocaleDateString('zh-TW')}</span>
                    <span>👤 {rec.trip.owner_info.display_name}</span>
                    <span>👥 {rec.trip.current_buddies}/{rec.trip.max_buddies}</span>
                  </div>
                </div>

                {/* Match Score */}
                <div className={`${getScoreBg(rec.match_score.total_score)} px-6 py-4 rounded-lg text-center`}>
                  <div className={`text-3xl font-bold ${getScoreColor(rec.match_score.total_score)}`}>
                    {rec.match_score.total_score}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">匹配分數</div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{rec.match_score.time_score}</div>
                  <div className="text-xs text-gray-600">時間匹配</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{rec.match_score.location_score}</div>
                  <div className="text-xs text-gray-600">地點匹配</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{rec.match_score.experience_score}</div>
                  <div className="text-xs text-gray-600">經驗匹配</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{rec.match_score.social_score}</div>
                  <div className="text-xs text-gray-600">社交因素</div>
                </div>
              </div>

              {/* Match Reasons */}
              {rec.match_score.reasons.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">匹配原因：</h4>
                  <div className="flex flex-wrap gap-2">
                    {rec.match_score.reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/trips/${rec.trip.trip_id}`)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  查看詳情
                </button>
                <button
                  onClick={() => {
                    /* TODO: Implement buddy request */
                  }}
                  className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  申請加入
                </button>
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
