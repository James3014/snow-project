/**
 * Admin Dashboard
 * 管理員後台首頁
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/shared/api/adminApi';
import type { Statistics } from '@/shared/api/adminApi';

export default function AdminDashboard() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getStatistics();
      setStatistics(data);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err.response as { data?: { detail?: string } })?.data?.detail || '載入統計資料失敗'
        : '載入統計資料失敗';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">管理後台</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="總用戶數"
          value={statistics?.total_users || 0}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="活躍用戶"
          value={statistics?.active_users || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          title="7天新用戶"
          value={statistics?.new_users_last_7_days || 0}
          icon="📈"
          color="purple"
        />
        <StatCard
          title="30天新用戶"
          value={statistics?.new_users_last_30_days || 0}
          icon="📊"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="text-2xl mb-2">👤</div>
            <h3 className="font-medium text-gray-900">用戶管理</h3>
            <p className="text-sm text-gray-600">查看和管理所有用戶</p>
          </Link>

          <Link
            to="/admin/ai-config"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-medium text-gray-900">AI 助手配置</h3>
            <p className="text-sm text-gray-600">配置 AI 模型和 API Key</p>
          </Link>

          <div className="block p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-medium text-gray-500">統計報表</h3>
            <p className="text-sm text-gray-400">即將推出</p>
          </div>
        </div>
      </div>

      {/* Experience Level Distribution */}
      {statistics && statistics.users_by_experience_level && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">用戶程度分布</h2>
          <div className="space-y-3">
            {Object.entries(statistics.users_by_experience_level).map(([level, count]) => (
              <div key={level} className="flex items-center">
                <div className="w-32 text-sm text-gray-600 capitalize">{level}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-primary-600 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${(count / (statistics.total_users || 1)) * 100}%`,
                    }}
                  >
                    <span className="text-xs text-white font-medium">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className={`text-4xl ${colorClasses[color]} rounded-full w-16 h-16 flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
