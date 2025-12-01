# UI/UX 視覺對比：單板教學 vs 雪場服務

---

## 🎨 設計語言統一性

兩個系統共享 **Alpine Velocity** 核心美學，通過色彩差異化實現功能識別。

```
Alpine Velocity 核心要素:
✓ 斜切角卡片 (Polygon Clipping)
✓ 傾斜字體元素 (Skewed Typography)
✓ 動態光效 (Velocity Shine + Pulse)
✓ 高對比主題 (Snow Mode)
✓ 觸控友善設計 (大按鈕 + 即時反饋)
```

---

## 📊 元件對比表

### 1. 標題 (Header)

**單板教學**
```tsx
<div className="flex items-center gap-2">
  <Image src="/logo.jpeg" width={36} height={36} />
  <h1 className="text-xl font-bold text-gradient">單板教學</h1>
</div>
<div className="flex gap-1">
  ❄️ 💬 📝 ❤️ [登入]
</div>
```

**雪場服務**
```tsx
<div className="flex items-center gap-2">
  <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600
       rounded-lg flex items-center justify-center">🏔️</div>
  <h1 className="text-xl font-bold text-gradient">雪場服務</h1>
</div>
<div className="flex gap-1">
  ❄️ 📍 ❤️
</div>
```

**差異點**:
- Logo: 圖片檔 vs 漸層圖標
- 圖標: 學習相關 (📝) vs 地點相關 (📍)
- 色彩: 保持一致的 `text-gradient` 工具類別

---

### 2. 搜尋列 (SearchBar)

**完全一致**
```tsx
<input
  type="text"
  placeholder="搜尋[課程|雪場]名稱..."
  className="
    w-full h-12 pl-12 pr-4
    bg-zinc-800 border-2 border-zinc-700
    rounded-xl text-white
    focus:border-[cyan|amber]-500
    focus:ring-2 focus:ring-[cyan|amber]-500/20
  "
/>
```

**唯一差異**: Focus 邊框色彩
- 單板教學: `border-amber-500` (橙黃)
- 雪場服務: `border-cyan-500` (冰藍)

---

### 3. 卡片元件 (Card)

#### 結構對比

```tsx
// 單板教學: LessonCard
<div className="[clip-path:polygon(...)]">
  {/* 左上角高光 from-white/10 */}
  {/* 右上角裝飾 from-amber-500/10 */}

  <h3 className="lesson-card-title text-gradient-velocity
       transform -skew-x-3 font-display">
    {lesson.title}  // 例: 「前刃 J-Turn 基礎動作」
  </h3>

  <div className="transform -skew-x-2">
    <span className="from-orange-500/25 to-amber-500/25 skew-x-2">
      初級/中級
    </span>
    <span className="from-purple-500/25 to-pink-500/25 skew-x-2">
      轉彎技能
    </span>
  </div>

  {/* 底部速度條紋 via-amber-500/20 */}
</div>
```

```tsx
// 雪場服務: ResortCard
<div className="[clip-path:polygon(...)]">
  {/* 圖片區 (新增) */}
  <div className="relative h-48">
    <Image src={resort.image} fill />
    <div className="from-white/20" />  // 左上角高光
  </div>

  {/* 左上角高光 from-white/10 */}
  {/* 右上角裝飾 from-cyan-500/10 */}

  <h3 className="resort-card-title text-gradient-velocity
       transform -skew-x-2 font-display">
    {resort.name}  // 例: 「神樂滑雪場」
  </h3>

  <div className="transform -skew-x-1">
    <div className="from-cyan-500/25 to-blue-500/25 skew-x-1">
      23 條雪道
    </div>
    <div className="from-purple-500/25 to-pink-500/25 skew-x-1">
      ↕ 1225m
    </div>
    <div className="from-emerald-500/25 to-teal-500/25 skew-x-1">
      ↗ 6000m
    </div>
  </div>

  {/* 底部速度條紋 via-cyan-500/20 */}
</div>
```

#### 視覺差異

