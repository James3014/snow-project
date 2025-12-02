/**
 * Smart Matching Page - 智慧媒合頁面
 * Glacial Futurism Design
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
      
      // 發起搜尋
      const { search_id } = await snowbuddyApi.startSearch(preferences);
      setSearchId(search_id);
      
      // 輪詢結果
      pollResults(search_id);
    } catch (err) {
      console.error('搜尋失敗:', err);
      setError('搜尋失敗，請稍後再試');
      setSearching(false);
    }
  };

  const pollResults = async (id: string) => {
    const maxAttempts = 30; // 最多輪詢 30 次（30 秒）
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
        
        // 繼續輪詢
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
            🧠 智慧媒合
          </h1>
          <p className="text-zinc-400">
            基於技能、地點、時間、角色的智慧配對
          </p>
        </div>

        {/* 偏好設定表單 */}
        {!searchId && !results && (
          <MatchingPreferenceForm 
            onSubmit={handleStartSearch}
            loading={searching}
          />
        )}

        {/* 搜尋中 */}
        {searching && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mb-4" />
            <p className="text-cyan-400 font-medium">
              正在分析配對分數...
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              這可能需要幾秒鐘
            </p>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 mb-6">
            {error}
            <button
              onClick={handleReset}
              className="ml-4 text-sm underline hover:text-red-300"
            >
              重新搜尋
            </button>
          </div>
        )}

        {/* 媒合結果 */}
        {results && results.matches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                找到 {results.matches.length} 位匹配的雪伴
              </h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-all"
              >
                重新搜尋
              </button>
            </div>

            <div className="grid gap-4">
              {results.matches
                .sort((a, b) => b.score - a.score)
                .map(match => (
                  <MatchScoreCard key={match.user_id} match={match} />
                ))}
            </div>
          </div>
        )}

        {/* 無結果 */}
        {results && results.matches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-xl font-bold text-white mb-2">
              沒有找到匹配的雪伴
            </h3>
            <p className="text-zinc-400 mb-6">
              試試調整搜尋條件，或稍後再試
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
            >
              重新搜尋
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
