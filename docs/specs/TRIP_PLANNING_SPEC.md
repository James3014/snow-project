# 滑雪行程規劃與雪伴媒合系統 - 技術規格

**版本**: 1.0
**日期**: 2025-11-07
**狀態**: 規劃中

---

## 📌 系統概述

### 核心功能
1. **雪季規劃 (Season Planning)** - 管理整季滑雪計劃
2. **行程管理 (Trip Management)** - 創建、編輯、分享滑雪行程
3. **雪伴媒合 (Buddy Matching)** - 智能推薦與配對
4. **智能整合** - 與現有系統打通

### 設計原則
- Trip 是核心，所有功能圍繞 Trip 展開
- Matching 是基於 Trip 的功能，不是獨立系統
- 從 Season 開始，每個 Trip 必須屬於某個 Season
- 自動轉換 completed Trip → CourseVisit

---

## 🗄️ 數據模型設計

### 1. Season（雪季）

```python
class Season(Base):
    __tablename__ = "seasons"

    # 主鍵
    season_id = Column(UUID, primary_key=True, default=uuid.uuid4)

    # 外鍵
    user_id = Column(UUID, ForeignKey("user_profiles.user_id"), nullable=False)

    # 基本資訊
    title = Column(String(100), nullable=False)  # "2024-2025 日本雪季"
    description = Column(Text)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # 目標
    goal_trips = Column(Integer)           # 目標行程數
    goal_resorts = Column(Integer)         # 目標雪場數
    goal_courses = Column(Integer)         # 目標雪道數

    # 狀態
    status = Column(Enum(SeasonStatus), default=SeasonStatus.PLANNING)
    # PLANNING, ACTIVE, COMPLETED, ARCHIVED

    # 時間戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # 關聯
    trips = relationship("Trip", back_populates="season")
```

---

### 2. Trip（行程）

```python
class Trip(Base):
    __tablename__ = "trips"

    # 主鍵
    trip_id = Column(UUID, primary_key=True, default=uuid.uuid4)

    # 外鍵
    season_id = Column(UUID, ForeignKey("seasons.season_id"), nullable=False)
    user_id = Column(UUID, ForeignKey("user_profiles.user_id"), nullable=False)
    resort_id = Column(String(100), nullable=False)  # 目標雪場

    # 基本資訊
    title = Column(String(200))              # 可選標題，例如 "春節北海道之旅"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # 靈活度
    flexibility = Column(Enum(TripFlexibility), default=TripFlexibility.FIXED)
    # FIXED, FLEXIBLE_1_DAY, FLEXIBLE_3_DAYS, FLEXIBLE_WEEK

    # 訂票狀態
    ticket_status = Column(Enum(TicketStatus), default=TicketStatus.NOT_PLANNED)
    # NOT_PLANNED, RESEARCHING, READY_TO_BOOK, BOOKED, CONFIRMED, CANCELLED

    # 狀態
    trip_status = Column(Enum(TripStatus), default=TripStatus.PLANNING)
    # PLANNING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED

    # 可見性與分享
    visibility = Column(Enum(TripVisibility), default=TripVisibility.PRIVATE)
    # PRIVATE, FRIENDS_ONLY, PUBLIC, CUSTOM
    share_token = Column(String(64), unique=True)  # 分享連結用

    # 雪伴設定
    max_buddies = Column(Integer, default=0)  # 0 = 不接受雪伴
    current_buddies = Column(Integer, default=0)

    # 備註
    notes = Column(Text)

    # 時間戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)

    # 關聯
    season = relationship("Season", back_populates="trips")
    buddies = relationship("TripBuddy", back_populates="trip")
    custom_shares = relationship("TripShare", back_populates="trip")
```

---

### 3. TripBuddy（雪伴關聯）

```python
class TripBuddy(Base):
    __tablename__ = "trip_buddies"

    # 主鍵
    buddy_id = Column(UUID, primary_key=True, default=uuid.uuid4)

    # 外鍵
    trip_id = Column(UUID, ForeignKey("trips.trip_id"), nullable=False)
    user_id = Column(UUID, ForeignKey("user_profiles.user_id"), nullable=False)

    # 角色
    role = Column(Enum(BuddyRole), nullable=False)
    # OWNER, BUDDY

    # 狀態
    status = Column(Enum(BuddyStatus), default=BuddyStatus.PENDING)
    # PENDING, ACCEPTED, CONFIRMED, DECLINED, CANCELLED

    # 申請訊息（如果是 BUDDY）
    request_message = Column(Text)

    # 時間戳
    joined_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime)

    # 關聯
    trip = relationship("Trip", back_populates="buddies")
    user = relationship("UserProfile")
```

