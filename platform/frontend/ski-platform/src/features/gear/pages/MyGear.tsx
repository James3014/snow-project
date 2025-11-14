/**
 * My Gear Page
 * 我的裝備管理頁面
 *
 * Linus 原则：简单直接，可以工作就行
 */
import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { gearApi } from '@/shared/api/gearApi';
import Card from '@/shared/components/Card';
import EmptyState from '@/shared/components/EmptyState';
import type { GearItem, GearItemCreate } from '../types';

export default function MyGear() {
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'for_sale'>('all');

  // 載入裝備列表
  const loadGear = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const statusFilter = filter === 'all' ? undefined : filter;
      const response = await gearApi.getMyGear({ status: statusFilter });
      setGearItems(response.data);
    } catch (err: any) {
      console.error('載入裝備失敗:', err);
      setError(err.response?.data?.detail || '載入裝備失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGear();
  }, [userId, filter]);

  // 建立裝備
  const handleCreate = async (data: GearItemCreate) => {
    try {
      await gearApi.createGearItem(data);
      await loadGear(); // 重新載入
      setShowCreateModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || '建立失敗');
    }
  };

  // 刪除裝備
  const handleDelete = async (itemId: string) => {
    if (!confirm('確定要刪除这个裝備吗？')) return;

    try {
      await gearApi.deleteGearItem(itemId);
      await loadGear(); // 重新載入
    } catch (err: any) {
      alert(err.response?.data?.detail || '刪除失敗');
    }
  };

  // 標記為出售
  const handleMarkForSale = async (itemId: string) => {
    const price = prompt('請輸入售價（TWD）:');
    if (!price) return;

    try {
      await gearApi.updateGearItem(itemId, {
        status: 'for_sale',
        sale_price: parseFloat(price),
        sale_currency: 'TWD',
      });
      await loadGear();
    } catch (err: any) {
      alert(err.response?.data?.detail || '更新失敗');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <div className="text-red-600 text-center py-8">{error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 标题和操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的裝備</h1>
          <p className="text-gray-600 mt-1">管理你的滑雪裝備</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 添加裝備
        </button>
      </div>

      {/* 过滤器 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          使用中
        </button>
        <button
          onClick={() => setFilter('for_sale')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'for_sale'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          待售
        </button>
      </div>

      {/* 裝備列表 */}
      {gearItems.length === 0 ? (
        <EmptyState
          icon="📦"
          title="还没有裝備"
          description="开始添加你的滑雪裝備吧"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gearItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* 裝備名称和状态 */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'for_sale'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.status === 'active'
                      ? '使用中'
                      : item.status === 'for_sale'
                      ? '待售'
                      : item.status}
                  </span>
                </div>

                {/* 裝備信息 */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {item.category && (
                    <div>
                      <span className="font-medium">類別：</span> {item.category}
                    </div>
                  )}
                  {item.brand && (
                    <div>
                      <span className="font-medium">品牌：</span> {item.brand}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">用途：</span>{' '}
                    {item.role === 'personal' ? '個人使用' : '教學用'}
                  </div>
                  {item.status === 'for_sale' && item.sale_price && (
                    <div className="text-blue-600 font-semibold">
                      售价：{item.sale_currency} ${item.sale_price}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  {item.status === 'active' && (
                    <button
                      onClick={() => handleMarkForSale(item.id)}
                      className="flex-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    >
                      標記出售
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 建立裝備 Modal */}
      {showCreateModal && (
        <CreateGearModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// 简单的建立裝備 Modal
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
      alert('请输入裝備名称');
      return;
    }
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">添加裝備</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                裝備名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="例如：Burton Custom 158"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                類別
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                品牌
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="例如：Burton"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用途
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as 'personal' | 'teaching' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="personal">個人使用</option>
                <option value="teaching">教學用</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                建立
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
