/**
 * Share Card Page - Glacial Futurism Design
 * 成就分享卡片頁面
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
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
      const text = `🎉 我在滑雪平台解鎖了成就！\n\n${achievement?.icon} ${achievement?.name_zh}\n${achievement?.name_en}\n\n獲得 ${achievement?.points} 積分\n\n快來一起滑雪吧！`;
      await navigator.clipboard.writeText(text);
      alert('成就資訊已複製到剪貼板！');
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  const handleShare = async () => {
    if (!achievement) return;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `解鎖成就：${achievement.name_zh}`,
          text: `我在滑雪平台解鎖了「${achievement.name_zh}」成就，獲得${achievement.points}積分！`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('分享失敗:', err);
      }
    } else {
      handleDownload();
    }
  };

  if (!achievement) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Card variant="glass">
          <Card.Body className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">未找到成就資訊</h3>
            <Button
              variant="neon"
              onClick={() => navigate('/achievements')}
            >
              返回成就列表
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-ice-primary/10 via-transparent to-neon-purple/10">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Share Card */}
        <div ref={cardRef} className="glass-card rounded-3xl overflow-hidden shadow-2xl mb-8 animate-slide-up">
          {/* Header Background */}
          <div className="relative h-40 bg-gradient-to-r from-ice-primary via-ice-accent to-neon-purple overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-pattern" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-900 to-transparent" />
          </div>

          {/* Achievement Content */}
          <div className="px-8 pb-12 -mt-10 relative z-10">
            {/* Achievement Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/40 to-neon-purple/40 rounded-full blur-2xl" />
                <div className="relative w-36 h-36 bg-gradient-to-br from-frost-white/10 to-ice-primary/5 rounded-full flex items-center justify-center text-7xl ring-4 ring-ice-primary/50">
                  {achievement.icon}
                </div>
              </div>
            </div>

            {/* Achievement Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gradient-glacier mb-2">
                {achievement.name_zh}
              </h1>
              <p className="text-lg text-crystal-blue mb-6">{achievement.name_en}</p>
              <Badge variant="ice" size="lg">
                +{achievement.points} 積分
              </Badge>
            </div>

            {/* Achievement Description */}
            {achievement.description && (
              <div className="bg-ice-primary/10 border border-ice-primary/30 rounded-2xl p-8 mb-8">
                <p className="text-center text-crystal-blue leading-relaxed text-lg">
                  {achievement.description}
                </p>
              </div>
            )}

            {/* Achievement Details */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-ice-primary/20 to-ice-accent/20 border border-ice-primary/30 rounded-2xl p-6 text-center">
                <div className="text-sm text-crystal-blue mb-2">類別</div>
                <div className="font-semibold text-ice-primary">{achievement.category}</div>
              </div>
              <div className="bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 rounded-2xl p-6 text-center">
                <div className="text-sm text-crystal-blue mb-2">獲得時間</div>
                <div className="font-semibold text-neon-purple">
                  {formatDate(achievement.earned_at)}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="text-center pt-8 border-t border-ice-primary/20">
              <p className="text-sm text-crystal-blue mb-2">成就解鎖者</p>
              <p className="text-xl font-semibold text-gradient-glacier">
                {currentUser?.user_id ? `用戶 ${currentUser.user_id.slice(0, 8)}` : '滑雪愛好者'}
              </p>
            </div>

            {/* Branding */}
            <div className="text-center mt-8 pt-8 border-t border-ice-primary/10">
              <p className="text-xs text-crystal-blue/70">🏔️ Ski Course Tracking</p>
              <p className="text-xs text-crystal-blue/50 mt-1">滑雪課程追蹤平台</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <Card variant="glass" className="animate-slide-up stagger-2">
          <Card.Body className="flex flex-col md:flex-row gap-3">
            <Button
              variant="neon"
              onClick={handleShare}
              className="flex-1"
            >
              {typeof navigator.share === 'function' ? '📤 分享成就' : '📋 複製文本'}
            </Button>
            <Button
              variant="glass"
              onClick={() => navigate('/achievements')}
              className="flex-1"
            >
              返回成就列表
            </Button>
          </Card.Body>
        </Card>

        {/* Tip */}
        <div className="text-center text-sm text-crystal-blue mt-6 animate-slide-up stagger-3">
          <p>💡 提示：你可以截圖這張卡片分享到社交媒體</p>
        </div>
      </div>
    </div>
  );
}
