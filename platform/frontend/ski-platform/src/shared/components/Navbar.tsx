/**
 * Navbar Component
 * 導航欄組件
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const navItems = [
    { path: '/resorts', label: '雪場' },
    { path: '/history', label: '記錄' },
    { path: '/gear', label: '裝備' },
    { path: '/trips', label: '行程' },
    { path: '/snowbuddy', label: '雪伴' },
    { path: '/ski-map', label: '地圖' },
    { path: '/feed', label: '動態' },
    { path: '/achievements', label: '成就' },
    { path: '/leaderboard', label: '排行榜' },
  ];

  const isAdmin = user?.roles && user.roles.includes('admin');

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎿</span>
            <span className="text-xl font-bold text-primary-600">SkiDIY</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    ⚙️ 管理後台
                  </Link>
                )}
                {/* 通知下拉選單 */}
                <NotificationDropdown />
                <div className="text-sm text-gray-600">
                  <span className="inline-flex items-center">
                    <span className="mr-2">👤</span>
                    <span>{user.display_name}</span>
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  登出
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                登入
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-primary-600'
                    : 'text-gray-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