| 元素 | 單板教學 | 雪場服務 |
|-----|---------|---------|
| **傾斜角度** | `-skew-x-3` (標題) | `-skew-x-2` (標題) |
| **主色光暈** | `amber-500/10` | `cyan-500/10` |
| **第一徽章** | Orange → Amber | Cyan → Blue |
| **第二徽章** | Purple → Pink | Purple → Pink (一致) |
| **第三徽章** | - | Emerald → Teal |
| **底部條紋** | `via-amber-500/20` | `via-cyan-500/20` |
| **額外內容** | - | 頂部圖片區 |

---

### 4. 徽章系統 (Badges)

#### 漸層配方

**單板教學**
```tsx
// 難度等級 (橙黃系)
className="from-orange-500/25 to-amber-500/25
          border-orange-400/40 text-orange-300"

// 技能類型 (紫粉系)
className="from-purple-500/25 to-pink-500/25
          border-purple-400/40 text-purple-300"
```

**雪場服務**
```tsx
// 雪道數量 (冰藍系)
className="from-cyan-500/25 to-blue-500/25
          border-cyan-400/40 text-cyan-300"

// 垂直落差 (紫粉系 - 共通)
className="from-purple-500/25 to-pink-500/25
          border-purple-400/40 text-purple-300"

// 最長雪道 (綠松系)
className="from-emerald-500/25 to-teal-500/25
          border-emerald-400/40 text-emerald-300"
```

**配色策略**:
- 主要資訊: 使用系統專屬色 (amber/cyan)
- 次要資訊: 使用共通色 (purple/pink)
- 補充資訊: 使用對比色 (emerald/teal)

---

### 5. Snow Mode 對比

#### 色彩映射

**單板教學**
```css
[data-theme="snow"] {
  --btn-primary-bg: #f59e0b;  /* amber-500 */
  --card-border: #fbbf24;     /* amber-400 */
  --accent: #fbbf24;
  --text-secondary: #fef3c7;  /* amber-100 */
}
```

**雪場服務**
```css
[data-theme="snow"] {
  --btn-primary-bg: #0ea5e9;  /* sky-500 */
  --card-border: #0ea5e9;
  --accent: #0ea5e9;
  --text-secondary: #e0f2fe;  /* sky-100 */
}
```

#### 環境光暈

**單板教學**
```css
background: radial-gradient(
  circle at 50% 0%,
  rgba(251, 191, 36, 0.03) 0%,  /* 琥珀黃光暈 */
  transparent 50%
);
```

**雪場服務**
```css
background: radial-gradient(
  circle at 50% 0%,
  rgba(14, 165, 233, 0.03) 0%,  /* 天空藍光暈 */
  transparent 50%
);
```

---

## 🎭 動畫效果對比

### Velocity Shine (完全一致)

```css
.velocity-shine::after {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),  /* 白色光澤 - 兩系統共通 */
    transparent
  );
  animation: velocity-shine 0.6s ease-out;
}
```

### Pulse Glow (顏色差異)

**單板教學**
```css
@keyframes lesson-card-pulse {
  50% {
    box-shadow: 0 0 20px 4px rgba(251, 191, 36, 0.15);  /* 琥珀光暈 */
  }
}
```

**雪場服務**
```css
@keyframes resort-card-pulse {
  50% {
    box-shadow: 0 0 20px 4px rgba(6, 182, 212, 0.15);  /* 冰藍光暈 */
  }
}
```

---

## 📱 互動反饋 (完全統一)

### 按壓效果
```css
active:scale-[0.97]
active:translate-y-1
```

### Hover 狀態
```css
hover:bg-zinc-800
hover:text-white
```

### 過渡時間
```css
transition-all duration-200
```

---

## 🎯 內容策略差異

### 單板教學
- **焦點**: 動作技巧學習
- **卡片內容**: 課程標題 + 難度 + 技能類型
- **行動**: 點擊查看教學步驟
- **情感**: ❤️ 收藏課程, 📝 記錄練習

### 雪場服務
- **焦點**: 地理資訊探索
- **卡片內容**: 雪場名稱 + 圖片 + 數據 + 設施
- **行動**: 點擊查看詳情與交通
- **情感**: 📍 記錄足跡, ❤️ 收藏雪場

---

## 🔤 字體使用對比

### 標題 (Bebas Neue)

**單板教學**
```
「前刃 J-TURN 基礎動作」
- 全大寫英文
- 中英混合
- tracking-wide (字距寬鬆)
- -skew-x-3 (傾斜更誇張)
```

