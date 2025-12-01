'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜尋雪場名稱..."
        className="
          w-full h-12 pl-12 pr-4
          bg-zinc-800 border-2 border-zinc-700
          rounded-xl text-white placeholder-zinc-500
          focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20
          transition-all duration-200
          text-base
        "
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">
        🔍
      </div>
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-all active:scale-95"
        >
          ✕
        </button>
      )}
    </div>
  );
}
