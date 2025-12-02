/**
 * User List Page - Glacial Futurism Design
 * 用戶列表頁面
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '@/shared/api/adminApi';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import type { UserListResponse, UserListItem } from '@/shared/api/adminApi';

export default function UserListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const loadUsers = useCallback(async () => {
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
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err.response as { data?: { detail?: string } })?.data?.detail || '載入用戶列表失敗'
        : '載入用戶列表失敗';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err.response as { data?: { detail?: string } })?.data?.detail || '更新失敗'
        : '更新失敗';
      alert(errorMessage);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('確定要刪除此用戶嗎？此操作無法撤銷！')) return;

    try {
      await adminApi.deleteUser(userId);
      loadUsers();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err.response as { data?: { detail?: string } })?.data?.detail || '刪除失敗'
        : '刪除失敗';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入用戶列表中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
              👥 用戶管理
            </h1>
            <p className="text-crystal-blue animate-slide-up stagger-1">
              查看、搜尋和管理所有用戶帳戶
            </p>
          </div>
          <Link
            to="/admin"
            className="flex items-center gap-2 text-crystal-blue hover:text-ice-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回後台
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Filters Card */}
        <Card variant="glass" className="mb-8 animate-slide-up stagger-2">
          <Card.Body>
            <form onSubmit={handleSearch} className="space-y-4">
              <h2 className="text-xl font-semibold text-frost-white">篩選條件</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-crystal-blue mb-2">
                    搜尋
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="電子郵件或名稱"
                    className="w-full px-4 py-2 rounded-lg bg-frost-white/5 border border-ice-primary/30 text-frost-white placeholder-crystal-blue/50 focus:outline-none focus:border-ice-primary/60 focus:ring-1 focus:ring-ice-primary/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-crystal-blue mb-2">
                    狀態
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-frost-white/5 border border-ice-primary/30 text-frost-white focus:outline-none focus:border-ice-primary/60 focus:ring-1 focus:ring-ice-primary/40 transition-colors"
                  >
                    <option value="">全部</option>
                    <option value="active">啟用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-crystal-blue mb-2">
                    角色
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-frost-white/5 border border-ice-primary/30 text-frost-white focus:outline-none focus:border-ice-primary/60 focus:ring-1 focus:ring-ice-primary/40 transition-colors"
                  >
                    <option value="">全部</option>
                    <option value="admin">管理員</option>
                    <option value="user">一般用戶</option>
                    <option value="coach">教練</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="neon"
                    onClick={() => handleSearch({ preventDefault: () => {} } as React.FormEvent)}
                    className="w-full"
                  >
                    🔍 搜尋
                  </Button>
                </div>
              </div>
            </form>
          </Card.Body>
        </Card>

        {/* Error State */}
        {error && (
          <Card variant="glass" className="mb-8 border-red-500/30">
            <Card.Body className="text-center">
              <p className="text-red-400">{error}</p>
            </Card.Body>
          </Card>
        )}

        {/* User Table */}
        {data && data.users.length > 0 ? (
          <>
            <Card variant="glass" className="mb-8 overflow-hidden animate-slide-up stagger-3">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ice-primary/20">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-crystal-blue">用戶</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-crystal-blue">角色</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-crystal-blue">程度</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-crystal-blue">狀態</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-crystal-blue">註冊時間</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-crystal-blue">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ice-primary/10">
                    {data.users.map((user, idx) => (
                      <UserRow
                        key={user.user_id}
                        user={user}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        delay={`${(idx + 3) * 0.05}s`}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <Card variant="glass" className="animate-slide-up stagger-4">
                <Card.Body className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-crystal-blue">
                    共 {data.total} 個用戶，第 {data.page} / {data.total_pages} 頁
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="glass"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={page === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      ← 上一頁
                    </Button>
                    <Button
                      variant="glass"
                      onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                      disabled={page === data.total_pages}
                      className={page === data.total_pages ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      下一頁 →
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </>
        ) : (
          <Card variant="glass" className="animate-slide-up stagger-3">
            <Card.Body className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-frost-white mb-2">未找到用戶</h3>
              <p className="text-crystal-blue">嘗試調整搜尋條件</p>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
}

interface UserRowProps {
  user: UserListItem;
  onStatusChange: (userId: string, status: string) => void;
  onDelete: (userId: string) => void;
  delay: string;
}

function UserRow({ user, onStatusChange, onDelete, delay }: UserRowProps) {
  const getRoleBadgeVariant = (role: string): 'ice' | 'accent' | 'pink' => {
    if (role === 'admin') return 'pink';
    if (role === 'coach') return 'accent';
    return 'ice';
  };

  const getStatusBadgeVariant = (status: string): 'ice' | 'accent' | 'pink' => {
    return status === 'active' ? 'ice' : 'pink';
  };

  return (
    <tr className="hover:bg-ice-primary/5 transition-colors animate-slide-up" style={{ animationDelay: delay }}>
      <td className="px-6 py-4">
        <div>
          <div className="text-sm font-medium text-frost-white">
            {user.display_name || '未設定'}
          </div>
          <div className="text-xs text-crystal-blue mt-1">{user.email}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge
              key={role}
              variant={getRoleBadgeVariant(role)}
              size="sm"
            >
              {role === 'admin' ? '⚙️ 管理員' : role === 'coach' ? '🎓 教練' : '👤 用戶'}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-crystal-blue">
        {user.experience_level ? (
          user.experience_level === 'beginner' ? '初級' : user.experience_level === 'intermediate' ? '中級' : '高級'
        ) : '-'}
      </td>
      <td className="px-6 py-4">
        <Badge
          variant={getStatusBadgeVariant(user.status)}
          size="sm"
        >
          {user.status === 'active' ? '✅ 啟用' : '⭘ 停用'}
        </Badge>
      </td>
      <td className="px-6 py-4 text-sm text-crystal-blue">
        {new Date(user.created_at).toLocaleDateString('zh-TW')}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/admin/users/${user.user_id}`}
            className="text-ice-primary hover:text-ice-accent transition-colors text-sm font-medium"
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
            className="text-neon-purple hover:text-neon-pink transition-colors text-sm font-medium"
          >
            {user.status === 'active' ? '停用' : '啟用'}
          </button>
          <button
            onClick={() => onDelete(user.user_id)}
            className="text-red-400 hover:text-red-500 transition-colors text-sm font-medium"
          >
            刪除
          </button>
        </div>
      </td>
    </tr>
  );
}
