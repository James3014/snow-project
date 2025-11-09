/**
 * Trip Create Modal - Simplified Version
 * 行程創建彈窗（簡化版 + 展開選項）
 */
import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { resortApiService } from '@/shared/api/resortApi';
import { calculateSeasonId } from '../utils/seasonUtils';
import QuickCourseRecordFlow from './QuickCourseRecordFlow';
import type { TripCreate, TripStatus, FlightStatus, AccommodationStatus } from '../types';
import type { Resort } from '@/shared/data/resorts';

interface TripCreateModalProps {
  onClose: () => void;
  onCreate: (trips: TripCreate[]) => void;
}

export default function TripCreateModal({ onClose, onCreate }: TripCreateModalProps) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showNewResortModal, setShowNewResortModal] = useState(false);
  const [showQuickRecord, setShowQuickRecord] = useState(false);
  const [shouldRecordAfterSave, setShouldRecordAfterSave] = useState(false);
  const [availableResorts, setAvailableResorts] = useState<Resort[]>([]);
  const [resortsLoading, setResortsLoading] = useState(true);
  const userId = useAppSelector((state) => state.auth.user?.user_id);

  const [formData, setFormData] = useState<Omit<TripCreate, 'season_id'>>({
    resort_id: '',
    title: '',
    start_date: '',
    end_date: '',
    trip_status: 'planning' as TripStatus,
    flexibility: 'fixed',
    flight_status: 'not_planned' as FlightStatus,
    accommodation_status: 'not_planned' as AccommodationStatus,
    visibility: 'private',
    max_buddies: 1,
    notes: '',
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
        // 使用降級數據
        setAvailableResorts([]);
      } finally {
        setResortsLoading(false);
      }
    };
    loadResorts();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 自動計算雪季 ID
    const seasonId = calculateSeasonId(formData.start_date);

    // 加上 season_id
    const tripWithSeason: TripCreate = {
      ...formData,
      season_id: seasonId,
    };

    // 如果狀態是「已完成」且用戶選擇立即記錄
    const shouldRecordCourses = formData.trip_status === 'completed' && shouldRecordAfterSave;

    onCreate([tripWithSeason]);

    // 如果需要記錄雪道，顯示快速記錄界面
    if (shouldRecordCourses && userId) {
      setShowQuickRecord(true);
    } else {
      onClose();
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
          <h2 className="text-2xl font-bold text-gray-900">新增行程</h2>
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
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setShowNewResortModal(true);
                  } else {
                    setFormData({ ...formData, resort_id: e.target.value });
                  }
                }}
                disabled={resortsLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{resortsLoading ? '載入中...' : '選擇雪場...'}</option>
                {availableResorts.map((resort) => (
                  <option key={resort.resort_id} value={resort.resort_id}>
                    {resort.names.zh} {resort.names.en}
                  </option>
                ))}
                <option value="__new__">➕ 新增其他雪場...</option>
              </select>
              {resortsLoading && (
                <p className="text-xs text-gray-500 mt-1">⏳ 正在載入雪場列表...</p>
              )}
              {!resortsLoading && availableResorts.length === 0 && (
                <p className="text-xs text-red-500 mt-1">⚠️ 無法載入雪場列表，請重新整理頁面</p>
              )}
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
                  onChange={(e) => {
                    const startDate = e.target.value;
                    // 自動設置結束日期為隔天
                    if (startDate) {
                      const nextDay = new Date(startDate);
                      nextDay.setDate(nextDay.getDate() + 1);
                      const endDateStr = nextDay.toISOString().split('T')[0];
                      setFormData({ ...formData, start_date: startDate, end_date: endDateStr });
                    } else {
                      setFormData({ ...formData, start_date: startDate });
                    }
                  }}
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

            {/* 已完成狀態提示 */}
            {formData.trip_status === 'completed' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎿</span>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-1">行程已完成！</p>
                    <p className="text-sm text-blue-700 mb-3">
                      儲存後可以記錄這次滑過的雪道、評分和心得
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShouldRecordAfterSave(false)}
                        className={`text-sm px-3 py-1 rounded ${
                          !shouldRecordAfterSave
                            ? 'bg-gray-200 text-gray-700'
                            : 'text-blue-600 hover:text-blue-700 underline'
                        }`}
                      >
                        稍後再說
                      </button>
                      <button
                        type="button"
                        onClick={() => setShouldRecordAfterSave(true)}
                        className={`text-sm px-3 py-1 rounded ${
                          shouldRecordAfterSave
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        💪 儲存後立即記錄
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

                  {/* 同行夥伴（預留） */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👥 同行夥伴（開發中）
                    </label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-sm">
                      此功能開發中，未來可以邀請其他用戶一起規劃行程
                    </div>
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
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              儲存
            </button>
          </div>
        </form>
      </div>

      {/* 新增雪場彈窗 */}
      {showNewResortModal && (
        <NewResortModal
          onClose={() => setShowNewResortModal(false)}
          onAdd={(resortId, resortName) => {
            setFormData({ ...formData, resort_id: resortId });
            setShowNewResortModal(false);
            // TODO: 實際上應該要把新雪場加入到 availableResorts 列表
            alert(`新增雪場：${resortName} (${resortId})\n注意：目前僅為示範，實際需要後端 API 支援`);
          }}
        />
      )}

      {/* 快速記錄雪道 */}
      {showQuickRecord && userId && formData.resort_id && formData.start_date && formData.end_date && (
        <QuickCourseRecordFlow
          resortId={formData.resort_id}
          tripDates={{
            start: formData.start_date,
            end: formData.end_date,
          }}
          userId={userId}
          onClose={() => {
            setShowQuickRecord(false);
            onClose();
          }}
          onComplete={() => {
            setShowQuickRecord(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}

// 新增雪場彈窗組件
function NewResortModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (resortId: string, resortName: string) => void;
}) {
  const [resortName, setResortName] = useState('');
  const [country, setCountry] = useState('JP');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 生成 resort_id（簡單版本：小寫 + 底線）
    const resortId = resortName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    onAdd(resortId, resortName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">新增雪場</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              雪場名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={resortName}
              onChange={(e) => setResortName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：白馬村 Hakuba"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所在國家/地區
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="JP">🇯🇵 日本 Japan</option>
              <option value="US">🇺🇸 美國 USA</option>
              <option value="CA">🇨🇦 加拿大 Canada</option>
              <option value="CH">🇨🇭 瑞士 Switzerland</option>
              <option value="FR">🇫🇷 法國 France</option>
              <option value="AT">🇦🇹 奧地利 Austria</option>
            </select>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              💡 提示：新增的雪場目前僅保存在本地，未來版本將支援雲端同步
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              新增
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
