# Module 04: Plan Builder

> 所属 PRD：ruff-prd-v3.md
> 优先级：P0 - 训练计划核心模块

## 1. 概述

Plan Builder 负责训练计划的增删改查，以及 Unit → DailyPlan → WeeklyPlan → Plan 的层级关系管理。

## 2. 数据结构

### 2.1 Plan（长期计划）

```typescript
interface Plan {
  id: string;
  name: string;
  targetDistance: '5k' | '10k' | 'half' | 'full';
  targetTime: number; // 秒
  vdot: number;
  paceE: number; // 秒/公里
  paceM: number;
  paceT: number;
  paceI: number;
  paceR: number;
  weeks: number;
  desc?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePlanInput {
  name: string;
  targetDistance: '5k' | '10k' | 'half' | 'full';
  targetTime: number; // 秒
  weeks: number;
  desc?: string;
}
```

### 2.2 WeeklyPlan

```typescript
interface WeeklyPlan {
  id: string;
  planId: string;
  weekIndex: number; // 1, 2, 3...
  desc?: string;
}

interface CreateWeeklyPlanInput {
  planId: string;
  weekIndex: number;
  desc?: string;
}
```

### 2.3 DailyPlan

```typescript
interface DailyPlan {
  id: string;
  weeklyPlanId: string;
  dayIndex: number; // 1-7（周一到周日）
  desc?: string;
}

interface CreateDailyPlanInput {
  weeklyPlanId: string;
  dayIndex: number;
  desc?: string;
}
```

### 2.4 Unit

见 Module 03: Unit Model

## 3. 接口定义

### 3.1 Plan CRUD

```typescript
// src/lib/plan/operations.ts

import type { Plan, CreatePlanInput } from './types';

/**
 * 创建长期训练计划
 * - 自动计算 VDOT 和五区间配速
 * - 自动生成 WeeklyPlan 和 DailyPlan 结构
 */
export async function createPlan(input: CreatePlanInput): Promise<Plan>;

/**
 * 获取单个计划（含完整层级）
 */
export async function getPlan(planId: string): Promise<PlanWithHierarchy | null>;

/**
 * 获取所有计划（列表）
 */
export async function getAllPlans(): Promise<Plan[]>;

/**
 * 更新计划基本信息
 */
export async function updatePlan(planId: string, input: Partial<CreatePlanInput>): Promise<void>;

/**
 * 删除计划（级联删除 WeeklyPlan, DailyPlan, Unit）
 */
export async function deletePlan(planId: string): Promise<void>;
```

### 3.2 WeeklyPlan 操作

```typescript
/**
 * 为计划添加周计划
 */
export async function addWeeklyPlan(planId: string, input: CreateWeeklyPlanInput): Promise<WeeklyPlan>;

/**
 * 获取计划的全部周计划
 */
export async function getWeeklyPlans(planId: string): Promise<WeeklyPlan[]>;
```

### 3.3 DailyPlan 操作

```typescript
/**
 * 为周计划添加日计划
 */
export async function addDailyPlan(weeklyPlanId: string, input: CreateDailyPlanInput): Promise<DailyPlan>;

/**
 * 获取周计划的全部日计划
 */
export async function getDailyPlans(weeklyPlanId: string): Promise<DailyPlan[]>;
```

### 3.4 Unit 操作

```typescript
import type { Unit } from '../unit/types';

/**
 * 为日计划添加训练单元
 */
export async function addUnit(dailyPlanId: string, unit: Unit, orderIndex: number): Promise<Unit>;

/**
 * 获取日计划的全部单元（按 orderIndex 排序）
 */
export async function getUnits(dailyPlanId: string): Promise<Unit[]>;

/**
 * 更新单元
 */
export async function updateUnit(unitId: string, unit: Partial<Unit>): Promise<void>;

/**
 * 删除单元
 */
export async function deleteUnit(unitId: string): Promise<void>;

/**
 * 批量添加单元到日计划
 */
export async function addUnits(dailyPlanId: string, units: Unit[]): Promise<void>;
```

