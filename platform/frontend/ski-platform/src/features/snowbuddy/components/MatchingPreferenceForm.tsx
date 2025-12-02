/**
 * Matching Preference Form - 智慧媒合偏好設定表單
 * Glacial Futurism Design
 */
import { useState, useEffect } from 'react';
import { resortApiService } from '@/shared/api/resortApi';
import type { Resort } from '@/shared/data/resorts';
import type { MatchingPreference } from '@/shared/api/snowbuddyApi';

interface MatchingPreferenceFormProps {
  onSubmit: (preferences: MatchingPreference) => void;
  loading?: boolean;
}

export default function MatchingPreferenceForm({ onSubmit, loading }: MatchingPreferenceFormProps) {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [selectedResorts, setSelectedResorts] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [skillMin, setSkillMin] = useState(1);
  const [skillMax, setSkillMax] = useState(10);
  const [role, setRole] = useState<'buddy' | 'student' | 'coach'>('buddy');

  useEffect(() => {
    resortApiService.getAllResorts().then(data => setResorts(data.items));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedResorts.length === 0 || !startDate || !endDate) {
      alert('請填寫所有必填欄位');
      return;
    }

    onSubmit({
      preferred_resorts: selectedResorts,
      date_range: { start: startDate, end: endDate },
      skill_level_range: [skillMin, skillMax],
      preferred_role: role,
    });
  };

  const toggleResort = (resortId: string) => {
    setSelectedResorts(prev =>
      prev.includes(resortId)
        ? prev.filter(id => id !== resortId)
        : [...prev, resortId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-cyan-500/20">
      {/* 雪場選擇 */}
      <div>
        <label className="block text-sm font-medium text-cyan-400 mb-3">
          偏好雪場 *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {resorts.map(resort => (
            <button
              key={resort.resort_id}
              type="button"
              onClick={() => toggleResort(resort.resort_id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedResorts.includes(resort.resort_id)
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-zinc-700'
                }
              `}
            >
              {resort.name_zh}
            </button>
          ))}
        </div>
      </div>

      {/* 日期範圍 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            開始日期 *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            結束日期 *
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            required
          />
        </div>
      </div>

      {/* 技能等級範圍 */}
      <div>
        <label className="block text-sm font-medium text-cyan-400 mb-3">
          技能等級範圍: {skillMin} - {skillMax}
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="1"
            max="10"
            value={skillMin}
            onChange={(e) => setSkillMin(Math.min(Number(e.target.value), skillMax))}
            className="w-full accent-cyan-500"
          />
          <input
            type="range"
            min="1"
            max="10"
            value={skillMax}
            onChange={(e) => setSkillMax(Math.max(Number(e.target.value), skillMin))}
            className="w-full accent-blue-500"
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-2">
          <span>初級 (1-3)</span>
          <span>中級 (4-6)</span>
          <span>高級 (7-9)</span>
          <span>專家 (10)</span>
        </div>
      </div>

      {/* 角色選擇 */}
      <div>
        <label className="block text-sm font-medium text-cyan-400 mb-3">
          尋找角色
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['buddy', 'student', 'coach'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${role === r
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-zinc-700'
                }
              `}
            >
              {r === 'buddy' ? '雪伴' : r === 'student' ? '學生' : '教練'}
            </button>
          ))}
        </div>
      </div>

      {/* 提交按鈕 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '搜尋中...' : '🔍 開始智慧媒合'}
      </button>
    </form>
  );
}
