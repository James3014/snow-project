/**
 * Trip Create Modal with Batch Support
 * 行程創建彈窗（支援批次創建）
 */
import { useState } from 'react';
import type { TripCreate, TripFlexibility, FlightStatus, AccommodationStatus, TripVisibility } from '../types';

interface TripCreateModalProps {
  onClose: () => void;
  onCreate: (trips: Omit<TripCreate, 'season_id'>[]) => void;
}

export default function TripCreateModal({ onClose, onCreate }: TripCreateModalProps) {
  const [batchMode, setBatchMode] = useState(false);
  const [trips, setTrips] = useState<Omit<TripCreate, 'season_id'>[]>([
    {
      resort_id: '',
      title: '',
      start_date: '',
      end_date: '',
      flexibility: 'fixed' as TripFlexibility,
      flight_status: 'not_planned' as FlightStatus,
      accommodation_status: 'not_planned' as AccommodationStatus,
      visibility: 'private' as TripVisibility,
      max_buddies: 0,
      notes: '',
    },
  ]);

  const handleAddTrip = () => {
    setTrips([
      ...trips,
      {
        resort_id: '',
        title: '',
        start_date: '',
        end_date: '',
        flexibility: 'fixed' as TripFlexibility,
        flight_status: 'not_planned' as FlightStatus,
        accommodation_status: 'not_planned' as AccommodationStatus,
        visibility: 'private' as TripVisibility,
        max_buddies: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveTrip = (index: number) => {
    setTrips(trips.filter((_, i) => i !== index));
  };

  const handleUpdateTrip = (index: number, field: string, value: any) => {
    const newTrips = [...trips];
    (newTrips[index] as any)[field] = value;
    setTrips(newTrips);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(trips);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">創建新行程</h2>
            <button
              onClick={() => setBatchMode(!batchMode)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {batchMode ? '單個模式' : '批次模式'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {trips.map((trip, index) => (
              <div key={index} className="border rounded-lg p-6 relative">
                {batchMode && trips.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTrip(index)}
                    className="absolute top-4 right-4 text-red-600 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {batchMode ? `行程 ${index + 1}` : '行程資訊'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 雪場 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      雪場 ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={trip.resort_id}
                      onChange={(e) => handleUpdateTrip(index, 'resort_id', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例如：niseko"
                    />
                  </div>

                  {/* 行程標題 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      行程標題
                    </label>
                    <input
                      type="text"
                      value={trip.title}
                      onChange={(e) => handleUpdateTrip(index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例如：二世谷粉雪之旅"
                    />
                  </div>

                  {/* 開始日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      開始日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={trip.start_date}
                      onChange={(e) => handleUpdateTrip(index, 'start_date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* 結束日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      結束日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={trip.end_date}
                      onChange={(e) => handleUpdateTrip(index, 'end_date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* 日期靈活度 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      日期靈活度
                    </label>
                    <select
                      value={trip.flexibility}
                      onChange={(e) => handleUpdateTrip(index, 'flexibility', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="fixed">固定日期</option>
                      <option value="flexible_1_day">±1天</option>
                      <option value="flexible_3_days">±3天</option>
                      <option value="flexible_week">±1週</option>
                      <option value="any_weekend">任意週末</option>
                      <option value="any_weekday">任意平日</option>
                    </select>
                  </div>

                  {/* 能見度 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      能見度
                    </label>
                    <select
                      value={trip.visibility}
                      onChange={(e) => handleUpdateTrip(index, 'visibility', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="private">私密</option>
                      <option value="friends_only">僅朋友</option>
                      <option value="public">公開</option>
                      <option value="custom">自訂</option>
                    </select>
                  </div>

                  {/* 機票狀態 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      機票狀態
                    </label>
                    <select
                      value={trip.flight_status}
                      onChange={(e) => handleUpdateTrip(index, 'flight_status', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="not_planned">尚未規劃</option>
                      <option value="researching">研究中</option>
                      <option value="ready_to_book">準備預訂</option>
                      <option value="booked">已預訂</option>
                      <option value="confirmed">已確認</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>

                  {/* 住宿狀態 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      住宿狀態
                    </label>
                    <select
                      value={trip.accommodation_status}
                      onChange={(e) => handleUpdateTrip(index, 'accommodation_status', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="not_planned">尚未規劃</option>
                      <option value="researching">研究中</option>
                      <option value="ready_to_book">準備預訂</option>
                      <option value="booked">已預訂</option>
                      <option value="confirmed">已確認</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>

                  {/* 雪伴數量 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最多雪伴數（0 = 獨自滑雪）
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={trip.max_buddies}
                      onChange={(e) => handleUpdateTrip(index, 'max_buddies', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* 備註 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      備註
                    </label>
                    <textarea
                      value={trip.notes}
                      onChange={(e) => handleUpdateTrip(index, 'notes', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="行程備註..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 批次模式：新增更多行程 */}
          {batchMode && (
            <button
              type="button"
              onClick={handleAddTrip}
              className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + 新增更多行程
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              創建 {trips.length > 1 ? `${trips.length} 個行程` : '行程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
