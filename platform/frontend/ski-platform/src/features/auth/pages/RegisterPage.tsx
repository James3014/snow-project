/**
 * Register Page - Glacial Futurism Design
 * 註冊頁面 - 冰川未來主義設計
 *
 * Mobile-First | Immersive Background | Glassmorphism Form
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerThunk, clearError } from '@/store/slices/authSlice';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    display_name: '',
    preferred_language: 'zh-TW',
    experience_level: 'beginner',
  });

  const [validationError, setValidationError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (password: string): { level: 'weak' | 'medium' | 'strong'; text: string; colorClass: string } => {
    if (password.length < 6) return { level: 'weak', text: '弱', colorClass: 'text-neon-pink' };
    if (password.length < 10) return { level: 'medium', text: '中', colorClass: 'text-ice-accent' };
    return { level: 'strong', text: '強', colorClass: 'text-green-400' };
  };

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (formData.password !== formData.confirmPassword) {
      setValidationError('密碼與確認密碼不一致');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('密碼至少需要 6 個字元');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registrationData } = formData;
    dispatch(registerThunk(registrationData));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Mountain Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-bg-deep-space via-bg-ice-dark to-bg-glacier" />

        {/* Mountain Silhouettes */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20"
          style={{
            background: 'linear-gradient(to top, var(--ice-primary), transparent)',
            clipPath: 'polygon(0% 100%, 0% 60%, 10% 55%, 20% 50%, 30% 45%, 40% 55%, 50% 40%, 60% 50%, 70% 45%, 80% 55%, 90% 50%, 100% 60%, 100% 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2/5 opacity-30"
          style={{
            background: 'linear-gradient(to top, var(--ice-secondary), transparent)',
            clipPath: 'polygon(0% 100%, 0% 70%, 15% 65%, 30% 55%, 45% 60%, 60% 50%, 75% 60%, 90% 55%, 100% 65%, 100% 100%)',
          }}
        />

        {/* Floating Snow Particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="snow-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${8 + Math.random() * 12}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Form Container */}
      <div className="max-w-md w-full space-y-8 relative z-10 animate-slide-up">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="text-7xl animate-slide-up pulse-glow">🎿</div>
          </div>
          <h2 className="text-4xl font-bold text-gradient-glacier mb-4 animate-slide-up stagger-1">
            註冊 SkiDIY 帳號
          </h2>
          <p className="text-crystal-blue text-sm animate-slide-up stagger-2">
            已經有帳號了？{' '}
            <Link
              to="/login"
              className="font-semibold text-ice-accent hover:text-ice-primary transition-colors"
            >
              立即登入
            </Link>
          </p>
        </div>

        {/* Form Card */}
        <form className="glass-card p-8 space-y-6 animate-slide-up stagger-3" onSubmit={handleSubmit}>
          {/* Error Display */}
          {(error || validationError) && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-neon-pink/20 to-red-500/20 border border-neon-pink/30">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-neon-pink flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-medium text-neon-pink">
                  {validationError || error}
                </h3>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Display Name */}
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-crystal-blue mb-2">
                顯示名稱
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                required
                value={formData.display_name}
                onChange={handleChange}
                className="input-glacier"
                placeholder="請輸入您的名稱"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-crystal-blue mb-2">
                電子郵件
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-glacier"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-crystal-blue mb-2">
                密碼
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-glacier pr-12"
                  placeholder="至少 6 個字元"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-crystal-blue/50 hover:text-ice-primary transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-crystal-blue/70">密碼強度：</span>
                  <span className={`font-semibold ${getPasswordStrength(formData.password).colorClass}`}>
                    {getPasswordStrength(formData.password).text}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-crystal-blue mb-2">
                確認密碼
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-glacier pr-12"
                  placeholder="再次輸入密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-crystal-blue/50 hover:text-ice-primary transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                <p className="mt-2 text-sm text-neon-pink">密碼不一致</p>
              )}
              {formData.confirmPassword && formData.confirmPassword === formData.password && formData.password.length >= 6 && (
                <p className="mt-2 text-sm text-green-400">✓ 密碼一致</p>
              )}
            </div>

            {/* Experience Level */}
            <div>
              <label htmlFor="experience_level" className="block text-sm font-medium text-crystal-blue mb-2">
                滑雪程度
              </label>
              <select
                id="experience_level"
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                className="input-glacier"
              >
                <option value="beginner">初學者</option>
                <option value="intermediate">中級</option>
                <option value="advanced">高級</option>
                <option value="expert">專家</option>
              </select>
            </div>

            {/* Preferred Language */}
            <div>
              <label htmlFor="preferred_language" className="block text-sm font-medium text-crystal-blue mb-2">
                偏好語言
              </label>
              <select
                id="preferred_language"
                name="preferred_language"
                value={formData.preferred_language}
                onChange={handleChange}
                className="input-glacier"
              >
                <option value="zh-TW">繁體中文</option>
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-neon ski-trail w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-frost-white border-t-transparent rounded-full animate-spin" />
                  註冊中...
                </span>
              ) : (
                '註冊'
              )}
            </button>
          </div>
        </form>

        {/* Back to Home */}
        <div className="text-center animate-slide-up stagger-4">
          <Link
            to="/"
            className="text-sm text-crystal-blue hover:text-ice-primary transition-colors"
          >
            ← 返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