---

### 4. TripShare（自定義分享）

```python
class TripShare(Base):
    __tablename__ = "trip_shares"

    # 主鍵
    share_id = Column(UUID, primary_key=True, default=uuid.uuid4)

    # 外鍵
    trip_id = Column(UUID, ForeignKey("trips.trip_id"), nullable=False)
    shared_with_user_id = Column(UUID, ForeignKey("user_profiles.user_id"))
    shared_with_email = Column(String(255))  # 可選：分享給非註冊用戶

    # 權限
    can_edit = Column(Boolean, default=False)
    can_invite_buddies = Column(Boolean, default=False)

    # 時間戳
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)  # 可選：分享連結過期時間

    # 關聯
    trip = relationship("Trip", back_populates="custom_shares")
```

---

## 🔌 API 端點設計

### Season API

```
POST   /api/seasons
  - 創建新雪季
  - Body: { title, description, start_date, end_date, goals }

GET    /api/seasons
  - 列出用戶所有雪季
  - Query: ?status=active&sort=start_date

GET    /api/seasons/{season_id}
  - 雪季詳情（含統計）
  - Response: season + trips summary + progress

PATCH  /api/seasons/{season_id}
  - 更新雪季
  - Body: { title?, description?, end_date?, goals? }

DELETE /api/seasons/{season_id}
  - 刪除雪季（級聯刪除 trips）
  - 需確認對話

GET    /api/seasons/{season_id}/stats
  - 雪季統計
  - Response: { total_trips, completed_trips, resorts_visited, ... }
```

---

### Trip API

```
POST   /api/trips
  - 創建單個行程
  - Body: { season_id, resort_id, start_date, end_date, ... }

POST   /api/trips/batch
  - 批量創建行程 ⭐
  - Body: { season_id, trips: [{ resort_id, start_date, ... }, ...] }

GET    /api/trips
  - 列出行程
  - Query: ?season_id=xxx&status=planning&start_date_from=2025-01-01

GET    /api/trips/{trip_id}
  - 行程詳情
  - Response: trip + buddies + share_info

PATCH  /api/trips/{trip_id}
  - 更新行程
  - Body: { start_date?, end_date?, status?, ... }

DELETE /api/trips/{trip_id}
  - 刪除行程

PATCH  /api/trips/{trip_id}/complete
  - 標記為已完成
  - 自動觸發 → CourseVisit 轉換

GET    /api/trips/{trip_id}/share-link
  - 生成分享連結
  - Response: { share_url, token, expires_at }

POST   /api/trips/{trip_id}/shares
  - 自定義分享給特定用戶
  - Body: { user_id or email, permissions }

GET    /api/trips/shared/{share_token}
  - 通過分享連結訪問行程（公開）
```

---

### Buddy Matching API

```
GET    /api/trips/explore
  - 公開探索頁面
  - Query: ?resort_id=xxx&date_from=xxx&date_to=xxx&flexibility=xxx
  - Response: 符合條件的 public trips

GET    /api/trips/{trip_id}/recommended-buddies
  - 智能推薦雪伴（基於該 trip）
  - Response: 排序後的推薦用戶列表 + 匹配分數

POST   /api/trips/{trip_id}/buddy-requests
  - 申請加入某個 trip
  - Body: { message }

GET    /api/trips/{trip_id}/buddy-requests
  - 查看收到的雪伴申請（僅 trip owner）

PATCH  /api/trips/{trip_id}/buddy-requests/{buddy_id}
  - 接受/拒絕雪伴申請
  - Body: { status: "accepted" | "declined" }

GET    /api/users/me/buddy-requests
  - 我發出的雪伴申請列表

DELETE /api/trips/{trip_id}/buddies/{buddy_id}
  - 移除雪伴 / 退出 trip
```

---

### Calendar API

```
GET    /api/calendar/trips
  - 日曆視圖數據
  - Query: ?year=2025&month=1&season_id=xxx
  - Response: { date: [trips], ... }

GET    /api/calendar/year-overview
  - 年度總覽
  - Response: 每月統計
```

---

