## 🏔️ 雪場資料欄位建議表（v2 Schema）

### 1. 基本資訊（Basic Info）
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| resort_id | string | 系統識別碼 | myoko_akakura_onsen |
| names.zh / en / ja | string | 多語系名稱 | 赤倉溫泉滑雪場 / Akakura Onsen / 赤倉温泉スキー場 |
| country_code | string | 國家代碼 (ISO 3166-1 alpha-2) | JP |
| region | string | 地區 / 都道府縣 | Niigata Prefecture |
| timezone | string | IANA 時區 | Asia/Tokyo |
| coordinates.lat / lng | float | 緯度 / 經度 | 36.893 / 138.189 |
| altitude | int | 海拔高度（m） | 1,200 |
| vertical_drop | int | 最大落差（m） | 650 |

---

### 2. 季節資訊（Season Info）
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| season.estimated_open | date | 預計開放日 | 2024-12-14 |
| season.estimated_close | date | 預計關閉日 | 2025-03-30 |
| season.season_notes | string | 雪季特性備註 | 降雪早、粉雪品質佳 |

---

### 3. 雪場定位與描述（Description）
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| description.highlights[] | array | 主要特色標籤 | ["粉雪品質佳", "適合家庭"] |
| description.tagline | string | 宣傳標語 | 新手與家庭的粉雪天堂 |
| description.resort_type | string | 類型（度假 / 滑行 / 混合） | resort |
| description.snow_quality | string | 平均雪質描述 | Light dry powder |

---

### 4. 設施資訊（Amenities）
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| amenities.general[] | array | 基本設施 | ["Kids Park", "Night Skiing"] |
| amenities.kids_facilities | bool | 是否有兒童設施 | true |
| amenities.onsen_availability | bool | 是否有溫泉 | true |

---

### 5. 雪道統計（Snow Stats）
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| snow_stats.lifts | int | 纜車數量 | 14 |
| snow_stats.courses_total | int | 雪道總數 | 17 |
| snow_stats.beginner_ratio | float | 初級比例 | 0.45 |
| snow_stats.intermediate_ratio | float | 中級比例 | 0.35 |
| snow_stats.advanced_ratio | float | 高級比例 | 0.20 |
| snow_stats.longest_run | float | 最長滑行距離（km） | 4.2 |
| snow_stats.elevation_range | string | 高度範圍 | 700–1350m |
| snow_stats.park_features | array | 特殊地形設施 | ["Terrain Park", "Mogul Field"] |

---

### 6. 雪道細節（Courses）
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| courses[].name | string | 雪道名稱 | Panorama Course |
| courses[].level | string | 等級 | beginner |
| courses[].tags[] | array | 特性標籤 | ["carving", "powder", "scenic"] |
| courses[].length | float | 雪道長度（m） | 1800 |
| courses[].elevation_diff | int | 高差（m） | 350 |
| courses[].avg_slope | float | 平均坡度（°） | 15.0 |
| courses[].description | string | 描述 | 寬闊緩坡，適合初學者 |
| courses[].notes | string | 備註 | 夜滑開放 |

---

### 7. 價格資訊（Pricing）
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| pricing.last_verified | date | 最新確認日期 | 2024-10-01 |
| pricing.ticket_types[] | array | 票種明細 | [{"type": "1-day", "adult": 5200, "child": 3000}] |

---

### 8. 租借資訊（Rental）
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| rental.last_verified | date | 最新確認日期 | 2024-10-01 |
| rental.items[] | array | 裝備列表 | [{"item": "Ski Set", "adult_price": 4500, "child_price": 3000}] |

---

### 9. 交通資訊（Transportation）
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| transportation.domestic.shinkansen[] | array | 新幹線資訊 | [{"from": "Tokyo", "to": "Nagano → Myoko", "duration_minutes": 180}] |
| transportation.domestic.bus[] | array | 巴士資訊 | [{"route": "Shinjuku → Myoko", "duration_minutes": 330}] |
| transportation.domestic.self_drive[] | array | 自駕路線 | [{"route": "Joshinetsu Expressway", "duration_minutes": 240}] |
| transportation.last_mile_options | string | 接駁資訊 | 提供飯店接送與巴士 |
| transportation.parking_info | string | 停車資訊 | 免費停車場 500 台 |

---

### 10. 資料維運（Meta）
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| content_sources[] | array | 資料來源 / 引用 | ["https://official-site.jp"] |
| last_updated | date | 最後更新時間 | 2024-10-14 |
| data_source_type | string | 資料來源類型 | manual / api / mixed |
| notes | string | 備註 / 維運說明 | 資料待更新，缺少部分國際航線資料 |