## 4. 完整层级查询

```typescript
// src/lib/plan/hierarchy.ts

interface PlanWithHierarchy {
  plan: Plan;
  weeklyPlans: {
    weeklyPlan: WeeklyPlan;
    dailyPlans: {
      dailyPlan: DailyPlan;
      units: Unit[];
    }[];
  }[];
}

interface DailyPlanWithUnits extends DailyPlan {
  units: Unit[];
}

interface WeeklyPlanWithDailyPlans extends WeeklyPlan {
  dailyPlans: DailyPlanWithUnits[];
}

/**
 * 获取计划的完整层级结构
 */
export async function getPlanHierarchy(planId: string): Promise<PlanWithHierarchy | null>;

/**
 * 获取单个日计划的完整信息（含单元）
 */
export async function getDailyPlanWithUnits(dailyPlanId: string): Promise<DailyPlanWithUnits | null>;
```

## 5. 实现细节

### 5.1 createPlan 流程

```typescript
async function createPlan(input: CreatePlanInput): Promise<Plan> {
  // 1. 计算 VDOT
  const distanceKm = TARGET_DISTANCE_MAP[input.targetDistance];
  const vdot = calculateVdot(distanceKm, input.targetTime);

  // 2. 计算五区间配速
  const paceZones = getPaceZones(vdot);

  // 3. 创建 Plan 记录
  const plan = await db.insert(planTable).values({
    id: generateId(),
    name: input.name,
    targetDistance: input.targetDistance,
    targetTime: input.targetTime,
    vdot,
    paceE: paceZones.zones.E,
    paceM: paceZones.zones.M,
    paceT: paceZones.zones.T,
    paceI: paceZones.zones.I,
    paceR: paceZones.zones.R,
    weeks: input.weeks,
    desc: input.desc,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 4. 为每周创建 WeeklyPlan 和 DailyPlan
  for (let weekIndex = 1; weekIndex <= input.weeks; weekIndex++) {
    const weeklyPlan = await db.insert(weeklyPlanTable).values({
      id: generateId(),
      planId: plan.id,
      weekIndex,
    });

    for (let dayIndex = 1; dayIndex <= 7; dayIndex++) {
      await db.insert(dailyPlanTable).values({
        id: generateId(),
        weeklyPlanId: weeklyPlan.id,
        dayIndex,
      });
    }
  }

  return plan;
}
```

### 5.2 目标距离映射

```typescript
const TARGET_DISTANCE_MAP = {
  '5k': 5,
  '10k': 10,
  'half': 21.0975,
  'full': 42.195,
};
```

## 6. 测试策略

使用内存 SQLite 数据库进行集成测试：

```typescript
// src/lib/plan/__tests__/createPlan.test.ts

describe('createPlan', () => {
  it('should calculate correct VDOT for 5K plan', async () => {
    const plan = await createPlan({
      name: '5K Training',
      targetDistance: '5k',
      targetTime: 20 * 60, // 20 minutes
      weeks: 8,
    });

    expect(plan.vdot).toBeCloseTo(49.0, 1);
  });

  it('should create correct number of weekly plans', async () => {
    const plan = await createPlan({
      name: '8 Week Plan',
      targetDistance: '10k',
      targetTime: 50 * 60,
      weeks: 8,
    });

    const weeklyPlans = await getWeeklyPlans(plan.id);
    expect(weeklyPlans).toHaveLength(8);
  });

  it('should create 7 daily plans per week', async () => {
    const plan = await createPlan({
      name: 'Test Plan',
      targetDistance: 'half',
      targetTime: 1.5 * 60 * 60,
      weeks: 4,
    });

    const weeklyPlans = await getWeeklyPlans(plan.id);
    for (const wp of weeklyPlans) {
      const dailyPlans = await getDailyPlans(wp.id);
      expect(dailyPlans).toHaveLength(7);
    }
  });
});
```

## 7. 依赖关系

- **前置依赖**：Module 01 (Database), Module 02 (VDOT Engine)
- **被依赖模块**：Module 05 (Calendar Engine)
