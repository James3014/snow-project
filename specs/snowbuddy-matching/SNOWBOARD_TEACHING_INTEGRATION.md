# snowbuddy-matching × 單板教學整合文檔

## 概述

本文檔說明 snowbuddy-matching 如何利用單板教學應用同步到 user-core 的資料，實現基於學習行為的智能媒合。

## 整合架構

```
┌─────────────────────────────────────────────────────────────┐
│                      單板教學 App                              │
│                                                               │
│  用戶行為：                                                    │
│  - 註冊（技能等級：beginner/intermediate/advanced）            │
│  - 瀏覽課程（lesson_id, category）                            │
│  - 完成練習（lesson_id, rating, note）                        │
│  - 搜尋（keyword）                                            │
│  - 收藏（lesson_id）                                          │
│                                                               │
│         │ 自動同步                                            │
│         ▼                                                     │
└─────────┼─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              user-core (https://user-core.zeabur.app)        │
│                                                               │
│  UserProfile:                                                 │
│  - user_id                                                    │
│  - roles: ["student"] or ["coach"]                           │
│  - experience_level: "beginner" | "intermediate" | "advanced"│
│  - preferred_language: "zh-TW"                                │
│                                                               │
│  BehaviorEvent:                                               │
│  - snowboard.lesson.viewed                                    │
│  - snowboard.practice.completed                               │
│  - snowboard.search.performed                                 │
│  - snowboard.favorite.added                                   │
│  - ...                                                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ API 查詢
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  snowbuddy-matching                          │
│                                                               │
│  媒合算法：                                                    │
│  1. 基於技能等級匹配                                          │
│  2. 基於學習進度匹配                                          │
│  3. 基於練習評分匹配                                          │
│  4. 基於學習興趣匹配                                          │
│  5. 教練學生匹配                                              │
│                                                               │
│  輸出：                                                       │
│  - 相似學習者列表                                             │
│  - 推薦的雪伴                                                 │
│  - 推薦的教練                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 可用的資料

### 1. 用戶基本資料（UserProfile）

**API 端點**：`GET /users/{user_id}`

**資料結構**：
```json
{
  "user_id": "uuid-123",
  "roles": ["student"],
  "experience_level": "intermediate",
  "preferred_language": "zh-TW",
  "status": "active",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-02T15:30:00Z"
}
```

**用途**：
- 基礎的技能等級匹配
- 角色識別（學生 vs 教練）
- 語言偏好匹配

### 2. 學習行為事件（BehaviorEvent）

**API 端點**：`GET /events?user_id={user_id}&source_project=snowboard-teaching`

**事件類型**：

| 事件類型 | 說明 | Payload 範例 |
|---------|------|-------------|
| `snowboard.lesson.viewed` | 瀏覽課程 | `{ lesson_id: "01", source: "home" }` |
| `snowboard.practice.completed` | 完成練習 | `{ lesson_id: "01", rating: 4, note: "..." }` |
| `snowboard.search.performed` | 執行搜尋 | `{ keyword: "後刃", results_count: 5 }` |
| `snowboard.favorite.added` | 添加收藏 | `{ lesson_id: "01" }` |
| `snowboard.favorite.removed` | 移除收藏 | `{ lesson_id: "01" }` |

**資料結構**：
```json
{
  "event_id": "evt-123",
  "user_id": "uuid-123",
  "source_project": "snowboard-teaching",
  "event_type": "snowboard.practice.completed",
  "occurred_at": "2025-12-02T14:30:00Z",
  "payload": {
    "lesson_id": "01",
    "rating": 4,
    "note": "今天練習很順利",
    "original_event_type": "practice_complete"
  },
  "version": 1
}
```

---

## 媒合算法設計

### 算法 1：基於技能等級的匹配

**目標**：找到技能等級相近的雪伴

**實作**：

```python
# snowbuddy-matching/app/core/matching_logic.py

