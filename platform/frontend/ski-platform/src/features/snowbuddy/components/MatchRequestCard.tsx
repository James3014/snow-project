/**
 * Match Request Card - Glacial Futurism Design
 * 媒合請求卡片 - 冰川未來主義設計
 *
 * Glassmorphism | Status Badges | Interactive Actions
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
      pending: {
        text: '待回應',
        color: 'bg-gradient-to-r from-ice-accent/20 to-ice-primary/20 border border-ice-accent/30 text-ice-accent'
      },
      accepted: {
        text: '已接受',
        color: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300'
      },
      declined: {
        text: '已拒絕',
        color: 'bg-gradient-to-r from-neon-pink/20 to-red-500/20 border border-neon-pink/30 text-neon-pink'
      },
    };
    const badge = badges[request.status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const userId = type === 'received' ? request.requester_id : request.target_user_id;

  return (
    <div className="glass-card p-5 group relative overflow-hidden">
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-gradient-glacier font-medium">
              {userId.slice(0, 8)}...
            </h3>
            <p className="text-xs text-crystal-blue">
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
              className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 font-medium"
            >
              ✓ 接受
            </button>
            <button
              onClick={() => handleRespond('decline')}
              disabled={responding}
              className="flex-1 py-2 glass-card text-neon-pink hover:text-red-400 hover:border-neon-pink/50 transition-all disabled:opacity-50 font-medium"
            >
              ✗ 拒絕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
