# Ruff 实施计划

## 项目概述

Ruff 是一款极简健身追踪应用，采用本地优先存储策略，专为跑步爱好者设计。三个核心维度：训练、睡眠、体重。三个主 Tab：计划、打卡、历史。

---

## 阶段一：项目初始化

### 1.1 脚手架搭建

- [ ] 初始化 React Native 项目 (React Native 0.83 + Expo SDK 55)
- [ ] 配置 TypeScript
- [ ] 配置 Tailwind CSS v4 + Uniwind
- [ ] 配置 expo-sqlite + Drizzle ORM
- [ ] 配置 Zustand 状态管理
- [ ] 配置 TanStack Query
- [ ] 配置 lucide-react-native 图标库
- [ ] 配置 Lexend + Manrope 字体

### 1.2 项目目录结构

```
src/
├── app/                    # expo-router 页面
│   ├── (tabs)/
│   │   ├── _layout.tsx    # Tab 导航布局
│   │   ├── plan.tsx       # 计划 Tab
│   │   ├── checkin.tsx    # 打卡 Tab
│   │   └── history.tsx    # 历史 Tab
│   └── (modals)/
│       ├── add-training.tsx
│       ├── add-sleep.tsx
│       └── add-weight.tsx
├── components/            # UI 组件
│   ├── ui/               # Ruff 风格基础组件
│   ├── plan/             # 计划相关组件
│   ├── checkin/          # 打卡相关组件
│   └── history/           # 历史相关组件
├── db/                   # 数据库层
│   ├── schema/           # Drizzle Schema
│   ├── local/            # 本地数据库
│   └── migrations/       # 迁移文件
├── lib/                  # 工具库
│   ├── sync.ts          # 同步服务
│   ├── store.ts         # Zustand stores
│   └── api.ts           # API 客户端
├── hooks/                # 自定义 Hooks
└── types/               # TypeScript 类型
```

---

## 阶段二：数据库层

### 2.1 本地 SQLite Schema

- [ ] 创建 `training_plans` 表
- [ ] 创建 `training_schedules` 表
- [ ] 创建 `training_logs` 表
- [ ] 创建 `sleep_logs` 表
- [ ] 创建 `weight_logs` 表
- [ ] 创建 `sync_queue` 表
- [ ] 创建数据库索引

### 2.2 数据迁移系统

- [ ] 实现 `runMigrations` 函数
- [ ] 实现版本管理 (PRAGMA user_version)

---

## 阶段三：状态管理层

### 3.1 Zustand Stores

- [ ] `usePlanStore` - 训练计划状态
- [ ] `useCheckInStore` - 打卡状态
- [ ] `useSyncStore` - 同步状态

### 3.2 TanStack Query Hooks

- [ ] `useTrainingPlan` - 获取训练计划
- [ ] `useAddTrainingLog` - 添加训练记录
- [ ] `useSleepLogs` - 获取睡眠记录
- [ ] `useWeightLogs` - 获取体重记录
- [ ] `useSyncStatus` - 同步状态

---

## 阶段四：UI 组件库

### 4.1 基础 UI 组件

- [ ] RuffButton - 按钮组件
- [ ] RuffCard - 卡片组件
- [ ] RuffInput - 输入框组件
- [ ] EmptyState - 空状态组件
- [ ] LoadingSpinner - 加载组件

### 4.2 计划模块组件

- [ ] WeekCalendar - 周日历组件
- [ ] DayCell - 日期单元格
- [ ] TrainingDetail - 训练详情
- [ ] TrainingForm - 训练表单

### 4.3 打卡模块组件

- [ ] TodayCheckIn - 今日打卡卡片
- [ ] SleepCard - 睡眠卡片
- [ ] WeightCard - 体重卡片

### 4.4 历史模块组件

- [ ] LogList - 记录列表
- [ ] LogItem - 记录项
- [ ] FilterBar - 筛选栏

---

## 阶段五：页面实现

### 5.1 Tab 导航

- [ ] Tab Bar 布局
- [ ] 三个 Tab 图标和标签

### 5.2 计划 Tab (plan.tsx)

- [ ] 本周训练日历显示
- [ ] 周切换功能 (prev/next)
- [ ] 点击日期展开训练详情
- [ ] 长按标记完成/未完成
- [ ] 空状态引导创建计划

### 5.3 打卡 Tab (checkin.tsx)

