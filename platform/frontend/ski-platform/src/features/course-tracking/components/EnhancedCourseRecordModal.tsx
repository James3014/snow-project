/**
 * Enhanced Course Record Modal
 * 增強的雪道記錄模態框 - 支援評分、雪況、天氣、心情標籤等
 */
import { useState, useEffect } from 'react';
import Button from '@/shared/components/Button';

interface EnhancedCourseRecordModalProps {
  isOpen: boolean;
  courseName: string;
  onClose: () => void;
  onSubmit: (data: CourseRecordData) => void;
  initialData?: CourseRecordData;
  mode?: 'create' | 'edit';
}

export interface CourseRecordData {
  snow_condition?: string | null;
  weather?: string | null;
  difficulty_feeling?: string | null;
  rating?: number | null;
  mood_tags?: string[] | null;
  notes?: string | null;
}

const SNOW_CONDITIONS = [
  { value: '粉雪', emoji: '❄️', desc: '鬆軟粉雪' },
  { value: '壓雪', emoji: '⛷️', desc: '壓雪整地' },
  { value: '冰面', emoji: '🧊', desc: '結冰硬雪' },
  { value: '融雪', emoji: '💧', desc: '融雪濕滑' },
];

const WEATHER_OPTIONS = [
  { value: '晴天', emoji: '☀️' },
  { value: '陰天', emoji: '☁️' },
  { value: '下雪', emoji: '🌨️' },
  { value: '暴風雪', emoji: '❄️' },
];

const DIFFICULTY_FEELINGS = [
  { value: '比預期簡單', emoji: '😊', color: 'text-green-600' },
  { value: '適中', emoji: '😐', color: 'text-yellow-600' },
  { value: '比預期困難', emoji: '😰', color: 'text-red-600' },
];

const MOOD_TAGS = [
  { value: '爽快', emoji: '🤩' },
  { value: '累爆', emoji: '😫' },
  { value: '初體驗', emoji: '🎉' },
  { value: '刺激', emoji: '😱' },
  { value: '順利', emoji: '✨' },
  { value: '挑戰', emoji: '💪' },
];

export default function EnhancedCourseRecordModal({
  isOpen,
  courseName,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
}: EnhancedCourseRecordModalProps) {
  const [rating, setRating] = useState<number>(initialData?.rating || 0);
  const [snowCondition, setSnowCondition] = useState<string>(initialData?.snow_condition || '');
  const [weather, setWeather] = useState<string>(initialData?.weather || '');
  const [difficultyFeeling, setDifficultyFeeling] = useState<string>(initialData?.difficulty_feeling || '');
  const [moodTags, setMoodTags] = useState<string[]>(initialData?.mood_tags || []);
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  // Update form state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setRating(initialData.rating || 0);
      setSnowCondition(initialData.snow_condition || '');
      setWeather(initialData.weather || '');
      setDifficultyFeeling(initialData.difficulty_feeling || '');
      setMoodTags(initialData.mood_tags || []);
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // In edit mode, send all fields (use null for empty to allow clearing)
    // In create mode, only send non-empty fields
    if (mode === 'edit') {
      const data = {
        rating: rating > 0 ? rating : null,
        snow_condition: snowCondition || null,
        weather: weather || null,
        difficulty_feeling: difficultyFeeling || null,
        mood_tags: moodTags.length > 0 ? moodTags : null,
        notes: notes.trim() || null,
      };
      onSubmit(data as CourseRecordData);
    } else {
      // Create mode: only include non-empty fields
      const data: CourseRecordData = {};
      if (rating > 0) data.rating = rating;
      if (snowCondition) data.snow_condition = snowCondition;
      if (weather) data.weather = weather;
      if (difficultyFeeling) data.difficulty_feeling = difficultyFeeling;
      if (moodTags.length > 0) data.mood_tags = moodTags;
      if (notes.trim()) data.notes = notes.trim();
      onSubmit(data);
    }

    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setRating(0);
    setSnowCondition('');
    setWeather('');
    setDifficultyFeeling('');
    setMoodTags([]);
    setNotes('');
    onClose();
  };

  const toggleMoodTag = (tag: string) => {
    setMoodTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">{mode === 'edit' ? '編輯雪道體驗' : '記錄雪道體驗'}</h2>
          <p className="text-primary-100 mt-1">{courseName}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ⭐ 整體評分（選填）
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-transform hover:scale-110 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Snow Condition */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ❄️ 雪況（選填）
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SNOW_CONDITIONS.map((condition) => (
                <button
                  key={condition.value}
                  type="button"
                  onClick={() => setSnowCondition(condition.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    snowCondition === condition.value
                      ? 'border-primary-500 bg-primary-50 shadow-md scale-105'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{condition.emoji}</div>
                  <div className="text-sm font-medium">{condition.value}</div>
                  <div className="text-xs text-gray-500">{condition.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🌤️ 天氣（選填）
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {WEATHER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setWeather(option.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    weather === option.value
                      ? 'border-primary-500 bg-primary-50 shadow-md scale-105'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="text-sm font-medium">{option.value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Feeling */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              💪 難度感受（選填）
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_FEELINGS.map((feeling) => (
                <button
                  key={feeling.value}
                  type="button"
                  onClick={() => setDifficultyFeeling(feeling.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    difficultyFeeling === feeling.value
                      ? 'border-primary-500 bg-primary-50 shadow-md scale-105'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{feeling.emoji}</div>
                  <div className={`text-sm font-medium ${feeling.color}`}>
                    {feeling.value}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mood Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              😊 心情標籤（可多選，選填）
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleMoodTag(tag.value)}
                  className={`px-4 py-2 rounded-full border-2 transition-all inline-flex items-center gap-2 ${
                    moodTags.includes(tag.value)
                      ? 'border-primary-500 bg-primary-500 text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                  }`}
                >
                  <span>{tag.emoji}</span>
                  <span className="text-sm font-medium">{tag.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📝 心得筆記（選填，最多 200 字）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              placeholder="寫下今天的滑雪心得、特別的回憶或想分享的事..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {notes.length} / 200
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600"
          >
            ✓ 完成記錄
          </Button>
        </div>
      </div>
    </div>
  );
}