async def match_by_skill_level(seeker_id: str) -> List[MatchResult]:
    """基於技能等級匹配"""
    
    # 1. 獲取搜尋者的技能等級
    seeker = await user_core_client.get_user(seeker_id)
    seeker_level = seeker['experience_level']  # "beginner" | "intermediate" | "advanced"
    
    # 2. 定義等級映射
    level_map = {
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3
    }
    seeker_level_num = level_map.get(seeker_level, 2)
    
    # 3. 查詢所有用戶
    all_users = await user_core_client.get_users(limit=1000)
    
    # 4. 計算技能分數
    candidates = []
    for user in all_users:
        if user['user_id'] == seeker_id:
            continue
            
        user_level_num = level_map.get(user['experience_level'], 2)
        
        # 等級差距越小，分數越高
        level_diff = abs(seeker_level_num - user_level_num)
        skill_score = max(0, 100 - (level_diff * 30))
        
        candidates.append({
            'user_id': user['user_id'],
            'skill_score': skill_score,
            'experience_level': user['experience_level']
        })
    
    # 5. 排序並返回
    candidates.sort(key=lambda x: x['skill_score'], reverse=True)
    return candidates[:10]
```

**評分標準**：
- 同等級：100 分
- 相差 1 級：70 分
- 相差 2 級：40 分

---

### 算法 2：基於學習進度的匹配

**目標**：找到學習進度相似的雪伴

**實作**：

```python
async def match_by_learning_progress(seeker_id: str) -> List[MatchResult]:
    """基於學習進度匹配"""
    
    # 1. 獲取搜尋者的練習紀錄
    seeker_events = await user_core_client.get_events(
        user_id=seeker_id,
        source_project='snowboard-teaching',
        event_type='snowboard.practice.completed',
        limit=100
    )
    
    # 2. 提取已完成的課程
    seeker_completed_lessons = set(
        event['payload']['lesson_id'] 
        for event in seeker_events
    )
    
    # 3. 查詢其他用戶的練習紀錄
    all_users = await user_core_client.get_users(limit=1000)
    
    candidates = []
    for user in all_users:
        if user['user_id'] == seeker_id:
            continue
        
        # 獲取該用戶的練習紀錄
        user_events = await user_core_client.get_events(
            user_id=user['user_id'],
            source_project='snowboard-teaching',
            event_type='snowboard.practice.completed',
            limit=100
        )
        
        user_completed_lessons = set(
            event['payload']['lesson_id'] 
            for event in user_events
        )
        
        # 4. 計算相似度（Jaccard 相似度）
        intersection = len(seeker_completed_lessons & user_completed_lessons)
        union = len(seeker_completed_lessons | user_completed_lessons)
        
        if union > 0:
            similarity = (intersection / union) * 100
        else:
            similarity = 0
        
        candidates.append({
            'user_id': user['user_id'],
            'progress_score': similarity,
            'completed_lessons_count': len(user_completed_lessons),
            'common_lessons_count': intersection
        })
    
    # 5. 排序並返回
    candidates.sort(key=lambda x: x['progress_score'], reverse=True)
    return candidates[:10]
```

**評分標準**：
- Jaccard 相似度 × 100
- 範圍：0-100 分

---

### 算法 3：基於練習評分的匹配

**目標**：找到練習表現相似的雪伴

**實作**：

```python
async def match_by_practice_rating(seeker_id: str) -> List[MatchResult]:
    """基於練習評分匹配"""
    
    # 1. 獲取搜尋者的練習評分
    seeker_events = await user_core_client.get_events(
        user_id=seeker_id,
        source_project='snowboard-teaching',
        event_type='snowboard.practice.completed',
        limit=50
    )
    
    # 2. 計算平均評分
    seeker_ratings = [
        event['payload'].get('rating', 0) 
        for event in seeker_events 
        if event['payload'].get('rating')
    ]
    
    if not seeker_ratings:
        return []
    
    seeker_avg_rating = sum(seeker_ratings) / len(seeker_ratings)
    
    # 3. 查詢其他用戶
    all_users = await user_core_client.get_users(limit=1000)
    
    candidates = []
    for user in all_users:
        if user['user_id'] == seeker_id:
            continue
        
        # 獲取該用戶的練習評分
        user_events = await user_core_client.get_events(
            user_id=user['user_id'],
            source_project='snowboard-teaching',
            event_type='snowboard.practice.completed',
            limit=50
        )
        
        user_ratings = [
            event['payload'].get('rating', 0) 
            for event in user_events 
            if event['payload'].get('rating')
        ]
        
        if not user_ratings:
            continue
        
        user_avg_rating = sum(user_ratings) / len(user_ratings)
        
        # 4. 計算評分相似度
        rating_diff = abs(seeker_avg_rating - user_avg_rating)
        rating_score = max(0, 100 - (rating_diff * 25))
        
        candidates.append({
            'user_id': user['user_id'],
            'rating_score': rating_score,
            'avg_rating': user_avg_rating,
            'practice_count': len(user_ratings)
        })
    
    # 5. 排序並返回
    candidates.sort(key=lambda x: x['rating_score'], reverse=True)
    return candidates[:10]
