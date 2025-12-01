/**
 * Course Visit Card - 單筆雪道記錄卡片
 */
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import { formatDate } from '@/shared/utils/helpers';
import type { CourseVisit } from '../types';

interface CourseVisitCardProps {
  visit: CourseVisit;
  onEdit: (visit: CourseVisit) => void;
  onDelete: (visitId: string) => void;
}

export default function CourseVisitCard({ visit, onEdit, onDelete }: CourseVisitCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{visit.course_name}</h3>
            {visit.rating && (
              <span className="text-yellow-500">{'⭐'.repeat(visit.rating)}</span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-2">{visit.resort_id}</p>
          <p className="text-gray-500 text-sm">{formatDate(visit.visited_date)}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {visit.snow_condition && (
              <Badge variant="info">{visit.snow_condition}</Badge>
            )}
            {visit.weather && (
              <Badge variant="secondary">{visit.weather}</Badge>
            )}
          </div>

          {/* Notes */}
          {visit.notes && (
            <p className="text-gray-600 text-sm mt-3 italic">"{visit.notes}"</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-4">
          <Button variant="ghost" size="sm" onClick={() => onEdit(visit)}>
            ✏️
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(visit.id)}>
            🗑️
          </Button>
        </div>
      </div>
    </Card>
  );
}
