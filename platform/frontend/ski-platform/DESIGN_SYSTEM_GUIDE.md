# Glacial Futurism Design System - 應用指南

## 🎨 設計哲學

**冰川未來主義 (Glacial Futurism)** = 極地冰川的純淨 × 科技未來的銳利

### 核心原則
1. **Mobile-First**: 所有設計優先考慮手機用戶
2. **Glassmorphism**: 毛玻璃效果貫穿所有卡片
3. **流體動畫**: 滑雪軌跡般的流暢交互
4. **沉浸式體驗**: 動態背景 + 粒子效果

---

## 📐 設計 Tokens

### 顏色系統
```css
/* 主色調 - 冰藍漸層 */
--ice-primary: #00d4ff      /* 冰藍 */
--ice-secondary: #0066ff    /* 深藍 */
--ice-accent: #00ffaa       /* 青綠 */
--frost-white: #f0f9ff      /* 霜白 */
--crystal-blue: #cfe9ff     /* 水晶藍 */

/* 霓虹點綴 */
--neon-cyan: #00f0ff
--neon-pink: #ff006e
--neon-purple: #7b2cbf

/* 背景 */
--bg-deep-space: #0a0e27    /* 深空藍 */
--bg-ice-dark: #0f1629
--bg-glacier: #1a1f3a
```

### 字體系統
```css
--font-display: 'Orbitron'  /* 標題 - 未來科技感 */
--font-body: 'Outfit'       /* 內文 - 現代幾何 */
```

### 間距系統 (Mobile-First)
```css
--space-xs: 0.5rem    /* 8px */
--space-sm: 0.75rem   /* 12px */
--space-md: 1rem      /* 16px */
--space-lg: 1.5rem    /* 24px */
--space-xl: 2rem      /* 32px */
--space-2xl: 3rem     /* 48px */
```

### 圓角系統
```css
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 24px
--radius-full: 9999px
```

### 陰影系統
```css
--shadow-ice: 0 4px 24px rgba(0, 212, 255, 0.1)
--shadow-glacier: 0 8px 32px rgba(0, 212, 255, 0.15)
--shadow-aurora: 0 12px 48px rgba(0, 212, 255, 0.2)
--shadow-neon: 0 0 20px rgba(0, 240, 255, 0.4)
```

---

## 🧩 核心組件

### 1. Glass Card（毛玻璃卡片）
```tsx
<div className="glass-card p-6">
  {/* 內容 */}
</div>
```

**特點**：
- 半透明背景
- 20px blur backdrop-filter
- 冰藍邊框
- Hover 時發光 + 上浮

### 2. Neon Button（霓虹按鈕）
```tsx
<button className="btn-neon">
  點擊我
</button>
```

**特點**：
- 冰藍漸層背景
- Orbitron 字體
- 全大寫字母
- Hover 閃光效果
- Active 狀態下壓

### 3. Glacier Input（冰川輸入框）
```tsx
<input
  type="text"
  className="input-glacier"
  placeholder="輸入內容..."
/>
```

**特點**：
- 毛玻璃背景
- Focus 時冰藍邊框 + 發光
- 平滑過渡動畫

### 4. Filter Pills（篩選藥丸）
```tsx
<button className={`filter-pill ${active ? 'active' : ''}`}>
  標籤名稱
</button>
```

**特點**：
- 圓角膠囊形狀
- Active 時漸層背景
- 水平滾動容器（手機）
- Scroll-snap 對齊

---

## 📄 頁面模板

### Hero Header 模板
```tsx
<div className="relative overflow-hidden px-4 pt-12 pb-16 mb-8">
  {/* 漸層背景 */}
  <div className="absolute inset-0 bg-gradient-to-b from-ice-primary/10 to-transparent opacity-50" />

  {/* 內容 */}
  <div className="relative z-10 max-w-4xl mx-auto text-center">
    <h1 className="text-5xl md:text-6xl font-bold text-gradient-glacier mb-6 animate-slide-up">
      頁面標題
    </h1>
    <p className="text-crystal-blue text-base md:text-lg animate-slide-up stagger-1">
      副標題描述
    </p>
  </div>
</div>
```

### Loading State 模板
```tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="text-center">
    <div className="spinner-glacier mb-4" />
    <p className="text-crystal-blue">載入中...</p>
  </div>
</div>
```

### Empty State 模板
```tsx
<div className="glass-card p-12 text-center max-w-md mx-auto">
  <div className="text-6xl mb-6">🔍</div>
  <h3 className="text-2xl font-bold text-frost-white mb-4">
    標題
  </h3>
  <p className="text-crystal-blue mb-8">
    描述文字
  </p>
  <button className="btn-neon">
    行動按鈕
  </button>
</div>
```

