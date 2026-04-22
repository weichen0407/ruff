# Ruff Mini — 产品需求文档

## 1. 产品概述

### 1.1 产品定位

Ruff Mini 是一款极简健身追踪应用，专为跑步爱好者设计。与 Ruff（完整版）不同，Ruff Mini 专注于最核心的三个数据维度，采用本地优先存储策略，确保数据隐私和快速响应。

### 1.2 核心价值主张

- **极简**：只保留最必要的功能，去除所有非核心模块
- **快速**：本地优先，毫秒级响应，无网络延迟
- **私密**：数据存储在本地，云端仅备份缩略图

### 1.3 目标用户

- 跑步初学者到中级跑者
- 偏好简洁界面的用户
- 注重数据隐私的用户

---

## 2. 功能需求

### 2.1 三个核心维度

#### 维度一：训练（训练计划与执行）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 训练计划创建 | 创建单周训练计划（7天） | P0 |
| 训练记录 | 记录跑步数据（距离、配速、时长） | P0 |
| 日历视图 | 按周查看训练安排 | P0 |
| 训练统计 | 周/月训练量汇总 | P1 |
| 间歇跑模板 | 预设阈值跑/间歇跑模板 | P1 |

#### 维度二：睡眠（每日打卡）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 睡眠时间记录 | 记录睡眠时长 | P0 |
| 睡眠质量评分 | 1-5分主观评分 | P1 |
| 睡眠趋势 | 周视图睡眠曲线 | P1 |

#### 维度三：体重（每日打卡）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 体重记录 | 记录当前体重 | P0 |
| 体重趋势 | 折线图展示变化趋势 | P0 |
| 目标设置 | 设置目标体重 | P2 |

### 2.2 三个主 Tab

#### Tab 1：计划

- 本周训练日历（可切换查看其他周）
- 每天的训练内容（训练类型、配速区间、预计时长）
- 点击日期展开训练详情
- 长按训练日标记完成/未完成
- 无网络时显示本地缓存数据

#### Tab 2：打卡

- 今日打卡卡片（睡眠 + 体重）
- 快速记录入口
- 打卡历史（最近7条）
- 完成状态可视化（✓ 已完成 / ○ 未打卡）

#### Tab 3：历史

- 训练历史列表（按月分组）
- 睡眠历史列表
- 体重历史列表
- 数据筛选（时间范围、类型）
- 导出功能（CSV格式）

### 2.3 用户交互流程

```
首次打开 → 简洁引导（3步）
    ↓
主界面（计划Tab）
    ↓
点击日期 → 查看训练详情 → 标记完成
    ↓
切换打卡Tab → 记录睡眠/体重
    ↓
切换历史Tab → 查看所有记录
```

### 2.4 离线优先策略

| 数据类型 | 存储位置 | 同步策略 |
|----------|----------|----------|
| 训练计划 | 本地 SQLite | 有网络时同步到云端 |
| 训练记录 | 本地 SQLite | 实时同步到云端 |
| 睡眠数据 | 本地 SQLite | 有网络时同步到云端 |
| 体重数据 | 本地 SQLite | 实时同步到云端 |
| 用户设置 | 本地 + 云端 | 实时同步 |
| 图片（缩略图） | 本地 | 仅缩略图备份到云端 |

---

## 3. 技术需求

### 3.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 移动端框架 | React Native 0.83 + Expo 55 | 跨平台 iOS/Android |
| 路由 | expo-router | 文件路由 |
| 样式 | Tailwind CSS v4 + Uniwind | 与 Ruff 一致 |
| UI 组件 | HeroUI Native | 成熟组件库 |
| 本地存储 | expo-sqlite + Drizzle ORM | SQLite 本地数据库 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 数据获取 | TanStack Query | 缓存与同步 |
| 后端 | Hono.js + Bun | 与 Ruff 共用 |
| 数据库 | PostgreSQL (Neon) + Drizzle ORM | 云端数据库 |

### 3.2 数据模型

#### 本地数据库 Schema

