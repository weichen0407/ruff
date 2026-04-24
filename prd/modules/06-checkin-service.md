# Module 06: Check-in Service

> 所属 PRD：ruff-prd-v3.md
> 优先级：P0 - 打卡核心模块

## 1. 概述

Check-in Service 负责处理训练打卡的完整生命周期，包括「按计划完成打卡」和「自定义训练打卡」两种路径，支持多次打卡和打卡状态管理。

## 2. 数据类型

### 2.1 CheckInRecord

```typescript
interface CheckInRecord {
  id: string;
  calendarEntryId: string | null; // nullable，表示自定义训练
  date: string; // YYYY-MM-DD
  type: 'run' | 'rest' | 'other';
  distance: number | null; // 公里
  duration: number | null; // 秒
  pace: number | null; // 秒/公里
  feeling?: 'easy' | 'moderate' | 'hard' | 'painful';
  photos?: string[]; // 文件路径数组
  createdAt: string;
}

interface CheckInRecordInput {
  calendarEntryId?: string; // 有值表示按计划打卡
  date: string;
  type: 'run' | 'rest' | 'other';
  distance?: number;
  duration?: number;
  pace?: number;
  feeling?: 'easy' | 'moderate' | 'hard' | 'painful';
  photos?: string[];
}
```

### 2.2 CheckInDailyOverview

```typescript
interface CheckInDailyOverview {
  id: string;
  date: string; // YYYY-MM-DD
  hasCheckIn: boolean;
}
```

### 2.3 今日打卡状态

```typescript
interface TodayCheckInStatus {
  date: string;
  hasCheckIn: boolean;
  schedule: CalendarEntryWithDetails | null; // 今日计划（如果有）
  checkIns: CheckInRecord[]; // 今日所有打卡记录
}
```

## 3. 接口定义

### 3.1 打卡操作

```typescript
// src/lib/checkin/service.ts

/**
 * 按计划完成打卡
 * @param calendarEntryId 日历条目 ID
 * @param actualData 实际完成的训练数据
 * @param feeling 主观感受
 * @param photos 照片列表
 */
export async function checkinFromPlan(
  calendarEntryId: string,
  actualData: {
    distance?: number;
    duration?: number;
    pace?: number;
  },
  feeling?: 'easy' | 'moderate' | 'hard' | 'painful',
  photos?: string[]
): Promise<CheckInRecord>;

/**
 * 自定义训练打卡
 * @param dailyPlanData 自定义的日计划数据（如果用户创建了临时日计划）
 * @param actualData 训练数据
 * @param feeling 主观感受
 * @param photos 照片列表
 */
export async function checkinCustom(
  actualData: {
    type: 'run' | 'rest' | 'other';
    distance?: number;
    duration?: number;
    pace?: number;
  },
  feeling?: 'easy' | 'moderate' | 'hard' | 'painful',
  photos?: string[]
): Promise<CheckInRecord>;

/**
 * 更新打卡记录
 */
export async function updateCheckIn(
  recordId: string,
  data: Partial<CheckInRecordInput>
): Promise<void>;

/**
 * 删除打卡记录
 */
export async function deleteCheckIn(recordId: string): Promise<void>;
```

### 3.2 打卡查询

```typescript
/**
 * 获取指定日期的打卡记录列表
 */
export async function getCheckInsForDate(
  date: string
): Promise<CheckInRecord[]>;

/**
 * 获取今日打卡状态
 */
export async function getTodayCheckInStatus(): Promise<TodayCheckInStatus>;

/**
 * 获取今日打卡状态（快速查询，使用 CheckInDailyOverview）
 */
export async function getTodayHasCheckIn(): Promise<boolean>;
```

### 3.3 打卡统计

```typescript
/**
 * 获取指定日期范围内的打卡统计
 */
export async function getCheckInStatsInRange(
  startDate: string,
  endDate: string
): Promise<{
  totalCount: number;
  totalDistance: number; // 公里
  totalDuration: number; // 秒
  averagePace: number | null; // 秒/公里
}>;

/**
 * 获取本周打卡统计
 */
export async function getThisWeekCheckInStats(): Promise<{
  totalCount: number;
  completedDays: number;
  totalDistance: number;
}>;
```

## 4. 实现细节

### 4.1 checkinFromPlan 流程

