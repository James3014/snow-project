/**
 * Match Score Card - 配對分數卡片
 * Glacial Futurism Design
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
  
  // 根據分數決定顏色
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-yellow-400 to-orange-500';
    if (score >= 70) return 'from-cyan-400 to-blue-500';
    if (score >= 50) return 'from-blue-400 to-purple-500';
    return 'from-zinc-400 to-zinc-600';
  };

  const getScoreGlow = (score: number) => {
    if (score >= 90) return 'shadow-2xl shadow-yellow-500/50';
    if (score >= 70) return 'shadow-xl shadow-cyan-500/50';
    if (score >= 50) return 'shadow-lg shadow-blue-500/30';
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
      p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-cyan-500/20
      hover:border-cyan-500/50 transition-all ${getScoreGlow(totalScore)}
    `}>
      {/* 用戶資訊 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            {userInfo?.display_name || match.user_id.slice(0, 8)}
          </h3>
          <p className="text-sm text-zinc-400">
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
        <ScoreBar label="技能相似度" score={match.breakdown.skill_score} weight={30} color="cyan" />
        <ScoreBar label="地點匹配" score={match.breakdown.location_score} weight={25} color="blue" />
        <ScoreBar label="時間重疊" score={match.breakdown.time_score} weight={20} color="purple" />
        <ScoreBar label="角色匹配" score={match.breakdown.role_score} weight={15} color="pink" />
        <ScoreBar label="知識相似" score={match.breakdown.knowledge_score} weight={10} color="indigo" />
      </div>

      {/* 發送請求按鈕 */}
      <button
        onClick={handleSendRequest}
        disabled={sending || sent}
        className={`
          w-full py-2 rounded-lg font-medium transition-all
          ${sent
            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
            : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/50'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {sent ? '✓ 已發送請求' : sending ? '發送中...' : '💌 發送媒合請求'}
      </button>
    </div>
  );
}

// 分數條組件
function ScoreBar({ label, score, weight, color }: { 
  label: string; 
  score: number; 
  weight: number; 
  color: string;
}) {
  const percentage = Math.round(score * 100);
  
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>{label} ({weight}%)</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorMap[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
