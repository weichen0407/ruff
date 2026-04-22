# Ruff Mini — 可复用组件总结

## 概述

本文档总结 Ruff 应用中两个高度可复用的模块：**首页日历打卡组件** 和 **Web 计划广场组件**。这些组件的设计可以直接移植到 Ruff Mini 项目中。

---

## 1. 日历打卡组件

### 1.1 组件位置

| 文件 | 说明 |
|------|------|
| `src/components/check-in/CalendarHeatmap.tsx` | 月历热力图组件 |
| `src/components/check-in/DayCheckInOverview.tsx` | 每日打卡概览组件 |
| `src/components/check-in/DiamondCheckIn.tsx` | 菱形打卡状态指示器 |

### 1.2 核心设计模式

#### CalendarHeatmap — 月历网格

**功能特点：**
- 以周为行显示整月日历（周一到周日）
- 每个日期格子显示：日期数字 + 菱形打卡状态
- 支持选中日期高亮
- 今日日期特殊标记
- 非当月日期降低透明度

**关键代码片段：**

```typescript
// 日期分组为周
const weeks: Date[][] = [];
for (let i = 0; i < dates.length; i += 7) {
  weeks.push(dates.slice(i, i + 7));
}

// 日期格式化
function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
```

**接口设计：**

```typescript
interface CalendarHeatmapProps {
  year: number;
  month: number;
  snapshots: DailyCheckInSnapshot[];  // 每日打卡快照
  selectedDate: string;             // 选中日期 YYYY-MM-DD
  onSelectDate: (date: string) => void;
  locale: string;
  textColor: string;
  textSecondaryColor: string;
  surfaceColor: string;
  accentColor: string;
  showDiamondBorder: boolean;
}
```

#### DayCheckInOverview — 打卡卡片网格

**功能特点：**
- 显示选中日期的四个打卡模块（训练/饮食/体重/睡眠）
- 每个模块独立卡片，包含图标、标题、数值
- 完成状态用主色高亮 + 勾选图标
- 点击跳转到详情页

**模块卡片设计 (ModuleCard)：**

```typescript
interface ModuleCardProps {
  icon: string;
  title: string;
  value: string;           // 主数值
  subValue?: string;       // 副文本
  isCheckedIn: boolean;    // 是否已完成
  textColor: string;
  textSecondaryColor: string;
  surfaceColor: string;
  primaryColor: string;
  onPress?: () => void;   // 点击回调
}
```

**布局：2x2 网格**

```typescript
<StyledView className="flex-row flex-wrap" style={{ gap: 8 }}>
  <StyledView style={{ width: '48%' }}>
    <ModuleCard {...trainingProps} />
  </StyledView>
  <StyledView style={{ width: '48%' }}>
    <ModuleCard {...dietProps} />
  </StyledView>
  <StyledView style={{ width: '48%' }}>
    <ModuleCard {...weightProps} />
  </StyledView>
  <StyledView style={{ width: '48%' }}>
    <ModuleCard {...sleepProps} />
  </StyledView>
</StyledView>
```

### 1.3 Ruff Mini 适配建议

Ruff Mini 只需要 **3 个模块**（训练/睡眠/体重），可以简化为：

```
┌─────────────────────────────────────┐
│  📅 今日打卡              75% 完成  │
├─────────────────────────────────────┤
│  ┌───────────┐    ┌───────────┐    │
│  │ 🏃 训练   │    │ 🌙 睡眠   │    │
│  │ 5公里     │    │ 7小时30分  │    │
│  │ ✓ 已完成  │    │ ✓ 已打卡   │    │
│  └───────────┘    └───────────┘    │
│  ┌─────────────────────────────┐   │
│  │ ⚖️ 体重        70.5 kg     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**修改要点：**
- 移除 `diet` 模块
- 改为 2 行布局：训练+睡眠 并排，体重单独一行占满

---

## 2. Web 计划广场组件

### 2.1 组件位置

| 文件 | 说明 |
|------|------|
| `web/src/app/(main)/plans/page.tsx` | 我的计划列表页 |
| `web/src/app/(main)/plans/square/page.tsx` | 计划广场页 |
| `web/src/components/plans/PlanCard.tsx` | 计划卡片组件 |

### 2.2 PlanCard 组件

**功能特点：**
- 左侧：距离徽章（5K/10K/半马/全马）
- 中间：计划名称 + VDOT + 周数 + 创建者
- 右侧：操作按钮组
- 支持"执行中"状态标签

**接口设计：**

```typescript
interface PlanCardData {
  id: string;
  name: string;
  targetDistance: '5k' | '10k' | 'half' | 'full';
  weeks: number;
  vdot: number | string;
  creator?: string;
  usageCount?: number;
  isDefault?: boolean;
  startDate?: string | null;
}

