# Module 01: Database Layer

> 所属 PRD：ruff-prd-v3.md
> 优先级：P0 - 所有模块的基础

## 1. 概述

Database Layer 是整个应用的数据基础设施，负责 SQLite 本地存储的 Schema 定义、Drizzle ORM 封装和数据库迁移。所有其他模块（VDOT Engine 除外）都依赖此层进行数据持久化。

## 2. Schema 定义

### 2.1 User 表

单设备单用户，固定 id 为 `'local'`。

```typescript
// src/db/schema/user.ts
export const user = sqliteTable('user', {
  id: text('id').$type<'local'>().primaryKey().default('local'),
  // 跑步目标
  runningGoalDistance: text('running_goal_distance').$type<'5k' | '10k' | 'half' | 'full'>(),
  runningGoalTime: integer('running_goal_time'), // 秒
  vdot: real('vdot'),
  // 睡眠目标（第二阶段）
  sleepGoalBedtime: text('sleep_goal_bedtime'), // HH:mm
  sleepGoalWakeTime: text('sleep_goal_wake_time'), // HH:mm
  // 体重目标（第二阶段）
  weightGoal: real('weight_goal'), // 公斤
  // 元数据
  updatedAt: text('updated_at').notNull(),
});
```

### 2.2 Plan 表

长期训练计划模板。

```typescript
// src/db/schema/plan.ts
export const plan = sqliteTable('plan', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetDistance: text('target_distance').$type<'5k' | '10k' | 'half' | 'full'>().notNull(),
  targetTime: integer('target_time').notNull(), // 秒
  vdot: real('vdot').notNull(),
  paceE: integer('pace_e').notNull(), // 秒/公里
  paceM: integer('pace_m').notNull(),
  paceT: integer('pace_t').notNull(),
  paceI: integer('pace_i').notNull(),
  paceR: integer('pace_r').notNull(),
  weeks: integer('weeks').notNull(),
  desc: text('desc'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  // 预留扩展字段
  cloudId: text('cloud_id'),
});
```

### 2.3 WeeklyPlan 表

```typescript
export const weeklyPlan = sqliteTable('weekly_plan', {
  id: text('id').primaryKey(),
  planId: text('plan_id').references(() => plan.id).notNull(),
  weekIndex: integer('week_index').notNull(), // 1, 2, 3...
  desc: text('desc'),
});
```

### 2.4 DailyPlan 表

```typescript
export const dailyPlan = sqliteTable('daily_plan', {
  id: text('id').primaryKey(),
  weeklyPlanId: text('weekly_plan_id').references(() => weeklyPlan.id).notNull(),
  dayIndex: integer('day_index').notNull(), // 1-7
  desc: text('desc'),
});
```

### 2.5 Unit 表

训练的最小原子单元。

```typescript
export const unit = sqliteTable('unit', {
  id: text('id').primaryKey(),
  dailyPlanId: text('daily_plan_id').references(() => dailyPlan.id).notNull(),
  type: text('type').$type<'run' | 'rest' | 'other'>().notNull(),
  orderIndex: integer('order_index').notNull(), // 同一天内的顺序
  // 跑步类型字段
  paceMode: text('pace_mode').$type<'vdot' | 'custom'>(),
  paceValue: text('pace_value'), // vdot 模式: 'E','M','T','I','R','E+10','R-5' 等; custom 模式: '4:30' 格式
  standardType: text('standard_type').$type<'time' | 'distance'>(),
  standardValue: integer('standard_value'), // 秒（时间）或 公里*100（距离，如 800m 存 80）
  // 休息类型字段
  standard: text('standard').$type<'time' | 'distance'>(),
  standardValue: integer('standard_value'),
  // 其他类型字段
  content: text('content'),
});
```

> **存储决策说明**：
> - `standardValue` 对于距离采用「厘米」精度存储（如 800m = 80），避免浮点数精度问题
> - `paceValue` vdot 模式直接存储表达式字符串，解析由 VDOT Engine 负责

