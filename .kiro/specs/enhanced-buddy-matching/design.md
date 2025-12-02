# 設計文檔 - 加強雪伴匹配功能

## 概述

本設計文檔描述了 SnowTrace 平台雪伴匹配功能的增強方案。系統將整合行程規劃、使用者技能資料和學習系統，提供智能的雪伴推薦服務。

### 設計目標

1. **智能匹配**：基於多維度（時間、地點、技能、學習目標）的精準匹配
2. **效能優化**：支援大規模使用者的快速候選人過濾和計分
3. **深度整合**：與行程規劃和單板教學系統無縫整合
4. **可擴展性**：模組化設計，易於新增匹配維度

### 核心概念

- **匹配搜尋 (Matching Search)**：基於行程或使用者偏好的雪伴搜尋任務
- **候選人過濾 (Candidate Filtering)**：根據基本條件快速篩選潛在匹配對象
- **多維度計分 (Multi-dimensional Scoring)**：綜合考慮時間、地點、技能等因素計算匹配分數
- **CASI 技能分析 (CASI Skill Analysis)**：基於單板教學系統的五項核心技能掌握度

## 架構

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Trip Detail  │  │ Buddy Search │  │ Match Results│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   User Core Service (FastAPI)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Trip Planning API                          │   │
│  │  - POST /trip-planning/trips/{trip_id}/find-buddies │   │
│  │  - GET  /trip-planning/trips/{trip_id}/buddies      │   │
│  │  - POST /trip-planning/trips/{trip_id}/buddy-requests│  │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Buddy Matching Service                     │   │
│  │  - filter_candidates()                               │   │
│  │  - calculate_match_score()                           │   │
│  │  - get_casi_skill_profile()                          │   │
│  │  - get_learning_focus()                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (PostgreSQL)                   │
│  - trips                                                     │
│  - trip_buddies                                              │
│  - users                                                     │
│  - practice_logs (from 單板教學)                             │
│  - favorites (from 單板教學)                                 │
└─────────────────────────────────────────────────────────────┘
```

### 服務邊界

本功能主要在 **user-core** 服務中實現，原因：
1. 行程資料已在 user-core 中管理
2. 避免跨服務的複雜資料同步
3. 簡化部署和維護

## 組件與介面

### 1. Buddy Matching Service

核心匹配邏輯服務，負責候選人過濾和計分。

```python
# services/buddy_matching_service.py

class BuddyMatchingService:
    """雪伴匹配服務"""
    
    def find_buddies_for_trip(
        self,
        db: Session,
        trip_id: uuid.UUID,
        user_id: uuid.UUID,
        max_results: int = 20
    ) -> List[MatchResult]:
        """為行程尋找雪伴"""
        pass
    
    def filter_candidates(
        self,
        db: Session,
        seeker: User,
        trip: Trip,
        all_users: List[User]
    ) -> List[User]:
        """過濾候選人"""
        pass
    
    def calculate_match_score(
        self,
        db: Session,
        seeker: User,
        seeker_trip: Trip,
        candidate: User,
        candidate_trips: List[Trip]
    ) -> MatchScore:
        """計算匹配分數"""
        pass
```

### 2. CASI Skill Analyzer

分析使用者在單板教學系統中的技能掌握度。

```python
# services/casi_skill_analyzer.py

class CASISkillAnalyzer:
    """CASI 技能分析器"""
    
    CASI_SKILLS = [
        "stance_balance",      # 站姿與平衡
        "rotation",            # 旋轉
        "edging",              # 用刃
        "pressure",            # 壓力
        "timing_coordination"  # 時機與協調性
    ]
    
    def get_skill_profile(
        self,
        db: Session,
        user_id: uuid.UUID
    ) -> Dict[str, float]:
        """獲取使用者的 CASI 技能掌握度"""
        pass
    
    def calculate_skill_similarity(
        self,
        profile_a: Dict[str, float],
        profile_b: Dict[str, float]
    ) -> float:
        """計算兩個技能檔案的相似度"""
        pass
