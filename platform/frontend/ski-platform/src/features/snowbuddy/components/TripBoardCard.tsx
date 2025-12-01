/**
 * TripBoardCard Component - Glacial Futurism Design
 * 公佈欄行程卡片組件 - 冰川未來主義設計
 *
 * Mobile-First | Glassmorphism | Fluid Animations
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TripSummary, BuddyStatus } from '@/features/trip-planning/types';
import type { Resort } from '@/shared/data/resorts';

interface TripBoardCardProps {
  trip: TripSummary & { user_id?: string };
  resort: Resort | null;
  onApply: (tripId: string) => void;
  onCancel?: (tripId: string, buddyId: string) => void;
  isApplying?: boolean;
  currentUserId?: string;
  buddyStatus?: BuddyStatus | null;
  buddyId?: string | null;
}

export default function TripBoardCard({
  trip,
  resort,
  onApply,
  onCancel,
  isApplying = false,
  currentUserId,
  buddyStatus,
  buddyId
}: TripBoardCardProps) {
  const navigate = useNavigate();
  const [showApplyModal, setShowApplyModal] = useState(false);

  const resortName = resort ? resort.names.zh : trip.resort_id;
  const resortNameEn = resort ? resort.names.en : '';
  const availableSlots = trip.max_buddies - trip.current_buddies;
  const isOwner = currentUserId === trip.user_id;
  const isFull = availableSlots <= 0;

  const handleCardClick = () => {
    navigate(`/trips/${trip.trip_id}`);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowApplyModal(true);
  };

  const confirmApply = () => {
    onApply(trip.trip_id);
    setShowApplyModal(false);
  };

  // Status badge component
  const StatusBadge = () => {
    if (buddyStatus === 'pending') {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-xs font-bold text-orange-300 tracking-wide">申請中</span>
        </div>
      );
    }
    if (buddyStatus === 'accepted') {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
          <span className="text-lg">✓</span>
          <span className="text-xs font-bold text-green-300 tracking-wide">已加入</span>
        </div>
      );
    }
    if (buddyStatus === 'declined') {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30">
          <span className="text-lg">×</span>
          <span className="text-xs font-bold text-red-300 tracking-wide">已拒絕</span>
        </div>
      );
    }
    if (isOwner) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <span className="text-lg">👑</span>
          <span className="text-xs font-bold text-purple-300 tracking-wide">我的行程</span>
        </div>
      );
    }
    if (isFull) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30">
          <span className="text-lg">🈵</span>
          <span className="text-xs font-bold text-gray-400 tracking-wide">已滿</span>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div
        className="glass-card p-5 cursor-pointer group relative overflow-hidden"
        onClick={handleCardClick}
      >
        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">
          {/* Header: Resort Name */}
          <div className="mb-4">
            <h3 className="text-xl md:text-2xl font-bold text-gradient-glacier mb-1">
              {resortName}
            </h3>
            {resortNameEn && (
              <p className="text-xs text-crystal-blue/70 font-light tracking-wider uppercase">
                {resortNameEn}
              </p>
            )}
            {trip.title && (
              <p className="text-sm text-frost-white/80 mt-2">{trip.title}</p>
            )}
          </div>

          {/* Owner Info */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-glacier">
            {trip.owner_info.avatar_url ? (
              <img
                src={trip.owner_info.avatar_url}
                alt={trip.owner_info.display_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-ice-primary/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-glacier flex items-center justify-center text-bg-deep-space text-sm font-bold">
                {trip.owner_info.display_name[0]}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-frost-white">
                {trip.owner_info.display_name}
              </p>
              <p className="text-xs text-crystal-blue/60">行程主人</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 mb-4 text-crystal-blue">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">
              {new Date(trip.start_date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
              {' - '}
              {new Date(trip.end_date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Slots Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-crystal-blue/80 font-semibold uppercase tracking-wide">
                名額
              </span>
              <span className={`text-sm font-bold ${
                isFull ? 'text-red-400' : availableSlots <= 2 ? 'text-orange-400' : 'text-ice-accent'
              }`}>
                {trip.current_buddies} / {trip.max_buddies}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="h-2 bg-glass-bg rounded-full overflow-hidden border border-glacier">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  availableSlots <= 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                  'bg-gradient-glacier'
                }`}
                style={{ width: `${(trip.current_buddies / trip.max_buddies) * 100}%` }}
              />
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-4">
            <StatusBadge />
          </div>

          {/* Action Buttons */}
          {buddyStatus === 'pending' && onCancel && buddyId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(trip.trip_id, buddyId);
              }}
              disabled={isApplying}
              className="w-full py-3 px-4 rounded-lg bg-glass-bg border border-glacier text-crystal-blue hover:border-ice-primary hover:bg-glass-border transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            >
              取消申請
            </button>
          )}

          {!buddyStatus && !isOwner && (
            <button
              onClick={handleApply}
              disabled={isApplying || isFull}
              className={`w-full btn-neon ${
                isFull ? 'opacity-50 cursor-not-allowed' : 'ski-trail'
              }`}
            >
              {isFull ? '已額滿' : isApplying ? '申請中...' : '申請加入'}
            </button>
          )}
        </div>
      </div>

      {/* Apply Confirmation Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-bg-deep-space/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-slide-up">
          <div className="glass-card max-w-md w-full p-6 md:p-8">
            <h3 className="text-2xl font-bold text-gradient-glacier mb-6 text-center">
              確認申請加入
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏔️</span>
                <div>
                  <p className="text-xs text-crystal-blue/70 mb-1">雪場</p>
                  <p className="text-frost-white font-semibold">{resortName}</p>
                  {resortNameEn && <p className="text-xs text-crystal-blue/50">{resortNameEn}</p>}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-xs text-crystal-blue/70 mb-1">日期</p>
                  <p className="text-frost-white font-semibold">
                    {new Date(trip.start_date).toLocaleDateString('zh-TW')} - {new Date(trip.end_date).toLocaleDateString('zh-TW')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="text-xs text-crystal-blue/70 mb-1">行程主人</p>
                  <p className="text-frost-white font-semibold">{trip.owner_info.display_name}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 py-3 px-4 rounded-lg bg-glass-bg border border-glacier text-crystal-blue hover:border-ice-primary transition-all font-semibold"
              >
                取消
              </button>
              <button
                onClick={confirmApply}
                className="flex-1 btn-neon ski-trail"
              >
                確認申請
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
