# Module 10: Technical Architecture

> 所属 PRD：ruff-prd-v3.md
> 优先级：P0

## 1. 技术栈总览

| 层级 | 选型 | 说明 |
|------|------|------|
| 移动端框架 | React Native 0.83 + Expo 55 | 跨平台 iOS/Android |
| UI 组件 | @expo/ui (SwiftUI) | 原生 SwiftUI 组件 |
| 路由 | expo-router | 文件路由 |
| 本地存储 | expo-sqlite + Drizzle ORM | SQLite 本地数据库 |
| 状态管理 | Zustand + TanStack Query | UI 状态 + 数据缓存 |
| 后端 | 无 | 纯本地 |

## 2. 项目结构

```
Ruff/
├── src/
│   ├── app/                          # expo-router 页面
│   │   ├── _layout.tsx              # 根布局
│   │   ├── index.tsx                # 重定向到 /plan
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx          # Tab 导航布局
│   │   │   ├── plan.tsx             # 计划 Tab
│   │   │   ├── checkin.tsx          # 打卡 Tab
│   │   │   └── history.tsx          # 历史 Tab
│   │   └── (modals)/
│   │       ├── create-plan.tsx       # 创建计划
│   │       ├── add-training.tsx      # 添加训练
│   │       └── view-record.tsx       # 查看记录详情
│   │
│   ├── components/                   # SwiftUI 组件 (@expo/ui)
│   │   ├── ui/                      # 基础 UI 组件
│   │   │   ├── Button.swift
│   │   │   ├── Card.swift
│   │   │   ├── Input.swift
│   │   │   └── index.ts
│   │   ├── plan/                    # 计划模块组件
│   │   ├── checkin/                 # 打卡模块组件
│   │   └── history/                 # 历史模块组件
│   │
│   ├── lib/                         # 业务逻辑
│   │   ├── vdot/                    # Module 02
│   │   ├── unit/                    # Module 03
│   │   ├── plan/                    # Module 04
│   │   ├── calendar/                # Module 05
│   │   ├── checkin/                 # Module 06
│   │   ├── history/                 # Module 07
│   │   └── user/                    # Module 08
│   │
│   ├── db/                          # 数据层
│   │   ├── index.ts                 # Drizzle 实例
│   │   ├── schema/                  # Schema 定义
│   │   │   ├── user.ts
│   │   │   ├── plan.ts
│   │   │   ├── weekly-plan.ts
│   │   │   ├── daily-plan.ts
│   │   │   ├── unit.ts
│   │   │   ├── user-plan-calendar.ts
│   │   │   ├── check-in-record.ts
│   │   │   └── check-in-daily-overview.ts
│   │   ├── operations/              # CRUD 操作
│   │   │   ├── plan.ts
│   │   │   ├── calendar.ts
│   │   │   └── checkin.ts
│   │   └── migrations/              # 数据库迁移
│   │
│   ├── stores/                      # Zustand stores
│   │   ├── usePlanStore.ts
│   │   ├── useCheckInStore.ts
│   │   └── useCalendarStore.ts
│   │
│   ├── hooks/                       # TanStack Query hooks
│   │   ├── usePlan.ts
│   │   ├── useCheckIn.ts
│   │   ├── useCalendar.ts
│   │   └── useHistory.ts
│   │
│   └── types/                       # TypeScript 类型
│       ├── vdot.ts
│       ├── unit.ts
│       └── plan.ts
│
├── ios/                             # iOS 原生代码
│   └── LocalPods/                  # 本地 CocoaPods
│       └── RuffUI/                 # SwiftUI 组件
│
├── android/                         # Android 原生代码（预留）
│
└── package.json
```

## 3. 架构决策

### 3.1 为什么用 @expo/ui (SwiftUI)

- SwiftUI 提供原生 iOS 体验
- @expo/ui 封装了 SwiftUI 到 React Native 的桥接
- 可以在 JS/TS 层调用 SwiftUI 组件

### 3.2 状态管理分层

| 层级 | 工具 | 职责 |
|------|------|------|
| UI 状态 | Zustand | 当前选中日期、Modal 开关、动画状态 |
| 服务端状态 | TanStack Query | 数据库查询缓存、自动刷新 |
| 持久化 | Drizzle ORM | SQLite 操作 |

### 3.3 模块独立性

每个模块（lib 下的目录）都是独立的：
- 只暴露必要的接口
- 不直接依赖其他模块的业务逻辑
- 通过 TypeScript 类型定义接口契约

## 4. 数据库连接

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

const sqlite = SQLite.openDatabaseSync('ruff.db');
export const db = drizzle(sqlite, { schema });
```

## 5. TanStack Query 集成

```typescript
// src/hooks/usePlan.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as planOps from '@/db/operations/plan';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => planOps.getAllPlans(),
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: () => planOps.getPlan(id),
    enabled: !!id,
  });
}
```

## 6. Zustand Store

```typescript
// src/stores/useCalendarStore.ts
import { create } from 'zustand';

interface CalendarState {
  currentDate: string;
  currentWeekStart: string;
  setCurrentDate: (date: string) => void;
  goToNextWeek: () => void;
  goToPrevWeek: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentDate: getTodayDateString(),
  currentWeekStart: getThisWeekMonday(),

  setCurrentDate: (date) => set({ currentDate: date }),

  goToNextWeek: () => {
    const next = addDays(get().currentWeekStart, 7);
    set({ currentWeekStart: next });
  },

  goToPrevWeek: () => {
    const prev = addDays(get().currentWeekStart, -7);
    set({ currentWeekStart: prev });
  },
}));
```

## 7. 依赖关系图

```
┌──────────────────────────────────────────────────────────────┐
│                         UI Layer (@expo/ui)                  │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Hooks (TanStack Query)                   │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│ usePlan    │ useCheckIn  │ useCalendar │ useHistory        │
└─────────────┴─────────────┴─────────────┴───────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   Zustand Stores (UI State)                │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│usePlanStore│useCheckInStr│useCalendarSt│useHistoryStore   │
└─────────────┴─────────────┴─────────────┴───────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      Business Logic (lib/)                   │
├─────────┬─────────┬─────────┬─────────┬─────────┬───────────┤
│VDOT Eng │Unit Mod │Plan Bld │Calendar │Check-in│History Q  │
│         │         │         │ Engine  │Service │           │
└─────────┴─────────┴─────────┴─────────┴─────────┴───────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      Database Layer (db/)                    │
│                   expo-sqlite + Drizzle ORM                  │
└──────────────────────────────────────────────────────────────┘
```

## 8. 性能目标

| 指标 | 目标 |
|------|------|
| 冷启动时间 | < 2秒 |
| 页面切换 | < 100ms |
| 本地查询 | < 50ms |
| 离线可用性 | 核心功能 100% |