```

**評分標準**：
- 評分差距 0：100 分
- 評分差距 1：75 分
- 評分差距 2：50 分
- 評分差距 3：25 分
- 評分差距 4+：0 分

---

### 算法 4：基於學習興趣的匹配

**目標**：找到學習興趣相似的雪伴

**實作**：

```python
async def match_by_learning_interest(seeker_id: str) -> List[MatchResult]:
    """基於學習興趣匹配（搜尋關鍵字和收藏）"""
    
    # 1. 獲取搜尋者的搜尋歷史
    seeker_searches = await user_core_client.get_events(
        user_id=seeker_id,
        source_project='snowboard-teaching',
        event_type='snowboard.search.performed',
        limit=50
    )
    
    seeker_keywords = [
        event['payload'].get('keyword', '').lower()
        for event in seeker_searches
    ]
    
    # 2. 獲取搜尋者的收藏
    seeker_favorites = await user_core_client.get_events(
        user_id=seeker_id,
        source_project='snowboard-teaching',
        event_type='snowboard.favorite.added',
        limit=50
    )
    
    seeker_favorite_lessons = set(
        event['payload'].get('lesson_id')
        for event in seeker_favorites
    )
    
    # 3. 查詢其他用戶
    all_users = await user_core_client.get_users(limit=1000)
    
    candidates = []
    for user in all_users:
        if user['user_id'] == seeker_id:
            continue
        
        # 獲取該用戶的搜尋歷史
        user_searches = await user_core_client.get_events(
            user_id=user['user_id'],
            source_project='snowboard-teaching',
            event_type='snowboard.search.performed',
            limit=50
        )
        
        user_keywords = [
            event['payload'].get('keyword', '').lower()
            for event in user_searches
        ]
        
        # 獲取該用戶的收藏
        user_favorites = await user_core_client.get_events(
            user_id=user['user_id'],
            source_project='snowboard-teaching',
            event_type='snowboard.favorite.added',
            limit=50
        )
        
        user_favorite_lessons = set(
            event['payload'].get('lesson_id')
            for event in user_favorites
        )
        
        # 4. 計算興趣相似度
        # 4.1 搜尋關鍵字相似度
        common_keywords = set(seeker_keywords) & set(user_keywords)
        keyword_similarity = len(common_keywords) / max(len(set(seeker_keywords)), 1) * 50
        
        # 4.2 收藏課程相似度
        common_favorites = seeker_favorite_lessons & user_favorite_lessons
        favorite_similarity = len(common_favorites) / max(len(seeker_favorite_lessons), 1) * 50
        
        interest_score = keyword_similarity + favorite_similarity
        
        candidates.append({
            'user_id': user['user_id'],
            'interest_score': interest_score,
            'common_keywords': list(common_keywords),
            'common_favorites': list(common_favorites)
        })
    
    # 5. 排序並返回
    candidates.sort(key=lambda x: x['interest_score'], reverse=True)
    return candidates[:10]
```

---

### 算法 5：教練學生匹配

**目標**：為需要幫助的學生推薦教練

**實作**：

```python
async def match_students_to_coaches(student_id: str) -> List[MatchResult]:
    """為學生推薦教練"""
    
    # 1. 獲取學生的練習評分
    student_events = await user_core_client.get_events(
        user_id=student_id,
        source_project='snowboard-teaching',
        event_type='snowboard.practice.completed',
        limit=20
    )
    
    # 2. 計算平均評分
    ratings = [
        event['payload'].get('rating', 0)
        for event in student_events
        if event['payload'].get('rating')
    ]
    
    if not ratings:
        avg_rating = 3  # 默認中等
    else:
        avg_rating = sum(ratings) / len(ratings)
    
    # 3. 識別需要幫助的領域
    struggling_lessons = [
        event['payload'].get('lesson_id')
        for event in student_events
        if event['payload'].get('rating', 5) < 3
    ]
    
    # 4. 查詢所有教練
    all_users = await user_core_client.get_users(limit=1000)
    coaches = [
        user for user in all_users
        if 'coach' in user.get('roles', [])
    ]
    
    # 5. 為每個教練計分
    candidates = []
    for coach in coaches:
        # 5.1 獲取教練的教學紀錄（假設有相關事件）
        coach_events = await user_core_client.get_events(
            user_id=coach['user_id'],
            source_project='snowboard-teaching',
            limit=100
        )
        
        # 5.2 計算教練的活躍度
        activity_score = min(len(coach_events) / 10, 1) * 50
        
        # 5.3 計算教練的經驗等級
        coach_level = coach.get('experience_level', 'intermediate')
        experience_score = {
            'beginner': 20,
            'intermediate': 35,
            'advanced': 50
        }.get(coach_level, 35)
        
        total_score = activity_score + experience_score
        
        candidates.append({
            'user_id': coach['user_id'],
            'coach_score': total_score,
            'experience_level': coach_level,
            'activity_count': len(coach_events)
        })
    
    # 6. 排序並返回
    candidates.sort(key=lambda x: x['coach_score'], reverse=True)
    return candidates[:5]
