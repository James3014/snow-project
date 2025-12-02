/**
 * Match Score Card - Glacial Futurism Design
 * 配對分數卡片 - 冰川未來主義設計
 *
 * Glassmorphism | Score Visualization | Interactive Requests
 */
import { useState } from 'react';
import type { MatchResult } from '@/shared/api/snowbuddyApi';
import { snowbuddyApi } from '@/shared/api/snowbuddyApi';

interface MatchScoreCardProps {
  match: MatchResult;
  userInfo?: {
    display_name: string;
    skill_level: number;
    preferred_resorts: string[];
  };
}

export default function MatchScoreCard({ match, userInfo }: MatchScoreCardProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const totalScore = Math.round(match.score * 100);

  // 根據分數決定顏色 - Glacial Futurism 版本
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-ice-accent to-ice-primary';
    if (score >= 70) return 'from-ice-primary to-ice-secondary';
    if (score >= 50) return 'from-ice-secondary to-neon-purple';
    return 'from-crystal-blue to-glacier';
  };

  const getScoreGlow = (score: number) => {
    if (score >= 90) return 'pulse-glow';
    if (score >= 70) return 'shadow-xl shadow-ice-primary/30';
    if (score >= 50) return 'shadow-lg shadow-ice-secondary/20';
    return '';
  };

  const handleSendRequest = async () => {
    try {
      setSending(true);
      await snowbuddyApi.sendMatchRequest(match.user_id);
      setSent(true);
    } catch (error) {
      console.error('發送請求失敗:', error);
      alert('發送請求失敗，請稍後再試');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`
      glass-card p-6 group relative overflow-hidden
      hover:border-ice-primary/50 transition-all ${getScoreGlow(totalScore)}
    `}>
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* 用戶資訊 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gradient-glacier">
              {userInfo?.display_name || match.user_id.slice(0, 8)}
            </h3>
            <p className="text-sm text-crystal-blue">
              技能等級: {userInfo?.skill_level || '?'}/10
            </p>
          </div>

          {/* 總分 */}
          <div className={`
            text-4xl font-black bg-gradient-to-r ${getScoreColor(totalScore)}
            bg-clip-text text-transparent
          `}>
            {totalScore}
          </div>
        </div>

        {/* 分數細節 */}
        <div className="space-y-2 mb-4">
          <ScoreBar label="技能相似度" score={match.breakdown.skill_score} weight={30} color="ice-primary" />
          <ScoreBar label="地點匹配" score={match.breakdown.location_score} weight={25} color="ice-secondary" />
          <ScoreBar label="時間重疊" score={match.breakdown.time_score} weight={20} color="neon-purple" />
          <ScoreBar label="角色匹配" score={match.breakdown.role_score} weight={15} color="neon-pink" />
          <ScoreBar label="知識相似" score={match.breakdown.knowledge_score} weight={10} color="ice-accent" />
        </div>

        {/* 發送請求按鈕 */}
        <button
          onClick={handleSendRequest}
          disabled={sending || sent}
          className={`
            w-full py-2 rounded-lg font-medium transition-all
            ${sent
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300'
              : 'btn-neon'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {sent ? '✓ 已發送請求' : sending ? '發送中...' : '💌 發送媒合請求'}
        </button>
      </div>
    </div>
  );
}

// 分數條組件 - Glacial Futurism 版本
function ScoreBar({ label, score, weight, color }: {
  label: string;
  score: number;
  weight: number;
  color: string;
}) {
  const percentage = Math.round(score * 100);

  const colorMap: Record<string, string> = {
    'ice-primary': 'bg-ice-primary',
    'ice-secondary': 'bg-ice-secondary',
    'ice-accent': 'bg-ice-accent',
    'neon-purple': 'bg-neon-purple',
    'neon-pink': 'bg-neon-pink',
  };

  return (
    <div>
      <div className="flex justify-between text-xs text-crystal-blue mb-1">
        <span>{label} ({weight}%)</span>
        <span className="text-ice-accent font-medium">{percentage}%</span>
      </div>
      <div className="h-2 bg-glass-bg border border-glacier/30 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorMap[color] || 'bg-ice-primary'} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
