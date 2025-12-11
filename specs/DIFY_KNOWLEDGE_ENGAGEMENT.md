# 📚 Knowledge Engagement + Dify 整合方案

**優先級**: P0（最高）  
**預估時間**: 1 週  
**ROI**: ⭐⭐⭐⭐⭐

---

## 🎯 為什麼完美契合？

```
Knowledge Engagement 需求：
├── 滑雪知識測驗題庫
├── 技能評分與弱項分析
├── 個人化學習建議
└── 教練指派練習任務

Dify 能做：
├── RAG 知識庫（題庫管理）
├── LLM 生成題目（自動擴充題庫）
├── AI 分析弱項（比規則引擎更智能）
└── Agent 工作流（自動指派任務）
```

---

## 🚀 核心功能

### 功能 1：AI 自動生成測驗題目

#### 場景
```
教練輸入：「生成 10 題關於『後刃控制』的測驗題」
↓
Dify Workflow：
1. RAG 搜尋「後刃控制」相關課程（從單板教學 213 堂課）
2. LLM 生成題目（Claude 3.5 Sonnet）
3. 自動分類難度（初級/中級/進階）
4. 儲存到題庫
↓
成本：$0.05/10 題
時間：30 秒
```

#### Dify Workflow 設計

```yaml
名稱: AI 測驗題生成器

輸入變數:
  - topic: 主題（如「後刃控制」）
  - difficulty: 難度（beginner/intermediate/advanced）
  - count: 題目數量（預設 10）

節點流程:
  1. [知識庫檢索]
     - 查詢: {{topic}}
     - Top K: 5
     - 來源: 單板教學 213 堂課程
  
  2. [LLM 生成節點]
     - 模型: Claude 3.5 Sonnet
     - Prompt: |
         你是 CASI 認證教練，根據以下課程內容生成測驗題目。
         
         主題: {{topic}}
         難度: {{difficulty}}
         數量: {{count}}
         
         課程內容:
         {{#knowledge_base_results}}
         
         請生成 {{count}} 題選擇題，格式如下：
         {
           "questions": [
             {
               "question": "題目內容",
               "options": ["A選項", "B選項", "C選項", "D選項"],
               "correct_answer": "A",
               "explanation": "解釋為什麼",
               "difficulty": "intermediate",
               "casi_skill": "用刃"
             }
           ]
         }
  
  3. [代碼節點] 格式化 JSON
     - 驗證 JSON 格式
     - 添加 ID 和時間戳
  
  4. [HTTP 節點] 儲存到資料庫
     - POST /api/quiz/questions
     - Body: {{formatted_questions}}

輸出:
  - questions: 生成的題目（JSON）
  - count: 實際生成數量
```

#### 前端整合

```typescript
// knowledge-app/src/lib/generateQuiz.ts
export async function generateQuiz(
  topic: string, 
  difficulty: string, 
  count: number = 10
) {
  const response = await fetch('https://dify.zeabur.app/v1/workflows/run', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: { topic, difficulty, count },
      response_mode: 'blocking',
      user: userId
    })
  })
  
  const data = await response.json()
  return JSON.parse(data.data.outputs.questions)
}
```

```tsx
// knowledge-app/src/app/admin/quiz/generate/page.tsx
export default function QuizGenerator() {
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  
  const handleGenerate = async () => {
    setLoading(true)
    const result = await generateQuiz(topic, difficulty, 10)
    setQuestions(result.questions)
    setLoading(false)
  }
  
  return (
    <div>
      <h1>AI 測驗題生成器</h1>
      
      <div className="space-y-4">
        <input 
          placeholder="主題（如：後刃控制）"
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
        
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          <option value="beginner">初級</option>
          <option value="intermediate">中級</option>
          <option value="advanced">進階</option>
        </select>
        
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? '生成中...' : '生成 10 題'}
        </button>
      </div>
      
      {questions.length > 0 && (
        <div className="mt-8">
          <h2>生成結果</h2>
          {questions.map((q, i) => (
            <QuestionCard key={i} question={q} index={i + 1} />
          ))}
          
          <button onClick={saveToDatabase}>
            儲存到題庫
          </button>
        </div>
      )}
    </div>
  )
}
```

---

### 功能 2：AI 分析學員弱項

#### 場景
```
學員完成測驗 → Dify Agent 分析：
├── 錯題主題：後刃控制（3/5 錯）、換刃技巧（2/5 錯）
├── LLM 分析：「後刃控制弱，建議先練『站姿與平衡』」
├── 自動推薦課程：lesson-03, lesson-07
└── 生成學習計畫：「本週練習 2 次，每次 30 分鐘」
↓
比規則引擎更智能，能理解上下文
```

