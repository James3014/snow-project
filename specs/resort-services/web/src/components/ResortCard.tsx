'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Resort {
  id: string;
  name: string;
  name_en: string;
  region: string;
  country_code: string;
  runs_count: number;
  vertical_drop: number;
  longest_run: number;
  amenities: string[];
  image: string;
}

interface ResortCardProps {
  resort: Resort;
}

const AMENITY_LABELS: Record<string, string> = {
  night_ski: '夜滑',
  onsen: '溫泉',
  rental: '租借',
  park: '公園',
  restaurant: '餐廳',
};

export default function ResortCard({ resort }: ResortCardProps) {
  return (
    <Link
      href={`/resort/${resort.id}`}
      className="block relative opacity-100 mb-6 pt-2"
    >
      <div className="
        velocity-shine resort-card-pulse relative rounded-2xl overflow-hidden
        bg-zinc-800 border-2 border-zinc-700 transition-all duration-200
        active:scale-[0.97] active:translate-y-1
        [clip-path:polygon(0_12px,12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%)]
      "
      style={{ borderImage: 'linear-gradient(165deg, var(--card-border), var(--card-border)) 1' }}
      >
        {/* 圖片區 */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={resort.image}
            alt={resort.name}
            fill
            className="object-cover"
          />
          {/* 漸層遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />

          {/* 左上角高光 */}
          <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent [clip-path:polygon(0_0,100%_0,0_100%)]" />

          {/* 國旗標籤 */}
          <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-bold text-cyan-300">
            {resort.country_code}
          </div>
        </div>

        {/* 內容區 */}
        <div className="p-6 relative">
          {/* 對角線裝飾 */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent [clip-path:polygon(100%_0,100%_100%,0_0)] pointer-events-none" />

          {/* 標題 */}
          <h3
            className="resort-card-title text-2xl font-bold text-gradient-velocity line-clamp-2 mb-2 tracking-wide transform -skew-x-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {resort.name}
          </h3>

          <p className="text-sm text-zinc-400 mb-4 transform -skew-x-1">
            {resort.name_en} · {resort.region}
          </p>

          {/* 數據徽章 */}
          <div className="flex gap-2 flex-wrap mb-4 transform -skew-x-1">
            <div className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-400/40 text-cyan-300 rounded-lg text-xs font-bold tracking-wide backdrop-blur-sm skew-x-1">
              {resort.runs_count} 條雪道
            </div>
            <div className="px-3 py-1.5 bg-gradient-to-r from-purple-500/25 to-pink-500/25 border border-purple-400/40 text-purple-300 rounded-lg text-xs font-bold tracking-wide backdrop-blur-sm skew-x-1">
              ↕ {resort.vertical_drop}m
            </div>
            <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 border border-emerald-400/40 text-emerald-300 rounded-lg text-xs font-bold tracking-wide backdrop-blur-sm skew-x-1">
              ↗ {resort.longest_run}m
            </div>
          </div>

          {/* 設施標籤 */}
          <div className="flex gap-2 flex-wrap">
            {resort.amenities.slice(0, 3).map(amenity => (
              <span
                key={amenity}
                className="px-2 py-1 bg-zinc-700/50 border border-zinc-600 text-zinc-300 rounded text-xs"
              >
                {AMENITY_LABELS[amenity] || amenity}
              </span>
            ))}
            {resort.amenities.length > 3 && (
              <span className="px-2 py-1 bg-zinc-700/50 border border-zinc-600 text-zinc-300 rounded text-xs">
                +{resort.amenities.length - 3}
              </span>
            )}
          </div>

          {/* 底部速度條紋 */}
          <div className="absolute bottom-2 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent rounded-full" />
        </div>
      </div>
    </Link>
  );
}