## 🎨 前端頁面設計

### 1. Season 管理頁面

**路由：** `/seasons`

**功能：**
- 列出所有雪季（卡片式）
- 創建新雪季（Modal）
- 每個卡片顯示：
  - 雪季名稱、日期範圍
  - 進度條（trips, resorts, courses）
  - 快速操作（編輯、刪除、查看）

---

### 2. Season 詳情頁

**路由：** `/seasons/{season_id}`

**功能：**
- Tabs:
  - **日曆視圖** - 月曆顯示所有 trips
  - **列表視圖** - Table 列出所有 trips
  - **統計儀表板** - 圖表展示進度

**日曆視圖：**
```
┌──────────────────────────────────────┐
│  2025 年 1 月         < 今天 >        │
├──────────────────────────────────────┤
│ 日  一  二  三  四  五  六            │
│         1   2   3   4   5           │
│ 6   7   8  [9-11 二世谷]  12         │
│                 [富良野]              │
│ 13  14  15  16  17  18  19          │
└──────────────────────────────────────┘

卡片式顯示：
┌────────────────────┐
│ 🏔️ 二世谷滑雪場    │
│ 1/9 - 1/11        │
│ ✅ 已訂票          │
│ 👥 2/4 雪伴        │
└────────────────────┘
```

**拖拽功能（建議方案 A）：**
- 拖拽卡片到不同日期
- 簡單移動整個行程

---

### 3. Trip 創建/編輯 Modal

**表單欄位：**
```
標題：[可選] _______________________
雪場：[下拉選擇] ▼
日期：[開始] 2025/01/09  [結束] 2025/01/11
靈活度：◯ 固定 ◯ ±1天 ◯ ±3天 ◯ ±1週
訂票狀態：[下拉] ▼ 尚未規劃
可見性：◯ 私人 ◯ 僅關注者 ◯ 公開
雪伴設定：接受 [0] 位雪伴 (0=不接受)
備註：__________________________________
```

**批量創建：**
- 按鈕：「+ 添加另一個行程」
- 可一次創建多個 trips

---

### 4. 公開探索頁面

**路由：** `/trips/explore`

**篩選面板：**
```
日期範圍：[2025/01/01] - [2025/03/31]
雪場：[全部] ▼
地區：[全部] ▼
靈活度：☑ 固定 ☑ ±1天 ☑ ±3天
訂票狀態：[全部] ▼
```

**Trip 卡片：**
```
┌─────────────────────────────────────┐
│ 👤 User123 · 中級滑雪者              │
│ ⭐⭐⭐⭐ (已完成 25 個雪場)             │
├─────────────────────────────────────┤
│ 🏔️ 二世谷滑雪場                      │
│ 📅 2025/01/09 - 01/11               │
│ 🔄 靈活度：± 1 天                    │
│ ✅ 已訂票                            │
│ 👥 雪伴：1/3                         │
├─────────────────────────────────────┤
│ 💬 "第一次去二世谷，想找熟悉的雪友"   │
├─────────────────────────────────────┤
│ [查看詳情]  [申請加入]               │
└─────────────────────────────────────┘

匹配度：88% ⭐⭐⭐⭐ (相同日期 + 相同雪場)
```

---

### 5. 智能推薦頁面

**路由：** `/trips/{trip_id}/recommendations`

**顯示：**
- 基於當前 trip 推薦雪伴
- 顯示匹配分數和原因

```
為您的「二世谷之旅」推薦雪伴：

┌─────────────────────────────────────┐
│ 匹配度：92% ⭐⭐⭐⭐⭐                  │
│                                     │
│ 👤 SnowMaster · 高級滑雪者           │
│ 去過 15 個相同雪場 · 互相關注         │
│                                     │
│ 🏔️ 二世谷滑雪場                      │
│ 📅 2025/01/09 - 01/11 (完全相同)    │
│ ✅ 已訂票                            │
│                                     │
│ 匹配原因：                           │
│ ✓ 完全相同日期 (40分)                │
│ ✓ 相同雪場 (30分)                    │
│ ✓ 互相關注 (10分)                    │
│ ✓ 去過相同雪場 (12分)                │
│                                     │
│ [查看檔案]  [發送申請]               │
└─────────────────────────────────────┘
```

---

## 🤖 智能匹配演算法

### Phase 1: 規則匹配（現在實施）

