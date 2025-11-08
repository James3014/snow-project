import { useAchievements } from '../hooks/useCourseTracking';
import { useAppSelector } from '@/store/hooks';
import Card from '@/shared/components/Card';
import EmptyState from '@/shared/components/EmptyState';

export default function Achievements() {
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const { achievements, loading } = useAchievements();

  if (loading) return <div className="text-center py-12">載入中...</div>;

  // 未登入用戶提示
  if (!userId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">我的成就</h1>
        <EmptyState
          icon="🔐"
          title="需要登入"
          description="登入後即可查看您獲得的成就和積分！"
          actionText="前往登入"
          actionLink="/login"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">我的成就</h1>
      {achievements.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="還沒有獲得成就"
          description="開始記錄滑雪、完成挑戰來獲得成就和積分！"
          actionText="前往記錄"
          actionLink="/resorts"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map(ach => (
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
          ))}
        </div>
      )}
    </div>
  );
}
