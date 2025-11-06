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

  if (loading) return <div className="text-center py-12">載入中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">我的推荐</h1>
        <Button onClick={() => navigate(`/resorts/${resortId}`)}>返回</Button>
      </div>
      {resortRecs.length === 0 ? (
        <Card><Card.Body className="text-center py-12"><p>還沒有推薦</p></Card.Body></Card>
      ) : (
        <div className="space-y-4">
          {resortRecs.map(rec => (
            <Card key={rec.id}>
              <Card.Body>
                <div className="flex justify-between">
                  <div><Badge>#{rec.rank}</Badge> <span className="font-semibold">{rec.course_name}</span></div>
                  <Badge variant={rec.status === 'approved' ? 'success' : 'warning'}>{rec.status}</Badge>
                </div>
                {rec.reason && <p className="text-gray-600 mt-2">{rec.reason}</p>}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
