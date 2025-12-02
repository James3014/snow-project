/**
 * Match Requests Page - Glacial Futurism Design
 * 媒合請求管理頁面 - 冰川未來主義設計
 *
 * Mobile-First | Request Management | Glassmorphism
 */
import { useState, useEffect } from 'react';
import MatchRequestCard from '../components/MatchRequestCard';
import type { MatchRequest } from '@/shared/api/snowbuddyApi';

export default function MatchRequestsPage() {
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
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            媒合請求
          </h1>
          <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
            管理您的雪伴媒合請求
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Tab Toggle - Glassmorphism Style */}
        <div className="mb-8 animate-slide-up stagger-2">
          <div className="flex glass-card p-1 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 py-3 px-4 font-medium transition-all rounded ${
                activeTab === 'received'
                  ? 'bg-gradient-glacier text-frost-white'
                  : 'text-crystal-blue hover:text-ice-primary'
              }`}
            >
              📥 收到的請求
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-3 px-4 font-medium transition-all rounded ${
                activeTab === 'sent'
                  ? 'bg-gradient-glacier text-frost-white'
                  : 'text-crystal-blue hover:text-ice-primary'
              }`}
            >
              📤 發出的請求
            </button>
          </div>
        </div>

        {/* 請求列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="spinner-glacier mb-4" />
              <p className="text-crystal-blue">載入請求中...</p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="glass-card p-12 text-center animate-slide-up max-w-md mx-auto">
            <div className="text-6xl mb-6">📭</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">
              {activeTab === 'received' ? '還沒有收到請求' : '還沒有發出請求'}
            </h3>
            <p className="text-crystal-blue text-balance">
              {activeTab === 'received'
                ? '當有人向您發送媒合請求時，會顯示在這裡'
                : '您可以從智慧媒合結果向雪伴發送請求'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request, index) => (
              <div
                key={request.request_id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <MatchRequestCard
                  request={request}
                  type={activeTab}
                  onUpdate={handleUpdate}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
