'use client';

interface FilterBarProps {
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
}

const REGIONS = [
  { id: 'niigata', name: '新潟縣' },
  { id: 'nagano', name: '長野縣' },
  { id: 'hokkaido', name: '北海道' },
  { id: 'tohoku', name: '東北地區' },
];

export default function FilterBar({ selectedRegion, onRegionChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      <button
        onClick={() => onRegionChange(null)}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
          transition-all duration-200 active:scale-95
          ${!selectedRegion
            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }
        `}
      >
        全部地區
      </button>
      {REGIONS.map(region => (
        <button
          key={region.id}
          onClick={() => onRegionChange(region.name)}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
            transition-all duration-200 active:scale-95
            ${selectedRegion === region.name
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }
          `}
        >
          {region.name}
        </button>
      ))}
    </div>
  );
}