```python
def calculate_match_score(trip_a: Trip, trip_b: Trip,
                         user_a: User, user_b: User) -> MatchResult:
    """
    計算兩個 trip 的匹配分數

    Returns:
        MatchResult {
            score: int (0-100),
            reasons: List[str],
            breakdown: Dict[str, int]
        }
    """
    score = 0
    reasons = []
    breakdown = {}

    # === 1. 時間匹配 (最高 40 分) ===
    if trip_a.start_date == trip_b.start_date and trip_a.end_date == trip_b.end_date:
        score += 40
        reasons.append("完全相同日期")
        breakdown["date"] = 40
    elif has_date_overlap(trip_a, trip_b):
        overlap_days = calculate_overlap_days(trip_a, trip_b)
        score += min(30, overlap_days * 10)
        reasons.append(f"日期重疊 {overlap_days} 天")
        breakdown["date"] = min(30, overlap_days * 10)
    elif is_flexibility_compatible(trip_a, trip_b):
        score += 20
        reasons.append("靈活度可配合")
        breakdown["date"] = 20

    # === 2. 地點匹配 (最高 30 分) ===
    if trip_a.resort_id == trip_b.resort_id:
        score += 30
        reasons.append("相同雪場")
        breakdown["location"] = 30
    elif is_same_region(trip_a.resort_id, trip_b.resort_id):
        score += 15
        reasons.append("相同地區")
        breakdown["location"] = 15

    # === 3. 經驗匹配 (最高 20 分) ===
    level_a = calculate_user_level(user_a)  # 從 course-visits 分析
    level_b = calculate_user_level(user_b)
    level_diff = abs(level_a - level_b)

    if level_diff == 0:
        score += 20
        reasons.append("相同經驗等級")
        breakdown["experience"] = 20
    elif level_diff == 1:
        score += 15
        reasons.append("相似經驗等級")
        breakdown["experience"] = 15
    elif level_diff == 2:
        score += 10
        reasons.append("可互補經驗等級")
        breakdown["experience"] = 10

    # === 4. 社交因素 (最高 10 分) ===
    if is_mutual_follow(user_a, user_b):
        score += 10
        reasons.append("互相關注")
        breakdown["social"] = 10
    elif is_following(user_a, user_b):
        score += 5
        reasons.append("你關注此用戶")
        breakdown["social"] = 5

    # === 5. 歷史因素 (額外分數) ===
    common_resorts = get_common_resorts_visited(user_a, user_b)
    if len(common_resorts) > 0:
        score += min(8, len(common_resorts) * 2)
        reasons.append(f"去過 {len(common_resorts)} 個相同雪場")

    common_achievements = get_common_achievements(user_a, user_b)
    if len(common_achievements) > 0:
        score += min(5, len(common_achievements))
        reasons.append(f"有 {len(common_achievements)} 個相同成就")

    return MatchResult(
        score=min(100, score),  # 上限 100
        reasons=reasons,
        breakdown=breakdown
    )
```

---

### 用戶經驗等級計算

```python
def calculate_user_level(user: User) -> int:
    """
    從用戶的滑雪紀錄分析經驗等級

    Returns:
        1-5 (1=新手, 5=專家)
    """
    visits = get_user_course_visits(user.user_id)

    if len(visits) == 0:
        return 1  # 新手

    # 因素1: 完成的雪道數量
    total_courses = len(visits)

    # 因素2: 去過的雪場數量
    unique_resorts = len(set(v.resort_id for v in visits))

    # 因素3: 完成的高級雪道比例
    advanced_courses = sum(1 for v in visits if is_advanced_course(v.course_name))
    advanced_ratio = advanced_courses / total_courses if total_courses > 0 else 0

    # 因素4: 平均評分（代表滿意度和信心）
    avg_rating = sum(v.rating or 0 for v in visits) / total_courses

    # 綜合評分
    score = 0
    score += min(30, total_courses)          # 最多 30 分
    score += min(20, unique_resorts * 2)     # 最多 20 分
    score += advanced_ratio * 30             # 最多 30 分
    score += avg_rating * 4                  # 最多 20 分

    # 轉換為 1-5 等級
    if score < 20:
        return 1
    elif score < 40:
        return 2
    elif score < 60:
        return 3
    elif score < 80:
        return 4
    else:
        return 5
```

---

## 🔄 Trip → CourseVisit 自動轉換

### 觸發條件

