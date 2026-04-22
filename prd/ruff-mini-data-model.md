# Ruff Mini — 数据模型文档

## 1. 概述

本文档定义 Ruff Mini 应用的数据模型，包括本地 SQLite 存储和云端 PostgreSQL 存储的所有实体及其关系。

### 1.1 设计原则

- **本地优先**：所有数据先写入本地，再同步到云端
- **离线可用**：核心功能在离线状态下完整可用
- **增量同步**：只同步变更数据，减少流量消耗
- **冲突解决**：采用 Last-Write-Wins 策略

### 1.2 数据流向

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   用户输入   │ ──► │  本地 SQLite │ ──► │   云端 PG   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   同步队列   │
                    └─────────────┘
```

---

## 2. 实体关系图

```
┌──────────────────┐       ┌──────────────────┐
│  TrainingPlan    │       │    User          │
│  ──────────────  │       │  ──────────────  │
│  id (PK)         │       │  id (PK)         │
│  name            │◄──────│  email           │
│  targetDistance  │       │  createdAt       │
│  weeks           │       └──────────────────┘
│  startDate       │                │
└────────┬─────────┘                │
         │                          │
         │ 1:N                     │ 1:N
         ▼                          ▼
┌──────────────────┐       ┌──────────────────┐
│ TrainingSchedule │       │  TrainingLog     │
│  ──────────────  │       │  ──────────────  │
│  id (PK)         │       │  id (PK)         │
│  planId (FK)     │──────►│  userId (FK)     │
│  weekNumber      │       │  planId (FK)     │
│  dayOfWeek       │       │  scheduleId (FK) │
│  trainingType    │       │  date            │
│  targetDuration  │       │  type            │
│  targetDistance  │       │  distance        │
│  paceZone        │       │  duration        │
│  isCompleted     │       │  pace            │
│  completedAt     │       │  calories        │
└──────────────────┘       │  notes           │
                            └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│   SleepLog       │       │   WeightLog      │
│  ──────────────  │       │  ──────────────  │
│  id (PK)         │       │  id (PK)         │
│  userId (FK)     │       │  userId (FK)     │
│  date (UNIQUE)   │       │  date (UNIQUE)   │
│  duration        │       │  weight          │
│  quality         │       │  createdAt       │
│  createdAt       │       │  updatedAt       │
└──────────────────┘       └──────────────────┘

┌──────────────────┐
│    SyncQueue     │
│  ──────────────  │
│  id (PK)         │
│  tableName       │
│  recordId        │
│  operation       │
│  payload         │
│  createdAt       │
│  retryCount      │
└──────────────────┘
```

---

## 3. 本地数据模型 (SQLite)

### 3.1 TrainingPlan (训练计划)

```typescript
// 本地存储的训练计划
interface LocalTrainingPlan {
  id: string;                    // UUID v4
  name: string;                 // 计划名称
  targetDistance: '5k' | '10k' | 'half' | 'full';
  weeks: number;                // 训练周数，默认 1
  startDate: string | null;     // YYYY-MM-DD，开始日期
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
  isLocal: boolean;             // 是否本地创建
  cloudId: string | null;      // 云端 ID，用于关联
  isSynced: boolean;            // 是否已同步到云端
}

// 表定义
const trainingPlans = sqliteTable('training_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetDistance: text('target_distance'),
  weeks: integer('weeks').notNull().default(1),
  startDate: text('start_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isLocal: integer('is_local', { mode: 'boolean' }).notNull().default(true),
  cloudId: text('cloud_id'),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
});
```

### 3.2 TrainingSchedule (训练日程)

```typescript
// 训练日程（每天的训练安排）
interface LocalTrainingSchedule {
  id: string;
  planId: string;               // 外键到 TrainingPlan
  weekNumber: number;           // 第几周 (1, 2, 3...)
  dayOfWeek: number;           // 周几 (1=周一, 7=周日)
  trainingType: 'run' | 'strength' | 'rest';
  targetDuration: number | null; // 目标时长（分钟）
  targetDistance: number | null; // 目标距离（公里）
  paceZone: 'E' | 'M' | 'T' | 'I' | 'R' | null;
  isCompleted: boolean;         // 是否完成
  completedAt: string | null;   // 完成时间
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
}

