# 🚀 snowbuddy-matching 整合快速開始

## 5 分鐘快速測試

### 前提條件

- ✅ 單板教學已部署並運行
- ✅ user-core 服務在線（https://user-core.zeabur.app）
- ✅ 單板教學已有用戶資料和事件

---

## 步驟 1：驗證資料可用性（1 分鐘）

```bash
# 檢查 user-core 服務
curl https://user-core.zeabur.app/docs

# 查看用戶列表
curl "https://user-core.zeabur.app/users/?limit=5" | python3 -m json.tool

# 查看事件列表
curl "https://user-core.zeabur.app/events?source_project=snowboard-teaching&limit=10" | python3 -m json.tool
```

**預期結果**：
- ✅ 看到用戶列表
- ✅ 看到單板教學的事件

---

## 步驟 2：創建測試腳本（2 分鐘）

創建 `test_integration.py`：

```python
import httpx
import asyncio

USER_CORE_API = "https://user-core.zeabur.app"

async def test_integration():
    async with httpx.AsyncClient() as client:
        # 1. 獲取所有用戶
        print("📊 獲取用戶列表...")
        response = await client.get(f"{USER_CORE_API}/users/?limit=10")
        users = response.json()
        print(f"✅ 找到 {len(users)} 個用戶")
        
        if not users:
            print("❌ 沒有用戶資料，請先在單板教學中註冊用戶")
            return
        
        # 2. 選擇第一個用戶
        test_user = users[0]
        user_id = test_user['user_id']
        print(f"\n👤 測試用戶: {user_id}")
        print(f"   等級: {test_user.get('experience_level', 'N/A')}")
        print(f"   角色: {test_user.get('roles', [])}")
        
        # 3. 獲取該用戶的事件
        print(f"\n📈 獲取學習事件...")
        response = await client.get(
            f"{USER_CORE_API}/events",
            params={
                "user_id": user_id,
                "source_project": "snowboard-teaching",
                "limit": 50
            }
        )
        events = response.json()
        print(f"✅ 找到 {len(events)} 個事件")
        
        # 4. 分析事件類型
        event_types = {}
        for event in events:
            event_type = event['event_type']
            event_types[event_type] = event_types.get(event_type, 0) + 1
        
        print(f"\n📊 事件統計:")
        for event_type, count in event_types.items():
            print(f"   {event_type}: {count}")
        
        # 5. 分析練習評分
        practice_events = [
            e for e in events 
            if e['event_type'] == 'snowboard.practice.completed'
        ]
        
        if practice_events:
            ratings = [
                e['payload'].get('rating', 0)
                for e in practice_events
                if e['payload'].get('rating')
            ]
            
            if ratings:
                avg_rating = sum(ratings) / len(ratings)
                print(f"\n⭐ 平均練習評分: {avg_rating:.2f}")
                print(f"   練習次數: {len(ratings)}")
        
        # 6. 簡單的匹配測試
        print(f"\n🔍 尋找相似用戶...")
        target_level = test_user.get('experience_level', 'intermediate')
        
        similar_users = [
            u for u in users 
            if u['user_id'] != user_id 
            and u.get('experience_level') == target_level
        ]
        
        print(f"✅ 找到 {len(similar_users)} 個相同等級的用戶")
        for user in similar_users[:3]:
            print(f"   - {user['user_id']} ({user.get('experience_level')})")
        
        print(f"\n🎉 整合測試完成！")
        print(f"\n💡 下一步:")
        print(f"   1. 實現完整的匹配算法")
        print(f"   2. 添加更多匹配維度")
        print(f"   3. 優化性能和快取")

if __name__ == "__main__":
    asyncio.run(test_integration())
```

---

## 步驟 3：運行測試（1 分鐘）

```bash
# 安裝依賴
pip install httpx

# 運行測試
python test_integration.py
```

**預期輸出**：
```
📊 獲取用戶列表...
✅ 找到 5 個用戶

👤 測試用戶: uuid-123
   等級: intermediate
   角色: ['student']

📈 獲取學習事件...
✅ 找到 25 個事件

📊 事件統計:
   snowboard.lesson.viewed: 15
   snowboard.practice.completed: 8
   snowboard.search.performed: 2

⭐ 平均練習評分: 4.12
   練習次數: 8

🔍 尋找相似用戶...
✅ 找到 2 個相同等級的用戶
   - uuid-456 (intermediate)
   - uuid-789 (intermediate)

🎉 整合測試完成！
```