### 2.6 UserPlanCalendar 表

计划与真实日期的映射。

```typescript
export const userPlanCalendar = sqliteTable('user_plan_calendar', {
  id: text('id').primaryKey(),
  planId: text('plan_id').references(() => plan.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  dailyPlanId: text('daily_plan_id').references(() => dailyPlan.id).notNull(),
  status: text('status').$type<'pending' | 'completed' | 'skipped'>().notNull().default('pending'),
});
```

### 2.7 CheckInRecord 表

```typescript
export const checkInRecord = sqliteTable('check_in_record', {
  id: text('id').primaryKey(),
  calendarEntryId: text('calendar_entry_id').references(() => userPlanCalendar.id), // nullable
  date: text('date').notNull(), // YYYY-MM-DD
  type: text('type').$type<'run' | 'rest' | 'other'>().notNull(),
  distance: real('distance'), // 公里
  duration: integer('duration'), // 秒
  pace: integer('pace'), // 秒/公里
  feeling: text('feeling').$type<'easy' | 'moderate' | 'hard' | 'painful'>(),
  photos: text('photos'), // JSON array of file paths
  createdAt: text('created_at').notNull(),
  // 预留扩展字段
  syncedAt: text('synced_at'),
});
```

### 2.8 CheckInDailyOverview 表

每日打卡总览（用于快速查询今日是否已打卡）。

```typescript
export const checkInDailyOverview = sqliteTable('check_in_daily_overview', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  hasCheckIn: integer('has_check_in', { mode: 'boolean' }).notNull().default(false),
});
```

## 3. 迁移策略

使用 Drizzle 的迁移系统，每次 Schema 变更生成新的迁移文件。

```typescript
// src/db/migrations/meta/0000/_journal.json
{
  "version": "1",
  "dialect": "sqlite",
  "entries": [
    { "idx": 0, "version": "1", "when": 1745529600000, "tag": "0000_init", "breakpoints": true }
  ]
}
```

**迁移执行时机**：
- App 冷启动时检查 `PRAGMA user_version`
- 如需升级，运行所有 pending 迁移

## 4. CRUD 接口

### 4.1 Plan CRUD

```typescript
// src/db/operations/plan.ts
import { eq, desc } from 'drizzle-orm';
import { db } from '../index';
import { plan } from '../schema/plan';

export async function createPlan(data: InsertPlan): Promise<Plan> { ... }
export async function getPlan(id: string): Promise<Plan | null> { ... }
export async function getAllPlans(): Promise<Plan[]> { ... }
export async function updatePlan(id: string, data: Partial<UpdatePlan>): Promise<void> { ... }
export async function deletePlan(id: string): Promise<void> { ... }
```

### 4.2 Calendar CRUD

```typescript
// src/db/operations/calendar.ts
export async function activatePlan(planId: string, startOption: 'this_week' | 'next_week'): Promise<string[]> { ... }
// 返回值为创建的 calendar entry ids
export async function getScheduleForDate(date: string): Promise<CalendarEntry | null> { ... }
export async function getScheduleForWeek(weekStartDate: string): Promise<CalendarEntry[]> { ... }
export async function updateCalendarStatus(entryId: string, status: 'pending' | 'completed' | 'skipped'): Promise<void> { ... }
```

### 4.3 CheckIn CRUD

```typescript
// src/db/operations/checkin.ts
export async function createCheckIn(data: InsertCheckIn): Promise<CheckInRecord> { ... }
export async function getCheckInsForDate(date: string): Promise<CheckInRecord[]> { ... }
export async function getTodayCheckInStatus(): Promise<boolean> { ... }
export async function updateDailyOverview(date: string): Promise<void> { ... }
```

## 5. 测试策略

- 使用 `better-sqlite3` 内存模式进行集成测试
- 每个迁移文件需要有对应的逆向迁移
- Schema 变更需要更新 TypeScript 类型定义

## 6. 依赖关系

- **前置依赖**：无
- **被依赖模块**：所有其他模块
