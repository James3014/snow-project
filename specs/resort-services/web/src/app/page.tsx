'use client';

import { useState } from 'react';
import ResortCard from '@/components/ResortCard';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';

// Mock data - 實際應從 API 取得
const MOCK_RESORTS = [
  {
    id: 'yuzawa_kagura',
    name: '神樂滑雪場',
    name_en: 'Kagura Ski Resort',
    region: '新潟縣',
    country_code: 'JP',
    runs_count: 23,
    vertical_drop: 1225,
    longest_run: 6000,
    amenities: ['night_ski', 'onsen', 'rental'],
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
  },
  {
    id: 'yuzawa_naeba',
    name: '苗場滑雪場',
    name_en: 'Naeba Ski Resort',
    region: '新潟縣',
    country_code: 'JP',
    runs_count: 22,
    vertical_drop: 889,
    longest_run: 4000,
    amenities: ['night_ski', 'park', 'rental'],
    image: 'https://images.unsplash.com/photo-1609672578074-e9e1c2437525?w=800',
  },
  {
    id: 'yuzawa_gala',
    name: 'GALA湯沢滑雪場',
    name_en: 'GALA Yuzawa',
    region: '新潟縣',
    country_code: 'JP',
    runs_count: 16,
    vertical_drop: 441,
    longest_run: 2500,
    amenities: ['onsen', 'rental', 'restaurant'],
    image: 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800',
  },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [snowMode, setSnowMode] = useState(false);

  const filteredResorts = MOCK_RESORTS.filter(resort => {
    const matchSearch = !search ||
      resort.name.includes(search) ||
      resort.name_en.toLowerCase().includes(search.toLowerCase());
    const matchRegion = !selectedRegion || resort.region === selectedRegion;
    return matchSearch && matchRegion;
  });

  return (
    <div className="min-h-screen" data-theme={snowMode ? 'snow' : undefined}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              🏔️
            </div>
            <h1 className="text-xl font-bold text-gradient">雪場服務</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSnowMode(!snowMode)}
              className="w-11 h-11 flex items-center justify-center text-xl hover:bg-zinc-800 rounded-lg active:scale-95 transition-all"
              title={snowMode ? '一般模式' : '雪地模式'}
            >
              {snowMode ? '☀️' : '❄️'}
            </button>
            <button className="w-11 h-11 flex items-center justify-center text-xl hover:bg-zinc-800 rounded-lg active:scale-95 transition-all" title="我的足跡">
              📍
            </button>
            <button className="w-11 h-11 flex items-center justify-center text-xl hover:bg-zinc-800 rounded-lg active:scale-95 transition-all" title="收藏">
              ❤️
            </button>
          </div>
        </div>
        <SearchBar value={search} onChange={setSearch} />
      </header>

      <main className="p-4 space-y-6">
        {/* Filter Bar */}
        <FilterBar
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
        />

        {/* Info Tip */}
        {!search && !selectedRegion && (
          <div className="bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300 border border-cyan-500/20">
            🏔️ 探索全球滑雪場，點擊卡片查看詳細資訊與交通方式
          </div>
        )}

        {/* Resort List */}
        <div className="space-y-4">
          {filteredResorts.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <div className="text-4xl mb-2">🔍</div>
              找不到符合條件的雪場
            </div>
          ) : (
            filteredResorts.map(resort => (
              <ResortCard key={resort.id} resort={resort} />
            ))
          )}
        </div>

        {/* Stats Footer */}
        <div className="text-center pt-4 pb-8 text-zinc-500 text-sm">
          共 {filteredResorts.length} 個雪場
        </div>
      </main>
    </div>
  );
}
