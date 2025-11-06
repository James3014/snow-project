import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import { formatDate } from '@/shared/utils/helpers';

export default function ShareCard() {
  const { achievementId } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const achievements = useAppSelector(state => state.courseTracking.achievements);
  const currentUser = useAppSelector(state => state.auth.user);

  const achievement = achievements.find(a => a.id === achievementId);

  useEffect(() => {
    if (!achievement && achievements.length > 0) {
      navigate('/achievements');
    }
  }, [achievement, achievements, navigate]);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      // 使用 html2canvas 或其他库来截图
      // 这里提供简单的文本复制功能
      const text = `🎉 我在滑雪平台解锁了成就！\n\n${achievement?.icon} ${achievement?.name_zh}\n${achievement?.name_en}\n\n获得 ${achievement?.points} 积分\n\n快来一起滑雪吧！`;
      await navigator.clipboard.writeText(text);
      alert('成就信息已复制到剪贴板！');
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleShare = async () => {
    if (!achievement) return;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `解锁成就：${achievement.name_zh}`,
          text: `我在滑雪平台解锁了"${achievement.name_zh}"成就，获得${achievement.points}积分！`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('分享失败:', err);
      }
    } else {
      handleDownload();
    }
  };

  if (!achievement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">未找到成就信息</p>
        <Button className="mt-4" onClick={() => navigate('/achievements')}>
          返回成就列表
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 分享卡片 */}
        <div ref={cardRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* 头部背景 */}
          <div className="h-32 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 relative">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
          </div>

          {/* 成就内容 */}
          <div className="px-8 pb-8 -mt-8">
            {/* 成就图标 */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-white rounded-full shadow-xl flex items-center justify-center text-7xl ring-4 ring-primary-100">
                {achievement.icon}
              </div>
            </div>

            {/* 成就标题 */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {achievement.name_zh}
              </h1>
              <p className="text-lg text-gray-600 mb-4">{achievement.name_en}</p>
              <div className="inline-block bg-primary-100 text-primary-700 px-6 py-2 rounded-full font-semibold text-lg">
                +{achievement.points} 积分
              </div>
            </div>

            {/* 成就描述 */}
            {achievement.description && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-gray-700 text-center leading-relaxed">
                  {achievement.description}
                </p>
              </div>
            )}

            {/* 成就详情 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">类别</div>
                <div className="font-semibold text-gray-900">{achievement.category}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">获得时间</div>
                <div className="font-semibold text-gray-900">
                  {formatDate(achievement.earned_at)}
                </div>
              </div>
            </div>

            {/* 用户信息 */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">成就解锁者</p>
              <p className="text-lg font-semibold text-gray-900">
                {currentUser?.user_id ? `用户 ${currentUser.user_id.slice(0, 8)}` : '滑雪爱好者'}
              </p>
            </div>

            {/* 品牌标识 */}
            <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400">滑雪课程追踪平台</p>
              <p className="text-xs text-gray-400 mt-1">🏔️ Ski Course Tracking</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <Card>
          <Card.Body>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleShare}
                className="flex-1"
              >
                {typeof navigator.share === 'function' ? '📤 分享成就' : '📋 复制文本'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/achievements')}
                className="flex-1"
              >
                返回列表
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* 提示信息 */}
        <div className="text-center text-sm text-gray-600">
          <p>💡 提示：你可以截图这张卡片分享到社交媒体</p>
        </div>
      </div>
    </div>
  );
}
