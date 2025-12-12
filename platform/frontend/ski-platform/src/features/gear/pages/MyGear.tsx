/**
 * My Gear Page - Glacial Futurism Design
 * 我的裝備管理頁面 - 冰川未來主義設計
 *
 * Mobile-First | Equipment Cards | Lock Screen
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { gearApi } from '@/shared/api/gearApi';
import GearReminders from '../components/GearReminders';
import type { GearItem, GearItemCreate } from '../types';

export default function MyGear() {
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'for_sale'>('all');
  const [activeTab, setActiveTab] = useState<'gear' | 'reminders'>('gear');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadGear = async () => {
      try {
        setLoading(true);
        setError(null);

        const statusFilter = filter === 'all' ? undefined : filter;
        const response = await gearApi.getMyGear({ status: statusFilter });
        setGearItems(response.data);
      } catch (err) {
        console.error('載入裝備失敗:', err);
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || '載入裝備失敗，請稍後重試');
      } finally {
        setLoading(false);
      }
    };

    loadGear();
  }, [userId, filter]);

  const handleCreate = async (data: GearItemCreate) => {
    try {
      await gearApi.createGearItem(data);
      setFilter((prev) => prev);
      setShowCreateModal(false);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || '建立失敗');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('確定要刪除這個裝備嗎？')) return;

    try {
      await gearApi.deleteGearItem(itemId);
      setFilter((prev) => prev);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || '刪除失敗');
    }
  };

  const handleMarkForSale = async (itemId: string) => {
    const price = prompt('請輸入售價（TWD）:');
    if (!price) return;

    try {
      await gearApi.updateGearItem(itemId, {
        status: 'for_sale',
        sale_price: parseFloat(price),
        sale_currency: 'TWD',
      });
      setFilter((prev) => prev);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || '更新失敗');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入裝備中...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Lock Screen
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-5">
          {['🎿', '🏂', '⛷️', '🥽', '🎽', '🧤'].map((emoji, i) => (
            <div
              key={i}
              className="absolute text-6xl animate-slide-up"
              style={{
                left: `${(i * 15) + 5}%`,
                top: `${(i * 20) % 80}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: '3s',
                opacity: 0.3,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Lock Content */}
        <div className="relative z-10 text-center max-w-md w-full animate-slide-up">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-8 glass-card pulse-glow">
            <svg className="w-12 h-12 text-ice-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gradient-glacier mb-4">
            我的裝備
          </h1>
          <p className="text-crystal-blue mb-8 text-balance">
            登入後即可管理您的滑雪裝備
            <br />
            紀錄裝備資訊、追蹤使用狀態
          </p>

          <button onClick={() => navigate('/login')} className="btn-neon ski-trail w-full">
            前往登入
          </button>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen pb-20">
        <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
              我的裝備
            </h1>
          </div>
        </div>

        <div className="px-4 max-w-md mx-auto">
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="text-6xl mb-6">⚠️</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">載入失敗</h3>
            <p className="text-crystal-blue mb-8">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-neon w-full">
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
                我的裝備
              </h1>
              <p className="text-crystal-blue text-sm md:text-base animate-slide-up stagger-1">
                管理您的滑雪裝備，追蹤使用狀態
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-neon ski-trail flex-shrink-0 animate-slide-up stagger-2"
            >
              + 添加裝備
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto">
        {/* Main Tabs */}
        <div className="mb-6 animate-slide-up stagger-2">
          <div className="flex gap-4 border-b border-glacier">
            <button
              onClick={() => setActiveTab('gear')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'gear'
                  ? 'text-ice-primary border-ice-primary'
                  : 'text-crystal-blue border-transparent hover:text-ice-primary'
              }`}
            >
              📦 我的裝備
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'reminders'
                  ? 'text-ice-primary border-ice-primary'
                  : 'text-crystal-blue border-transparent hover:text-ice-primary'
              }`}
            >
              ⏰ 提醒事項
            </button>
          </div>
        </div>

        {activeTab === 'gear' && (
          <>
            {/* Filter Pills */}
            <div className="mb-8 animate-slide-up stagger-3">
              <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`filter-pill scroll-snap-item flex-shrink-0 ${
                    filter === 'all' ? 'active' : ''
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`filter-pill scroll-snap-item flex-shrink-0 ${
                    filter === 'active' ? 'active' : ''
                  }`}
                >
                  使用中
                </button>
                <button
                  onClick={() => setFilter('for_sale')}
                  className={`filter-pill scroll-snap-item flex-shrink-0 ${
                    filter === 'for_sale' ? 'active' : ''
                  }`}
                >
                  💰 待售
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'gear' && (
          <>
            {/* Gear Grid */}
        {gearItems.length === 0 ? (
          <div className="glass-card p-12 text-center animate-slide-up max-w-md mx-auto">
            <div className="text-6xl mb-6">📦</div>
            <h3 className="text-2xl font-bold text-frost-white mb-4">
              還沒有裝備
            </h3>
            <p className="text-crystal-blue mb-8 text-balance">
              開始添加您的滑雪裝備，紀錄裝備資訊
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn-neon w-full">
              添加第一個裝備
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gearItems.map((item, index) => {
              let statusBadgeClass = 'bg-glass-bg border border-glacier text-crystal-blue';
              if (item.status === 'active') {
                statusBadgeClass = 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300';
              } else if (item.status === 'for_sale') {
                statusBadgeClass = 'bg-gradient-to-r from-ice-accent/20 to-ice-primary/20 border border-ice-accent/30 text-ice-accent';
              }

              return (
                <div
                  key={item.id}
                  className="glass-card p-5 group relative overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gradient-glacier flex-1">{item.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass} ml-2`}>
                        {item.status === 'active' ? '使用中' : item.status === 'for_sale' ? '待售' : item.status}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm text-crystal-blue mb-4">
                      {item.category && (
                        <div className="flex items-center gap-2">
                          <span className="text-ice-accent">類別：</span>
                          <span className="text-frost-white">{item.category}</span>
                        </div>
                      )}
                      {item.brand && (
                        <div className="flex items-center gap-2">
                          <span className="text-ice-accent">品牌：</span>
                          <span className="text-frost-white">{item.brand}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-ice-accent">用途：</span>
                        <span className="text-frost-white">
                          {item.role === 'personal' ? '個人使用' : '教學用'}
                        </span>
                      </div>
                      {item.status === 'for_sale' && item.sale_price && (
                        <div className="flex items-center gap-2 text-ice-accent font-semibold pt-2 border-t border-glacier">
                          <span>💰 售價：</span>
                          <span>{item.sale_currency} ${item.sale_price}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {item.status === 'active' && (
                        <button
                          onClick={() => handleMarkForSale(item.id)}
                          className="flex-1 px-3 py-2 text-sm glass-card text-ice-accent hover:text-ice-primary transition-colors font-medium"
                        >
                          標記出售
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-2 text-sm glass-card text-neon-pink hover:text-red-400 transition-colors font-medium"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>
        )}

        {activeTab === 'reminders' && userId && (
          <div className="animate-slide-up stagger-3">
            <GearReminders userId={userId} />
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateGearModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// Create Gear Modal
function CreateGearModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: GearItemCreate) => void;
}) {
  const [formData, setFormData] = useState<GearItemCreate>({
    name: '',
    category: '',
    brand: '',
    role: 'personal',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('請輸入裝備名稱');
      return;
    }
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-bg-deep-space/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="glass-card p-6 md:p-8 w-full max-w-md animate-slide-up">
        <h2 className="text-2xl font-bold text-gradient-glacier mb-6">添加裝備</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-crystal-blue mb-2">
              裝備名稱 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-glacier"
              placeholder="例如：Burton Custom 158"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-crystal-blue mb-2">
              類別
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-glacier"
            >
              <option value="">請選擇</option>
              <option value="board">單板</option>
              <option value="binding">固定器</option>
              <option value="boots">雪靴</option>
              <option value="helmet">頭盔</option>
              <option value="goggles">雪鏡</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-crystal-blue mb-2">
              品牌
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="input-glacier"
              placeholder="例如：Burton"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-crystal-blue mb-2">
              用途
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as 'personal' | 'teaching' })
              }
              className="input-glacier"
            >
              <option value="personal">個人使用</option>
              <option value="teaching">教學用</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass-card px-4 py-3 text-crystal-blue hover:text-ice-primary transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 btn-neon"
            >
              建立
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
