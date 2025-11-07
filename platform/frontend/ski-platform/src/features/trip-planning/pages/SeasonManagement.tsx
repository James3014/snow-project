/**
 * Season Management Page
 * 雪季管理頁面
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { tripPlanningApi } from '@/shared/api/tripPlanningApi';
import Card from '@/shared/components/Card';
import EmptyState, { ErrorEmptyState } from '@/shared/components/EmptyState';
import type { Season, SeasonCreate } from '../types';

export default function SeasonManagement() {
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.user_id);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (userId) {
      loadSeasons();
    }
  }, [userId]);

  const loadSeasons = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await tripPlanningApi.getSeasons(userId);
      setSeasons(data);
    } catch (err) {
      console.error('載入雪季失敗:', err);
      setError('載入雪季資料失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async (data: SeasonCreate) => {
    if (!userId) return;

    try {
      await tripPlanningApi.createSeason(userId, data);
      setShowCreateModal(false);
      loadSeasons();
    } catch (err) {
      console.error('創建雪季失敗:', err);
      alert('創建雪季失敗');
    }
  };

  const handleDeleteSeason = async (seasonId: string) => {
    if (!userId) return;

    if (!confirm('確定要刪除這個雪季嗎？這將刪除所有相關的行程！')) {
      return;
    }

    try {
      await tripPlanningApi.deleteSeason(seasonId, userId);
      loadSeasons();
    } catch (err) {
      console.error('刪除雪季失敗:', err);
      alert('刪除雪季失敗');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      active: { class: 'bg-green-100 text-green-800', text: '進行中' },
      completed: { class: 'bg-blue-100 text-blue-800', text: '已完成' },
      archived: { class: 'bg-gray-100 text-gray-800', text: '已封存' },
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorEmptyState message={error} onRetry={loadSeasons} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">雪季管理</h1>
          <p className="text-gray-600">管理您的滑雪季節和行程規劃</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + 創建新雪季
        </button>
      </div>

      {/* Season List */}
      {seasons.length === 0 ? (
        <EmptyState
          icon="📅"
          title="還沒有任何雪季"
          description="創建您的第一個雪季，開始規劃滑雪行程"
          action={{ label: '創建第一個雪季', onClick: () => setShowCreateModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seasons.map((season) => (
            <Card key={season.season_id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  {getStatusBadge(season.status)}
                  <button
                    onClick={() => handleDeleteSeason(season.season_id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="刪除雪季"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Season Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{season.title}</h3>
                {season.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{season.description}</p>
                )}

                {/* Date Range */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(season.start_date).toLocaleDateString('zh-TW')} - {new Date(season.end_date).toLocaleDateString('zh-TW')}
                </div>

                {/* Goals */}
                {(season.goal_trips || season.goal_resorts || season.goal_courses) && (
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">本季目標</p>
                    {season.goal_trips && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">行程數</span>
                        <span className="font-medium">{season.goal_trips} 趟</span>
                      </div>
                    )}
                    {season.goal_resorts && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">雪場數</span>
                        <span className="font-medium">{season.goal_resorts} 個</span>
                      </div>
                    )}
                    {season.goal_courses && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">雪道數</span>
                        <span className="font-medium">{season.goal_courses} 條</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => navigate(`/seasons/${season.season_id}`)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    查看詳情
                  </button>
                  <button
                    onClick={() => navigate(`/seasons/${season.season_id}/edit`)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    編輯
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Season Modal */}
      {showCreateModal && (
        <CreateSeasonModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSeason}
        />
      )}
    </div>
  );
}

// 創建雪季彈窗組件
function CreateSeasonModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: SeasonCreate) => void;
}) {
  const [formData, setFormData] = useState<SeasonCreate>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    goal_trips: undefined,
    goal_resorts: undefined,
    goal_courses: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">創建新雪季</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本資訊 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              雪季名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：2024-2025 冬季滑雪"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              雪季描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="描述這個雪季的計畫..."
            />
          </div>

          {/* 日期範圍 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                結束日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 目標設定 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">本季目標（選填）</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標行程數
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.goal_trips || ''}
                  onChange={(e) => setFormData({ ...formData, goal_trips: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標雪場數
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.goal_resorts || ''}
                  onChange={(e) => setFormData({ ...formData, goal_resorts: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標雪道數
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.goal_courses || ''}
                  onChange={(e) => setFormData({ ...formData, goal_courses: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              創建雪季
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
