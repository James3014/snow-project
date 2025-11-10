/**
 * SuggestionList
 * 建議列表組件
 */

interface SuggestionListProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  title?: string;
}

export default function SuggestionList({
  suggestions,
  onSelect,
  title = '你是想說：',
}: SuggestionListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {title && (
        <p className="text-sm text-gray-600">{title}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
