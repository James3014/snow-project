/**
 * Share Card Preview Modal
 * 分享卡片預覽模態框 - 生成並分享精美的滑雪成就卡片
 */
import { useState, useEffect } from 'react';
import Button from '@/shared/components/Button';
import { courseTrackingApi } from '../api/courseTrackingApi';

interface ShareCardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'course' | 'achievement' | 'progress';
  data: {
    visitId?: string;
    achievementId?: string;
    userId?: string;
    resortId?: string;
    courseName?: string;
    resortName?: string;
  };
}

export default function ShareCardPreviewModal({
  isOpen,
  onClose,
  type,
  data,
}: ShareCardPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      generateCard();
    } else {
      // 清理
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
      }
      setError(null);
    }
  }, [isOpen]);

  const generateCard = async () => {
    setLoading(true);
    setError(null);

    try {
      let blob: Blob;

      switch (type) {
        case 'course':
          if (!data.visitId) throw new Error('缺少 visitId');
          blob = await courseTrackingApi.shareCards.generateCourseCompletionCard(
            data.visitId,
            true
          );
          break;

        case 'achievement':
          if (!data.achievementId) throw new Error('缺少 achievementId');
          blob = await courseTrackingApi.shareCards.generateAchievementCard(
            data.achievementId
          );
          break;

        case 'progress':
          if (!data.userId || !data.resortId) throw new Error('缺少 userId 或 resortId');
          blob = await courseTrackingApi.shareCards.generateProgressMilestoneCard(
            data.userId,
            data.resortId
          );
          break;

        default:
          throw new Error('未知的卡片類型');
      }

      // 創建預覽 URL
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err: any) {
      console.error('生成分享卡片失敗:', err);
      setError(err.message || '生成失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `滑雪成就_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareLine = () => {
    if (!imageUrl) return;

    // LINE 分享文字
    const text = getShareText();
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank');

    // 注意：LINE 不支持直接分享圖片 URL，需要先下載圖片
    alert('請先下載圖片，然後在 LINE 中手動傳送圖片');
  };

  const handleShareFacebook = () => {
    // Facebook 分享（分享當前頁面）
    const url = window.location.href;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyText = () => {
    const text = getShareText();
    navigator.clipboard.writeText(text).then(() => {
      alert('✓ 已複製到剪貼板！');
    });
  };

  const getShareText = () => {
    switch (type) {
      case 'course':
        return `🎉 我完成了 ${data.resortName || ''} 的 ${data.courseName || ''} 雪道！\n\n快來一起滑雪吧！`;
      case 'achievement':
        return `🏆 我解鎖了新成就！\n\n快來看看我的滑雪成就！`;
      case 'progress':
        return `⭐ 我在 ${data.resortName || ''} 又進步了！\n\n持續挑戰更多雪道中！`;
      default:
        return '分享我的滑雪冒險！';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">✨ 分享你的成就</h2>
          <p className="text-white/90 mt-1 text-sm">AI 生成精美分享卡片</p>
        </div>

        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium">🎨 AI 正在創作中...</p>
              <p className="text-sm text-gray-500 mt-2">使用 Google Imagen 3 生成</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <div className="text-5xl mb-3">😢</div>
              <p className="text-red-600 font-medium mb-2">生成失敗</p>
              <p className="text-sm text-red-500">{error}</p>
              <Button
                onClick={generateCard}
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                🔄 重新生成
              </Button>
            </div>
          )}

          {/* Image Preview */}
          {imageUrl && !loading && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
                <img
                  src={imageUrl}
                  alt="分享卡片預覽"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>

              {/* Share Text Preview */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-semibold mb-2">📝 分享文字</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{getShareText()}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Download */}
                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3"
                >
                  💾 下載圖片
                </Button>

                {/* Share Options */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={handleShareLine}
                    variant="secondary"
                    className="bg-green-500 hover:bg-green-600 text-white border-0 text-sm py-2"
                  >
                    <span className="text-lg">📱</span>
                    <br />
                    LINE
                  </Button>
                  <Button
                    onClick={handleShareFacebook}
                    variant="secondary"
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-sm py-2"
                  >
                    <span className="text-lg">📘</span>
                    <br />
                    Facebook
                  </Button>
                  <Button
                    onClick={handleCopyText}
                    variant="secondary"
                    className="bg-gray-600 hover:bg-gray-700 text-white border-0 text-sm py-2"
                  >
                    <span className="text-lg">📋</span>
                    <br />
                    複製文字
                  </Button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                <p className="font-semibold mb-1">💡 分享小提示：</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>下載圖片後可直接分享到任何社交媒體</li>
                  <li>複製分享文字搭配圖片效果更好</li>
                  <li>每次生成的卡片都是獨一無二的！</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full"
          >
            關閉
          </Button>
        </div>
      </div>
    </div>
  );
}
