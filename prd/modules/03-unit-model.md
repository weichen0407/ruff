# Module 03: Unit Model & Formatters

> 所属 PRD：ruff-prd-v3.md
> 优先级：P0 - 训练单元的核心数据模型

## 1. 概述

Unit Model 定义了训练的最小原子单元（跑步、休息、其他），以及时间、距离、配速的格式化函数。此模块为纯函数模块，不依赖数据库，可独立开发与测试。

## 2. 数据类型

### 2.1 Unit 类型

```typescript
// src/lib/unit/types.ts

type PaceMode = 'vdot' | 'custom';
type UnitType = 'run' | 'rest' | 'other';
type StandardType = 'time' | 'distance';
type VdotZone = 'E' | 'M' | 'T' | 'I' | 'R';
type VdotExpression = `${VdotZone}${'+' | '-'}${number}` | VdotZone; // 如 'E+10', 'R-5', 'M'

interface RunUnit {
  type: 'run';
  paceMode: PaceMode;
  paceValue: VdotExpression | string; // vdot 模式: 'E+10'; custom 模式: '4:30'
  standardType: StandardType;
  standardValue: number; // 秒（时间）或 厘米（距离，如 800m = 80）
}

interface RestUnit {
  type: 'rest';
  standard: StandardType;
  standardValue: number; // 秒或 厘米
}

interface OtherUnit {
  type: 'other';
  content: string;
}

type Unit = RunUnit | RestUnit | OtherUnit;
```

### 2.2 创建函数

```typescript
// src/lib/unit/factory.ts

/**
 * 创建跑步单元
 */
export function createRunUnit(
  paceMode: PaceMode,
  paceValue: string,
  standardType: StandardType,
  standardValue: number
): RunUnit;

/**
 * 创建休息单元
 */
export function createRestUnit(
  standard: StandardType,
  standardValue: number
): RestUnit;

/**
 * 创建其他类型单元
 */
export function createOtherUnit(content: string): OtherUnit;
```

## 3. 格式化函数

### 3.1 时间格式化

**规则**：数据库存储秒，界面显示 hh:mm:ss

```typescript
// src/lib/unit/formatDuration.ts

/**
 * 秒 -> hh:mm:ss
 * @param seconds 秒数
 * @returns 如 '1:01:01', '45:30', '5'
 */
export function formatDuration(seconds: number): string;

/**
 * hh:mm:ss -> 秒
 * @param str 如 '1:01:01', '45:30', '5'
 * @returns 秒数
 */
export function parseDuration(str: string): number;

/**
 * 秒数 -> 可读时长描述
 * @param seconds 秒数
 * @returns 如 '1小时1分1秒', '45分', '5秒'
 */
export function formatDurationReadable(seconds: number): string;
```

### 3.2 距离格式化

**规则**：数据库存储公里，界面 <1km 显示米

```typescript
// src/lib/unit/formatDistance.ts

/**
 * 公里 -> 用户友好显示
 * @param km 公里数（公里）
 * @returns 如 '800m', '5.0km', '21.1km'
 */
export function formatDistance(km: number): string;

/**
 * 米 -> 公里
 * @param meters 米数
 * @returns 公里数
 */
export function metersToKm(meters: number): number;

/**
 * 公里 -> 米
 * @param km 公里数
 * @returns 米数
 */
export function kmToMeters(km: number): number;

/**
 * 厘米（数据库存储格式）-> 公里
 * @param cm 厘米数（如 800m = 80cm... 实际上存的是厘米放大100倍）
 * @returns 公里数
 */
export function centiMetersToKm(cm: number): number;
```

> **存储决策说明**：
> - 数据库 `standard_value` 对于距离存储为「厘米整数」，如 800m 存 8000（避免浮点精度）
> - 界面显示时：<1000m 显示为 "800m"，>=1000m 显示为 "5.0km"

### 3.3 配速格式化

**规则**：数据库存储秒/公里，界面显示 mm:ss

```typescript
// src/lib/unit/formatPace.ts

/**
 * 秒/公里 -> mm:ss
 * @param secondsPerKm 秒/公里
 * @returns 如 '4:30', '5:00'
 */
export function formatPace(secondsPerKm: number): string;

/**
 * mm:ss -> 秒/公里
 * @param str 如 '4:30', '5:00'
 * @returns 秒/公里
 */
export function parsePace(str: string): number;
```

## 4. 格式化示例

| 输入 | 函数 | 输出 |
|------|------|------|
| 3661 | formatDuration | "1:01:01" |
| 2700 | formatDuration | "45:00" |
| 45 | formatDuration | "0:45" |
| 0.8 | formatDistance | "800m" |
| 1.0 | formatDistance | "1.0km" |
| 5.0 | formatDistance | "5.0km" |
| 21.0975 | formatDistance | "21.1km" |
| 270 | formatPace | "4:30" |
| 300 | formatPace | "5:00" |

## 5. 核心测试用例

```typescript
// src/lib/unit/__tests__/formatDuration.test.ts

describe('formatDuration', () => {
  it('formats 3661 seconds as 1:01:01', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('formats 3600 seconds as 1:00:00', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
  });

  it('formats 45 seconds as 0:45', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('formats 0 seconds as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});

describe('parseDuration', () => {
  it('parses 1:01:01 correctly', () => {
    expect(parseDuration('1:01:01')).toBe(3661);
  });

  it('parses 45:00 correctly', () => {
    expect(parseDuration('45:00')).toBe(2700);
  });

  it('parses 5 correctly', () => {
    expect(parseDuration('5')).toBe(5);
  });
});
```

```typescript
// src/lib/unit/__tests__/formatDistance.test.ts

describe('formatDistance', () => {
  it('formats 0.8km as 800m', () => {
    expect(formatDistance(0.8)).toBe('800m');
  });

  it('formats 1.0km as 1.0km', () => {
    expect(formatDistance(1.0)).toBe('1.0km');
  });

  it('formats 5.0km as 5.0km', () => {
    expect(formatDistance(5.0)).toBe('5.0km');
  });

  it('formats 0.999km as 999m', () => {
    expect(formatDistance(0.999)).toBe('999m');
  });
});
```

```typescript
// src/lib/unit/__tests__/formatPace.test.ts

describe('formatPace', () => {
  it('formats 270 as 4:30', () => {
    expect(formatPace(270)).toBe('4:30');
  });

  it('formats 300 as 5:00', () => {
    expect(formatPace(300)).toBe('5:00');
  });

  it('formats 61 as 1:01', () => {
    expect(formatPace(61)).toBe('1:01');
  });
});

describe('parsePace', () => {
  it('parses 4:30 correctly', () => {
    expect(parsePace('4:30')).toBe(270);
  });

  it('parses 5:00 correctly', () => {
    expect(parsePace('5:00')).toBe(300);
  });
});
```

## 6. 依赖关系

- **前置依赖**：无
- **被依赖模块**：Plan Builder（创建单元时使用）、Check-in Service（打卡记录时使用）、Calendar Engine（展示日程时使用）
