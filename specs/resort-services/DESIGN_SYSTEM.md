# Resort Services Design System
## 基於 Alpine Velocity 美學的 Mountain Ice 變體

---

## 📐 設計系統概覽

### 美學定位：Mountain Ice (山岳冰川)

延續單板教學的 Alpine Velocity 設計語言，針對雪場資訊場景做出差異化調整：
- 從 **速度與運動感** (橙黃) → **探索與地理感** (冰藍)
- 保持核心視覺元素：斜切角、傾斜字體、動態光效
- 統一手機優先、高對比、觸控友善的互動設計

---

## 🎨 色彩系統對比

### 單板教學 (Snowboard Teaching)
```
主色：Orange/Amber 系統
- Primary: #f59e0b (amber-500) 速度橙
- Accent: #fb923c (orange-400)
- Gradient: amber → orange → red
- 情境：運動、速度、技巧學習
```

### 雪場服務 (Resort Services)
```
主色：Cyan/Blue 系統
- Primary: #0891b2 (cyan-600) 冰川藍
- Accent: #06b6d4 (cyan-500)
- Gradient: cyan → blue → sky
- 情境：地理、探索、資訊查詢
```

### Snow Mode 共通設計
```
高對比黑白基底 + 強調色
單板教學：黑白 + 琥珀黃 (#f59e0b)
雪場服務：黑白 + 天空藍 (#0ea5e9)
```

---

## 🔤 字體系統 (完全一致)

```css
/* Display Font - 滑雪場標誌風格 */
--font-display: 'Bebas Neue', 'Impact', sans-serif;

/* Body Font - 技術等寬字體 */
--font-body: 'Space Mono', 'Courier New', monospace;
```

**使用原則**:
- 標題/數字/強調 → Bebas Neue (全大寫，追蹤寬鬆)
- 內文/說明/輔助 → Space Mono (等寬，資訊密度高)

---

## 🃏 卡片設計模式

### 共通結構
```tsx
<div className="
  velocity-shine
  [card]-pulse
  relative
  rounded-2xl
  bg-zinc-800
  border-2
  border-[color]
  [clip-path:polygon(0_12px,12px_0,100%_0,...)]
  active:scale-[0.97]
  active:translate-y-1
">
  {/* 左上角高光 */}
  <div className="absolute top-0 left-0 w-16 h-16
    bg-gradient-to-br from-white/10 to-transparent
    [clip-path:polygon(0_0,100%_0,0_100%)]" />

  {/* 對角線裝飾 */}
  <div className="absolute top-0 right-0 w-24 h-24
    bg-gradient-to-br from-[accent]/10 to-transparent
    [clip-path:polygon(100%_0,100%_100%,0_0)]" />

  {/* 標題 - 傾斜字體 */}
  <h3 className="
    [card]-title
    text-gradient-velocity
    transform -skew-x-3
    font-display
  ">
    {title}
  </h3>

  {/* 徽章 - 反向傾斜 */}
  <div className="transform -skew-x-2">
    <span className="badge skew-x-2">...</span>
  </div>

  {/* 底部速度條紋 */}
  <div className="absolute bottom-2 left-6 right-6 h-1
    bg-gradient-to-r from-transparent via-[accent]/20 to-transparent" />
</div>
```

### 差異點

| 元素 | 單板教學 | 雪場服務 |
|-----|---------|---------|
| 邊框色 | `border-zinc-700` + amber glow | `border-zinc-700` + cyan glow |
| 主徽章漸層 | `from-orange-500/25 to-amber-500/25` | `from-cyan-500/25 to-blue-500/25` |
| 文字陰影 | `rgba(251, 191, 36, 0.1)` amber | `rgba(6, 182, 212, 0.1)` cyan |
| 脈動動畫 | `lesson-card-pulse` | `resort-card-pulse` |

---

## ✨ 動畫系統

### 核心動畫 (共通)

1. **Velocity Shine** - 點擊光澤效果
```css
@keyframes velocity-shine {
  from { transform: translateX(-100%); }
  to { transform: translateX(200%); }
}
```

2. **Diagonal Slide In** - 對角線進場
```css
@keyframes slide-in-diagonal {
  from {
    opacity: 0;
    transform: translate(-20px, 30px);
  }
  to {
    opacity: 1;
    transform: translate(0, 0);
  }
}
```

3. **Pulse Glow** - 持續脈動
```css
@keyframes [prefix]-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba([color], 0); }
  50% { box-shadow: 0 0 20px 4px rgba([color], 0.15); }
}
```

### 互動反饋 (統一)
```css
/* 按壓縮放 */
active:scale-[0.97] active:translate-y-1

/* Hover 高光 */
hover:bg-zinc-800 hover:text-white

/* 過渡時間 */
transition-all duration-200
```

---

## 🎯 徽章設計

### 漸層徽章模板
```tsx
<span className="
  px-3 py-1.5
  bg-gradient-to-r from-[color-1]/25 to-[color-2]/25
  border border-[color-1]/40
  text-[color-text]
  rounded-lg
  text-xs font-bold tracking-wide
  backdrop-blur-sm
  skew-x-1
">
  內容
</span>
```

### 配色方案

**單板教學**:
- 難度: `orange → amber` (橙黃漸層)
- 技能: `purple → pink` (紫粉漸層)

