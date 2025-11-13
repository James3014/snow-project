/**
 * TripBoardCard Component
 * 公佈欄行程卡片組件
 */
import { useState } from 'react';
import Card from '@/shared/components/Card';
import type { Trip } from '@/features/trip-planning/types';
import type { Resort } from '@/shared/data/resorts';

interface TripBoardCardProps {
  trip: Trip;
  resort: Resort | null;
  onApply: (tripId: string) => void;
  isApplying?: boolean;
  currentUserId?: string;
}

export default function TripBoardCard({
  trip,
  resort,
  onApply,
  isApplying = false,
  currentUserId
}: TripBoardCardProps) {
  const [showApplyModal, setShowApplyModal] = useState(false);

  const resortName = resort ? `${resort.names.zh} ${resort.names.en}` : trip.resort_id;
  const availableSlots = trip.max_buddies - trip.current_buddies;
  const isOwner = currentUserId === trip.user_id;
  const isFull = availableSlots <= 0;

  const handleApply = () => {
    setShowApplyModal(true);
  };

  const confirmApply = () => {
    onApply(trip.trip_id);
    setShowApplyModal(false);
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        {/* 雪場名稱 */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            🏔️ {resortName}
          </h3>
          {trip.title && (
            <p className="text-sm text-gray-600">{trip.title}</p>
          )}
        </div>

        {/* 日期 */}
        <div className="mb-4">
          <div className="flex items-center text-gray-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {new Date(trip.start_date).toLocaleDateString('zh-TW')} - {new Date(trip.end_date).toLocaleDateString('zh-TW')}
            </span>
          </div>
        </div>

        {/* 剩餘名額 */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">剩餘名額</span>
            <span className={`text-lg font-bold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
              {availableSlots} / {trip.max_buddies}
            </span>
          </div>
        </div>

        {/* 申請按鈕 */}
        {!isOwner && (
          <button
            onClick={handleApply}
            disabled={isApplying || isFull}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              isFull
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isFull ? '已額滿' : isApplying ? '申請中...' : '申請加入'}
          </button>
        )}

        {isOwner && (
          <div className="bg-purple-50 text-purple-700 py-3 px-4 rounded-lg text-center font-medium">
            這是你的行程
          </div>
        )}
      </Card>

      {/* 申請確認對話框 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">確認申請加入</h3>
            <div className="mb-6 space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">雪場：</span>{resortName}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">日期：</span>
                {new Date(trip.start_date).toLocaleDateString('zh-TW')} - {new Date(trip.end_date).toLocaleDateString('zh-TW')}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmApply}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
