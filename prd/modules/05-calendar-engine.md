# Module 05: Calendar Engine

> 所属 PRD：ruff-prd-v3.md
> 优先级：P0 - 计划与日期的映射

## 1. 概述

Calendar Engine 负责将 Plan 映射到真实日历，处理「本周开始」或「下周开始」的日期计算，以及计划执行状态的管理。

## 2. 核心概念

### 2.1 Calendar Entry

```typescript
interface CalendarEntry {
  id: string;
  planId: string;
  date: string; // YYYY-MM-DD
  dailyPlanId: string;
  status: 'pending' | 'completed' | 'skipped';
}

interface CalendarEntryWithDetails extends CalendarEntry {
  dailyPlan: DailyPlan;
  units: Unit[];
  checkInRecords: CheckInRecord[];
}
```

### 2.2 计划执行状态

```typescript
type PlanExecutionStatus = 'idle' | 'active' | 'paused' | 'completed';

// 保存在 user 表或单独的 plan_execution 表中
interface PlanExecution {
  planId: string;
  status: PlanExecutionStatus;
  startDate: string; // YYYY-MM-DD
  currentWeekIndex: number;
}
```

## 3. 接口定义

### 3.1 激活计划

```typescript
// src/lib/calendar/engine.ts

/**
 * 激活计划
 * @param planId 要激活的计划 ID
 * @param startOption 'this_week' | 'next_week'
 * @returns 创建的日历条目 IDs
 */
export async function activatePlan(
  planId: string,
  startOption: 'this_week' | 'next_week'
): Promise<string[]>;
```

### 3.2 日期查询

```typescript
/**
 * 获取指定日期的训练安排
 */
export async function getScheduleForDate(
  date: string // YYYY-MM-DD
): Promise<CalendarEntryWithDetails | null>;

/**
 * 获取指定周的全部训练安排（周一到周日）
 */
export async function getScheduleForWeek(
  weekStartDate: string // YYYY-MM-DD，周一日期
): Promise<CalendarEntryWithDetails[]>;

/**
 * 获取今日的训练安排
 */
export async function getTodaySchedule(): Promise<CalendarEntryWithDetails | null>;
```

### 3.3 状态管理

```typescript
/**
 * 标记日历条目状态
 */
export async function updateCalendarStatus(
  entryId: string,
  status: 'pending' | 'completed' | 'skipped'
): Promise<void>;

/**
 * 获取计划的当前执行状态
 */
export async function getPlanExecutionStatus(
  planId: string
): Promise<PlanExecution | null>;

/**
 * 暂停计划
 */
export async function pausePlan(planId: string): Promise<void>;

/**
 * 恢复计划
 */
export async function resumePlan(planId: string): Promise<void>;

/**
 * 切换到另一个计划
 */
export async function switchPlan(newPlanId: string): Promise<void>;
```

### 3.4 周计算

```typescript
/**
 * 获取本周一的日期
 */
export function getThisWeekMonday(date?: Date): string;

/**
 * 获取下周一的日期
 */
export function getNextWeekMonday(date?: Date): string;

/**
 * 获取指定日期所在周的周一
 */
export function getWeekMonday(date: Date): string;

/**
 * 获取指定日期是周几（1=周一，7=周日）
 */
export function getDayOfWeek(date: string): number;

/**
 * 获取日期范围内的所有日期
 */
export function getDateRange(
  startDate: string,
  endDate: string
): string[];
```

## 4. 实现细节

### 4.1 activatePlan 流程

```typescript
async function activatePlan(
  planId: string,
  startOption: 'this_week' | 'next_week'
): Promise<string[]> {
  // 1. 获取计划层级
  const planHierarchy = await getPlanHierarchy(planId);
  if (!planHierarchy) throw new Error('Plan not found');

  // 2. 计算开始日期
  const baseDate = startOption === 'this_week'
    ? getThisWeekMonday()
    : getNextWeekMonday();

  // 3. 清除该计划之前的日历条目（如果存在）
  await deleteCalendarEntries(planId);

  // 4. 为每周的每天创建日历条目
  const entryIds: string[] = [];
  for (const week of planHierarchy.weeklyPlans) {
    const weekOffset = week.weeklyPlan.weekIndex - 1;
    for (const day of week.dailyPlans) {
      const dayOffset = day.dailyPlan.dayIndex - 1;
      const entryDate = addDays(baseDate, weekOffset * 7 + dayOffset);

      const entry = await db.insert(userPlanCalendar).values({
        id: generateId(),
        planId,
        date: entryDate,
        dailyPlanId: day.dailyPlan.id,
        status: 'pending',
      });

      entryIds.push(entry.id);
    }
  }

  // 5. 记录计划执行状态
  await db.insert(planExecution).values({
    planId,
    status: 'active',
    startDate: baseDate,
    currentWeekIndex: 1,
  });

  return entryIds;
}
```

### 4.2 日期计算工具

```typescript
// src/lib/calendar/dateUtils.ts

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function getThisWeekMonday(date?: Date): string {
  const d = date || new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

export function getNextWeekMonday(date?: Date): string {
  const thisMonday = getThisWeekMonday(date);
  return addDays(thisMonday, 7);
}
```

## 5. 核心测试用例

```typescript
// src/lib/calendar/__tests__/dateUtils.test.ts

describe('getThisWeekMonday', () => {
  it('should return Monday for a Wednesday', () => {
    // 2026-04-22 is Wednesday
    const result = getThisWeekMonday(new Date('2026-04-22'));
    expect(result).toBe('2026-04-20'); // Monday
  });

  it('should return same day for Monday', () => {
    const result = getThisWeekMonday(new Date('2026-04-20'));
    expect(result).toBe('2026-04-20');
  });
});

describe('getNextWeekMonday', () => {
  it('should return next Monday', () => {
    const result = getNextWeekMonday(new Date('2026-04-20'));
    expect(result).toBe('2026-04-27');
  });
});

describe('getDayOfWeek', () => {
  it('should return 1 for Monday', () => {
    expect(getDayOfWeek('2026-04-20')).toBe(1);
  });

  it('should return 7 for Sunday', () => {
    expect(getDayOfWeek('2026-04-26')).toBe(7);
  });
});
```

```typescript
// src/lib/calendar/__tests__/activatePlan.test.ts

describe('activatePlan', () => {
  it('should create calendar entries starting from this Monday', async () => {
    const plan = await createPlan({ ... });
    const entryIds = await activatePlan(plan.id, 'this_week');

    const firstEntry = await getCalendarEntry(entryIds[0]);
    expect(firstEntry.date).toBe(getThisWeekMonday());
  });

  it('should create correct number of entries', async () => {
    const plan = await createPlan({ ... });
    const entryIds = await activatePlan(plan.id, 'this_week');

    // 8 weeks * 7 days = 56 entries
    expect(entryIds).toHaveLength(56);
  });
});
```

## 6. 依赖关系

- **前置依赖**：Module 01 (Database), Module 04 (Plan Builder)
- **被依赖模块**：Module 06 (Check-in Service)