#### Dify Workflow 設計

```yaml
名稱: AI 弱項分析引擎

輸入變數:
  - user_id: 用戶 ID
  - quiz_results: 測驗結果（JSON）
  - practice_history: 練習紀錄（可選）

節點流程:
  1. [數據聚合]
     - 解析錯題
     - 統計錯誤主題
     - 查詢歷史練習紀錄
  
  2. [知識庫檢索]
     - 查詢: 錯題相關課程
     - Top K: 10
  
  3. [LLM 分析節點]
     - 模型: Claude 3.5 Sonnet
     - Prompt: |
         你是 CASI 認證教練，分析學員的測驗結果並給出建議。
         
         學員 ID: {{user_id}}
         測驗結果: {{quiz_results}}
         練習紀錄: {{practice_history}}
         
         請分析：
         1. 主要弱項（2-3 個，按嚴重程度排序）
         2. 根本原因（為什麼會錯這些題）
         3. 推薦課程（5 堂，按優先順序）
         4. 學習計畫（時間安排、練習頻率）
         
         輸出格式（JSON）:
         {
           "weak_areas": [
             {
               "skill": "後刃控制",
               "severity": "high",
               "reason": "重心不穩，膝蓋太直",
               "error_rate": 0.6
             }
           ],
           "root_cause": "站姿與平衡基礎不足",
           "recommended_lessons": [
             {
               "id": "lesson-03",
               "title": "站姿與平衡",
               "priority": 1,
               "reason": "先打好基礎"
             }
           ],
           "learning_plan": {
             "duration": "2 weeks",
             "frequency": "3 times/week",
             "focus": "站姿與平衡 → 後刃控制"
           }
         }
  
  4. [條件分支]
     - 如果弱項 > 3 個 → 建議「回到基礎課程」
     - 如果進步緩慢 → 建議「預約教練」
     - 否則 → 正常推薦
  
  5. [HTTP 節點] 儲存分析結果
     - POST /api/analysis/weakness
     - Body: {{analysis_result}}

輸出:
  - analysis: 完整分析結果（JSON）
```

#### 前端整合

