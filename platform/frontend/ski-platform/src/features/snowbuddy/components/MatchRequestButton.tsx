/**
 * Match Request Button - 媒合請求按鈕
 */
import { useState } from 'react';
import { snowbuddyApi } from '@/shared/api/snowbuddyApi';

interface MatchRequestButtonProps {
  targetUserId: string;
  onSuccess?: () => void;
}

export default function MatchRequestButton({ targetUserId, onSuccess }: MatchRequestButtonProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    try {
      setSending(true);
      setError(null);
      await snowbuddyApi.sendMatchRequest(targetUserId);
      setSent(true);
      onSuccess?.();
    } catch (err) {
      console.error('發送請求失敗:', err);
      setError('發送失敗');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <button
        disabled
        className="w-full py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg font-medium"
      >
        ✓ 已發送請求
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
      >
        {sending ? '發送中...' : '💌 發送媒合請求'}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