**雪場服務**
```
「神樂滑雪場」
KAGURA SKI RESORT
- 中文優先
- 英文副標
- tracking-wide
- -skew-x-2 (傾斜較緩)
```

### 內文 (Space Mono)

**兩系統一致使用等寬字體於**:
- 數據顯示 (23 條, 1225m)
- 程式碼區塊
- 技術性說明

---

## 📐 間距韻律對比

### 卡片內間距

**單板教學**
```tsx
<div className="p-6 space-y-4">
  <h3 className="mb-4">...</h3>      // 標題底部 16px
  <div className="gap-2.5">...</div> // 徽章間距 10px
</div>
```

**雪場服務**
```tsx
<div className="p-6 space-y-4">
  <h3 className="mb-2">...</h3>      // 標題底部 8px
  <p className="mb-4">...</p>        // 副標底部 16px
  <div className="gap-2 mb-4">...</div> // 數據徽章間距 8px
  <div className="gap-2">...</div>   // 設施標籤間距 8px
</div>
```

**原則**: 保持 Tailwind 的 4px 倍數韻律

---

## 🎨 漸層使用策略

### 背景漸層

**單板教學**
```css
--gradient-primary: linear-gradient(
  135deg,
  #f59e0b 0%,    /* amber-500 */
  #fb923c 50%,   /* orange-400 */
  #f97316 100%   /* orange-500 */
);
```

**雪場服務**
```css
--gradient-primary: linear-gradient(
  135deg,
  #06b6d4 0%,    /* cyan-500 */
  #0891b2 100%   /* cyan-600 */
);
```

### 文字漸層 (共通)

```css
--gradient-text: linear-gradient(
  135deg,
  #ffffff 0%,
  #e5e5e5 50%,
  #ffffff 100%
);
```

**使用**: 所有標題的 `text-gradient-velocity` 類別

---

## 🚀 效能優化 (一致)

### 動畫節流

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 滾動優化

```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

---

## ✅ 設計系統檢查清單

### 已實現的一致性
- [x] 字體系統 (Bebas Neue + Space Mono)
- [x] 卡片結構 (斜切角 + 傾斜文字)
- [x] 動畫效果 (Velocity Shine + Pulse)
- [x] 互動反饋 (Scale + Translate)
- [x] Snow Mode (高對比主題)
- [x] 觸控友善 (44px 觸控目標)
- [x] 間距韻律 (Tailwind scale)

### 實現的差異化
- [x] 主色系統 (Amber vs Cyan)
- [x] 光暈色彩 (橙黃 vs 冰藍)
- [x] 徽章配色 (運動感 vs 地理感)
- [x] 內容策略 (學習 vs 探索)

---

## 🎬 實際使用範例

### 從單板教學切換到雪場服務

**使用者體驗**:
1. 熟悉的卡片佈局 → 無需重新學習
2. 相同的觸控手感 → 肌肉記憶延續
3. 色彩變化識別 → 橙黃 (學習) vs 冰藍 (探索)
4. 統一的 Snow Mode → 雪場環境一鍵切換

**開發者體驗**:
1. 複製 `globals.css` 色彩區塊
2. 修改 `--btn-primary-bg` 和 `--accent`
3. 更新徽章漸層色 (從 `orange` → `cyan`)
4. 保持所有動畫與工具類別不變

---

## 📚 設計原則總結

### Linus "Good Taste" 應用

1. **統一而非重複** - 共享核心動畫與結構
2. **差異化有意義** - 色彩變化對應功能差異
3. **品質一致性** - 相同的光暈強度與間距韻律
4. **簡潔優雅** - 避免不必要的特殊情況

### 未來擴展指南

新增系統時，僅需:
1. 選擇專屬主色 (綠/粉/紫...)
2. 更新 CSS 變數的 5 個色值
3. 保持所有其他設計元素不變

範例色彩方案:
- **教練排課**: Emerald (綠色) - 成長與協調
- **雪伴媒合**: Pink (粉色) - 社交與連結
- **裝備租借**: Violet (紫色) - 專業與品質

---

**文件版本**: v1.0
**建立日期**: 2025-12-02
**設計系統**: Alpine Velocity (Mountain Ice Variant)