---

## 步驟 4：實現基礎匹配（1 分鐘）

創建 `simple_match.py`：

```python
import httpx
import asyncio

USER_CORE_API = "https://user-core.zeabur.app"

async def simple_skill_match(seeker_id: str):
    """簡單的技能等級匹配"""
    async with httpx.AsyncClient() as client:
        # 1. 獲取搜尋者資料
        response = await client.get(f"{USER_CORE_API}/users/{seeker_id}")
        seeker = response.json()
        seeker_level = seeker.get('experience_level', 'intermediate')
        
        print(f"🔍 為 {seeker_id} 尋找雪伴...")
        print(f"   等級: {seeker_level}")
        
        # 2. 獲取所有用戶
        response = await client.get(f"{USER_CORE_API}/users/?limit=100")
        all_users = response.json()
        
        # 3. 計算匹配分數
        level_map = {'beginner': 1, 'intermediate': 2, 'advanced': 3}
        seeker_level_num = level_map.get(seeker_level, 2)
        
        matches = []
        for user in all_users:
            if user['user_id'] == seeker_id:
                continue
            
            user_level = user.get('experience_level', 'intermediate')
            user_level_num = level_map.get(user_level, 2)
            
            # 計算分數
            level_diff = abs(seeker_level_num - user_level_num)
            score = max(0, 100 - (level_diff * 30))
            
            matches.append({
                'user_id': user['user_id'],
                'experience_level': user_level,
                'score': score
            })
        
        # 4. 排序並返回
        matches.sort(key=lambda x: x['score'], reverse=True)
        
        print(f"\n✅ 找到 {len(matches)} 個候選人")
        print(f"\n🏆 前 5 名匹配:")
        for i, match in enumerate(matches[:5], 1):
            print(f"   {i}. {match['user_id']}")
            print(f"      等級: {match['experience_level']}")
            print(f"      分數: {match['score']}")
        
        return matches[:10]

if __name__ == "__main__":
    # 替換成實際的 user_id
    test_user_id = "your-user-id-here"
    asyncio.run(simple_skill_match(test_user_id))
```

---

## 常見問題

### Q1: 沒有看到用戶資料

**A:** 確保單板教學已有用戶註冊：
```bash
# 1. 訪問單板教學應用
# 2. 註冊新用戶
# 3. 等待 5-10 秒（同步延遲）
# 4. 再次查詢 user-core
curl "https://user-core.zeabur.app/users/?limit=5"
```

### Q2: 沒有看到事件資料

**A:** 確保用戶有進行操作：
```bash
# 1. 登入單板教學
# 2. 瀏覽幾個課程
# 3. 完成練習
# 4. 等待 5-10 秒（批次處理）
# 5. 查詢事件
curl "https://user-core.zeabur.app/events?source_project=snowboard-teaching&limit=10"
```

### Q3: API 調用失敗

**A:** 檢查 user-core 服務狀態：
```bash
# 檢查服務
curl https://user-core.zeabur.app/docs

# 如果失敗，等待服務恢復或聯絡管理員
```

---

## 下一步

### 1. 實現完整匹配算法

參考：`SNOWBOARD_TEACHING_INTEGRATION.md`

實現：
- ✅ 技能等級匹配
- ✅ 學習進度匹配
- ✅ 練習評分匹配
- ✅ 學習興趣匹配
- ✅ 教練學生匹配

### 2. 添加到 snowbuddy-matching

```python
# snowbuddy-matching/app/core/matching_logic.py

from .snowboard_integration import (
    match_by_skill_level,
    match_by_learning_progress,
    match_by_practice_rating,
    comprehensive_match
)

# 在現有的匹配邏輯中使用
async def run_matching_process(seeker_id: str):
    # ... 現有邏輯 ...
    
    # 添加單板教學資料
    snowboard_matches = await comprehensive_match(seeker_id)
    
    # 合併結果
    # ...
```

### 3. 測試和優化

- 性能測試
- 快取優化
- 批次查詢
- 錯誤處理

---

## 資源

- [完整整合文檔](SNOWBOARD_TEACHING_INTEGRATION.md)
- [單板教學整合文檔](../單板教學/docs/USER_CORE_INTEGRATION.md)
- [事件映射文檔](../單板教學/docs/EVENT_MAPPING.md)
- [user-core API 文檔](https://user-core.zeabur.app/docs)

---

*預計時間：5 分鐘*
*難度：簡單*
*前提：單板教學已部署*