```

### 3. Learning Focus Tracker

追蹤使用者最近的學習焦點。

```python
# services/learning_focus_tracker.py

class LearningFocusTracker:
    """學習焦點追蹤器"""
    
    def get_recent_focus(
        self,
        db: Session,
        user_id: uuid.UUID,
        days: int = 30
    ) -> LearningFocus:
        """獲取使用者最近的學習焦點"""
        pass
    
    def calculate_focus_similarity(
        self,
        focus_a: LearningFocus,
        focus_b: LearningFocus
    ) -> float:
        """計算兩個學習焦點的相似度"""
        pass
```

## 資料模型

### 核心資料結構

```python
# schemas/buddy_matching.py

class MatchingPreference(BaseModel):
    """匹配偏好"""
    skill_level_min: SkillLevel
    skill_level_max: SkillLevel
    preferred_resorts: List[str]
    date_range: DateRange
    max_distance_km: Optional[int] = None

class MatchScore(BaseModel):
    """匹配分數"""
    total_score: int  # 0-100
    time_score: int   # 0-40
    location_score: int  # 0-30
    skill_score: int  # 0-20
    social_score: int  # 0-10
    reasons: List[str]  # 人類可讀的原因

class MatchResult(BaseModel):
    """匹配結果"""
    candidate_id: uuid.UUID
    candidate_name: str
    candidate_avatar: Optional[str]
    match_score: MatchScore
    candidate_trips: List[TripSummary]
    casi_skills: Dict[str, float]
    learning_focus: List[str]
    is_mutual_follower: bool

class CASISkillProfile(BaseModel):
    """CASI 技能檔案"""
    user_id: uuid.UUID
    stance_balance: float  # 0.0-1.0
    rotation: float
    edging: float
    pressure: float
    timing_coordination: float
    updated_at: datetime

class LearningFocus(BaseModel):
    """學習焦點"""
    user_id: uuid.UUID
    primary_skill: str  # CASI 技能
    recent_lessons: List[str]  # 最近練習的課程 ID
    skill_trend: Dict[str, str]  # "improving", "stable", "declining"
```

### 資料庫 Schema 擴展

```sql
-- 擴展 users 表，新增技能等級
ALTER TABLE users ADD COLUMN IF NOT EXISTS skill_level VARCHAR(20) DEFAULT 'beginner';

-- 新增 CASI 技能檔案表
CREATE TABLE IF NOT EXISTS casi_skill_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(user_id),
    stance_balance FLOAT DEFAULT 0.0,
    rotation FLOAT DEFAULT 0.0,
    edging FLOAT DEFAULT 0.0,
    pressure FLOAT DEFAULT 0.0,
    timing_coordination FLOAT DEFAULT 0.0,
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT skill_range CHECK (
        stance_balance BETWEEN 0 AND 1 AND
        rotation BETWEEN 0 AND 1 AND
        edging BETWEEN 0 AND 1 AND
        pressure BETWEEN 0 AND 1 AND
        timing_coordination BETWEEN 0 AND 1
    )
);

