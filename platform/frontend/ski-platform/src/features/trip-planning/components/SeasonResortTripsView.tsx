/**
 * 按雪場分組的行程視圖組件
 */
import Card from '@/shared/components/Card';
import Badge from '@/shared/components/Badge';
import type { Trip } from '../types';
import type { Resort } from '@/shared/data/resorts';

interface ResortTripsViewProps {
  trips: Trip[];
  resorts: Resort[];
  onTripClick: (tripId: string) => void;
}

export default function SeasonResortTripsView({ trips, resorts, onTripClick }: ResortTripsViewProps) {
  if (trips.length === 0) {
    return (
      <Card variant="glass" className="animate-slide-up">
        <Card.Body className="text-center py-12">
          <div className="text-6xl mb-4">🏔️</div>
          <h3 className="text-2xl font-bold text-frost-white mb-2">還沒有任何行程</h3>
          <p className="text-crystal-blue">建立您的第一個行程，開始規劃雪季冒險！</p>
        </Card.Body>
      </Card>
    );
  }

  const resortsMap = resorts.reduce((acc, resort) => {
    acc[resort.resort_id] = resort;
    return acc;
  }, {} as Record<string, Resort>);

  const getResortName = (resortId: string) => {
    const resort = resortsMap[resortId];
    return resort ? `${resort.names.zh} ${resort.names.en}` : resortId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const groupedByResort = trips.reduce((acc, trip) => {
    if (!acc[trip.resort_id]) acc[trip.resort_id] = [];
    acc[trip.resort_id].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'ice' | 'accent' | 'pink'; text: string }> = {
      completed: { variant: 'ice', text: '✅ 已完成' },
      confirmed: { variant: 'accent', text: '✈️ 已確認' },
    };
    return map[status] || { variant: 'pink', text: '📋 規劃中' };
  };

  const getIcon = (status: string, type: 'transport' | 'accommodation') => {
    if (status === 'confirmed' || status === 'booked') return type === 'transport' ? '✈️' : '🏨';
    if (status === 'ready_to_book') return '🔖';
    if (status === 'researching') return '🔍';
    return '📝';
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedByResort).map(([resortId, resortTrips], resortIdx) => (
        <Card
          key={resortId}
          variant="glass"
          className="animate-slide-up overflow-hidden"
          style={{ animationDelay: `${(resortIdx + 1) * 0.05}s` }}
        >
          <div className="relative overflow-hidden px-6 py-4 border-b border-ice-primary/20">
            <div className="absolute inset-0 bg-gradient-to-r from-ice-primary/10 to-ice-accent/5" />
            <h3 className="relative text-xl font-bold text-gradient-glacier flex items-center gap-3">
              🏔️ {getResortName(resortId)}
              <Badge variant="ice" size="sm">{resortTrips.length} 趟</Badge>
            </h3>
          </div>

          <Card.Body className="p-0">
            <div className="divide-y divide-ice-primary/10">
              {resortTrips.map((trip, tripIdx) => {
                const badge = getStatusBadge(trip.trip_status);
                return (
                  <div
                    key={trip.trip_id}
                    onClick={() => onTripClick(trip.trip_id)}
                    className="p-6 hover:bg-ice-primary/5 cursor-pointer transition-colors border-0 animate-slide-up"
                    style={{ animationDelay: `${(resortIdx * 10 + tripIdx + 2) * 0.02}s` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant={badge.variant}>{badge.text}</Badge>
                        {trip.visibility === 'public' && <Badge variant="accent">📢 已發布</Badge>}
                        {trip.title && <span className="text-sm text-crystal-blue">{trip.title}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-crystal-blue">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>
                          {new Date(trip.start_date).toLocaleDateString('zh-TW')} - {new Date(trip.end_date).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{getIcon(trip.flight_status, 'transport')} 機票</span>
                        <span>{getIcon(trip.accommodation_status, 'accommodation')} 住宿</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{trip.current_buddies}/{trip.max_buddies} 人</span>
                          </div>
                          <div className="w-full bg-ice-primary/10 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-gradient-to-r from-ice-primary to-ice-accent h-1.5 rounded-full"
                              style={{ width: `${Math.round((trip.current_buddies / trip.max_buddies) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {trip.notes && (
                      <div className="mt-3 text-sm text-crystal-blue bg-ice-primary/10 p-3 rounded border border-ice-primary/20">
                        📝 {trip.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
