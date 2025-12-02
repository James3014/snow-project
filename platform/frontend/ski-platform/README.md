# 滑雪课程追踪平台 (Ski Course Tracking Platform)

雪场课程打卡与成就系统的前端应用，支持记录滑雪课程、取得成就、查看排行榜等功能。

## 功能特性

- **雪场课程追踪** - 记录已完成的雪道课程，顯示完成度百分比
- **成就系统** - 解锁20种不同的成就，获得积分奖励
- **课程推荐** - 推荐最喜欢的前3条雪道，参与社区评选
- **人气排名** - 查看每个雪场的课程人气排行榜
- **全球排行榜** - 查看用户积分和完成度排名
- **实时通知** - 顶部通知栏顯示成就解锁等重要事件

## 技术栈

- **React 18** - 用户界面库
- **TypeScript 5** - 类型安全的开发体验
- **Vite** - 快速构建工具
- **TailwindCSS** - 实用优先的 CSS 框架
- **Redux Toolkit** - 状态管理
- **React Router v6** - 路由管理
- **Axios** - HTTP 客户端

## 项目结构

```
src/
├── features/                 # 功能模块
│   ├── course-tracking/     # 课程追踪功能
│   │   ├── pages/           # 页面组件
│   │   │   ├── ResortList.tsx
│   │   │   ├── ResortDetail.tsx
│   │   │   ├── Recommendations.tsx
│   │   │   ├── Rankings.tsx
│   │   │   ├── Achievements.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── ShareCard.tsx
│   │   └── hooks/           # 自定义 Hooks
│   │       └── useCourseTracking.ts
│   └── auth/                # 认证功能
│       └── pages/
│           └── Login.tsx
├── shared/                   # 共享资源
│   ├── api/                 # API 接口
│   │   ├── client.ts        # Axios 客户端配置
│   │   ├── courseTrackingApi.ts
│   │   └── resortApi.ts
│   ├── components/          # 通用组件
│   │   ├── Navbar.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ToastContainer.tsx
│   │   └── ErrorBoundary.tsx
│   ├── types/               # TypeScript 类型定义
│   │   └── common.ts
│   └── utils/               # 工具函数
│       └── helpers.ts
├── store/                    # Redux 状态管理
│   ├── slices/
│   │   ├── authSlice.ts
│   │   └── courseTrackingSlice.ts
│   └── hooks.ts             # Redux Hooks
├── router/                   # 路由配置
│   └── index.tsx
└── main.tsx                 # 应用入口
```

## 安装和运行

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist/` 目录

### 代码检查

```bash
npm run lint
```

### 预览生产构建

```bash
npm run preview
```

## API 配置

应用通过环境变量配置 API 端点：

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

```bash
# .env.production
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

## 主要页面

### 1. 雪场列表 (`/resorts`)
- 顯示所有可用的雪场
- 顯示每个雪场的完成进度

### 2. 雪场详情 (`/resorts/:id`)
- 顯示雪场的所有课程
- 支持批量或单独打卡课程
- 顯示课程难度和坡度資訊
- 推荐最喜欢的前3条雪道

### 3. 课程推荐 (`/resorts/:id/recommendations`)
- 查看目前雪场的推荐记录
- 刪除推荐
- 查看推荐状态（待审核/已批准/已拒绝）

### 4. 人气排名 (`/resorts/:id/rankings`)
- 查看雪场课程的人气排行
- 顯示访问次数和推荐次数
- 顯示综合人气分数

### 5. 我的成就 (`/achievements`)
- 查看已获得的所有成就
- 顯示成就图标、名称、描述和获得时间
- 顯示获得的积分

### 6. 全球排行榜 (`/leaderboard`)
- 查看全球用户排名
- 顯示用户总积分、完成雪场数、完成课程数
- 高亮顯示目前用户位置

### 7. 成就分享 (`/share/achievement/:id`)
- 分享成就卡片（开发中）

## 自定义 Hooks

项目提供了一系列自定义 Hooks 简化状态管理和 API 调用：

- `useCourseVisits(userId)` - 取得用户的课程访问记录
- `useRecommendations(userId)` - 取得用户的课程推荐
- `useResortProgress(userId, resortId)` - 取得雪场完成进度
- `useCourseRankings(resortId)` - 取得课程人气排名
- `useAchievements(userId)` - 取得用户成就
- `useLeaderboard()` - 取得全球排行榜

## 成就系统

应用包含20种不同的成就，分为4个类别：

1. **基础成就** - 完成第一条雪道、第一个推荐等
2. **进阶成就** - 完成多个雪场、多条雪道
3. **挑战成就** - 完成困难课程、获得高排名
4. **特殊成就** - 社区贡献、连续打卡等

每个成就都有对应的积分奖励（10-300分），解锁成就时会顯示顶部通知。

## 测试用户

开发环境已配置自动登录测试用户：

**用户ID:** `c7347757-0bc3-4a5c-aad8-148cb6403d22`
**用户名:** 张伟

更多测试用户请查看 `TEST_USERS.md`

## 开发指南

### 添加新页面

1. 在 `src/features/course-tracking/pages/` 建立页面组件
2. 在 `src/router/index.tsx` 添加路由配置
3. 在 `src/shared/components/Navbar.tsx` 添加导航連結（如需要）

### 添加新 API

1. 在 `src/shared/api/` 建立 API 服务文件
2. 使用 `client.ts` 中配置的 Axios 实例
3. 定义 TypeScript 类型在 `src/shared/types/`

### 状态管理

使用 Redux Toolkit 的 Slice 模式：

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// 读取状态
const visits = useAppSelector(state => state.courseTracking.visits);

// 派发 action
const dispatch = useAppDispatch();
dispatch(addVisit(newVisit));
```

### 样式规范

使用 TailwindCSS 实用类：

```tsx
<div className="flex items-center justify-between p-4 rounded-lg shadow-md">
  <span className="text-lg font-bold text-primary-600">标题</span>
  <Button variant="primary" size="sm">按钮</Button>
</div>
```

## 浏览器支持

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- 移动端浏览器 (iOS Safari, Chrome Mobile)

## 贡献指南

1. Fork 项目
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证

## 联系方式

如有问题或建议，请建立 Issue 或联系项目维护者。