-- 新增匹配搜尋快取表
CREATE TABLE IF NOT EXISTS match_search_cache (
    search_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(trip_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    results JSONB,  -- 儲存 MatchResult 列表
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE INDEX idx_match_cache_trip ON match_search_cache(trip_id);
CREATE INDEX idx_match_cache_expires ON match_search_cache(expires_at);
```

## 正確性屬性

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 自動觸發匹配搜尋
*For any* 新創建的行程，如果可見性為「公開」或「好友可見」且 max_buddies > 0，系統應自動啟動匹配搜尋並儲存結果。
**Validates: Requirements 1.1, 1.2**

### Property 2: 候選人過濾完整性
*For any* 匹配搜尋，過濾後的候選人應滿足所有基本條件：未被封鎖、技能等級在範圍內、有重疊的偏好雪場、時間重疊。
**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

### Property 3: 匹配分數組成
*For any* 兩個使用者的匹配，最終分數應等於各維度分數的加權和，且總分在 0-100 之間。
**Validates: Requirements 3.1, 3.5**

### Property 4: 完全匹配最高分
*For any* 兩個行程，如果日期和雪場完全相同，時間和地點分數應達到最大值。
**Validates: Requirements 3.2**

### Property 5: 重疊天數比例計分
*For any* 兩個部分重疊的行程，時間分數應與重疊天數成正比。
**Validates: Requirements 3.3**

### Property 6: 請求唯一性
*For any* 使用者和行程組合，系統應只允許一個待處理或已接受的雪伴請求存在。
**Validates: Requirements 4.4**

### Property 7: 容量限制檢查
*For any* 行程，當 current_buddies >= max_buddies 時，系統應拒絕新的雪伴請求。
**Validates: Requirements 4.5**

### Property 8: 狀態更新一致性
*For any* 雪伴請求被接受，TripBuddy 狀態應更新為「已接受」且行程的 current_buddies 應增加 1。
**Validates: Requirements 5.2**

### Property 9: 事件紀錄完整性
*For any* 雪伴請求的創建、接受或拒絕，系統應向 user-core 發送對應的行為事件。
**Validates: Requirements 4.3, 5.4**

### Property 10: 封鎖過濾
*For any* 匹配搜尋，如果使用者 A 封鎖了使用者 B，則 B 不應出現在 A 的匹配結果中。
**Validates: Requirements 2.2, 8.3**

### Property 11: 社交加分
*For any* 兩個互相追蹤的使用者，匹配分數應包含社交加分。
**Validates: Requirements 8.2**

### Property 12: 技能等級過濾
*For any* 匹配搜尋，候選人的技能等級應落在搜尋者設定的範圍內。
**Validates: Requirements 9.2**

### Property 13: 技能相似度計分
*For any* 兩個使用者，技能等級差距越小，技能相容性分數應越高。
**Validates: Requirements 9.3, 9.4**

### Property 14: CASI 技能紀錄
*For any* 使用者完成單板教學課程的練習，系統應更新該使用者的 CASI 技能掌握度。
**Validates: Requirements 10.1**

### Property 15: CASI 技能相似度加分
*For any* 兩個使用者，如果 CASI 技能分布相似，應給予額外的技能匹配加分。
**Validates: Requirements 10.3**

### Property 16: 學習焦點相似度加分
*For any* 兩個使用者，如果最近都在練習相同的技能領域，應給予學習目標相似度加分。
**Validates: Requirements 11.2**

### Property 17: 快取失效
*For any* 行程更新操作，該行程的匹配搜尋快取應被標記為失效。
**Validates: Requirements 7.5**

### Property 18: 非同步處理
*For any* 多個同時發起的匹配搜尋，系統應以非同步方式處理，不應阻塞其他請求。
**Validates: Requirements 7.3**

## 錯誤處理

### 錯誤類型

```python
class BuddyMatchingError(Exception):
    """雪伴匹配基礎錯誤"""
    pass

class TripNotFoundError(BuddyMatchingError):
    """行程不存在"""
    pass

class UnauthorizedMatchingError(BuddyMatchingError):
    """無權限進行匹配"""
    pass

class BuddyRequestError(BuddyMatchingError):
    """雪伴請求錯誤"""
    pass

class CapacityExceededError(BuddyRequestError):
    """行程已滿"""
    pass

class DuplicateRequestError(BuddyRequestError):
    """重複請求"""
    pass
```

### 錯誤處理策略

1. **輸入驗證錯誤**：回傳 400 Bad Request 並附上詳細錯誤訊息
2. **資源不存在**：回傳 404 Not Found
3. **權限錯誤**：回傳 403 Forbidden
4. **業務邏輯錯誤**：回傳 400 Bad Request 並附上業務規則說明
5. **系統錯誤**：紀錄詳細日誌，回傳 500 Internal Server Error

## 測試策略

### 單元測試

測試各個計分函式和過濾邏輯：

```python
# tests/test_buddy_matching.py

def test_calculate_time_score_perfect_match():
    """測試完全相同日期的時間分數"""
    trip_a = create_trip(start_date="2025-02-01", end_date="2025-02-05")
    trip_b = create_trip(start_date="2025-02-01", end_date="2025-02-05")
    score = calculate_time_score(trip_a, trip_b)
    assert score == 40  # 最高分

def test_calculate_time_score_partial_overlap():
    """測試部分重疊日期的時間分數"""
    trip_a = create_trip(start_date="2025-02-01", end_date="2025-02-05")
    trip_b = create_trip(start_date="2025-02-03", end_date="2025-02-07")
    score = calculate_time_score(trip_a, trip_b)
    assert 0 < score < 40  # 部分分數

def test_filter_candidates_blocks():
    """測試封鎖過濾"""
    seeker = create_user(id=1)
    blocked_user = create_user(id=2)
    normal_user = create_user(id=3)
    
    # 使用者 1 封鎖使用者 2
    create_block(blocker_id=1, blocked_id=2)
    
    candidates = filter_candidates(
        seeker=seeker,
        all_users=[blocked_user, normal_user]
    )
    
    assert blocked_user not in candidates
    assert normal_user in candidates
```

### 屬性測試 (Property-Based Testing)

使用 Hypothesis 進行屬性測試：

```python
from hypothesis import given, strategies as st

@given(
    trip_a=st.builds(Trip),
    trip_b=st.builds(Trip)
)
def test_match_score_range(trip_a, trip_b):
    """**Feature: enhanced-buddy-matching, Property 3: 匹配分數組成**
    
    測試匹配分數總是在 0-100 範圍內
    """
    score = calculate_match_score(trip_a, trip_b)
    assert 0 <= score.total_score <= 100
    assert score.total_score == (
        score.time_score + 
        score.location_score + 
        score.skill_score + 
        score.social_score
    )

@given(
    user_a=st.builds(User),
    user_b=st.builds(User)
)
def test_skill_similarity_symmetric(user_a, user_b):
    """**Feature: enhanced-buddy-matching, Property 15: CASI 技能相似度加分**
    
    測試技能相似度計算的對稱性
    """
    similarity_ab = calculate_skill_similarity(user_a, user_b)
    similarity_ba = calculate_skill_similarity(user_b, user_a)
    assert similarity_ab == similarity_ba
```

### 整合測試

測試完整的匹配流程：

```python
def test_find_buddies_for_trip_integration():
    """測試完整的雪伴搜尋流程"""
    # 準備測試資料
    user = create_user(skill_level="intermediate")
    trip = create_trip(
        user_id=user.user_id,
        resort_id="niseko",
        start_date="2025-02-01",
        end_date="2025-02-05",
        visibility="public"
    )
    
    # 創建候選人
    candidate1 = create_user(skill_level="intermediate")
    candidate1_trip = create_trip(
        user_id=candidate1.user_id,
        resort_id="niseko",
        start_date="2025-02-02",
        end_date="2025-02-06"
    )
    
    candidate2 = create_user(skill_level="beginner")
    candidate2_trip = create_trip(
        user_id=candidate2.user_id,
        resort_id="hakuba",
        start_date="2025-02-01",
        end_date="2025-02-05"
    )
    
    # 執行匹配
    results = find_buddies_for_trip(trip_id=trip.trip_id, user_id=user.user_id)
    
    # 驗證結果
    assert len(results) > 0
    assert candidate1.user_id in [r.candidate_id for r in results]
    # candidate2 應該被過濾掉（技能等級差距太大）
    assert candidate2.user_id not in [r.candidate_id for r in results]
```

## 效能考量

### 候選人過濾優化

1. **資料庫索引**：
   ```sql
   CREATE INDEX idx_users_skill_level ON users(skill_level);
   CREATE INDEX idx_trips_dates ON trips(start_date, end_date);
   CREATE INDEX idx_trips_resort ON trips(resort_id);
   ```

2. **分頁查詢**：一次只載入必要的候選人數量
3. **快取策略**：快取匹配結果 1 小時，減少重複計算

### 計分效能

1. **批次查詢**：一次查詢所有候選人的相關資料
2. **並行計算**：使用 asyncio 並行計算多個候選人的分數
3. **提前終止**：當候選人明顯不符合時，提前終止計分

### 快取策略

```python
# services/match_cache_service.py

class MatchCacheService:
    """匹配快取服務"""
    
    def get_cached_results(
        self,
        db: Session,
        trip_id: uuid.UUID
    ) -> Optional[List[MatchResult]]:
        """獲取快取的匹配結果"""
        cache = db.query(MatchSearchCache).filter(
            MatchSearchCache.trip_id == trip_id,
            MatchSearchCache.expires_at > datetime.now(UTC)
        ).first()
        
        if cache:
            return [MatchResult(**r) for r in cache.results]
        return None
    
    def cache_results(
        self,
        db: Session,
        trip_id: uuid.UUID,
        user_id: uuid.UUID,
        results: List[MatchResult]
    ):
        """快取匹配結果"""
        cache = MatchSearchCache(
            trip_id=trip_id,
            user_id=user_id,
            results=[r.dict() for r in results],
            expires_at=datetime.now(UTC) + timedelta(hours=1)
        )
        db.add(cache)
        db.commit()
    
    def invalidate_cache(
        self,
        db: Session,
        trip_id: uuid.UUID
    ):
        """使快取失效"""
        db.query(MatchSearchCache).filter(
            MatchSearchCache.trip_id == trip_id
        ).delete()
        db.commit()
```

## 部署考量

### 環境變數

```bash
# .env
MATCHING_MAX_CANDIDATES=100
MATCHING_CACHE_TTL_HOURS=1
MATCHING_ENABLE_CASI_SKILLS=true
MATCHING_ENABLE_LEARNING_FOCUS=true
```

### 監控指標

1. **匹配搜尋次數**：每日/每小時的搜尋量
2. **平均匹配時間**：從搜尋到回傳結果的時間
3. **快取命中率**：快取使用效率
4. **候選人過濾率**：過濾掉的候選人比例
5. **雪伴請求成功率**：請求被接受的比例

### 日誌紀錄

```python
import logging

logger = logging.getLogger(__name__)

def find_buddies_for_trip(trip_id, user_id):
    logger.info(f"Starting buddy search for trip {trip_id} by user {user_id}")
    
    start_time = time.time()
    
    # ... 匹配邏輯 ...
    
    elapsed = time.time() - start_time
    logger.info(
        f"Buddy search completed for trip {trip_id}. "
        f"Found {len(results)} matches in {elapsed:.2f}s"
    )
    
    return results
```

## 未來擴展

### 階段 2：進階功能

1. **機器學習推薦**：基於歷史匹配成功率訓練模型
2. **群組匹配**：支援多人行程的群組匹配
3. **智能通知**：當有高匹配度的新行程時主動通知
4. **匹配偏好學習**：根據使用者的接受/拒絕行為調整匹配權重

### 階段 3：社交功能

1. **雪伴評價系統**：行程結束後互相評價
2. **常滑雪伴**：標記和管理常一起滑雪的夥伴
3. **雪伴群組**：創建固定的滑雪群組

## 參考資料

- [CASI 教學框架](specs/單板教學/snowboard_course/01_curriculum_map.md)
- [Trip Planning Service](platform/user_core/services/trip_planning_service.py)
- [單板教學系統 README](specs/單板教學/README.md)
