/**
 * Match Requests Page - 媒合請求管理頁面
 */
import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import MatchRequestCard from '../components/MatchRequestCard';
import type { MatchRequest } from '@/shared/api/snowbuddyApi';

export default function MatchRequestsPage() {
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const loadRequests = async () => {
    // TODO: 實作從 user-core 查詢請求
    // 目前使用 mock 資料
    setLoading(false);
    setRequests([]);
  };

  const handleUpdate = () => {
    loadRequests();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
          媒合請求
        </h1>

        {/* Tab 切換 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('received')}
            className={`
              flex-1 py-3 rounded-lg font-medium transition-all
              ${activeTab === 'received'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
              }
            `}
          >
            收到的請求
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`
              flex-1 py-3 rounded-lg font-medium transition-all
              ${activeTab === 'sent'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
              }
            `}
          >
            發出的請求
          </button>
        </div>

        {/* 請求列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-zinc-400">
              {activeTab === 'received' ? '還沒有收到請求' : '還沒有發出請求'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map(request => (
              <MatchRequestCard
                key={request.request_id}
                request={request}
                type={activeTab}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
