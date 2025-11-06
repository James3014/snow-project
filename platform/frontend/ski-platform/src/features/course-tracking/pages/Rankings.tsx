import { useParams } from 'react-router-dom';
import { useCourseRankings } from '../hooks/useCourseTracking';
import Card from '@/shared/components/Card';
import Badge from '@/shared/components/Badge';

export default function Rankings() {
  const { resortId } = useParams();
  const { rankings, loading } = useCourseRankings(resortId || 'rusutsu');

  if (loading) return <div className="text-center py-12">加载中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">雪道人气排名</h1>
      <div className="space-y-3">
        {rankings.map((ranking, idx) => (
          <Card key={ranking.course_name}>
            <Card.Body className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                <span className="font-medium">{ranking.course_name}</span>
              </div>
              <div className="text-right text-sm">
                <div><Badge>🏔️ {ranking.visit_count} 次访问</Badge></div>
                <div className="mt-1"><Badge variant="success">💡 {ranking.recommendation_count} 推荐</Badge></div>
                <div className="text-xs text-gray-500 mt-1">人气: {ranking.popularity_score}</div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
}