// 表定义
const trainingSchedules = sqliteTable('training_schedules', {
  id: text('id').primaryKey(),
  planId: text('plan_id').references(() => trainingPlans.id),
  weekNumber: integer('week_number').notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  trainingType: text('training_type'),
  targetDuration: integer('target_duration'),
  targetDistance: real('target_distance'),
  paceZone: text('pace_zone'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
});
```

### 3.3 TrainingLog (训练记录)

```typescript
// 训练记录（每次实际跑步的数据）
interface LocalTrainingLog {
  id: string;
  userId: string;               // 用户 ID
  planId: string | null;        // 关联的计划 ID
  scheduleId: string | null;    // 关联的日程 ID
  date: string;                 // YYYY-MM-DD
  type: 'run' | 'strength' | 'rest';
  distance: number | null;      // 公里
  duration: number | null;      // 分钟
  pace: number | null;          // 秒/公里
  calories: number | null;      // 消耗卡路里
  notes: string | null;         // 备注
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
}

// 表定义
const trainingLogs = sqliteTable('training_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  planId: text('plan_id'),
  scheduleId: text('schedule_id'),
  date: text('date').notNull(),
  type: text('type').notNull(),
  distance: real('distance'),
  duration: integer('duration'),
  pace: integer('pace'),
  calories: integer('calories'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
});
```

### 3.4 SleepLog (睡眠记录)

```typescript
// 睡眠记录
interface LocalSleepLog {
  id: string;
  userId: string;
  date: string;                 // YYYY-MM-DD，唯一
  duration: number;            // 睡眠时长（分钟）
  quality: number | null;      // 睡眠质量 1-5
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
}

// 表定义
const sleepLogs = sqliteTable('sleep_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull().unique(),
  duration: integer('duration').notNull(),
  quality: integer('quality'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
});
```

### 3.5 WeightLog (体重记录)

```typescript
// 体重记录
interface LocalWeightLog {
  id: string;
  userId: string;
  date: string;                 // YYYY-MM-DD，唯一
  weight: number;              // 体重（公斤）
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
}

// 表定义
const weightLogs = sqliteTable('weight_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull().unique(),
  weight: real('weight').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
});
```

### 3.6 SyncQueue (同步队列)

```typescript
// 离线操作队列
interface SyncQueueItem {
  id: string;
  tableName: 'training_plans' | 'training_logs' | 'sleep_logs' | 'weight_logs';
  recordId: string;
  operation: 'insert' | 'update' | 'delete';
  payload: string | null;       // JSON 序列化的变更数据
  createdAt: string;
  retryCount: number;           // 重试次数
  lastError: string | null;     // 最近一次错误信息
}