### Lock Screen（未登入狀態）模板
```tsx
<div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
  {/* 背景裝飾元素 */}
  <div className="absolute inset-0 z-0 opacity-10">
    {/* 浮動 emoji */}
  </div>

  {/* 鎖定卡片 */}
  <div className="relative z-10 text-center max-w-md w-full animate-slide-up">
    {/* 鎖頭圖標 */}
    <div className="inline-flex items-center justify-center w-24 h-24 mb-8 glass-card pulse-glow">
      <svg className="w-12 h-12 text-ice-primary">...</svg>
    </div>

    <h1 className="text-3xl md:text-4xl font-bold text-gradient-glacier mb-4">
      標題
    </h1>
    <p className="text-crystal-blue mb-8">描述</p>

    <button onClick={() => navigate('/login')} className="btn-neon ski-trail w-full">
      前往登入
    </button>
  </div>
</div>
```

---

## 🎬 動畫系統

### 進場動畫
```tsx
<div className="animate-slide-up">內容</div>
<div className="animate-slide-up stagger-1">延遲 0.1s</div>
<div className="animate-slide-up stagger-2">延遲 0.2s</div>
```

### 滑雪軌跡動畫
```tsx
<button className="btn-neon ski-trail">
  按鈕
</button>
```

### 脈衝發光
```tsx
<div className="pulse-glow">元素</div>
```

---

## 📱 Mobile-First 模式

### 水平滾動篩選器
```tsx
<div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2 -mx-4 px-4">
  <button className="filter-pill scroll-snap-item flex-shrink-0">
    選項 1
  </button>
  <button className="filter-pill scroll-snap-item flex-shrink-0">
    選項 2
  </button>
</div>
```

### 響應式網格
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 卡片 */}
</div>
```

---

## 🚀 快速應用清單

### 任何頁面改造步驟：

1. **替換 Loading State**
   ```tsx
   // 舊版
   <div>載入中...</div>

   // 新版
   <div className="flex items-center justify-center min-h-screen">
     <div className="text-center">
       <div className="spinner-glacier mb-4" />
       <p className="text-crystal-blue">載入中...</p>
     </div>
   </div>
   ```

2. **替換 Hero Header**
   - 加入漸層背景
   - 使用 `text-gradient-glacier`
   - 加入 `animate-slide-up`

3. **替換卡片**
   ```tsx
   // 舊版
   <Card className="bg-white">

   // 新版
   <div className="glass-card">
   ```

4. **替換按鈕**
   ```tsx
   // 舊版
   <button className="bg-blue-600 text-white">

   // 新版
   <button className="btn-neon">
   ```

5. **替換輸入框**
   ```tsx
   // 舊版
   <input className="border">

   // 新版
   <input className="input-glacier">
   ```

6. **加入進場動畫**
   ```tsx
   {items.map((item, index) => (
     <div
       key={item.id}
       className="animate-slide-up"
       style={{ animationDelay: `${index * 0.05}s` }}
     >
       {/* 內容 */}
     </div>
   ))}
   ```

---

## ✨ 特殊效果

### 浮動雪花粒子
```tsx
{[...Array(15)].map((_, i) => (
  <div
    key={i}
    className="snow-particle"
    style={{
      left: `${Math.random() * 100}%`,
      animationDuration: `${8 + Math.random() * 12}s`,
      animationDelay: `${Math.random() * 5}s`,
    }}
  />
))}
```

### Hover 發光效果
```tsx
<div className="glass-card group relative overflow-hidden">
  {/* 發光層 */}
  <div className="absolute inset-0 bg-gradient-to-br from-ice-primary/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

  {/* 內容 */}
  <div className="relative z-10">
    內容
  </div>
</div>
```

---

## 🎯 設計檢查清單

頁面設計完成前，確認：

- [ ] 使用 Glacial Futurism 配色
- [ ] 所有卡片使用 `.glass-card`
- [ ] 主要按鈕使用 `.btn-neon`
- [ ] 輸入框使用 `.input-glacier`
- [ ] 加入進場動畫 `.animate-slide-up`
- [ ] Hero 標題使用 `.text-gradient-glacier`
- [ ] Loading 使用 `.spinner-glacier`
- [ ] 手機版可用（測試 375px 寬度）
- [ ] 水平滾動區域使用 `.scroll-snap-x`
- [ ] 未登入狀態使用 Lock Screen 模板

---

**設計完成！** 所有頁面應用此指南後將擁有一致的 Glacial Futurism 美學。