interface PlanCardProps {
  plan: PlanCardData;
  onClick?: () => void;
  actions?: React.ReactNode;  // 可自定义操作按钮
}
```

**视觉效果：**

```
┌──────────────────────────────────────────────────────────┐
│  ┌────┐                                                 │
│  │ 5K │  我的5K训练计划            [执行中] [查看] [删除] │
│  └────┘  VDOT 45.2 · 12周 · 创始人                      │
└──────────────────────────────────────────────────────────┘
```

### 2.3 计划列表页设计

**功能特点：**
- Tab 切换：我的计划 / 计划广场
- 空状态引导创建
- 加载状态骨架屏
- 错误状态重试
- 启动计划弹窗（本周/下周开始）

**启动计划弹窗：**

```typescript
// 开始选项
<button onClick={() => handleStartOption("this_week")}>
  从本周一开始
</button>
<button onClick={() => handleStartOption("next_week")}>
  从下周一开始
</button>
```

### 2.4 计划广场页设计

**功能特点：**
- 距离筛选：全部/5K/10K/半马/全马
- 排序：最多点赞/最多收藏/最多使用
- 导入计划弹窗（输入分享码）
- 公开计划列表

**筛选栏：**

```typescript
const DISTANCE_OPTIONS = [
  { value: "", label: "全部距离" },
  { value: "5k", label: "5K" },
  { value: "10k", label: "10K" },
  { value: "half", label: "半马" },
  { value: "full", label: "全马" },
];

const SORT_OPTIONS = [
  { value: "likes", label: "最多点赞" },
  { value: "favorites", label: "最多收藏" },
  { value: "usageCount", label: "最多使用" },
];
```

### 2.5 Ruff Mini 适配建议

Ruff Mini 的"计划"Tab 可以简化设计：

**移动端计划卡片（垂直布局）：**

```
┌─────────────────────────────────────┐
│  ┌────┐                            │
│  │ 5K │  我的5K训练计划             │
│  └────┘  VDOT 45.2 · 12周         │
│                                     │
│  [本周一开始]  [查看详情]            │
└─────────────────────────────────────┘
```

**周日历视图（可直接复用 CalendarHeatmap）：**

```
     4月 2026
  一  二  三  四  五  六  日
  ─────────────────────────
     1  2   3   4   5   6
  7   8   9  10  11  12  13
  ...
```

**复用策略：**
- `CalendarHeatmap` → 直接移植，用于显示周训练日历
- `PlanCard` → 简化后用于 Ruff Mini 计划列表
- 广场功能 → Ruff Mini 可简化或移除（MVP 阶段）

---

## 3. 共享设计模式

### 3.1 数据获取模式

```typescript
// TanStack Query hooks
const { data, isLoading, error, refetch } = useMyPlans();

// 状态处理
if (isLoading) return <Skeleton />;
if (error) return <ErrorState onRetry={refetch} />;
if (plans.length === 0) return <EmptyState onCreate={...} />;
```

### 3.2 空状态模式

```typescript
<EmptyState
  icon="📅"
  title="还没有训练计划"
  description="创建第一个训练计划开始你的跑步之旅"
  action={{
    label: "创建计划",
    onPress: () => {},
  }}
/>
```

### 3.3 操作反馈模式

```typescript
// 危险操作二次确认
if (!confirm("确定要删除这个计划吗？")) return;

// Toast 反馈
toast.show({ label: "计划删除成功", variant: "success" });

// 加载状态禁用按钮
<button disabled={isPending}>删除中...</button>
```

---

## 4. 组件复用优先级

| 优先级 | 组件 | 复用方式 |
|--------|------|----------|
| P0 | CalendarHeatmap | 直接移植到 Ruff Mini 计划 Tab |
| P0 | DayCheckInOverview | 简化（移除diet）移植到打卡 Tab |
| P1 | PlanCard | 简化后用于计划列表 |
| P1 | ModuleCard | 直接复用或简化后用于打卡模块 |
| P2 | 计划广场整套 | MVP 可暂不需要 |

---

## 5. 移植检查清单

### CalendarHeatmap 移植
- [ ] 保留周视图逻辑（可扩展为月视图）
- [ ] 适配深色模式颜色
- [ ] 替换 `withUniwind` 为标准 React Native 组件
- [ ] 调整格子高度和间距

### DayCheckInOverview 移植
- [ ] 移除 diet 模块
- [ ] 调整布局为 2+1 模式（训练+睡眠并排，体重单独）
- [ ] 适配深色模式

### PlanCard 移植
- [ ] 调整为移动端垂直布局
- [ ] 简化操作按钮（只保留关键操作）
- [ ] 适配触摸交互

---

*文档版本：v1.0*
*最后更新：2026-04-22*
