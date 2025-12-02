/**
 * Smart Matching Page - Glacial Futurism Design
 * 智慧媒合頁面 - 冰川未來主義設計
 *
 * Mobile-First | AI Matching | Real-time Results
 */
import { useState } from 'react';
import { snowbuddyApi } from '@/shared/api/snowbuddyApi';
import type { MatchingPreference, SearchResult } from '@/shared/api/snowbuddyApi';
import MatchingPreferenceForm from '../components/MatchingPreferenceForm';
import MatchScoreCard from '../components/MatchScoreCard';

export default function SmartMatchingPage() {
  const [searchId, setSearchId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartSearch = async (preferences: MatchingPreference) => {
    try {
      setSearching(true);
      setError(null);

      const { search_id } = await snowbuddyApi.startSearch(preferences);
      setSearchId(search_id);

      pollResults(search_id);
    } catch (err) {
      console.error('搜尋失敗:', err);
      setError('搜尋失敗，請稍後再試');
      setSearching(false);
    }
  };

  const pollResults = async (id: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const result = await snowbuddyApi.getSearchResults(id);

        if (result.status === 'completed') {
          setResults(result);
          setSearching(false);
          return;
        }

        if (result.status === 'failed') {
          setError('媒合失敗，請重試');
          setSearching(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setError('搜尋超時，請重試');
          setSearching(false);
        }
      } catch (err) {
        console.error('查詢結果失敗:', err);
        setError('查詢結果失敗');
        setSearching(false);
      }
    };

    poll();
  };

  const handleReset = () => {
    setSearchId(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            🧠 智慧媒合
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            基於技能、地點、時間、角色的智慧配對
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Preference Form */}
        {!searchId && !results && (
          <div className="animate-slide-up stagger-2">
            <MatchingPreferenceForm
              onSubmit={handleStartSearch}
              loading={searching}
            />
          </div>
        )}

        {/* Searching State */}
        {searching && (
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="spinner-glacier mb-6" />
            <p className="text-ice-primary font-medium text-lg mb-2">
              正在分析配對分數...
            </p>
            <p className="text-crystal-blue text-sm">
              這可能需要幾秒鐘
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="glass-card p-6 mb-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-neon-pink/20 to-red-500/20 border border-neon-pink/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-neon-pink font-medium">{error}</p>
              </div>
              <button
                onClick={handleReset}
                className="glass-card px-4 py-2 text-ice-primary hover:text-ice-accent transition-colors font-medium text-sm"
              >
                重新搜尋
              </button>
            </div>
          </div>
        )}

        {/* Match Results */}
        {results && results.matches.length > 0 && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 animate-slide-up">
              <h2 className="text-2xl font-bold text-gradient-glacier">
                找到 {results.matches.length} 位匹配的雪伴
              </h2>
              <button
                onClick={handleReset}
                className="btn-neon flex-shrink-0"
              >
                重新搜尋
              </button>
            </div>

            <div className="grid gap-4">
              {results.matches
                .sort((a, b) => b.score - a.score)
                .map((match, index) => (
                  <div
                    key={match.user_id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <MatchScoreCard match={match} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {results && results.matches.length === 0 && (
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="text-6xl mb-6">😔</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">
              沒有找到匹配的雪伴
            </h3>
            <p className="text-crystal-blue mb-8 text-balance">
              試試調整搜尋條件，或稍後再試
            </p>
            <button
              onClick={handleReset}
              className="btn-neon ski-trail"
            >
              重新搜尋
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
