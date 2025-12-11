/**
 * useMyGear - 裝備管理數據 hook
 */
import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { gearApi } from '@/shared/api/gearApi';
import type { GearItem, GearItemCreate } from '../types';

type FilterType = 'all' | 'active' | 'for_sale';

export function useMyGear() {
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const loadGear = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
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
  }, [userId, filter]);

  useEffect(() => {
    loadGear();
  }, [loadGear]);

  const handleCreate = useCallback(async (data: GearItemCreate) => {
    try {
      await gearApi.createGearItem(data);
      await loadGear();
      setShowCreateModal(false);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || '建立失敗');
    }
  }, [loadGear]);

  const handleDelete = useCallback(async (itemId: string) => {
    if (!confirm('確定要刪除這個裝備嗎？')) return;
    try {
      await gearApi.deleteGearItem(itemId);
      await loadGear();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || '刪除失敗');
    }
  }, [loadGear]);

  const handleMarkForSale = useCallback(async (itemId: string) => {
    const price = prompt('請輸入售價（TWD）:');
    if (!price) return;
    try {
      await gearApi.updateGearItem(itemId, {
        status: 'for_sale',
        sale_price: parseFloat(price),
        sale_currency: 'TWD',
      });
      await loadGear();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || '更新失敗');
    }
  }, [loadGear]);

  const handleMarkSold = useCallback(async (itemId: string) => {
    if (!confirm('確定要標記為已售出嗎？')) return;
    try {
      await gearApi.updateGearItem(itemId, { status: 'retired' });
      await loadGear();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || '更新失敗');
    }
  }, [loadGear]);

  return {
    userId,
    gearItems,
    loading,
    error,
    filter,
    showCreateModal,
    setFilter,
    setShowCreateModal,
    handleCreate,
    handleDelete,
    handleMarkForSale,
    handleMarkSold,
  };
}
