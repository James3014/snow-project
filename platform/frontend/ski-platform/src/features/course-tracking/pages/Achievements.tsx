import { useAchievements } from '../hooks/useCourseTracking';
import Card from '@/shared/components/Card';

export default function Achievements() {
  const { achievements, loading } = useAchievements();

  if (loading) return <div className="text-center py-12">載入中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">我的成就</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.length === 0 ? (
          <Card><Card.Body className="text-center py-12"><p>還沒有獲得成就，開始滑雪吧！</p></Card.Body></Card>
        ) : (
          achievements.map(ach => (
            <Card key={ach.id} className="hover:shadow-lg transition">
              <Card.Body>
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{ach.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{ach.name_zh}</h3>
                    <p className="text-sm text-gray-600">{ach.name_en}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-primary-600 font-semibold">+{ach.points} 積分</span>
                      <span className="text-xs text-gray-400">{new Date(ach.earned_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