```

---

## 綜合媒合算法

**目標**：結合多個算法，提供最佳匹配

**實作**：

```python
async def comprehensive_match(seeker_id: str, weights: dict = None) -> List[MatchResult]:
    """綜合媒合算法"""
    
    # 默認權重
    if weights is None:
        weights = {
            'skill': 0.3,
            'progress': 0.25,
            'rating': 0.2,
            'interest': 0.25
        }
    
    # 1. 執行所有算法
    skill_matches = await match_by_skill_level(seeker_id)
    progress_matches = await match_by_learning_progress(seeker_id)
    rating_matches = await match_by_practice_rating(seeker_id)
    interest_matches = await match_by_learning_interest(seeker_id)
    
    # 2. 合併結果
    all_user_ids = set()
    for matches in [skill_matches, progress_matches, rating_matches, interest_matches]:
        all_user_ids.update(m['user_id'] for m in matches)
    
    # 3. 計算綜合分數
    final_candidates = []
    for user_id in all_user_ids:
        scores = {
            'skill': next((m['skill_score'] for m in skill_matches if m['user_id'] == user_id), 0),
            'progress': next((m['progress_score'] for m in progress_matches if m['user_id'] == user_id), 0),
            'rating': next((m['rating_score'] for m in rating_matches if m['user_id'] == user_id), 0),
            'interest': next((m['interest_score'] for m in interest_matches if m['user_id'] == user_id), 0)
        }
        
        # 加權平均
        total_score = sum(scores[key] * weights[key] for key in weights)
        
        final_candidates.append({
            'user_id': user_id,
            'total_score': total_score,
            'breakdown': scores
        })
    
    # 4. 排序並返回
    final_candidates.sort(key=lambda x: x['total_score'], reverse=True)
    return final_candidates[:10]
```

---

## API 使用範例

### 範例 1：查詢用戶資料

```python
import httpx

USER_CORE_API = "https://user-core.zeabur.app"

