/**
 * Login Page - Glacial Futurism Design
 * 登入頁面 - 冰川未來主義設計
 *
 * Mobile-First | Immersive | Glassmorphism
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginThunk, clearError } from '@/store/slices/authSlice';
import { TurnstileWidget } from '@/shared/components/TurnstileWidget';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    dispatch(clearError());
    // Trigger entrance animation
    setTimeout(() => setIsFormVisible(true), 100);
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginThunk({ ...formData, captcha_token: captchaToken || undefined }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Mountain Background */}
      <div className="fixed inset-0 z-0">
        {/* Mountain silhouettes with parallax */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20"
          style={{
            background: 'linear-gradient(to top, var(--ice-primary), transparent)',
            clipPath: 'polygon(0% 100%, 0% 60%, 10% 55%, 20% 65%, 30% 50%, 40% 60%, 50% 45%, 60% 55%, 70% 40%, 80% 50%, 90% 55%, 100% 60%, 100% 100%)'
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 opacity-30"
          style={{
            background: 'linear-gradient(to top, var(--neon-purple), transparent)',
            clipPath: 'polygon(0% 100%, 0% 70%, 15% 65%, 25% 75%, 35% 60%, 45% 70%, 55% 55%, 65% 65%, 75% 50%, 85% 60%, 95% 65%, 100% 70%, 100% 100%)'
          }}
        />

        {/* Floating snow particles */}
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

      {/* Login Container */}
      <div
        className={`relative z-10 w-full max-w-md transition-all duration-1000 ${
          isFormVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-slide-up stagger-1">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 glass-card pulse-glow">
            <span className="text-5xl">🎿</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-3">
            SNOWTRACE
          </h1>
          <p className="text-crystal-blue text-sm md:text-base font-light tracking-wide">
            GLACIAL ADVENTURE AWAITS
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-6 md:p-8 mb-6 animate-slide-up stagger-2">
          <h2 className="text-2xl font-bold text-frost-white mb-6 text-center">
            登入您的帳戶
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 backdrop-blur-sm animate-slide-up">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-crystal-blue">
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

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-crystal-blue">
                密碼
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-glacier pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-crystal-blue/60 hover:text-ice-primary transition-colors"
                  aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Bot Protection */}
            {turnstileSiteKey && (
              <div className="pt-2">
                <TurnstileWidget siteKey={turnstileSiteKey} onToken={setCaptchaToken} />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-neon mt-6 ski-trail"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  登入中...
                </span>
              ) : (
                '登入'
              )}
            </button>
          </form>
        </div>

        {/* Register Link */}
        <div className="text-center space-y-4 animate-slide-up stagger-3">
          <p className="text-crystal-blue/80 text-sm">
            還沒有帳號？{' '}
            <Link
              to="/register"
              className="text-ice-primary hover:text-neon-cyan font-semibold transition-colors underline decoration-ice-primary/30 hover:decoration-neon-cyan underline-offset-4"
            >
              立即註冊
            </Link>
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-crystal-blue/60 hover:text-frost-white text-sm transition-colors group"
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首頁
          </Link>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-ice-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}
