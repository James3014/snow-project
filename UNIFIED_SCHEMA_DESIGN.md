# SnowTrace 統一行事曆系統設計

## 系統分析

### 現有日期系統分佈
1. **前端 AI 助手** - 自然語言日期解析 (dateParser.ts)
2. **Tour 系統** - Trip/Day/Item 行程管理 (Prisma + PostgreSQL)  
3. **Snowbuddy Matching** - 可用性日期列表 (Python + Pydantic)
4. **Resort API** - 滑雪足跡紀錄 (SkiHistoryCreate)
5. **User-Core** - 雪具管理時間軸 (GearItem, GearInspection)

### 架構決策：整合到 user-core
**理由：**
- 用戶資料集中，避免分散
- 利用現有認證系統
- 簡化服務間同步
- 行事曆本質上是個人資料

## 統一 Prisma Schema（替換現有）

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 核心行程模型 - 整合媒合功能
model Trip {
  id           String    @id @default(cuid())
  user_id      String
  title        String
  
  // 統一日期系統
  start_date   DateTime
  end_date     DateTime
  timezone     String    @default("Asia/Taipei")
  
  // 媒合整合
  visibility   TripVisibility @default(PRIVATE)
  max_buddies  Int       @default(1)
  current_buddies Int    @default(0)
  
  // 行程詳情
  template_id  String?
  resort_id    String?
  resort_name  String?
  region       String?
  people_count Int?
  note         String?
  
  // 狀態管理
  status       TripStatus @default(PLANNING)
  
  // 時間戳
  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt
  
  // 關聯
  days         Day[]
  trip_buddies TripBuddy[]
  calendar_events CalendarEvent[]
  matching_requests MatchingRequest[]

  @@index([user_id])
  @@index([start_date, end_date])
  @@index([visibility, status])
}

// 統一行事曆事件
model CalendarEvent {
  id          String    @id @default(cuid())
  user_id     String
  
  // 事件基本資訊
  type        EventType
  title       String
  description String?
  
  // 時間資訊
  start_date  DateTime
  end_date    DateTime
  all_day     Boolean   @default(false)
  timezone    String    @default("Asia/Taipei")
  
  // 關聯資訊
  trip_id     String?
  resort_id   String?
  
  // 外部整合
  google_event_id  String?
  outlook_event_id String?
  
  // 媒合相關
  matching_id      String?
  participants     String[] // JSON array of user_ids
  
  // 提醒設定
  reminders        Json?    // [{type: 'email', minutes: 1440}]
  
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  
  // 關聯
  trip        Trip?     @relation(fields: [trip_id], references: [id], onDelete: Cascade)
  
  @@index([user_id, start_date])
  @@index([type, start_date])
}

// 雪伴關聯
model TripBuddy {
  id         String      @id @default(cuid())
  trip_id    String
  user_id    String      // 被邀請的用戶
  inviter_id String      // 邀請者
  
  status     BuddyStatus @default(PENDING)
  role       BuddyRole   @default(BUDDY)
  
  // 申請資訊
  request_message String?
  response_message String?
  
  // 時間戳
  requested_at DateTime  @default(now())
  responded_at DateTime?
  joined_at    DateTime?
  
  // 關聯
  trip       Trip      @relation(fields: [trip_id], references: [id], onDelete: Cascade)
  
  @@unique([trip_id, user_id])
  @@index([user_id, status])
}

// 媒合請求記錄
model MatchingRequest {
  id          String           @id @default(cuid())
  trip_id     String
  requester_id String
  
  // 媒合參數
  preferences Json             // MatchingPreference as JSON
  
  // 結果
  status      MatchingStatus   @default(PENDING)
  results     Json?            // MatchSummary[] as JSON
  
  // 時間戳
  created_at  DateTime         @default(now())
  completed_at DateTime?
  
  // 關聯
  trip        Trip             @relation(fields: [trip_id], references: [id], onDelete: Cascade)
  
  @@index([requester_id, status])
}

// 保持現有的 Day/Item 結構，但簡化
model Day {
  id         String  @id @default(cuid())
  trip_id    String
  day_index  Int
  label      String
  
  // 地點資訊
  city       String?
  resort_id  String?
  resort_name String?
  region     String?
  
  // 滑雪相關
  is_ski_day Boolean @default(false)
  
  items      Item[]
  trip       Trip    @relation(fields: [trip_id], references: [id], onDelete: Cascade)

  @@index([trip_id])
  @@unique([trip_id, day_index])
}

