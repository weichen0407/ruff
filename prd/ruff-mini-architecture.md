# Ruff Mini — 技术架构文档

## 1. 系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ expo-   │  │ TanStack│  │ Zustand │  │ Drizzle │      │
│  │ sqlite  │←→│ Query   │←→│ Store   │←→│ ORM     │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│       ↓                                                    │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Sync Service Layer                   │       │
│  │   (增量同步 + 冲突解决 + 离线队列管理)           │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     Hono.js Backend                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Plan    │  │ Sync    │  │ Auth    │  │ Share   │      │
│  │ Routes  │  │ Routes  │  │ Middle  │  │ Routes  │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL (Neon)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ users   │  │ plans   │  │ logs    │  │ sync_   │      │
│  │         │  │         │  │         │  │ status  │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 移动端架构

```
src/
├── app/                    # expo-router 页面
│   ├── (tabs)/
│   │   ├── plan.tsx       # 计划 Tab
│   │   ├── checkin.tsx    # 打卡 Tab
│   │   └── history.tsx     # 历史 Tab
│   └── (modals)/          # 模态框
├── components/             # UI 组件
│   ├── ui/               # Ruff 风格组件
│   ├── plan/             # 计划相关
│   ├── checkin/          # 打卡相关
│   └── history/           # 历史相关
├── db/                    # 数据库层
│   ├── schema/           # Drizzle Schema
│   ├── local/            # 本地数据库
│   └── migrations/       # 迁移文件
├── lib/                   # 工具库
│   ├── sync.ts           # 同步服务
│   ├── store.ts          # Zustand stores
│   └── api.ts            # API 客户端
├── hooks/                 # 自定义 Hooks
│   ├── usePlan.ts
│   ├── useSync.ts
│   └── useOffline.ts
└── types/                 # TypeScript 类型
```

---

## 2. 数据层设计

### 2.1 本地数据库 Schema (Drizzle + SQLite)

```typescript
// src/db/schema/local.ts

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const trainingPlans = sqliteTable('training_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetDistance: text('target_distance').$type<'5k' | '10k' | 'half' | 'full'>(),
  weeks: integer('weeks').notNull().default(1),
  startDate: text('start_date'), // YYYY-MM-DD
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isLocal: integer('is_local', { mode: 'boolean' }).notNull().default(true),
  cloudId: text('cloud_id'),
});

export const trainingSchedules = sqliteTable('training_schedules', {
  id: text('id').primaryKey(),
  planId: text('plan_id').references(() => trainingPlans.id),
  weekNumber: integer('week_number').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 1=周一, 7=周日
  trainingType: text('training_type').$type<'run' | 'strength' | 'rest'>(),
  targetDuration: integer('target_duration'), // 分钟
  targetDistance: real('target_distance'), // 公里
  paceZone: text('pace_zone').$type<'E' | 'M' | 'T' | 'I' | 'R'>(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
});

export const trainingLogs = sqliteTable('training_logs', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id'),
  date: text('date').notNull(), // YYYY-MM-DD
  type: text('type').$type<'run' | 'strength' | 'rest'>(),
  distance: real('distance'), // 公里
  duration: integer('duration'), // 分钟
  pace: integer('pace'), // 秒/公里
  calories: integer('calories'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
});

export const sleepLogs = sqliteTable('sleep_logs', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  duration: integer('duration').notNull(), // 分钟
  quality: integer('quality'), // 1-5
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
});

export const weightLogs = sqliteTable('weight_logs', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  weight: real('weight').notNull(), // 公斤
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation').$type<'insert' | 'update' | 'delete'>(),
  payload: text('payload'), // JSON
  createdAt: text('created_at').notNull(),
  retryCount: integer('retry_count').notNull().default(0),
});
```

### 2.2 云端数据库 Schema (Drizzle + PostgreSQL)

```typescript
// server/db/schema.ts

import { pgTable, uuid, text, integer, real, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  targetDistance: text('target_distance').$type<'5k' | '10k' | 'half' | 'full'>(),
  weeks: integer('weeks').notNull().default(1),
  startDate: text('start_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false),
});

export const trainingLogs = pgTable('training_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  planId: uuid('plan_id'),
  date: text('date').notNull(),
  type: text('type').$type<'run' | 'strength' | 'rest'>(),
  distance: real('distance'),
  duration: integer('duration'),
  pace: integer('pace'),
  calories: integer('calories'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false),
});

export const sleepLogs = pgTable('sleep_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  date: text('date').notNull(),
  duration: integer('duration').notNull(),
  quality: integer('quality'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false),
});

export const weightLogs = pgTable('weight_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  date: text('date').notNull(),
  weight: real('weight').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false),
});
```

---

## 3. 同步策略

### 3.1 同步流程

