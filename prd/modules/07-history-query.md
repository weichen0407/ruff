# Module 07: History Query

> 所属 PRD：ruff-prd-v3.md
> 优先级：P0 - 历史记录查询

## 1. 概述

History Query 负责按日期范围聚合训练记录，提供日历视图所需的数据，计算月度统计数据。

## 2. 数据类型

### 2.1 DailyRecord

```typescript
interface DailyRecord {
  date: string; // YYYY-MM-DD
  hasCheckIn: boolean;
  checkIns: CheckInRecord[];
  calendarEntry?: CalendarEntry | null; // 当日计划（如果有）
  isFromPlan: boolean; // 是否为计划内训练
}

interface DailyRecordWithStats extends DailyRecord {
  totalDistance: number;
  totalDuration: number;
  totalCheckIns: number;
}
```

### 2.2 MonthlyStats

```typescript
interface MonthlyStats {
  year: number;
  month: number; // 1-12
  totalDistance: number; // 公里
  totalDuration: number; // 秒
  totalCheckIns: number;
  planCompletionRate: number; // 0-1，计划完成率
  activeDays: number; // 有打卡的天数
}
```

### 2.3 CalendarMonth

```typescript
interface CalendarMonth {
  year: number;
  month: number;
  days: {
    date: string;
    dayOfMonth: number;
    isCurrentMonth: boolean;
    hasCheckIn: boolean;
    isPlanDay: boolean;
    isCompleted: boolean;
    checkInCount: number;
  }[];
}
```

## 3. 接口定义

### 3.1 日历视图

```typescript
// src/lib/history/query.ts

/**
 * 获取指定月份的日历数据（用于日历视图）
 */
export async function getCalendarMonth(
  year: number,
  month: number // 1-12
): Promise<CalendarMonth>;

/**
 * 获取指定周的日历数据
 */
export async function getCalendarWeek(
  weekStartDate: string // YYYY-MM-DD
): Promise<CalendarMonth['days']>;
```

### 3.2 记录查询

```typescript
/**
 * 获取指定日期的完整记录
 */
export async function getDailyRecord(
  date: string
): Promise<DailyRecordWithStats | null>;

/**
 * 获取日期范围内的所有记录
 */
export async function getRecordsInRange(
  startDate: string,
  endDate: string
): Promise<DailyRecord[]>;
```

### 3.3 统计

```typescript
/**
 * 获取月度统计数据
 */
export async function getMonthlyStats(
  year: number,
  month: number
): Promise<MonthlyStats>;

/**
 * 获取年度统计数据
 */
export async function getYearlyStats(
  year: number
): Promise<{
  year: number;
  monthlyStats: MonthlyStats[];
  totalDistance: number;
  totalDuration: number;
  totalCheckIns: number;
}>;

/**
 * 获取训练趋势（最近 N 周）
 */
export async function getTrainingTrend(
  weeks: number = 4
): Promise<{
  weekStartDates: string[];
  distances: number[];
  durations: number[];
  counts: number[];
}>;
```

## 4. 实现细节

### 4.1 getCalendarMonth 流程

```typescript
async function getCalendarMonth(
  year: number,
  month: number
): Promise<CalendarMonth> {
  // 1. 计算月份的第一天和最后一天
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // 2. 获取该月的所有日期（包含上月和下月的补齐日期）
  const days: CalendarMonth['days'] = [];

  // 3. 获取当月的打卡总览数据
  const overviews = await db.query(checkInDailyOverview)
    .where(and(
      gte(checkInDailyOverview.date, firstDay.toISOString().split('T')[0]),
      lte(checkInDailyOverview.date, lastDay.toISOString().split('T')[0])
    ))
    .execute();

  // 4. 构建日历数据
  // ... 补齐逻辑，生成完整的 42 天（6 周）日历数据

  return { year, month, days };
}
```

### 4.2 getMonthlyStats 流程

```typescript
async function getMonthlyStats(
  year: number,
  month: number
): Promise<MonthlyStats> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = lastDayOfMonth(year, month);

  // 1. 获取当月所有打卡记录
  const records = await getRecordsInRange(startDate, endDate);

  // 2. 计算统计数据
  const totalDistance = records.reduce((sum, r) =>
    sum + r.checkIns.reduce((s, c) => s + (c.distance || 0), 0)
  , 0);

  const totalDuration = records.reduce((sum, r) =>
    sum + r.checkIns.reduce((s, c) => s + (c.duration || 0), 0)
  , 0);

  const totalCheckIns = records.reduce((sum, r) => sum + r.checkIns.length, 0);

  // 3. 计算计划完成率
  const planDays = records.filter(r => r.isFromPlan);
  const completedPlanDays = planDays.filter(r =>
    r.checkIns.some(c => c.calendarEntryId !== null)
  );
  const planCompletionRate = planDays.length > 0
    ? completedPlanDays.length / planDays.length
    : 0;

  return {
    year,
    month,
    totalDistance,
    totalDuration,
    totalCheckIns,
    planCompletionRate,
    activeDays: records.filter(r => r.hasCheckIn).length,
  };
}
```

## 5. 核心测试用例

```typescript
// src/lib/history/__tests__/query.test.ts

describe('getCalendarMonth', () => {
  it('should return 42 days for a month', async () => {
    const result = await getCalendarMonth(2026, 4);
    expect(result.days).toHaveLength(42);
  });

  it('should mark days with check-ins correctly', async () => {
    // 先创建一些打卡记录
    await checkinCustom({ type: 'run', distance: 5 });
    await checkinCustom({ type: 'run', distance: 3 });

    const result = await getCalendarMonth(2026, 4);
    const today = getTodayDateString();
    const todayEntry = result.days.find(d => d.date === today);
    expect(todayEntry?.hasCheckIn).toBe(true);
  });
});

describe('getMonthlyStats', () => {
  it('should calculate correct total distance', async () => {
    await checkinCustom({ type: 'run', distance: 5 });
    await checkinCustom({ type: 'run', distance: 3 });

    const stats = await getMonthlyStats(2026, 4);
    expect(stats.totalDistance).toBe(8);
  });

  it('should calculate correct active days', async () => {
    await checkinCustom({ type: 'run', distance: 5 });
    // 同一天多次打卡只算 1 天

    const stats = await getMonthlyStats(2026, 4);
    expect(stats.activeDays).toBe(1);
  });
});
```

## 6. 依赖关系

- **前置依赖**：Module 01 (Database), Module 06 (Check-in Service)
- **被依赖模块**：无（UI 层直接调用）