- [ ] 今日打卡卡片 (睡眠 + 体重)
- [ ] 快速记录入口
- [ ] 打卡历史 (最近7条)
- [ ] 完成状态可视化

### 5.4 历史 Tab (history.tsx)

- [ ] 训练历史列表 (按月分组)
- [ ] 睡眠历史列表
- [ ] 体重历史列表
- [ ] 数据筛选 (时间范围、类型)

### 5.5 Modal 页面

- [ ] add-training.tsx - 添加训练记录
- [ ] add-sleep.tsx - 添加睡眠记录
- [ ] add-weight.tsx - 添加体重记录

---

## 阶段六：同步服务

### 6.1 同步核心

- [ ] 增量同步 payload 构建
- [ ] 离线队列管理 (sync_queue)
- [ ] Last-Write-Wins 冲突解决
- [ ] 同步状态追踪

### 6.2 同步触发

- [ ] App 冷启动同步
- [ ] App 从后台恢复同步
- [ ] 网络状态恢复同步
- [ ] 定时同步 (每 5 分钟)
- [ ] 用户手动触发同步

---

## 阶段七：后端 API (Hono.js)

### 7.1 认证

- [ ] POST /api/auth/login
- [ ] POST /api/auth/register
- [ ] JWT Token 验证中间件

### 7.2 计划 API

- [ ] GET /api/plans - 获取计划列表
- [ ] POST /api/plans - 创建计划
- [ ] GET /api/plans/:id - 获取计划详情
- [ ] DELETE /api/plans/:id - 删除计划
- [ ] POST /api/plans/:id/start - 开始执行计划

### 7.3 数据 API

- [ ] GET /api/training-logs
- [ ] POST /api/training-logs
- [ ] GET /api/sleep-logs
- [ ] POST /api/sleep-logs
- [ ] GET /api/weight-logs
- [ ] POST /api/weight-logs

### 7.4 同步 API

- [ ] POST /api/sync - 增量同步
- [ ] GET /api/sync/status - 同步状态

---

## 阶段八：设计系统适配

### 8.1 色彩系统

- [ ] Primary #FF6B00 (能量橙)
- [ ] 背景色 (浅色/深色)
- [ ] 语义色 (success/warning/error/info)
- [ ] 配速区间颜色 (E/M/T/I/R)

### 8.2 字体系统

- [ ] Lexend (标题)
- [ ] Manrope (正文)

### 8.3 间距与圆角

- [ ] 4px 网格系统
- [ ] 按钮 16px 圆角
- [ ] 卡片 28px 圆角
- [ ] 输入框 12px 圆角

---

## 阶段九：可复用组件移植

### 9.1 从 Ruff 移植

- [ ] CalendarHeatmap → 简化为周视图用于计划 Tab
- [ ] DayCheckInOverview → 简化 (移除 diet) 用于打卡 Tab
- [ ] PlanCard → 简化用于计划列表

### 9.2 移植检查

- [ ] 适配深色模式
- [ ] 调整移动端布局
- [ ] 替换 Web 组件为 React Native 组件

---

## 实施顺序

1. **阶段一** - 项目初始化 (1天)
2. **阶段二** - 数据库层 (1天)
3. **阶段三** - 状态管理层 (1天)
4. **阶段四** - UI 组件库 (2天)
5. **阶段五** - 页面实现 (2天)
6. **阶段六** - 同步服务 (2天)
7. **阶段七** - 后端 API (2天)
8. **阶段八** - 设计系统适配 (1天)
9. **阶段九** - 可复用组件移植 (1天)

**预计总工期：13 天**

---

## MVP 功能清单

### P0 (必须实现)

- [ ] 三个 Tab 导航
- [ ] 训练计划创建 (单周)
- [ ] 训练记录添加 (跑步)
- [ ] 睡眠时间记录
- [ ] 体重记录
- [ ] 本地 SQLite 存储
- [ ] 数据同步到云端
- [ ] 基础日历视图
- [ ] 打卡状态展示

### P1 (下一步迭代)

- [ ] 训练统计图表
- [ ] 睡眠/体重趋势图
- [ ] 训练模板选择
- [ ] 数据导出 CSV
- [ ] 推送提醒

### P2 (未来规划)

- [ ] 多周训练计划
- [ ] 目标设置与追踪
- [ ] 数据分析与建议
- [ ] 社交分享功能

---

*计划创建日期：2026-04-22*
