# Module 02: VDOT Engine

> 所属 PRD：ruff-prd-v3.md
> 优先级：P0 - 训练配速体系的核心

## 1. 概述

VDOT Engine 是整个训练配速体系的核心，负责根据丹尼尔斯训练法计算 VDOT 值和五个配速区间。此模块为纯函数模块，不依赖数据库，可独立开发与测试。

## 2. 核心算法

### 2.1 VDOT 计算公式

丹尼尔斯训练法基于目标距离和完赛时间计算 VDOT：

```
VDOT = 距离(英里) / 时间(分钟) 的某种变换
```

实际实现参考 Jack Daniels' Running Formula 第二版的计算逻辑：

```typescript
// src/lib/vdot/calculateVdot.ts

interface VdotInput {
  distanceKm: number;      // 目标距离（公里）
  timeSeconds: number;     // 完赛时间（秒）
}

interface VdotResult {
  vdot: number;            // 如 45.2
  equivalentPerformances: {
    distanceMeters: number;
    timeSeconds: number;
    vdot: number;
  }[];
}
```

### 2.2 五区间配速计算

根据 VDOT 计算 E/M/T/I/R 五个区间的配速（秒/公里）：

| 区间 | 名称 | VDOT 百分比 | 说明 |
|------|------|-------------|------|
| E | Easy | 59%-84% | 轻松跑 |
| M | Marathon | 75%-84% | 马拉松配速 |
| T | Threshold | 84%-88% | 阈值跑 |
| I | Interval | 95%-100% | 间歇跑 |
| R | Repetition | 107%+ | 重复跑 |

```typescript
// src/lib/vdot/getPaceZones.ts

interface PaceZones {
  vdot: number;
  zones: {
    E: number;   // 秒/公里
    M: number;
    T: number;
    I: number;
    R: number;
  };
  descriptions: {
    E: string;
    M: string;
    T: string;
    I: string;
    R: string;
  };
}

export function getPaceZones(vdot: number): PaceZones;
```

### 2.3 配速微调表达式

支持用户在 VDOT 配速基础上进行微调：

| 表达式 | 含义 |
|--------|------|
| `E+10` | E 区间 +10 秒/公里 |
| `M-5` | M 区间 -5 秒/公里 |
| `T+0` | T 区间不变 |
| `R-10` | R 区间 -10 秒/公里 |

```typescript
// src/lib/vdot/adjustPace.ts

export function adjustPace(
  basePaceSecondsPerKm: number,
  expression: string // 如 'E+10', 'R-5', 'M+0'
): number; // 返回调整后的秒/公里
```

## 3. 接口定义

### 3.1 calculateVdot

```typescript
// src/lib/vdot/calculateVdot.ts

/**
 * 根据目标距离和完赛时间计算 VDOT
 * @param distanceKm 距离（公里），支持 5, 10, 21.0975, 42.195
 * @param timeSeconds 时间（秒）
 * @returns VDOT 值（保留一位小数）
 */
export function calculateVdot(distanceKm: number, timeSeconds: number): number;

/**
 * 根据 VDOT 和目标距离推算等效完赛时间
 * @param vdot VDOT 值
 * @param distanceKm 目标距离（公里）
 * @returns 推算的完赛时间（秒）
 */
export function estimateTime(vdot: number, distanceKm: number): number;
```

### 3.2 getPaceZones

```typescript
// src/lib/vdot/getPaceZones.ts

/**
 * 根据 VDOT 获取五个配速区间
 * @param vdot VDOT 值
 * @returns 各区间配速（秒/公里）和描述
 */
export function getPaceZones(vdot: number): PaceZones;

/**
 * 获取单个区间配速
 * @param vdot VDOT 值
 * @param zone 区间标识 E|M|T|I|R
 * @returns 该区间的配速（秒/公里）
 */
export function getZonePace(vdot: number, zone: 'E' | 'M' | 'T' | 'I' | 'R'): number;
```

### 3.3 adjustPace

```typescript
// src/lib/vdot/adjustPace.ts

/**
 * 解析配速微调表达式
 * @param expression 如 'E+10', 'R-5', 'M+0'
 * @returns 解析后的区间和调整量
 */
export function parseAdjustExpression(expression: string): {
  zone: 'E' | 'M' | 'T' | 'I' | 'R' | null;
  adjustment: number; // 秒/公里，可为负数
  isValid: boolean;
};

/**
 * 在 VDOT 配速基础上应用微调
 * @param vdot VDOT 值
 * @param expression 如 'E+10', 'R-5'
 * @returns 调整后的配速（秒/公里）
 */
export function adjustPace(vdot: number, expression: string): number;
```

### 3.4 formatters

```typescript
// src/lib/vdot/formatters.ts

/**
 * 将秒/公里转换为 mm:ss 格式
 * @param secondsPerKm 秒/公里
 * @returns 如 '4:30'
 */
export function formatPace(secondsPerKm: number): string;

/**
 * 将秒/公里转换为带区间的描述
 * @param secondsPerKm 秒/公里
 * @param zone 区间标识
 * @returns 如 'E 4:30 (+10s)'
 */
export function formatPaceWithZone(secondsPerKm: number, zone: string, adjustment?: number): string;
```

## 4. 核心测试用例

### 4.1 calculateVdot 测试

```typescript
// src/lib/vdot/__tests__/calculateVdot.test.ts

describe('calculateVdot', () => {
  it('should calculate correct VDOT for 5K in 20 minutes', () => {
    expect(calculateVdot(5, 20 * 60)).toBeCloseTo(49.0, 1);
  });

  it('should calculate correct VDOT for marathon in 3 hours', () => {
    expect(calculateVdot(42.195, 3 * 60 * 60)).toBeCloseTo(45.0, 1);
  });

  it('should handle half marathon', () => {
    expect(calculateVdot(21.0975, 1.5 * 60 * 60)).toBeCloseTo(43.0, 1);
  });
});
```

### 4.2 getPaceZones 测试

```typescript
// src/lib/vdot/__tests__/getPaceZones.test.ts

describe('getPaceZones', () => {
  const zones = getPaceZones(45);

  it('should return E zone slower than M zone', () => {
    expect(zones.zones.E).toBeGreaterThan(zones.zones.M);
  });

  it('should return M zone slower than T zone', () => {
    expect(zones.zones.M).toBeGreaterThan(zones.zones.T);
  });

  it('should return T zone slower than I zone', () => {
    expect(zones.zones.T).toBeGreaterThan(zones.zones.I);
  });

  it('should return I zone slower than R zone', () => {
    expect(zones.zones.I).toBeGreaterThan(zones.zones.R);
  });
});
```

### 4.3 adjustPace 测试

```typescript
// src/lib/vdot/__tests__/adjustPace.test.ts

describe('adjustPace', () => {
  it('should parse E+10 correctly', () => {
    const result = parseAdjustExpression('E+10');
    expect(result.zone).toBe('E');
    expect(result.adjustment).toBe(10);
    expect(result.isValid).toBe(true);
  });

  it('should parse R-5 correctly', () => {
    const result = parseAdjustExpression('R-5');
    expect(result.zone).toBe('R');
    expect(result.adjustment).toBe(-5);
    expect(result.isValid).toBe(true);
  });

  it('should apply E+10 to VDOT pace', () => {
    const vdot = 45;
    const baseE = getZonePace(vdot, 'E');
    const adjusted = adjustPace(vdot, 'E+10');
    expect(adjusted).toBe(baseE + 10);
  });
});
```

## 5. 依赖关系

- **前置依赖**：无
- **被依赖模块**：Plan Builder（计算计划配速）、Unit Model（跑步单元格式化）