model Item {
  id         String    @id @default(cuid())
  day_id     String
  type       String
  title      String
  
  // 時間資訊（保持靈活性）
  start_time DateTime?
  end_time   DateTime?
  time_hint  String?   // "早上"、"下午" 等
  
  // 地點資訊
  location   String?
  resort_id  String?
  resort_name String?
  region     String?
  
  // 其他
  link       String?
  note       String?
  
  created_at DateTime  @default(now())
  day        Day       @relation(fields: [day_id], references: [id], onDelete: Cascade)

  @@index([day_id])
}

// 保持現有的 Checklist/Packing
model ChecklistItem {
  id         String   @id @default(cuid())
  trip_id    String
  category   String
  title      String
  completed  Boolean  @default(false)
  order      Int
  created_at DateTime @default(now())

  @@index([trip_id])
}

model PackingItem {
  id         String   @id @default(cuid())
  trip_id    String
  category   String
  title      String
  completed  Boolean  @default(false)
  order      Int
  created_at DateTime @default(now())

  @@index([trip_id])
}

// 枚舉定義
enum TripVisibility {
  PRIVATE
  FRIENDS_ONLY
  PUBLIC
}

enum TripStatus {
  PLANNING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum EventType {
  TRIP
  AVAILABILITY
  MEETING
  REMINDER
  EXTERNAL
  SNOWBUDDY_MATCH
}

enum BuddyStatus {
  PENDING
  ACCEPTED
  DECLINED
  CANCELLED
}

enum BuddyRole {
  OWNER
  BUDDY
  COACH
  STUDENT
}

enum MatchingStatus {
  PENDING
  COMPLETED
  FAILED
  EXPIRED
}
```

## 關鍵改進

### 1. 統一時間系統
- 所有 DateTime 字段必填（除了特殊情況）
- 統一時區處理
- start_date + end_date 替代單一 date

### 2. 原生媒合支援
- Trip 直接支援 visibility 和 max_buddies
- TripBuddy 完整的邀請流程
- MatchingRequest 記錄所有媒合歷史

### 3. 統一行事曆
- CalendarEvent 涵蓋所有類型事件
- 支援外部行事曆整合
- 靈活的提醒系統

### 4. 保持現有優勢
- Day/Item 結構保持不變
- Checklist/Packing 功能完整
- 模板系統相容

## 遷移策略

### Step 1: 備份現有 schema
```bash
cp prisma/schema.prisma prisma/schema.prisma.backup
```

### Step 2: 應用新 schema
```bash
# 刪除現有資料庫（沒有用戶資料）
npx prisma db push --force-reset

# 應用新 schema
npx prisma db push
```

### Step 3: 更新 TypeScript 類型
```bash
npx prisma generate
```

### Step 4: 更新 API 和前端
- 一次性更新所有相關代碼
- 利用 TypeScript 編譯錯誤指導修改
- 測試所有功能

## 優勢

1. **最優架構**: 沒有歷史包袱，設計最佳方案
2. **統一系統**: 行程和媒合完全整合
3. **未來擴展**: 為外部行事曆整合做好準備
4. **開發效率**: 一次性重構，避免後續技術債
## 雪具管理整合

### 新增雪具使用紀錄
```prisma
model GearUsageLog {
  id               String   @id @default(cuid())
  gear_item_id     String   // 關聯到 user-core 的 GearItem
  trip_id          String?  // 關聯到行程
  resort_id        String?  // 關聯到雪場
  usage_date       DateTime
  usage_type       String   @default("skiing") // skiing, practice, teaching
  performance_rating Int?   @check(performance_rating >= 1 AND performance_rating <= 5)
  conditions       String?  // 雪況、天氣
  notes            String?
  created_at       DateTime @default(now())
  
  // 關聯
  trip             Trip?    @relation(fields: [trip_id], references: [id])
  
  @@index([gear_item_id, usage_date])
}
```

### CalendarEvent 擴展雪具事件
```prisma
// 在現有 CalendarEvent 中新增
model CalendarEvent {
  // ... 現有欄位
  
  // 雪具相關 (新增)
  gear_items  Json? // 使用的裝備 ID 列表 ["gear_123", "gear_456"]
  
  // 事件類型擴展
  type        CalendarEventType
}

enum CalendarEventType {
  TRIP_PLANNING
  TRIP_CONFIRMED
  SKI_SESSION      // 滑雪活動紀錄
  GEAR_INSPECTION  // 裝備檢查
  GEAR_MAINTENANCE // 裝備保養
  BUDDY_MATCHING
  LESSON_BOOKING
}
```

### 整合要點
1. **行程建立時** → 選擇使用裝備 → 自動建立 GearUsageLog
2. **裝備檢查/保養** → 建立 CalendarEvent (GEAR_INSPECTION/GEAR_MAINTENANCE)
3. **統一日曆** → 顯示所有滑雪、裝備、媒合相關事件
4. **智能提醒** → 基於使用頻率自動排程裝備維護