```typescript
// 训练计划表
interface TrainingPlan {
  id: string;              // UUID
  name: string;            // 计划名称
  targetDistance: '5k' | '10k' | 'half' | 'full';
  weeks: number;           // 训练周数
  startDate: string;       // YYYY-MM-DD
  createdAt: string;       // ISO 时间戳
  isLocal: boolean;        // 是否本地创建
  cloudId?: string;        // 云端 ID（同步后）
}

// 训练日程表
interface TrainingSchedule {
  id: string;
  planId: string;          // 外键到 TrainingPlan
  weekNumber: number;      // 1, 2, 3...
  dayOfWeek: number;       // 1=周一, 7=周日
  templateId?: string;      // 可选的模板ID
  trainingType: 'run' | 'strength' | 'rest';
  targetDuration?: number;  // 目标时长（分钟）
  targetDistance?: number;  // 目标距离（公里）
  paceZone?: 'E' | 'M' | 'T' | 'I' | 'R';
  isCompleted: boolean;
  completedAt?: string;    // ISO 时间戳
}

// 训练记录表
interface TrainingLog {
  id: string;
  scheduleId?: string;      // 可选的关联日程
  date: string;            // YYYY-MM-DD
  type: 'run' | 'strength' | 'rest';
  distance?: number;        // 公里
  duration?: number;        // 分钟
  pace?: number;           // 秒/公里
  calories?: number;
  notes?: string;
  createdAt: string;
  isSynced: boolean;
}

// 睡眠记录表
interface SleepLog {
  id: string;
  date: string;            // YYYY-MM-DD
  duration: number;         // 分钟
  quality: number;         // 1-5 分
  createdAt: string;
  isSynced: boolean;
}

// 体重记录表
interface WeightLog {
  id: string;
  date: string;            // YYYY-MM-DD
  weight: number;          // 公斤
  createdAt: string;
  isSynced: boolean;
}

// 同步状态表
interface SyncStatus {
  tableName: string;
  lastSyncedAt: string;
  pendingCount: number;
}
```

#### 云端数据库 Schema

云端 schema 与本地基本一致，增加：

- `userId`: 用户 ID（所有表的关联字段）
- `createdAt`: 创建时间
- `updatedAt`: 更新时间
- `isDeleted`: 软删除标记

### 3.3 API 设计

#### 移动端 → 云端同步

```
POST /api/sync
Request: {
  tables: {
    training_logs: [...],
    sleep_logs: [...],
    weight_logs: [...]
  },
  lastSyncedAt: "2024-01-01T00:00:00Z"
}
Response: {
  updated: {
    training_logs: [...],
    sleep_logs: [...]
  },
  deleted: [...]
}
```

#### 计划相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/plans | 获取用户训练计划列表 |
| POST | /api/plans | 创建训练计划 |
| GET | /api/plans/:id | 获取计划详情 |
| DELETE | /api/plans/:id | 删除计划 |
| POST | /api/plans/:id/start | 开始执行计划 |

#### 数据同步

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/sync | 增量同步数据 |
| GET | /api/sync/status | 获取同步状态 |

### 3.4 本地存储策略

```
┌─────────────────────────────────────┐
│           React Native App          │
├─────────────────────────────────────┤
│  SQLite (expo-sqlite)               │
│  ├── training_plans               │
│  ├── training_schedules            │
│  ├── training_logs                 │
│  ├── sleep_logs                    │
│  ├── weight_logs                   │
│  └── sync_queue                    │
├─────────────────────────────────────┤
│  Drizzle ORM (本地查询)             │
├─────────────────────────────────────┤
│  Zustand (UI 状态)                 │
│  ├── usePlanStore                  │
│  ├── useCheckInStore               │
│  └── useSyncStore                  │
└─────────────────────────────────────┘
              ↓ 网络
┌─────────────────────────────────────┐
│         Hono.js Backend             │
├─────────────────────────────────────┤
│  PostgreSQL (Neon)                  │
│  ├── users                         │
│  ├── plans                         │
│  ├── training_logs                 │
│  ├── sleep_logs                    │
│  └── weight_logs                   │
└─────────────────────────────────────┘
```

### 3.5 同步冲突解决

采用 **Last-Write-Wins** 策略：

1. 每次写入本地时记录 `updatedAt`
2. 同步时比较本地与云端的 `updatedAt`
3. 以较新的记录为准
4. 冲突时保留本地最新数据

---

## 4. UI/UX 需求

### 4.1 设计原则

1. **简洁优先**：每个页面只展示最必要的信息
2. **操作便捷**：核心操作一步完成
3. **反馈明确**：每个操作都有明确的状态反馈
4. **离线可用**：无网络时核心功能不受影响

### 4.2 视觉规范

与 Ruff 主应用保持一致的设计语言：

| 元素 | 规范 |
|------|------|
| 主色 | #FF6B00 (能量橙) |
| 背景色 | #FFFBFF (浅色) / #121212 (深色) |
| 卡片圆角 | 28px |
| 按钮圆角 | 16px |
| 字体 | Lexend (标题) / Manrope (正文) |
| 图标 | Lucide React Native |
| 间距基准 | 4px |

### 4.3 组件库

使用 HeroUI Native 成熟组件：

| 组件 | 用途 |
|------|------|
| BottomSheet | 底部弹出层 |
| Card | 内容卡片 |
| Button | 按钮 |
| Input | 输入框 |
| Calendar | 日历选择 |
| Progress | 进度展示 |
| Avatar | 用户头像 |
| Badge | 标签/徽章 |