// 表定义
const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation').notNull(),
  payload: text('payload'),
  createdAt: text('created_at').notNull(),
  retryCount: integer('retry_count').notNull().default(0),
  lastError: text('last_error'),
});
```

---

## 4. 云端数据模型 (PostgreSQL)

### 4.1 User (用户)

```typescript
// 云端用户表
interface CloudUser {
  id: string;                  // UUID
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// 表定义
const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  nickname: text('nickname'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false),
});
```

### 4.2 Plan (训练计划)

```typescript
// 云端训练计划
interface CloudPlan {
  id: string;                  // UUID
  userId: string;              // 外键到 User
  name: string;
  targetDistance: '5k' | '10k' | 'half' | 'full';
  weeks: number;
  startDate: string | null;
  vdot: string | null;         // 存为字符串
  paceE: number | null;        // 秒/公里
  paceM: number | null;
  paceT: number | null;
  paceI: number | null;
  paceR: number | null;
  weeklyScheduleData: Record<number, any[]> | null; // JSONB
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// 表定义
const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  targetDistance: text('target_distance').notNull(),
  weeks: integer('weeks').notNull(),
  startDate: text('start_date'),
  vdot: decimal('vdot', { precision: 5, scale: 2 }),
  paceE: integer('pace_e'),
  paceM: integer('pace_m'),
  paceT: integer('pace_t'),
  paceI: integer('pace_i'),
  paceR: integer('pace_r'),
  weeklyScheduleData: jsonb('weekly_schedule_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false),
});
```

### 4.3 TrainingLog (训练记录)

```typescript
// 云端训练记录
interface CloudTrainingLog {
  id: string;                  // UUID
  userId: string;              // 外键到 User
  planId: string | null;
  date: string;                // YYYY-MM-DD
  type: 'run' | 'strength' | 'rest';
  distance: number | null;
  duration: number | null;
  pace: number | null;
  calories: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// 表定义
const trainingLogs = pgTable('training_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  planId: uuid('plan_id'),
  date: text('date').notNull(),
  type: text('type').notNull(),
  distance: real('distance'),
  duration: integer('duration'),
  pace: integer('pace'),
  calories: integer('calories'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false),
});
```

### 4.4 SleepLog (睡眠记录)

```typescript
// 云端睡眠记录
interface CloudSleepLog {
  id: string;                  // UUID
  userId: string;              // 外键到 User
  date: string;                // YYYY-MM-DD
  duration: number;            // 分钟
  quality: number | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// 表定义
const sleepLogs = pgTable('sleep_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  date: text('date').notNull(),
  duration: integer('duration').notNull(),
  quality: integer('quality'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false),
});
```

### 4.5 WeightLog (体重记录)

```typescript
// 云端体重记录
interface CloudWeightLog {
  id: string;                  // UUID
  userId: string;              // 外键到 User
  date: string;                // YYYY-MM-DD
  weight: number;              // 公斤
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// 表定义
const weightLogs = pgTable('weight_logs', {
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

## 5. 索引设计

### 5.1 SQLite 索引

```sql
-- 训练记录按日期查询
CREATE INDEX idx_training_logs_date ON training_logs(date);

-- 睡眠记录按日期查询
CREATE INDEX idx_sleep_logs_date ON sleep_logs(date);

-- 体重记录按日期查询
CREATE INDEX idx_weight_logs_date ON weight_logs(date);

-- 同步队列待处理记录
CREATE INDEX idx_sync_queue_pending
ON sync_queue(created_at)
WHERE retry_count < 3;

-- 训练日程按计划查询
CREATE INDEX idx_training_schedules_plan
ON training_schedules(plan_id, week_number);
```

### 5.2 PostgreSQL 索引

```sql
-- 训练记录复合索引
CREATE INDEX idx_training_logs_user_date
ON training_logs(user_id, date DESC);

-- 睡眠记录唯一约束
CREATE UNIQUE INDEX idx_sleep_logs_user_date
ON sleep_logs(user_id, date)
WHERE is_deleted = false;

-- 体重记录唯一约束
CREATE UNIQUE INDEX idx_weight_logs_user_date
ON weight_logs(user_id, date)
WHERE is_deleted = false;

-- 计划按用户查询
CREATE INDEX idx_plans_user ON plans(user_id)
WHERE is_deleted = false;
```

---

## 6. 数据迁移策略

### 6.1 本地数据库迁移

```typescript
// 使用 expo-sqlite 进行迁移
import * as SQLite from 'expo-sqlite';

const MIGRATIONS = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS training_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_distance TEXT,
        weeks INTEGER NOT NULL DEFAULT 1,
        start_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_local INTEGER NOT NULL DEFAULT 1,
        cloud_id TEXT,
        is_synced INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS training_schedules (
        id TEXT PRIMARY KEY,
        plan_id TEXT REFERENCES training_plans(id),
        week_number INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        training_type TEXT,
        target_duration INTEGER,
        target_distance REAL,
        pace_zone TEXT,
        is_completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      );
    `,
  },
  {
    version: 2,
    up: `
      CREATE TABLE IF NOT EXISTS sleep_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL UNIQUE,
        duration INTEGER NOT NULL,
        quality INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS weight_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL UNIQUE,
        weight REAL NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      );
    `,
  },
  // 后续版本继续添加
];

export async function runMigrations(db: SQLite.SQLiteDatabase) {
  const currentVersion = await db.getFirstAsync<{ version: number }>(
    'PRAGMA user_version'
  );

  for (const migration of MIGRATIONS) {
    if (migration.version > (currentVersion?.version || 0)) {
      await db.execAsync(migration.up);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    }
  }
}
```

---

## 7. 数据验证规则

### 7.1 必填字段

| 表名 | 必填字段 |
|------|----------|
| training_plans | name, weeks |
| training_schedules | weekNumber, dayOfWeek |
| training_logs | userId, date, type |
| sleep_logs | userId, date, duration |
| weight_logs | userId, date, weight |

### 7.2 取值范围

```typescript
// 训练类型
type TrainingType = 'run' | 'strength' | 'rest';

// 配速区间
type PaceZone = 'E' | 'M' | 'T' | 'I' | 'R';

// 目标距离
type TargetDistance = '5k' | '10k' | 'half' | 'full';

// 睡眠质量
const SLEEP_QUALITY_RANGE = { min: 1, max: 5 };

// 体重范围（公斤）
const WEIGHT_RANGE = { min: 20, max: 300 };

// 训练时长范围（分钟）
const DURATION_RANGE = { min: 1, max: 480 };

// 距离范围（公里）
const DISTANCE_RANGE = { min: 0.1, max: 100 };
```

---

## 8. 数据导出

### 8.1 CSV 导出格式

```typescript
// 训练记录 CSV
const trainingLogCSV = `
date,type,distance_km,duration_min,pace_sec_per_km,calories,notes
2026-04-20,run,5.0,30,360,300,户外跑步
2026-04-21,rest,0,0,,,休息日
`.trim();

// 睡眠记录 CSV
const sleepLogCSV = `
date,duration_min,quality
2026-04-20,420,4
2026-04-21,450,5
`.trim();

// 体重记录 CSV
const weightLogCSV = `
date,weight_kg
2026-04-20,70.5
2026-04-21,70.3
`.trim();
```

### 8.2 导出函数

```typescript
async function exportToCSV(
  tableName: 'training_logs' | 'sleep_logs' | 'weight_logs',
  startDate: string,
  endDate: string
): Promise<string> {
  const records = await db.query[tableName]
    .where(gte(date, startDate))
    .where(lte(date, endDate))
    .execute();

  const headers = getCSVHeaders(tableName);
  const rows = records.map(r => formatCSVRow(r, tableName));

  return [headers, ...rows].join('\n');
}
```

---

*文档版本：v1.0*
*最后更新：2026-04-22*
