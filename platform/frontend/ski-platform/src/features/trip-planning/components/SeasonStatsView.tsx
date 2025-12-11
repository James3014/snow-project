/**
 * 統計視圖組件
 */
import Card from '@/shared/components/Card';
import type { SeasonStats } from '../types';

interface StatsViewProps {
  stats: SeasonStats;
}

export default function SeasonStatsView({ stats }: StatsViewProps) {
  const completionRate = stats.trip_count > 0 ? Math.round((stats.completed_trips / stats.trip_count) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 行程完成率 */}
      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <Card.Body className="text-center py-8">
          <h3 className="text-lg font-bold text-frost-white mb-6">行程完成率</h3>
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-ice-primary/20 to-ice-accent/20 border-2 border-ice-primary/40" />
            <div className="text-4xl font-bold text-gradient-glacier">{completionRate}%</div>
          </div>
          <p className="text-crystal-blue text-sm">{stats.completed_trips} / {stats.trip_count} 趟已完成</p>
        </Card.Body>
      </Card>

      {/* 雪場統計 */}
      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <Card.Body className="space-y-4 py-8">
          <h3 className="text-lg font-bold text-frost-white text-center">🏔️ 雪場統計</h3>
          <div className="flex items-center justify-between">
            <span className="text-crystal-blue">本季探索雪場</span>
            <span className="text-3xl font-bold text-ice-primary">{stats.unique_resorts}</span>
          </div>
          <div className="h-2 bg-ice-primary/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-ice-primary to-ice-accent" style={{ width: '100%' }} />
          </div>
        </Card.Body>
      </Card>

      {/* 社交統計 */}
      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <Card.Body className="space-y-4 py-8">
          <h3 className="text-lg font-bold text-frost-white text-center">👥 社交統計</h3>
          <div className="flex items-center justify-between">
            <span className="text-crystal-blue">滑雪夥伴</span>
            <span className="text-3xl font-bold text-neon-pink">{stats.total_buddies}</span>
          </div>
          <p className="text-xs text-crystal-blue text-center">與 {stats.total_buddies} 位夥伴一起滑雪</p>
        </Card.Body>
      </Card>
    </div>
  );
}