**雪場服務**:
- 雪道數: `cyan → blue` (冰藍漸層)
- 垂直落差: `purple → pink` (紫粉漸層)
- 最長雪道: `emerald → teal` (綠松漸層)

---

## 📱 互動設計標準

### 觸控目標尺寸
```tsx
// 最小觸控區域: 44x44px
<button className="w-11 h-11">  // 44px × 44px
  🔍
</button>

// 文字按鈕
<button className="h-11 px-3">  // 高度 44px, 左右自適應
  登入
</button>
```

### 按鈕狀態
```tsx
className="
  w-11 h-11
  flex items-center justify-center
  text-xl
  hover:bg-zinc-800
  rounded-lg
  active:scale-95
  transition-all
"
```

### 輸入框設計
```tsx
<input className="
  w-full h-12
  pl-12 pr-4
  bg-zinc-800
  border-2 border-zinc-700
  rounded-xl
  focus:border-[accent]
  focus:ring-2 focus:ring-[accent]/20
  text-base
" />
```

---

## 🌓 Snow Mode 實現

### 主題切換邏輯
```tsx
const [snowMode, setSnowMode] = useState(false);

<div data-theme={snowMode ? 'snow' : undefined}>
  {/* 應用內容 */}
</div>
```

### CSS 變數覆蓋
```css
[data-theme="snow"] {
  --background: #000000;  /* 純黑 */
  --foreground: #ffffff;  /* 純白 */
  --btn-primary-bg: #0ea5e9;  /* 天空藍 */
  --btn-primary-text: #000000;  /* 黑字 */
  --card-border: #0ea5e9;  /* 藍色邊框 */
}
```

### 環境光暈效果
```css
[data-theme="snow"] body::before {
  content: '';
  position: fixed;
  background: radial-gradient(
    circle at 50% 0%,
    rgba([accent-rgb], 0.03) 0%,
    transparent 50%
  );
}
```

---

## 📦 元件庫對照

### Header 元件
```
單板教學: HomeHeader.tsx
雪場服務: (內嵌於 page.tsx)

共通元素:
- Logo + 標題
- 雪地模式切換 ❄️/☀️
- 使用者功能按鈕 (收藏/練習/足跡)
- 搜尋列
```

### 卡片元件
```
單板教學: LessonCard.tsx
雪場服務: ResortCard.tsx

共通結構:
- 斜切角外框
- 傾斜標題 (Bebas Neue)
- 多個漸層徽章
- 底部速度條紋
```

### 搜尋元件
```
單板教學: SearchBar.tsx
雪場服務: SearchBar.tsx

完全一致:
- 圓角輸入框
- 左側 emoji 圖標
- 右側清除按鈕
- Focus 藍光效果
```

---

## 🎬 實現檢查清單

### ✅ 已實現
- [x] 色彩系統：Cyan/Blue 主題
- [x] 字體系統：Bebas Neue + Space Mono
- [x] 卡片設計：斜切角 + 傾斜文字
- [x] 動畫效果：Velocity Shine + Pulse
- [x] Snow Mode：高對比主題切換
- [x] 互動反饋：按壓縮放 + Hover 高光
- [x] 手機優先：大觸控目標 + 響應式

### 🔄 待實現
- [ ] 雪場詳細頁面
- [ ] 足跡紀錄功能
- [ ] 分享圖卡生成
- [ ] 交通查詢介面
- [ ] 與 API 整合

---

## 🎨 視覺品質標準

### Linus "Good Taste" 原則應用

1. **光暈與陰影一致性**
   - 所有光效使用相同的透明度層級 (10%, 15%, 20%, 25%)
   - 陰影模糊半徑統一 (8px, 20px, 30px)

2. **間距韻律感**
   - 元件間距: 4, 6, 8, 12, 16, 24 (Tailwind scale)
   - 卡片內邊距: p-6 (24px)
   - 徽章間距: gap-2 (8px)

3. **色彩對比度**
   - 普通模式: ≥ 4.5:1 (WCAG AA)
   - Snow Mode: ≥ 12:1 (極高對比)

4. **動畫時間統一**
   - 快速反饋: 200ms
   - 進場動畫: 600ms
   - 持續效果: 3s (pulse)

---

## 📚 參考資源

- **源設計**: `../單板教學/web/src/app/globals.css`
- **色彩靈感**: Tailwind Cyan/Sky 色板
- **字體來源**: Google Fonts (Bebas Neue, Space Mono)
- **動畫參考**: Alpine 滑雪運動的速度與流暢感

---

## 🔗 整合指南

### 如何在新專案中使用

1. 複製 `globals.css` 的色彩變數區塊
2. 修改主色系 (從 amber → cyan, 或其他)
3. 保持核心動畫與工具類別不變
4. 使用相同的卡片結構模板
5. 遵循統一的互動反饋標準

### 品牌色彩擴展範例

```css
/* 教練排課系統 - Green Theme */
--btn-primary-bg: #059669;  /* emerald-600 */
--accent: #10b981;  /* emerald-500 */
--gradient-primary: linear-gradient(135deg, #10b981 0%, #059669 100%);

/* 雪伴媒合系統 - Pink Theme */
--btn-primary-bg: #db2777;  /* pink-600 */
--accent: #ec4899;  /* pink-500 */
--gradient-primary: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
```

---

**設計系統版本**: v1.0
**最後更新**: 2025-12-02
**維護者**: Claude Code + Frontend Design Skill