### 4.4 页面结构

```
├── _layout.tsx              # 根布局 + 主题Provider
├── index.tsx                # 重定向到 /plan
├── (tabs)/
│   ├── _layout.tsx          # Tab 导航布局
│   ├── plan.tsx             # 计划 Tab
│   ├── checkin.tsx          # 打卡 Tab
│   └── history.tsx           # 历史 Tab
├── (modals)/
│   ├── add-training.tsx      # 添加训练
│   ├── add-sleep.tsx         # 添加睡眠
│   └── add-weight.tsx        # 添加体重
└── settings.tsx              # 设置页
```

---

## 5. 非功能需求

### 5.1 性能要求

| 指标 | 目标 |
|------|------|
| 冷启动时间 | < 2秒 |
| 页面切换 | < 100ms |
| 本地查询 | < 50ms |
| 离线可用性 | 核心功能 100% |

### 5.2 安全要求

- 用户数据加密存储（AES-256）
- 敏感操作需要身份验证
- 云端传输使用 HTTPS
- 不存储用户密码（使用第三方认证）

### 5.3 兼容性要求

- iOS 14.0+
- Android 8.0+ (API 26)
- 支持深色模式

---

## 6. MVP 范围

### 6.1 必须实现 (P0)

- [ ] 三个 Tab 导航
- [ ] 训练计划创建（单周）
- [ ] 训练记录添加（跑步）
- [ ] 睡眠时间记录
- [ ] 体重记录
- [ ] 本地 SQLite 存储
- [ ] 数据同步到云端
- [ ] 基础日历视图
- [ ] 打卡状态展示

### 6.2 下一步迭代 (P1)

- [ ] 训练统计图表
- [ ] 睡眠/体重趋势图
- [ ] 训练模板选择
- [ ] 数据导出 CSV
- [ ] 推送提醒

### 6.3 未来规划 (P2)

- [ ] 多周训练计划
- [ ] 目标设置与追踪
- [ ] 数据分析与建议
- [ ] 社交分享功能

---

## 7. 用户故事

### 7.1 核心用户故事

1. 作为跑者，我希望能创建单周训练计划，以便规划我的训练
2. 作为跑者，我希望能快速记录每次跑步数据，以便追踪训练效果
3. 作为用户，我希望能记录每天的睡眠情况，以便了解睡眠与运动表现的关系
4. 作为用户，我希望能记录体重变化，以便追踪健康状况
5. 作为用户，我希望数据能自动同步到云端，以便在多设备间访问
6. 作为用户，我希望即使没有网络也能记录数据，以便随时使用

### 7.2 详细用户故事

#### 训练相关

- 作为跑者，我希望能查看本周的训练日历，以便了解每天的训练安排
- 作为跑者，我希望能标记训练完成，以便追踪完成情况
- 作为跑者，我希望能记录跑步的距离、配速和时长，以便全面了解训练情况
- 作为跑者，我希望能选择不同的训练类型（E/M/T/I/R跑），以便科学训练
- 作为跑者，我希望能查看训练历史，以便分析进步情况

#### 打卡相关

- 作为用户，我希望能一键记录今日睡眠，以便养成习惯
- 作为用户，我希望能快速记录体重，以便坚持追踪
- 作为用户，我希望能查看打卡连续天数，以便保持动力

#### 历史相关

- 作为用户，我希望能按月查看训练历史，以便回顾总结
- 作为用户，我希望能导出数据到 CSV，以便做进一步分析
- 作为用户，我希望能筛选不同类型的数据，以便查看特定记录

---

## 8. 风险与依赖

### 8.1 技术风险

| 风险 | 缓解措施 |
|------|----------|
| SQLite 性能瓶颈 | 合理索引，定期清理历史数据 |
| 同步冲突 | Last-Write-Wins + 用户确认 |
| 离线数据丢失 | 定期自动同步 + 本地备份 |

### 8.2 项目依赖

- Ruff 主应用的 API 设计
- Neon 数据库服务
- Expo 生态系统

---

## 9. 附录

### 9.1 术语表

| 术语 | 说明 |
|------|------|
| E/M/T/I/R 跑 | 丹尼尔斯训练法：Easy/Marathon/Threshold/Interval/Recovery |
| VDOT | 最大摄氧量指标，用于计算训练配速 |
| PACE | 配速（分钟/公里） |
| 打卡 | 每日完成健康记录的动作 |

### 9.2 参考文档

- [Ruff Design System](../design-system.md)
- [HeroUI Native 组件文档](https://heroui.com/docs/native)
- [Drizzle ORM 文档](https://orm.drizzle.team)
- [expo-sqlite 文档](https://docs.expo.dev/versions/latest/sdk/sqlite/)

---

*文档版本：v1.0*
*最后更新：2026-04-22*