async def get_user_profile(user_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{USER_CORE_API}/users/{user_id}")
        return response.json()

# 使用
user = await get_user_profile("uuid-123")
print(f"Experience Level: {user['experience_level']}")
```

### 範例 2：查詢學習事件

```python
async def get_user_learning_events(user_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{USER_CORE_API}/events",
            params={
                "user_id": user_id,
                "source_project": "snowboard-teaching",
                "limit": 100
            }
        )
        return response.json()

# 使用
events = await get_user_learning_events("uuid-123")
practice_events = [e for e in events if e['event_type'] == 'snowboard.practice.completed']
print(f"Completed {len(practice_events)} practices")
```

### 範例 3：分析學習進度

```python
async def analyze_learning_progress(user_id: str):
    events = await get_user_learning_events(user_id)
    
    # 統計各類事件
    stats = {
        'lessons_viewed': 0,
        'practices_completed': 0,
        'searches_performed': 0,
        'favorites_added': 0
    }
    
    for event in events:
        if event['event_type'] == 'snowboard.lesson.viewed':
            stats['lessons_viewed'] += 1
        elif event['event_type'] == 'snowboard.practice.completed':
            stats['practices_completed'] += 1
        elif event['event_type'] == 'snowboard.search.performed':
            stats['searches_performed'] += 1
        elif event['event_type'] == 'snowboard.favorite.added':
            stats['favorites_added'] += 1
    
    # 計算平均評分
    practice_events = [
        e for e in events 
        if e['event_type'] == 'snowboard.practice.completed'
    ]
    
    ratings = [
        e['payload'].get('rating', 0)
        for e in practice_events
        if e['payload'].get('rating')
    ]
    
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    
    return {
        **stats,
        'avg_rating': avg_rating,
        'total_events': len(events)
    }

# 使用
progress = await analyze_learning_progress("uuid-123")
print(f"Average Rating: {progress['avg_rating']:.2f}")
print(f"Practices Completed: {progress['practices_completed']}")
```

---

## 實施建議

### 1. 分階段實施

**Phase 1：基礎匹配**
- 實現算法 1（技能等級匹配）
- 測試基本功能

**Phase 2：進階匹配**
- 實現算法 2（學習進度匹配）
- 實現算法 3（練習評分匹配）

**Phase 3：智能匹配**
- 實現算法 4（學習興趣匹配）
- 實現算法 5（教練學生匹配）
- 實現綜合匹配算法

### 2. 性能優化

**快取策略**：
```python
from functools import lru_cache
from datetime import datetime, timedelta

# 快取用戶資料（5 分鐘）
@lru_cache(maxsize=1000)
async def get_user_cached(user_id: str, cache_time: int):
    return await user_core_client.get_user(user_id)

# 使用時傳入當前時間的 5 分鐘區間
cache_key = int(datetime.now().timestamp() / 300)
user = await get_user_cached(user_id, cache_key)
```

**批次查詢**：
```python
# 一次查詢多個用戶的事件
async def get_multiple_users_events(user_ids: List[str]):
    tasks = [
        user_core_client.get_events(user_id=uid, limit=100)
        for uid in user_ids
    ]
    return await asyncio.gather(*tasks)
```

### 3. 資料品質

**處理缺失資料**：
```python
def safe_get_rating(event: dict, default: float = 3.0) -> float:
    """安全獲取評分，處理缺失值"""
    return event.get('payload', {}).get('rating', default)

def safe_get_lesson_id(event: dict) -> Optional[str]:
    """安全獲取課程 ID"""
    return event.get('payload', {}).get('lesson_id')
```

**資料驗證**：
```python
def validate_user_profile(user: dict) -> bool:
    """驗證用戶資料完整性"""
    required_fields = ['user_id', 'experience_level', 'roles']
    return all(field in user for field in required_fields)
```

---

## 測試指南

### 測試場景 1：技能等級匹配

```python
async def test_skill_level_matching():
    # 創建測試用戶
    beginner_id = "test-beginner-1"
    intermediate_id = "test-intermediate-1"
    
    # 執行匹配
    matches = await match_by_skill_level(beginner_id)
    
    # 驗證
    assert len(matches) > 0
    assert matches[0]['skill_score'] >= 70  # 應該找到相近等級的用戶
```

### 測試場景 2：學習進度匹配

```python
async def test_learning_progress_matching():
    user_id = "test-user-1"
    
    # 執行匹配
    matches = await match_by_learning_progress(user_id)
    
    # 驗證
    assert len(matches) > 0
    assert matches[0]['progress_score'] > 0
    assert 'common_lessons_count' in matches[0]
```

---

## 監控和維護

### 關鍵指標

| 指標 | 目標 | 說明 |
|------|------|------|
| 匹配成功率 | > 80% | 用戶找到至少 1 個匹配 |
| 平均匹配數量 | 5-10 個 | 每次搜尋的結果數 |
| API 響應時間 | < 2 秒 | 完整匹配流程 |
| 資料新鮮度 | < 5 分鐘 | 事件同步延遲 |

### 日誌紀錄

```python
import logging

logger = logging.getLogger('snowbuddy-matching')

async def match_with_logging(seeker_id: str):
    logger.info(f"Starting match for user {seeker_id}")
    
    start_time = time.time()
    matches = await comprehensive_match(seeker_id)
    duration = time.time() - start_time
    
    logger.info(f"Match completed in {duration:.2f}s, found {len(matches)} candidates")
    
    return matches
```

---

## 參考資料

- [單板教學整合文檔](../單板教學/docs/USER_CORE_INTEGRATION.md)
- [事件映射文檔](../單板教學/docs/EVENT_MAPPING.md)
- [user-core API 文檔](https://user-core.zeabur.app/docs)
- [snowbuddy-matching 規格](spec.md)

---

*最後更新：2025-12-02*
*版本：v1.0.0*
*狀態：就緒*
