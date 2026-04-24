# Module 08: User Model

> 所属 PRD：ruff-prd-v3.md
> 优先级：P0 - 用户配置模块

## 1. 概述

User Model 负责存储用户个人目标配置，包括跑步目标（目标距离、时间）、VDOT 值、以及第二阶段的睡眠目标和体重目标。

## 2. 数据类型

### 2.1 User

```typescript
interface User {
  id: 'local'; // 固定值
  // 跑步目标
  runningGoalDistance: '5k' | '10k' | 'half' | 'full' | null;
  runningGoalTime: number | null; // 秒
  vdot: number | null;
  // 睡眠目标（第二阶段）
  sleepGoalBedtime: string | null; // HH:mm
  sleepGoalWakeTime: string | null; // HH:mm
  // 体重目标（第二阶段）
  weightGoal: number | null; // 公斤
  // 元数据
  updatedAt: string;
}

interface UpdateUserInput {
  runningGoalDistance?: '5k' | '10k' | 'half' | 'full' | null;
  runningGoalTime?: number | null;
  vdot?: number | null;
  sleepGoalBedtime?: string | null;
  sleepGoalWakeTime?: string | null;
  weightGoal?: number | null;
}
```

## 3. 接口定义

### 3.1 用户配置

```typescript
// src/lib/user/service.ts

/**
 * 获取当前用户配置（单设备，返回固定的 local 用户）
 */
export async function getUser(): Promise<User>;

/**
 * 更新用户配置
 */
export async function updateUser(input: UpdateUserInput): Promise<User>;

/**
 * 根据跑步目标计算并更新 VDOT
 */
export async function calculateAndUpdateVdot(): Promise<number>;
```

### 3.2 快捷操作

```typescript
/**
 * 设置跑步目标并自动计算 VDOT
 */
export async function setRunningGoal(
  distance: '5k' | '10k' | 'half' | 'full',
  timeSeconds: number
): Promise<void>;

/**
 * 获取当前 VDOT 对应的五区间配速
 */
export async function getCurrentPaceZones(): Promise<PaceZones | null>;
```

## 4. 实现细节

### 4.1 getUser

```typescript
async function getUser(): Promise<User> {
  const user = await db.query(user)
    .where(eq(user.id, 'local'))
    .get();

  if (!user) {
    // 首次使用，创建默认用户
    const newUser = await db.insert(user).values({
      id: 'local',
      updatedAt: new Date().toISOString(),
    });
    return newUser;
  }

  return user;
}
```

### 4.2 setRunningGoal

```typescript
async function setRunningGoal(
  distance: '5k' | '10k' | 'half' | 'full',
  timeSeconds: number
): Promise<void> {
  // 1. 计算 VDOT
  const distanceKm = TARGET_DISTANCE_MAP[distance];
  const vdot = calculateVdot(distanceKm, timeSeconds);

  // 2. 更新用户配置
  await db.update(user)
    .set({
      runningGoalDistance: distance,
      runningGoalTime: timeSeconds,
      vdot,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(user.id, 'local'));
}
```

## 5. 依赖关系

- **前置依赖**：Module 01 (Database), Module 02 (VDOT Engine)
- **被依赖模块**：Module 04 (Plan Builder - 创建计划时获取用户 VDOT)
