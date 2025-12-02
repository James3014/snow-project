/**
 * Admin Dashboard - Glacial Futurism Design
 * 管理員後台首頁
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/shared/api/adminApi';
import Card from '@/shared/components/Card';
import Badge from '@/shared/components/Badge';
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
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="spinner-glacier mb-4" />
          <p className="text-crystal-blue">載入統計資料中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="glass">
        <Card.Body className="text-center py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400">{error}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-12 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 to-transparent opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-glacier mb-4 animate-slide-up">
            ⚙️ 管理後台
          </h1>
          <p className="text-crystal-blue animate-slide-up stagger-1">
            管理應用、查看統計資料、配置系統設定
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="總用戶數"
            value={statistics?.total_users || 0}
            icon="👥"
            variant="ice"
            delay="0.1s"
          />
          <StatCard
            title="活躍用戶"
            value={statistics?.active_users || 0}
            icon="✅"
            variant="accent"
            delay="0.15s"
          />
          <StatCard
            title="7天新用戶"
            value={statistics?.new_users_last_7_days || 0}
            icon="📈"
            variant="pink"
            delay="0.2s"
          />
          <StatCard
            title="30天新用戶"
            value={statistics?.new_users_last_30_days || 0}
            icon="📊"
            variant="accent"
            delay="0.25s"
          />
        </div>

        {/* Quick Actions */}
        <Card variant="glass" className="mb-8 animate-slide-up stagger-3">
          <Card.Body className="space-y-4">
            <h2 className="text-2xl font-bold text-frost-white">快速操作</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/admin/users"
                className="group block p-6 border border-ice-primary/30 rounded-xl hover:border-ice-primary/60 bg-ice-primary/5 hover:bg-ice-primary/10 transition-all"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👤</div>
                <h3 className="font-semibold text-frost-white mb-1">用戶管理</h3>
                <p className="text-sm text-crystal-blue">查看和管理所有用戶</p>
              </Link>

              <Link
                to="/admin/ai-config"
                className="group block p-6 border border-neon-purple/30 rounded-xl hover:border-neon-purple/60 bg-neon-purple/5 hover:bg-neon-purple/10 transition-all"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🤖</div>
                <h3 className="font-semibold text-frost-white mb-1">AI 助手配置</h3>
                <p className="text-sm text-crystal-blue">配置 AI 模型和 API Key</p>
              </Link>

              <div className="block p-6 border border-ice-primary/20 rounded-xl bg-ice-primary/5 opacity-60">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-crystal-blue mb-1">統計報表</h3>
                <p className="text-sm text-crystal-blue/50">即將推出</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Experience Level Distribution */}
        {statistics && statistics.users_by_experience_level && (
          <Card variant="glass" className="animate-slide-up stagger-4">
            <Card.Body className="space-y-6">
              <h2 className="text-2xl font-bold text-frost-white">👨‍🎓 用戶程度分布</h2>
              <div className="space-y-4">
                {Object.entries(statistics.users_by_experience_level).map(([level, count], idx) => (
                  <div key={level} className="animate-slide-up" style={{ animationDelay: `${(idx + 4) * 0.05}s` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="capitalize font-medium text-frost-white">
                        {level === 'beginner' ? '初級' : level === 'intermediate' ? '中級' : level === 'advanced' ? '高級' : level}
                      </div>
                      <Badge variant={level === 'beginner' ? 'ice' : level === 'intermediate' ? 'accent' : 'pink'} size="sm">
                        {count} 人
                      </Badge>
                    </div>
                    <div className="w-full bg-ice-primary/10 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-ice-primary to-ice-accent transition-all duration-500"
                        style={{
                          width: `${(count / (statistics.total_users || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  variant: 'ice' | 'accent' | 'pink';
  delay: string;
}

function StatCard({ title, value, icon, variant, delay }: StatCardProps) {
  const bgGradient = {
    ice: 'from-ice-primary/20 to-ice-accent/20',
    accent: 'from-ice-accent/20 to-neon-purple/20',
    pink: 'from-neon-pink/20 to-red-500/20',
  };

  const textColor = {
    ice: 'text-ice-primary',
    accent: 'text-ice-accent',
    pink: 'text-neon-pink',
  };

  return (
    <Card
      variant="glass"
      className="animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <Card.Body className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-crystal-blue mb-1">{title}</p>
            <p className={`text-3xl font-bold ${textColor[variant]}`}>
              {value.toLocaleString()}
            </p>
          </div>
          <div className={`text-4xl p-3 rounded-full bg-gradient-to-br ${bgGradient[variant]}`}>
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
