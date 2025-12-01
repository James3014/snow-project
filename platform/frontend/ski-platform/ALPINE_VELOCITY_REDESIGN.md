# Alpine Velocity UI/UX 改造完成

## 改造日期
2025-12-02

## 改造範圍
將 ski-platform (resort-services 前端) 從淺色簡約風格改造為 **Alpine Velocity - Mountain Ice** 深色動態風格，與單板教學系統保持一致的設計語言。

---

## 修改檔案清單

### 1. ✅ `src/index.css` - 全局樣式系統
**改動**:
- 從淺色背景 (`rgb(249 250 251)`) 改為深色 (`#09090b`)
- 加入 Alpine Velocity 核心設計變數
- 引入 Google Fonts: Bebas Neue (顯示字體) + Space Mono (內文字體)
- 加入 Mountain Ice 主題色系 (Cyan/Blue)
- 新增動畫: `slide-in-diagonal`, `velocity-shine`, `mountain-pulse`
- 新增工具類別: `.velocity-shine`, `.resort-card-pulse`, `.text-gradient-velocity`

### 2. ✅ `src/features/course-tracking/components/ResortCard.tsx` - 新元件
**新建檔案** - Alpine Velocity 風格的雪場卡片元件

**核心特徵**:
- 斜切角外框 `clip-path: polygon(...)`
- 傾斜標題文字 `-skew-x-2` 使用 Bebas Neue
- Logo 圖片區 + 漸層遮罩
- 左上角高光 + 右上角對角線裝飾
- Cyan/Blue 漸層徽章
- 底部速度條紋 (`via-cyan-500/20`)
- Velocity Shine 點擊效果
- Mountain Pulse 持續脈動動畫

### 3. ✅ `src/features/course-tracking/pages/ResortList.tsx` - 主頁面改造
**改動**:
- 頁面標題: 使用 `text-gradient-velocity` + Bebas Neue
- 搜尋框: 深色背景 (`bg-zinc-900`) + Cyan 聚焦效果
- 地區篩選: 深色下拉選單
- 統計卡片: 從白色 Card 改為深色 (`bg-zinc-800`)，數字使用 Bebas Neue
- 雪場列表: 使用新的 `ResortCard` 元件取代原有的 `Card`
- 空狀態: 深色背景提示

---

## 設計系統：Mountain Ice

### 色彩方案
```css
主色: Cyan/Blue (#06b6d4 → #0891b2) 冰川藍
輔助: Emerald (#059669) 森林綠
背景: Zinc 900/950 (#09090b) 深灰黑
文字: White/Zinc 400 高對比
```

### 字體系統
```css
Display Font: 'Bebas Neue' - 標題、數字、強調
Body Font: 'Space Mono' - 內文、技術資訊 (等寬)
```

### 核心視覺元素
1. **斜切角卡片** - 12px 切角，技術感外框
2. **傾斜文字** - 標題 `-skew-x-2`，徽章反向 `skew-x-1`
3. **漸層光效** - 左上高光、右上裝飾、底部條紋
4. **動態效果** - Velocity Shine (點擊)、Mountain Pulse (脈動)

---

## 與單板教學的對比

| 元素 | 單板教學 | Ski-Platform (改造後) |
|-----|---------|----------------------|
| 主色 | Orange/Amber (速度) | Cyan/Blue (冰川) |
| 字體 | Bebas + Space Mono | Bebas + Space Mono ✅ |
| 卡片 | 斜切角 + 傾斜 | 斜切角 + 傾斜 ✅ |
| 動畫 | Velocity Shine | Velocity Shine ✅ |
| 脈動 | Lesson Card Pulse | Resort Card Pulse ✅ |
| 徽章 | Orange → Amber | Cyan → Blue ✅ |

**設計語言一致性**: 100%
**功能差異化**: 通過色彩系統 (橙黃 vs 冰藍)

---

## 測試檢查清單

### 視覺檢查
- [ ] 深色背景正確顯示
- [ ] Bebas Neue 字體載入成功
- [ ] 卡片斜切角渲染正確
- [ ] 漸層效果顯示正常
- [ ] Logo 圖片正確顯示或降級到 emoji

### 互動檢查
- [ ] 搜尋框 Focus 邊框變為 Cyan
- [ ] 卡片點擊縮放效果 (`active:scale-[0.97]`)
- [ ] Velocity Shine 光澤掃過動畫
- [ ] Mountain Pulse 脈動動畫循環

### 響應式檢查
- [ ] 手機端 (1 列)
- [ ] 平板端 (2-3 列)
- [ ] 桌面端 (4 列)

---

## 啟動與測試

```bash
cd /Users/jameschen/Downloads/diyski/project/platform/frontend/ski-platform

# 安裝依賴 (如果尚未安裝)
npm install

# 啟動開發伺服器
npm run dev

# 訪問
open http://localhost:5173
```

---

## 後續工作

### 高優先級
- [ ] 改造 ResortDetail 頁面 (雪場詳情)
- [ ] 改造導航列 (Header/Navigation)
- [ ] 改造其他課程追蹤頁面

### 中優先級
- [ ] 加入 Snow Mode 高對比主題切換
- [ ] 優化移動端觸控反饋
- [ ] 加入載入動畫

### 低優先級
- [ ] 圖片懶加載優化
- [ ] 動畫效能優化
- [ ] 無障礙功能增強

---

## 設計原則遵循

✅ **Linus "Good Taste"**
- 簡潔優於複雜 - 保持元件職責單一
- 資料結構第一 - UI 呼應 Resort 資料結構
- 消除特殊情況 - 統一的卡片模式
- 品味 - 精確的光暈、陰影、間距控制

✅ **Alpine Velocity 美學**
- 速度感 - 對角線動畫、光澤掃過
- 技術感 - 等寬字體、斜切角
- 運動感 - 傾斜文字、動態脈動
- 專業感 - 高品質漸層、冰川配色

---

## 參考資源

- **單板教學 UI**: `/Users/jameschen/Downloads/diyski/project/specs/單板教學/web`
- **設計系統文件**: `/Users/jameschen/Downloads/diyski/project/specs/resort-services/DESIGN_SYSTEM.md`
- **視覺對比文件**: `/Users/jameschen/Downloads/diyski/project/specs/resort-services/UI_COMPARISON.md`

---

**改造狀態**: ✅ ResortList 頁面完成
**設計系統版本**: v1.0 (Mountain Ice)
**維護者**: Claude Code + Frontend Design Skill