```
┌──────────────────────────────────────────────────────────────┐
│                        同步触发                               │
│  1. App 打开 (冷启动)                                        │
│  2. App 从后台恢复                                           │
│  3. 网络状态恢复                                             │
│  4. 定时同步 (每 5 分钟)                                     │
│  5. 用户手动触发                                             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     同步服务 (Sync Service)                    │
│                                                              │
│  1. 收集本地变更 (isSynced = false)                          │
│  2. 构建增量 payload                                         │
│  3. 调用 POST /api/sync                                      │
│  4. 解析云端响应                                             │
│  5. 更新本地 isSynced 状态                                   │
│  6. 合并云端变更到本地                                       │
│  7. 处理冲突 (Last-Write-Wins)                              │
│  8. 更新同步时间戳                                           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                       冲突处理                                │
│                                                              │
│  Last-Write-Wins:                                           │
│  - 比较 updatedAt 时间戳                                      │
│  - 保留最新记录                                              │
│  - 旧记录归档到 conflict_logs 表                             │
│                                                              │
│  用户确认 (可选):                                            │
│  - 保留本地 / 保留云端 / 合并                                │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 同步 API

```typescript
// POST /api/sync
// 请求体
interface SyncRequest {
  lastSyncedAt: string; // ISO 时间戳
  changes: {
    training_logs: TrainingLog[];
    sleep_logs: SleepLog[];
    weight_logs: WeightLog[];
  };
}

// 响应体
interface SyncResponse {
  success: boolean;
  serverTime: string; // 服务器时间戳
  updated: {
    training_logs: TrainingLog[];
    sleep_logs: SleepLog[];
    weight_logs: WeightLog[];
  };
  deleted: {
    training_logs: string[]; // IDs
    sleep_logs: string[];
    weight_logs: string[];
  };
  conflicts: ConflictRecord[];
}
```

### 3.3 离线队列

```typescript
// 本地离线操作队列
interface QueuedOperation {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, any>;
  createdAt: string;
  retryCount: number;
}

// 队列处理伪代码
async function processSyncQueue() {
  const pending = await db.query(syncQueue).where(eq(syncQueue.retryCount, < 3));

  for (const op of pending) {
    try {
      await syncToCloud(op);
      await db.delete(syncQueue).where(eq(syncQueue.id, op.id));
    } catch (error) {
      await db.update(syncQueue)
        .set({ retryCount: op.retryCount + 1 })
        .where(eq(syncQueue.id, op.id));
    }
  }
}
```

---

## 4. 组件架构

### 4.1 目录结构

```
src/components/
├── ui/                        # Ruff 设计系统组件
│   ├── RuffButton.tsx         # 主按钮
│   ├── RuffCard.tsx           # 卡片
│   ├── RuffInput.tsx          # 输入框
│   └── index.ts
├── plan/                      # 计划模块
│   ├── WeekCalendar.tsx       # 周日历
│   ├── DayCell.tsx            # 日期单元格
│   ├── TrainingDetail.tsx      # 训练详情
│   ├── TrainingForm.tsx        # 训练表单
│   └── index.ts
├── checkin/                   # 打卡模块
│   ├── TodayCheckIn.tsx       # 今日打卡
│   ├── SleepCard.tsx          # 睡眠卡片
│   ├── WeightCard.tsx         # 体重卡片
│   └── index.ts
├── history/                   # 历史模块
│   ├── LogList.tsx           # 记录列表
│   ├── LogItem.tsx           # 记录项
│   ├── FilterBar.tsx          # 筛选栏
│   └── index.ts
└── common/                    # 通用组件
    ├── LoadingSpinner.tsx
    ├── EmptyState.tsx
    └── index.ts
```

### 4.2 核心组件设计

#### WeekCalendar (周日历)

```typescript
interface WeekCalendarProps {
  currentWeek: Date; // 周一日期
  schedules: TrainingSchedule[];
  completedDays: Set<number>; // 已完成的 dayOfWeek
  onDayPress: (dayOfWeek: number) => void;
  onWeekChange: (direction: 'prev' | 'next') => void;
}

// 使用示例
<WeekCalendar
  currentWeek={new Date('2026-04-20')}
  schedules={schedules}
  completedDays={new Set([1, 2, 3, 5])}
  onDayPress={(day) => navigation.push('/training', { day })}
  onWeekChange={(dir) => setWeek(addWeeks(week, dir === 'next' ? 1 : -1))}
/>
```

#### TodayCheckIn (今日打卡)

```typescript
interface TodayCheckInProps {
  sleep?: SleepLog;
  weight?: WeightLog;
  onAddSleep: () => void;
  onAddWeight: () => void;
}

// 使用示例
<TodayCheckIn
  sleep={todaySleep}
  weight={todayWeight}
  onAddSleep={() => bottomSheetRef.current?.open()}
  onAddWeight={() => bottomSheetRef.current?.open()}
