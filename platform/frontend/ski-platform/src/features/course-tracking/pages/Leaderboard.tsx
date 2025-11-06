import { useLeaderboard } from '../hooks/useCourseTracking';
import { useAppSelector } from '@/store/hooks';
import Card from '@/shared/components/Card';

export default function Leaderboard() {
  const { leaderboard, loading } = useLeaderboard();
  const currentUserId = useAppSelector(state => state.auth.user?.user_id);

  if (loading) return <div className="text-center py-12">加载中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">全球排行榜</h1>
      <div className="space-y-2">
        {leaderboard.map(entry => (
          <Card key={entry.user_id} className={entry.user_id === currentUserId ? 'ring-2 ring-primary-500' : ''}>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold ${entry.rank <= 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                    #{entry.rank}
                  </span>
                  <div>
                    <div className="font-semibold">{entry.user_display_name}</div>
                    <div className="text-xs text-gray-500">{entry.resorts_count} 雪场 · {entry.courses_count} 雪道</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">{entry.total_points}</div>
                  <div className="text-xs text-gray-500">积分</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
}
