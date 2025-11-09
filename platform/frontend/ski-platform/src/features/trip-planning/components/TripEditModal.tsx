/**
 * Trip Edit Modal
 * 行程編輯彈窗
 */
import { useState, useEffect } from 'react';
import { resortApiService } from '@/shared/api/resortApi';
import { calculateSeasonId } from '../utils/seasonUtils';
import type { Trip, TripUpdate, TripStatus, FlightStatus, AccommodationStatus } from '../types';
import type { Resort } from '@/shared/data/resorts';

interface TripEditModalProps {
  trip: Trip;
  onClose: () => void;
  onUpdate: (tripId: string, data: TripUpdate) => Promise<void>;
}

export default function TripEditModal({ trip, onClose, onUpdate }: TripEditModalProps) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [availableResorts, setAvailableResorts] = useState<Resort[]>([]);
  const [resortsLoading, setResortsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<TripUpdate>({
    resort_id: trip.resort_id,
    title: trip.title || '',
    start_date: trip.start_date,
    end_date: trip.end_date,
    trip_status: trip.trip_status,
    flight_status: trip.flight_status,
    accommodation_status: trip.accommodation_status,
    max_buddies: trip.max_buddies,
    notes: trip.notes || '',
  });

  // 載入雪場列表
  useEffect(() => {
    const loadResorts = async () => {
      try {
        setResortsLoading(true);
        const response = await resortApiService.getAllResorts();
        setAvailableResorts(response.items);
      } catch (error) {
        console.error('載入雪場列表失敗:', error);
        setAvailableResorts([]);
      } finally {
        setResortsLoading(false);
      }
    };
    loadResorts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      // 如果日期改變了，重新計算 season_id
      const seasonId = calculateSeasonId(formData.start_date || trip.start_date);
      const updateData: TripUpdate = {
        ...formData,
        season_id: seasonId,
      };

      await onUpdate(trip.trip_id, updateData);
      onClose();
    } catch (error) {
      console.error('更新行程失敗:', error);
      alert('更新行程失敗，請重試');
    } finally {
      setSaving(false);
    }
  };

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">編輯行程</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* 雪場選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏔️ 雪場 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.resort_id}
                onChange={(e) => setFormData({ ...formData, resort_id: e.target.value })}
                disabled={resortsLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{resortsLoading ? '載入中...' : '選擇雪場...'}</option>
                {availableResorts.map((resort) => (
                  <option key={resort.resort_id} value={resort.resort_id}>
                    {resort.names.zh} {resort.names.en}
                  </option>
                ))}
              </select>
            </div>

            {/* 日期範圍 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 開始日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 結束日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  min={formData.start_date || undefined}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 顯示天數 */}
            {calculateDays() > 0 && (
              <div className="text-sm text-gray-600 -mt-4">
                ⏱️ 共 {calculateDays()} 天
              </div>
            )}

            {/* 行程狀態 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 狀態 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.trip_status || 'planning'}
                onChange={(e) => setFormData({ ...formData, trip_status: e.target.value as TripStatus })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="planning">📋 規劃中</option>
                <option value="confirmed">✈️ 已確認</option>
                <option value="completed">✅ 已完成</option>
                <option value="cancelled">❌ 已取消</option>
              </select>
            </div>

            {/* 備註 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 備註
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="行程備註、特別注意事項..."
              />
            </div>

            {/* 更多選項（展開/收合） */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="font-medium text-gray-700">⚙️ 更多選項</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMoreOptions && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  {/* 行程標題 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ✏️ 行程標題（選填）
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例如：聖誕節粉雪之旅"
                    />
                  </div>

                  {/* 機票和住宿狀態 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ✈️ 機票狀態
                      </label>
                      <select
                        value={formData.flight_status}
                        onChange={(e) => setFormData({ ...formData, flight_status: e.target.value as FlightStatus })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="not_planned">未規劃</option>
                        <option value="researching">研究中</option>
                        <option value="ready_to_book">準備預訂</option>
                        <option value="booked">已預訂</option>
                        <option value="confirmed">已確認</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🏨 住宿狀態
                      </label>
                      <select
                        value={formData.accommodation_status}
                        onChange={(e) => setFormData({ ...formData, accommodation_status: e.target.value as AccommodationStatus })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="not_planned">未規劃</option>
                        <option value="researching">研究中</option>
                        <option value="ready_to_book">準備預訂</option>
                        <option value="booked">已預訂</option>
                        <option value="confirmed">已確認</option>
                      </select>
                    </div>
                  </div>

                  {/* 同行夥伴上限 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👥 同行夥伴人數上限
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.max_buddies}
                      onChange={(e) => setFormData({ ...formData, max_buddies: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