/>
```

---

## 5. 状态管理

### 5.1 Zustand Stores

```typescript
// src/lib/stores/planStore.ts
import { create } from 'zustand';

interface PlanState {
  currentPlan: TrainingPlan | null;
  schedules: TrainingSchedule[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentPlan: (plan: TrainingPlan | null) => void;
  loadSchedules: (weekNumber: number) => Promise<void>;
  toggleComplete: (scheduleId: string) => Promise<void>;
  createPlan: (data: CreatePlanData) => Promise<void>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  currentPlan: null,
  schedules: [],
  isLoading: false,
  error: null,

  setCurrentPlan: (plan) => set({ currentPlan: plan }),

  loadSchedules: async (weekNumber) => {
    set({ isLoading: true, error: null });
    try {
      const schedules = await db.query.trainingSchedules
        .where(eq(trainingSchedules.weekNumber, weekNumber))
        .execute();
      set({ schedules, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  toggleComplete: async (scheduleId) => {
    const schedule = get().schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    await db.update(trainingSchedules)
      .set({
        isCompleted: !schedule.isCompleted,
        completedAt: !schedule.isCompleted ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
        isSynced: false,
      })
      .where(eq(trainingSchedules.id, scheduleId));

    // 触发同步
    syncService.queueChange('training_schedules', scheduleId, 'update');
  },

  createPlan: async (data) => {
    // 创建计划逻辑
  },
}));
```

### 5.2 TanStack Query 集成

```typescript
// src/lib/queryhooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syncService } from './sync';

// 同步状态
export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync', 'status'],
    queryFn: () => api.get('/sync/status'),
    staleTime: 1000 * 60, // 1分钟
  });
}

// 训练计划
export function useTrainingPlan(planId?: string) {
  return useQuery({
    queryKey: ['plan', planId],
    queryFn: () => planId ? db.query.plans.findFirst(planId) : null,
    enabled: !!planId,
  });
}

// 添加训练记录
export function useAddTrainingLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrainingLog) => api.post('/training-logs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sync', 'status'] });
    },
  });
}
```

---

## 6. API 设计

### 6.1 端点列表

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/register | 用户注册 |
| GET | /api/plans | 获取计划列表 |
| POST | /api/plans | 创建计划 |
| GET | /api/plans/:id | 获取计划详情 |
| DELETE | /api/plans/:id | 删除计划 |
| POST | /api/plans/:id/start | 开始执行计划 |
| GET | /api/training-logs | 获取训练记录 |
| POST | /api/training-logs | 创建训练记录 |
| GET | /api/sleep-logs | 获取睡眠记录 |
| POST | /api/sleep-logs | 创建/更新睡眠记录 |
| GET | /api/weight-logs | 获取体重记录 |
| POST | /api/weight-logs | 创建/更新体重记录 |
| POST | /api/sync | 同步数据 |
| GET | /api/sync/status | 获取同步状态 |

### 6.2 API 响应格式

```typescript
// 统一响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 使用示例
// GET /api/plans/:id
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "5K训练计划",
    "targetDistance": "5k",
    "weeks": 12,
    "startDate": "2026-04-20",
    "schedules": [...],
    "stats": {
      "totalDistance": 150.5,
      "completedWorkouts": 8,
      "currentWeek": 2
    }
  }
}
```

---

## 7. 安全性设计

### 7.1 认证

- 使用 JWT Token 认证
- Token 存储在 Keychain (iOS) / Keystore (Android)
- Token 有效期 7 天，自动刷新

### 7.2 数据加密

| 数据 | 存储 | 传输 |
|------|------|------|
| 用户密码 | 哈希 (bcrypt) | HTTPS |
| 个人数据 | SQLite 加密 | HTTPS |
| 敏感字段 | 应用层加密 | HTTPS |

### 7.3 隐私保护

- 不收集不必要的用户信息
- 数据导出功能让用户完全控制自己的数据
- 支持删除所有个人数据

---

## 8. 性能优化

### 8.1 数据库优化

```sql
-- 常用查询索引
CREATE INDEX idx_training_logs_date ON training_logs(date);
CREATE INDEX idx_training_logs_user_date ON training_logs(user_id, date);
CREATE INDEX idx_sleep_logs_date ON sleep_logs(date);
CREATE INDEX idx_weight_logs_date ON weight_logs(date);
CREATE INDEX idx_sync_queue_retry ON sync_queue(retry_count) WHERE retry_count < 3;
```

### 8.2 渲染优化

- 使用 `React.memo` 优化组件重渲染
- 使用 `useCallback` 和 `useMemo` 缓存函数和计算结果
- 列表使用虚拟化 (FlashList)
- 图片懒加载

### 8.3 离线性能

- 本地查询 < 50ms
- 索引优化 + 预处理查询
- 批量写入减少 IO 操作

---

*文档版本：v1.0*
*最后更新：2026-04-22*
