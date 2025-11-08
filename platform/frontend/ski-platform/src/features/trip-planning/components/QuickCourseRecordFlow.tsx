/**
 * Quick Course Record Flow
 * 快速記錄雪道流程組件
 */
import { useState, useEffect } from 'react';
import { resortApiService } from '@/shared/api/resortApi';
import { courseTrackingApi } from '@/features/course-tracking/api/courseTrackingApi';
import EnhancedCourseRecordModal, { type CourseRecordData } from '@/features/course-tracking/components/EnhancedCourseRecordModal';
import type { Resort, Course } from '@/shared/data/resorts';

interface QuickCourseRecordFlowProps {
  resortId: string;
  tripDates: {
    start: string;
    end: string;
  };
  userId: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function QuickCourseRecordFlow({
  resortId,
  tripDates,
  userId,
  onClose,
  onComplete,
}: QuickCourseRecordFlowProps) {
  const [resort, setResort] = useState<Resort | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState<number>(-1);
  const [recordedCourses, setRecordedCourses] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadResort();
  }, [resortId]);

  const loadResort = async () => {
    try {
      setLoading(true);
      const resortData = await resortApiService.getResort(resortId);
      setResort(resortData);
    } catch (error) {
      console.error('載入雪場失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCourse = (courseName: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseName)) {
      newSelected.delete(courseName);
    } else {
      newSelected.add(courseName);
    }
    setSelectedCourses(newSelected);
  };

  const handleStartRecording = () => {
    if (selectedCourses.size === 0) {
      alert('請至少選擇一條雪道');
      return;
    }
    setCurrentRecordingIndex(0);
  };

  const handleRecordSubmit = async (data: CourseRecordData) => {
    const coursesArray = Array.from(selectedCourses);
    const currentCourseName = coursesArray[currentRecordingIndex];

    try {
      // 創建雪道訪問記錄
      await courseTrackingApi.visits.create(userId, {
        resort_id: resortId,
        course_name: currentCourseName,
        visited_date: tripDates.start, // 預設使用行程開始日期
        ...data,
      });

      // 標記為已記錄
      setRecordedCourses(prev => new Set([...prev, currentCourseName]));

      // 移動到下一條
      if (currentRecordingIndex < coursesArray.length - 1) {
        setCurrentRecordingIndex(currentRecordingIndex + 1);
      } else {
        // 全部完成
        alert(`✅ 完成！已記錄 ${coursesArray.length} 條雪道`);
        onComplete();
      }
    } catch (error) {
      console.error('記錄雪道失敗:', error);
      alert('記錄失敗，請稍後重試');
    }
  };

  const handleSkipCourse = () => {
    const coursesArray = Array.from(selectedCourses);
    if (currentRecordingIndex < coursesArray.length - 1) {
      setCurrentRecordingIndex(currentRecordingIndex + 1);
    } else {
      const recordedCount = recordedCourses.size;
      if (recordedCount > 0) {
        alert(`✅ 已記錄 ${recordedCount} 條雪道`);
      }
      onComplete();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入雪場資料...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resort) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">無法載入雪場資料</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            關閉
          </button>
        </div>
      </div>
    );
  }

  const coursesArray = Array.from(selectedCourses);
  const currentCourseName = currentRecordingIndex >= 0 ? coursesArray[currentRecordingIndex] : '';

  // 如果正在記錄中，顯示記錄彈窗
  if (currentRecordingIndex >= 0) {
    return (
      <EnhancedCourseRecordModal
        isOpen={true}
        courseName={currentCourseName}
        onClose={handleSkipCourse}
        onSubmit={handleRecordSubmit}
        mode="create"
      />
    );
  }

  // 雪道選擇界面
  const groupedCourses = resort.courses.reduce((acc, course) => {
    if (!acc[course.level]) {
      acc[course.level] = [];
    }
    acc[course.level].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  const levelLabels = {
    beginner: { emoji: '🟢', label: '初級', color: 'text-green-600' },
    intermediate: { emoji: '🔵', label: '中級', color: 'text-blue-600' },
    advanced: { emoji: '🔴', label: '高級', color: 'text-red-600' },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold mb-2">🎿 記錄滑雪雪道</h2>
          <p className="text-blue-100">
            {resort.names.zh} · {tripDates.start}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              選擇這次行程滑過的雪道（可多選）
            </p>
            {selectedCourses.size > 0 && (
              <p className="text-sm text-blue-600">
                已選擇 {selectedCourses.size} 條雪道
              </p>
            )}
          </div>

          {/* Courses by difficulty */}
          <div className="space-y-6">
            {Object.entries(groupedCourses).map(([level, courses]) => {
              const levelInfo = levelLabels[level as keyof typeof levelLabels];
              if (!levelInfo || courses.length === 0) return null;

              return (
                <div key={level}>
                  <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${levelInfo.color}`}>
                    {levelInfo.emoji} {levelInfo.label}雪道 ({courses.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {courses.map((course) => {
                      const isSelected = selectedCourses.has(course.name);
                      return (
                        <button
                          key={course.name}
                          type="button"
                          onClick={() => handleToggleCourse(course.name)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">
                                {course.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                平均坡度 {course.avg_slope}° · 最大 {course.max_slope}°
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-blue-600 text-xl ml-2">✓</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {resort.courses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              此雪場尚無雪道資料
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            稍後再說
          </button>
          <button
            onClick={handleStartRecording}
            disabled={selectedCourses.size === 0}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {selectedCourses.size > 0
              ? `下一步：記錄 ${selectedCourses.size} 條雪道`
              : '請先選擇雪道'}
          </button>
        </div>
      </div>
    </div>
  );
}
