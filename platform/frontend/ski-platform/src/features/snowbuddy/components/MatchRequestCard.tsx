/**
 * Match Request Card - 媒合請求卡片
 */
import { useState } from 'react';
import { snowbuddyApi } from '@/shared/api/snowbuddyApi';
import type { MatchRequest } from '@/shared/api/snowbuddyApi';

interface MatchRequestCardProps {
  request: MatchRequest;
  type: 'received' | 'sent';
  onUpdate?: () => void;
}

export default function MatchRequestCard({ request, type, onUpdate }: MatchRequestCardProps) {
  const [responding, setResponding] = useState(false);

  const handleRespond = async (action: 'accept' | 'decline') => {
    try {
      setResponding(true);
      await snowbuddyApi.respondToRequest(request.request_id, action);
      onUpdate?.();
    } catch (err) {
      console.error('回應失敗:', err);
      alert('操作失敗，請稍後再試');
    } finally {
      setResponding(false);
    }
  };

  const getStatusBadge = () => {
    const badges = {
      pending: { text: '待回應', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
      accepted: { text: '已接受', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
      declined: { text: '已拒絕', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
    };
    const badge = badges[request.status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const userId = type === 'received' ? request.requester_id : request.target_user_id;

  return (
    <div className="p-4 bg-zinc-900/50 backdrop-blur-md rounded-xl border border-cyan-500/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-medium">
            {userId.slice(0, 8)}...
          </h3>
          <p className="text-xs text-zinc-500">
            {new Date(request.created_at).toLocaleDateString('zh-TW')}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {type === 'received' && request.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => handleRespond('accept')}
            disabled={responding}
            className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
          >
            ✓ 接受
          </button>
          <button
            onClick={() => handleRespond('decline')}
            disabled={responding}
            className="flex-1 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50"
          >
            ✗ 拒絕
          </button>
        </div>
      )}
    </div>
  );
}
