/**
 * Matching Preference Form - Glacial Futurism Design
 * 智慧媒合偏好設定表單 - 冰川未來主義設計
 *
 * Mobile-First | Multi-Step Form | Glassmorphism
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
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
      {/* 雪場選擇 */}
      <div>
        <label className="block text-sm font-medium text-ice-accent mb-3">
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
                  ? 'bg-gradient-glacier text-frost-white shadow-lg shadow-ice-primary/30'
                  : 'glass-card text-crystal-blue hover:text-ice-primary hover:border-ice-primary/50'
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
          <label className="block text-sm font-medium text-ice-accent mb-2">
            開始日期 *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-glacier"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ice-accent mb-2">
            結束日期 *
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-glacier"
            required
          />
        </div>
      </div>

      {/* 技能等級範圍 */}
      <div>
        <label className="block text-sm font-medium text-ice-accent mb-3">
          技能等級範圍: <span className="text-ice-primary font-bold">{skillMin} - {skillMax}</span>
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="1"
            max="10"
            value={skillMin}
            onChange={(e) => setSkillMin(Math.min(Number(e.target.value), skillMax))}
            className="w-full accent-ice-primary"
          />
          <input
            type="range"
            min="1"
            max="10"
            value={skillMax}
            onChange={(e) => setSkillMax(Math.max(Number(e.target.value), skillMin))}
            className="w-full accent-ice-secondary"
          />
        </div>
        <div className="flex justify-between text-xs text-crystal-blue mt-2">
          <span>初級 (1-3)</span>
          <span>中級 (4-6)</span>
          <span>高級 (7-9)</span>
          <span>專家 (10)</span>
        </div>
      </div>

      {/* 角色選擇 */}
      <div>
        <label className="block text-sm font-medium text-ice-accent mb-3">
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
                  ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-frost-white shadow-lg shadow-neon-purple/30'
                  : 'glass-card text-crystal-blue hover:text-ice-primary hover:border-ice-primary/50'
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
        className="btn-neon w-full py-3 ski-trail disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '搜尋中...' : '🔍 開始智慧媒合'}
      </button>
    </form>
  );
}