```tsx
// knowledge-app/src/app/quiz/result/[id]/page.tsx
export default function QuizResult({ params }: { params: { id: string } }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    analyzeWeakness()
  }, [])
  
  async function analyzeWeakness() {
    // 1. 獲取測驗結果
    const quizResult = await getQuizResult(params.id)
    
    // 2. 獲取練習紀錄
    const practiceHistory = await getPracticeHistory(userId)
    
    // 3. 呼叫 Dify API
    const response = await fetch('https://dify.zeabur.app/v1/workflows/run', {
      method: 'POST',
      body: JSON.stringify({
        inputs: {
          user_id: userId,
          quiz_results: JSON.stringify(quizResult),
          practice_history: JSON.stringify(practiceHistory)
        }
      })
    })
    
    const data = await response.json()
    setAnalysis(JSON.parse(data.data.outputs.analysis))
    setLoading(false)
  }
  
  if (loading) return <LoadingState />
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">測驗結果分析</h1>
      
      {/* 測驗分數 */}
      <section className="mb-8">
        <ScoreCard score={quizResult.score} />
      </section>
      
      {/* AI 弱項分析 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🎯 AI 弱項分析</h2>
        <div className="grid gap-4">
          {analysis.weak_areas.map(area => (
            <div key={area.skill} className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{area.skill}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  area.severity === 'high' ? 'bg-red-600' : 'bg-yellow-600'
                }`}>
                  {area.severity === 'high' ? '急需加強' : '需改善'}
                </span>
              </div>
              <p className="text-zinc-400 mb-2">{area.reason}</p>
              <p className="text-sm text-zinc-500">錯誤率：{(area.error_rate * 100).toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* 根本原因 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🔍 根本原因</h2>
        <div className="bg-zinc-800 p-4 rounded-lg">
          <p>{analysis.root_cause}</p>
        </div>
      </section>
      
      {/* 推薦課程 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📚 推薦課程</h2>
        <div className="space-y-4">
          {analysis.recommended_lessons.map((lesson, index) => (
            <LessonCard 
              key={lesson.id}
              lesson={lesson}
              priority={index + 1}
              reason={lesson.reason}
            />
          ))}
        </div>
      </section>
      
      {/* 學習計畫 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">📅 學習計畫</h2>
        <div className="bg-zinc-800 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-zinc-400 text-sm">建議時長</div>
              <div className="font-bold">{analysis.learning_plan.duration}</div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm">練習頻率</div>
              <div className="font-bold">{analysis.learning_plan.frequency}</div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm">重點</div>
              <div className="font-bold">{analysis.learning_plan.focus}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
```

---

### 功能 3：AI 教練助手

#### 場景
```
學員提問：「我後刃一直抖怎麼辦？」
↓
Dify RAG：
1. 搜尋知識庫（題庫 + 單板教學課程）
2. 找到相關課程：lesson-03「後刃控制」
3. LLM 生成回答：「後刃抖動通常是重心不穩...建議練習...」
4. 附上相關測驗題：「測試你的後刃知識」
↓
提升 engagement，減少教練負擔
```

#### Dify Chat Agent 設計

```yaml
名稱: AI 教練助手

系統 Prompt: |
  你是 CASI 認證教練，專門解答滑雪技術問題。
  
  規則：
  1. 回答要清晰易懂（避免專業術語）
  2. 優先給出「立刻能做的動作」
  3. 引用相關課程編號
  4. 如果問題複雜，建議「預約真人教練」
  
  範例：
  Q: 後刃一直抖怎麼辦？
  A: 後刃抖動通常是重心不穩。試試這個：
     1. 膝蓋再彎一點
     2. 重心放在腳掌中間
     3. 眼睛看前方，不要看板子
     
     詳見課程 03「後刃控制」。
     如果還是抖，建議預約教練一對一指導。

知識庫:
  - 單板教學 213 堂課程
  - 測驗題庫
  - 常見問題 FAQ

檢索設置:
  - Top K: 5
  - 相似度閾值: 0.7
  - Rerank: 啟用
```

#### 前端整合

```tsx
// knowledge-app/src/components/AICoachChat.tsx
export function AICoachChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSend = async () => {
    if (!input.trim()) return
    
    // 添加用戶訊息
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    // 呼叫 Dify Chat API
    const response = await fetch('https://dify.zeabur.app/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: input,
        user: userId,
        conversation_id: conversationId
      })
    })
    
    const data = await response.json()
    
    // 添加 AI 回覆
    const aiMessage = { 
      role: 'assistant', 
      content: data.answer,
      references: data.metadata?.retriever_resources || []
    }
    setMessages(prev => [...prev, aiMessage])
    setLoading(false)
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-amber-500 text-white' 
                : 'bg-zinc-800'
            }`}>
              <p>{msg.content}</p>
              
              {/* 顯示引用的課程 */}
              {msg.references && msg.references.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <p className="text-sm text-zinc-400 mb-2">相關課程：</p>
                  {msg.references.map((ref, j) => (
                    <a 
                      key={j}
                      href={`/lesson/${ref.lesson_id}`}
                      className="block text-sm text-amber-500 hover:underline"
                    >
                      {ref.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && <LoadingDots />}
      </div>
      
      {/* 輸入框 */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="問我任何滑雪問題..."
            className="flex-1 px-4 py-3 bg-zinc-800 rounded-lg"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-amber-500 rounded-lg font-bold disabled:opacity-50"
          >
            發送
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 成本與效益

### 開發成本

| 項目 | 時間 |
|------|------|
| Dify 部署 | 5 分鐘 |
| 知識庫匯入 | 1 天 |
| 功能 1（生成題目） | 2 天 |
| 功能 2（弱項分析） | 2 天 |
| 功能 3（教練助手） | 2 天 |
| 測試與優化 | 1 天 |
| **總計** | **1 週** |

### 月運營成本

| 項目 | 成本 | 說明 |
|------|------|------|
| Dify 自部署 | $5/月 | Zeabur |
| Claude API | $20-50/月 | 1000 活躍用戶 |
| **總計** | **$25-55/月** | |

### 效益預估

| 指標 | 改善 |
|------|------|
| 題目生成效率 | +80% |
| 弱項分析準確度 | +40% |
| 學習效果 | +40% |
| Engagement | +50% |
| 教練工作量 | -30% |

**ROI**: 非常高 ⭐⭐⭐⭐⭐

---

## ✅ 實作檢查清單

### Week 1: 基礎建設
- [ ] Zeabur 部署 Dify
- [ ] 213 堂課程格式化
- [ ] 知識庫匯入
- [ ] 測試 RAG 檢索

### Week 2: 功能開發
- [ ] 功能 1：AI 生成題目
- [ ] 功能 2：弱項分析
- [ ] 功能 3：教練助手
- [ ] 前端整合

### Week 3: 測試上線
- [ ] 內部測試
- [ ] 教練試用
- [ ] 收集反饋
- [ ] 正式上線

---

**文檔版本**: v1.0  
**最後更新**: 2025-12-06
