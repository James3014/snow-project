/**
 * User Detail Page
 * 用戶詳情/編輯頁面
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/shared/api/adminApi';
import type { UserDetail } from '@/shared/api/adminApi';

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    display_name: '',
    preferred_language: '',
    experience_level: '',
    bio: '',
    coach_cert_level: '',
  });

  // Role management
  const [editingRoles, setEditingRoles] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const loadUser = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await adminApi.getUserDetail(userId);
      setUser(data);
      setFormData({
        display_name: data.display_name || '',
        preferred_language: data.preferred_language || '',
        experience_level: data.experience_level || '',
        bio: data.bio || '',
        coach_cert_level: data.coach_cert_level || '',
      });
      setRoles(data.roles || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || '載入用戶資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      await adminApi.updateUser(userId, formData);
      setIsEditing(false);
      loadUser();
    } catch (err: any) {
      alert(err.response?.data?.detail || '更新失敗');
    }
  };

  const handleSaveRoles = async () => {
    if (!userId) return;

    try {
      await adminApi.updateUserRoles(userId, roles);
      setEditingRoles(false);
      loadUser();
    } catch (err: any) {
      alert(err.response?.data?.detail || '更新角色失敗');
    }
  };

  const toggleRole = (role: string) => {
    if (roles.includes(role)) {
      setRoles(roles.filter((r) => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || '用戶不存在'}</p>
        </div>
        <Link
          to="/admin/users"
          className="inline-block text-primary-600 hover:text-primary-700"
        >
          ← 返回用戶列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">用戶詳情</h1>
        <Link
          to="/admin/users"
          className="text-sm text-gray-600 hover:text-primary-600"
        >
          ← 返回用戶列表
        </Link>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">基本資訊</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              編輯
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                儲存
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用戶 ID
            </label>
            <div className="text-gray-900">{user.user_id}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電子郵件
            </label>
            <div className="text-gray-900">{user.email}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              顯示名稱
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            ) : (
              <div className="text-gray-900">{user.display_name || '-'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              狀態
            </label>
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                user.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {user.status === 'active' ? '啟用' : '停用'}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              偏好語言
            </label>
            {isEditing ? (
              <select
                value={formData.preferred_language}
                onChange={(e) =>
                  setFormData({ ...formData, preferred_language: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="zh-TW">繁體中文</option>
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            ) : (
              <div className="text-gray-900">{user.preferred_language || '-'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              滑雪程度
            </label>
            {isEditing ? (
              <select
                value={formData.experience_level}
                onChange={(e) =>
                  setFormData({ ...formData, experience_level: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="beginner">初學者</option>
                <option value="intermediate">中級</option>
                <option value="advanced">高級</option>
                <option value="expert">專家</option>
              </select>
            ) : (
              <div className="text-gray-900">{user.experience_level || '-'}</div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              個人簡介
            </label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            ) : (
              <div className="text-gray-900">{user.bio || '-'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              註冊時間
            </label>
            <div className="text-gray-900">
              {new Date(user.created_at).toLocaleString('zh-TW')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最後更新
            </label>
            <div className="text-gray-900">
              {new Date(user.updated_at).toLocaleString('zh-TW')}
            </div>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">角色管理</h2>
          {!editingRoles ? (
            <button
              onClick={() => setEditingRoles(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              編輯角色
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => {
                  setEditingRoles(false);
                  setRoles(user.roles || []);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveRoles}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                儲存
              </button>
            </div>
          )}
        </div>

        {editingRoles ? (
          <div className="space-y-2">
            {['admin', 'user', 'coach'].map((role) => (
              <label key={role} className="flex items-center">
                <input
                  type="checkbox"
                  checked={roles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="mr-2"
                />
                <span className="capitalize">{role}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span
                key={role}
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
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
        )}
      </div>
    </div>
  );
}