```typescript
async function checkinFromPlan(
  calendarEntryId: string,
  actualData: {
    distance?: number;
    duration?: number;
    pace?: number;
  },
  feeling?: 'easy' | 'moderate' | 'hard' | 'painful',
  photos?: string[]
): Promise<CheckInRecord> {
  // 1. 获取日历条目验证存在
  const entry = await getCalendarEntry(calendarEntryId);
  if (!entry) throw new Error('Calendar entry not found');

  // 2. 创建打卡记录
  const record = await db.insert(checkInRecord).values({
    id: generateId(),
    calendarEntryId,
    date: entry.date,
    type: 'run', // 从日历条目获取，这里简化
    distance: actualData.distance,
    duration: actualData.duration,
    pace: actualData.pace,
    feeling,
    photos: photos ? JSON.stringify(photos) : null,
    createdAt: new Date().toISOString(),
  });

  // 3. 更新日历条目状态为 completed
  await db.update(userPlanCalendar)
    .set({ status: 'completed' })
    .where(eq(userPlanCalendar.id, calendarEntryId));

  // 4. 更新每日打卡总览
  await updateDailyOverview(entry.date);

  return record;
}
```

### 4.2 checkinCustom 流程

```typescript
async function checkinCustom(
  actualData: {
    type: 'run' | 'rest' | 'other';
    distance?: number;
    duration?: number;
    pace?: number;
  },
  feeling?: 'easy' | 'moderate' | 'hard' | 'painful',
  photos?: string[]
): Promise<CheckInRecord> {
  const today = getTodayDateString();

  // 1. 创建打卡记录（calendarEntryId 为 null 表示自定义）
  const record = await db.insert(checkInRecord).values({
    id: generateId(),
    calendarEntryId: null,
    date: today,
    type: actualData.type,
    distance: actualData.distance,
    duration: actualData.duration,
    pace: actualData.pace,
    feeling,
    photos: photos ? JSON.stringify(photos) : null,
    createdAt: new Date().toISOString(),
  });

  // 2. 更新每日打卡总览
  await updateDailyOverview(today);

  return record;
}
```

### 4.3 updateDailyOverview 流程

```typescript
async function updateDailyOverview(date: string): Promise<void> {
  // 检查今日是否有打卡记录
  const checkIns = await getCheckInsForDate(date);

  // 插入或更新总览记录
  await db.insert(checkInDailyOverview)
    .values({
      id: generateId(),
      date,
      hasCheckIn: checkIns.length > 0,
    })
    .onConflictDoUpdate({
      target: checkInDailyOverview.date,
      set: { hasCheckIn: checkIns.length > 0 },
    });
}
```

## 5. 核心测试用例

```typescript
// src/lib/checkin/__tests__/service.test.ts

describe('checkinFromPlan', () => {
  it('should create check-in record linked to calendar entry', async () => {
    const record = await checkinFromPlan(
      calendarEntryId,
      { distance: 5, duration: 1800, pace: 360 },
      'easy'
    );

    expect(record.calendarEntryId).toBe(calendarEntryId);
    expect(record.distance).toBe(5);
    expect(record.feeling).toBe('easy');
  });

  it('should update calendar entry status to completed', async () => {
    await checkinFromPlan(calendarEntryId, { distance: 5 });
    const entry = await getCalendarEntry(calendarEntryId);
    expect(entry.status).toBe('completed');
  });

  it('should update daily overview hasCheckIn to true', async () => {
    await checkinCustom({ type: 'run', distance: 5 });
    const hasCheckIn = await getTodayHasCheckIn();
    expect(hasCheckIn).toBe(true);
  });
});

describe('checkinCustom', () => {
  it('should create check-in record with null calendarEntryId', async () => {
    const record = await checkinCustom({
      type: 'run',
      distance: 3,
      duration: 1200,
    });

    expect(record.calendarEntryId).toBeNull();
    expect(record.type).toBe('run');
  });
});

describe('getCheckInsForDate', () => {
  it('should return all check-ins for a date', async () => {
    await checkinCustom({ type: 'run', distance: 5 });
    await checkinCustom({ type: 'run', distance: 3 });

    const checkIns = await getCheckInsForDate(getTodayDateString());
    expect(checkIns).toHaveLength(2);
  });
});
```

## 6. 依赖关系

- **前置依赖**：Module 01 (Database), Module 05 (Calendar Engine)
- **被依赖模块**：Module 07 (History Query)