```python
@router.patch("/trips/{trip_id}/complete")
async def complete_trip(
    trip_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    標記 trip 為已完成
    自動創建 CourseVisit 紀錄（可修改）
    """
    trip = get_trip(trip_id, db)

    # 1. 更新 trip 狀態
    trip.trip_status = TripStatus.COMPLETED
    trip.completed_at = datetime.utcnow()

    # 2. 自動創建 CourseVisit（基礎版本）
    course_visit = CourseVisit(
        user_id=user_id,
        resort_id=trip.resort_id,
        course_name="整體體驗",  # 預設，用戶可後續編輯
        visited_date=trip.end_date,

        # 預設空值，用戶可後續填寫
        rating=None,
        snow_condition=None,
        weather=None,
        difficulty_feeling=None,
        mood_tags=None,
        notes=f"自動從行程轉換: {trip.title or trip.resort_id}"
    )
    db.add(course_visit)

    # 3. 創建 ActivityFeed 動態
    activity = ActivityFeedItem(
        user_id=user_id,
        activity_type="trip_completed",
        content={
            "trip_id": str(trip_id),
            "resort_id": trip.resort_id,
            "trip_title": trip.title,
            "buddies_count": trip.current_buddies
        }
    )
    db.add(activity)

    db.commit()

    return {
        "trip": trip,
        "course_visit_id": course_visit.id,
        "message": "行程已完成，已自動創建雪道紀錄（可編輯補充詳情）"
    }
```

---

## 📱 動態牆整合

### 新增 Activity Types

```python
class ActivityType(Enum):
    # 現有的
    COURSE_COMPLETED = "course_completed"
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"

    # 新增的 Trip 相關
    TRIP_CREATED = "trip_created"           # 創建新行程（僅 public）
    TRIP_COMPLETED = "trip_completed"       # 完成行程
    BUDDY_MATCHED = "buddy_matched"         # 找到雪伴
    TRIP_UPDATED = "trip_updated"           # 行程重大更新（日期變更等）
    SEASON_GOAL_REACHED = "season_goal_reached"  # 達成雪季目標
```

### Feed 顯示範例

```
┌─────────────────────────────────────┐
│ 👤 User123                          │
│ 📅 創建了新行程  · 2 小時前          │
├─────────────────────────────────────┤
│ 🏔️ 規劃前往 二世谷滑雪場              │
│ 📅 2025/01/09 - 01/11               │
│ 👥 尋找 2 位雪伴                     │
│                                     │
│ [查看行程]  [申請加入]               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👤 User123 和 SnowMaster            │
│ 🤝 成為雪伴  · 5 小時前              │
├─────────────────────────────────────┤
│ 他們將一起前往 二世谷滑雪場           │
│ 📅 2025/01/09 - 01/11               │
│                                     │
│ 💬 1 則留言  ❤️ 12                  │
└─────────────────────────────────────┘
```

---

## 📅 開發排程（5 週）

### Week 1: 數據庫與核心 API
- Day 1-2: 數據庫 Migration (Season, Trip, TripBuddy, TripShare)
- Day 3-4: Season API (CRUD + Stats)
- Day 5-7: Trip API (CRUD + Batch + Share)

### Week 2: 前端基礎頁面
- Day 8-9: Season 管理頁面
- Day 10-11: Trip 列表與表單
- Day 12-14: 日曆視圖組件

### Week 3: 分享與探索
- Day 15-16: Trip 分享功能（連結、自定義）
- Day 17-18: 公開探索頁面
- Day 19-21: 篩選與排序

### Week 4: 智能匹配
- Day 22-23: 匹配演算法實現
- Day 24-25: 推薦 API 與頁面
- Day 26-28: Buddy Request 流程

### Week 5: 整合與優化
- Day 29-30: Trip → CourseVisit 轉換
- Day 31-32: ActivityFeed 整合
- Day 33-35: 測試、優化、修 Bug

---

## 🔮 Future Enhancements (Phase 4+)

1. **群組聊天** - Trip buddies 的即時通訊
2. **行程範本** - 常用行程快速創建
3. **費用分攤** - 計算雪伴間的共同開銷
4. **天氣提醒** - 行程前 3 天天氣預報
5. **機器學習推薦** - 基於歷史數據的智能配對

---

**最後更新**: 2025-11-07
**待確認**: 靈活度選項、訂票狀態、拖拽方案
