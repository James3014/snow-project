/**
 * User List Page
 * 用戶列表頁面
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/shared/api/adminApi';
import type { UserListResponse, UserListItem } from '@/shared/api/adminApi';

export default function UserListPage() {
  const [data, setData] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page, statusFilter, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await adminApi.listUsers({
        page,
        page_size: 20,
        search: search || undefined,
        status_filter: statusFilter || undefined,
        role_filter: roleFilter || undefined,
      });
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || '載入用戶列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!confirm(`確定要將用戶狀態改為 ${newStatus} 嗎？`)) return;

    try {
      await adminApi.updateUserStatus(userId, newStatus);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || '更新失敗');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('確定要刪除此用戶嗎？此操作無法撤銷！')) return;

    try {
      await adminApi.deleteUser(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || '刪除失敗');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">用戶管理</h1>
        <Link
          to="/admin"
          className="text-sm text-gray-600 hover:text-primary-600"
        >
          ← 返回後台首頁
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              搜尋
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="電子郵件或名稱"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              狀態
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">全部</option>
              <option value="active">啟用</option>
              <option value="inactive">停用</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              角色
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">全部</option>
              <option value="admin">管理員</option>
              <option value="user">一般用戶</option>
              <option value="coach">教練</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              搜尋
            </button>
          </div>
        </form>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">載入中...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用戶
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      程度
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      註冊時間
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.users.map((user) => (
                    <UserRow
                      key={user.user_id}
                      user={user}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  共 {data.total} 個用戶，第 {data.page} / {data.total_pages} 頁
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一頁
                  </button>
                  <button
                    onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                    disabled={page === data.total_pages}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface UserRowProps {
  user: UserListItem;
  onStatusChange: (userId: string, status: string) => void;
  onDelete: (userId: string) => void;
}

function UserRow({ user, onStatusChange, onDelete }: UserRowProps) {
  return (
    <tr>
      <td className="px-6 py-4">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {user.display_name || '未設定'}
          </div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <span
              key={role}
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                role === 'admin'
                  ? 'bg-red-100 text-red-800'
                  : role === 'coach'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {role}
            </span>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {user.experience_level || '-'}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            user.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.status === 'active' ? '啟用' : '停用'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {new Date(user.created_at).toLocaleDateString('zh-TW')}
      </td>
      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
        <Link
          to={`/admin/users/${user.user_id}`}
          className="text-primary-600 hover:text-primary-900"
        >
          查看
        </Link>
        <button
          onClick={() =>
            onStatusChange(
              user.user_id,
              user.status === 'active' ? 'inactive' : 'active'
            )
          }
          className="text-orange-600 hover:text-orange-900"
        >
          {user.status === 'active' ? '停用' : '啟用'}
        </button>
        <button
          onClick={() => onDelete(user.user_id)}
          className="text-red-600 hover:text-red-900"
        >
          刪除
        </button>
      </td>
    </tr>
  );
}
