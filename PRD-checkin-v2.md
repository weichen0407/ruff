# Check-in System PRD — Training / Sleep / Weight

## Problem Statement

用户需要一个完整的每日打卡系统，覆盖训练、睡眠、体重三个维度。目前已有训练打卡的基础设施（数据库表、API、组件），但缺少睡眠和体重记录功能。用户希望通过三角入口快速记录各维度数据，并在下方聚合展示区查看历史打卡内容。

## Solution

扩展打卡系统，增加体重记录和睡眠记录两个维度：
1. **训练打卡** — 复用现有 `checkInRecord` 表，增加数据入口和展示
2. **体重记录** — 新建 `weightRecord` 表和独立操作函数
3. **睡眠记录** — 新建 `sleepRecord` 表和独立操作函数
4. **三角** — 三个区域（训练/睡眠/体重）各自点亮，有记录时高亮
5. **底部展示区** — 改为三 Tab（训练/睡眠/体重），分别展示对应维度的打卡卡片

## User Stories

### 通用
1. 作为用户，点击三角的任意区域后能快速进入对应的打卡确认页
2. 作为用户，有任意维度的打卡记录后，对应的三角区域自动点亮
3. 作为用户，能在底部聚合区看到今日所有维度的打卡记录
4. 作为用户，切换 Tab 时能查看对应维度的历史打卡列表

### 训练打卡
5. 作为用户，点击"训练"三角区域，如果有今日计划则直接打开确认页，如果没有则打开创建训练单元页
6. 作为用户，在训练确认页可选择照片、填写感受和评论后提交
7. 作为用户，提交后在"训练"Tab 下看到今日训练打卡卡片（时间、内容摘要、照片、感受标签）
8. 作为用户，训练打卡后三角的"训练"区域自动点亮

### 体重记录
9. 作为用户，点击三角的"体重"区域后弹出体重确认页
10. 作为用户，在体重确认页输入体重数值（单位：kg，精确到 0.1）、选择/拍摄照片、提交
11. 作为用户，提交后记录打卡时间（前端显示为当前时刻），体重数据存入 `weightRecord` 表
12. 作为用户，在"体重"Tab 下看到今日体重打卡记录（时间、体重数值、照片缩略图）
13. 作为用户，体重打卡后三角的"体重"区域自动点亮
14. 作为用户，可以查看体重打卡历史记录（按日期倒序）
15. 作为用户，体重数值支持手动修改

### 睡眠记录
16. 作为用户，点击三角的"睡眠"区域后弹出睡眠确认页
17. 作为用户，在睡眠确认页输入起床时间和入睡时间（时间选择器）、选择/拍摄照片、提交
18. 作为用户，提交后睡眠记录关联到前一天的日期（例如 5 月 2 日打卡显示 5 月 1 日晚上的记录）
19. 作为用户，在"睡眠"Tab 下看到前一天（昨日）的睡眠打卡记录
20. 作为用户，提交后在"睡眠"Tab 下看到睡眠打卡卡片（关联日期、睡眠时段、照片、时长计算）
21. 作为用户，睡眠打卡后三角的"睡眠"区域自动点亮
22. 作为用户，可以查看睡眠打卡历史记录（按日期倒序）

### 三角组件
23. 作为用户，三角的"训练"区域点亮条件：有训练打卡记录
24. 作为用户，三角的"睡眠"区域点亮条件：有睡眠打卡记录
25. 作为用户，三角的"体重"区域点亮条件：有体重打卡记录
26. 作为用户，点击任意三角区域均能进入对应的打卡确认页

## Implementation Decisions

### 1. 数据库 Schema 变更

**新增 `weightRecord` 表：**
```sql
CREATE TABLE weight_record (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,          -- YYYY-MM-DD 打卡日期
  weight REAL NOT NULL,        -- 体重 kg，精确到 0.1
  photos TEXT,                 -- JSON array of file paths
  created_at TEXT NOT NULL,    -- 打卡时刻
  synced_at TEXT
);
```

**新增 `sleepRecord` 表：**
```sql
CREATE TABLE sleep_record (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,          -- YYYY-MM-DD 关联日期（打卡前一天）
  wake_time TEXT NOT NULL,      -- HH:MM 起床时间
  sleep_time TEXT NOT NULL,     -- HH:MM 入睡时间
  duration INTEGER,             -- 计算得出：睡眠时长（分钟）
  photos TEXT,                 -- JSON array of file paths
  comment TEXT,                 -- 用户心得（可选）
  created_at TEXT NOT NULL,    -- 实际打卡时刻
  synced_at TEXT
);
```

**修改 `checkInDailyOverview` 表：**
- 新增 `hasWeightRecord` 布尔字段
- 新增 `hasSleepRecord` 布尔字段
- 或保持现状，通过各自独立查询判断是否有点亮

### 2. API 函数（operations）

**Weight 模块** (`src/lib/weight/operations.ts`)：
- `createWeightRecord(input)` — 插入体重记录，返回 `WeightRecord`
- `getWeightRecordForDate(date)` — 获取指定日期体重记录
- `updateWeightRecord(id, weight)` — 修改体重数值

**Sleep 模块** (`src/lib/sleep/operations.ts`)：
- `createSleepRecord(input)` — 插入睡眠记录，自动计算 duration，返回 `SleepRecord`
- `getSleepRecordForDate(date)` — 获取指定日期（关联日期）的睡眠记录
- `getSleepRecordsRange(startDate, endDate)` — 获取日期范围内的睡眠记录

**CheckIn 模块** (`src/lib/checkin/operations.ts`）变更：
- `getCheckInsForDate` 已在返回 `CheckInWithDetails`，继续复用

### 3. 数据入口组件

**`WeightConfirmSheet`**（新组件）：
- Props: `visible`, `date`, `onClose`, `onConfirmed`
- 布局：体重数值输入（数字键盘，支持小数点）、照片上传（复用 ImagePicker）、提交按钮
- 调用 `createWeightRecord`

**`SleepConfirmSheet`**（新组件）：
- Props: `visible`, `date`, `onClose`, `onConfirmed`
- 布局：入睡时间选择器、起床时间选择器、照片上传、评论输入、提交按钮
- 自动计算睡眠时长：`|wakeTime - sleepTime|`，跨天情况（如 23:00 - 07:00）需要特殊处理
- 调用 `createSleepRecord`，`date` 字段传入前一天的日期

### 4. 三角组件更新

**`CheckInTriangle`** Props 变更：
- 新增 `hasWeightRecord: boolean`
- 新增 `hasSleepRecord: boolean`
- `active` prop 移除或保留用于训练
- `isLit(index)` 逻辑：
  - index 0（训练）: `active` 或 `filledSegments.includes(0)`
  - index 1（睡眠）: `hasSleepRecord` → 底部点亮
  - index 2（体重）: `hasWeightRecord` → 右侧点亮

**`track.tsx`** 更新：
- 加载今日体重记录和睡眠记录状态
- 传递给 `CheckInTriangle`
- 点击各区域分别打开对应 ConfirmSheet

### 5. 底部打卡展示区 — 三 Tab 布局

**新增 `CheckInTabView` 组件**：
- 三个 Tab：训练 / 睡眠 / 体重
- 每个 Tab 下渲染对应维度的打卡卡片列表
- 训练 Tab：复用 `TodayCheckInCard`
- 睡眠 Tab：新增 `SleepRecordCard`
- 体重 Tab：新增 `WeightRecordCard`

**`SleepRecordCard`** 布局：
```
HH:MM  │  入睡 22:30 → 起床 07:00
       │  共 8.5 小时
       │  [照片缩略图]
       │  评论...
```

**`WeightRecordCard`** 布局：
```
HH:MM  │  体重 65.3 kg
       │  [照片缩略图]
```

### 6. TrackScreen 数据加载更新

`track.tsx` 需要加载：
- `todayPlan`（现有）
- `todayCheckIns`（现有，训练）
- `todayWeightRecord`（新增）
- `todaySleepRecord`（新增，昨日关联日期）

### 7. 入睡/起床时间跨天计算

睡眠时长计算规则：
- 如果 `wake_time` > `sleep_time`：同一天内睡眠（例 23:00-07:00 跨天）
- 计算方式：`(24 - sleepHour + wakeHour) * 60 + wakeMinute - sleepMinute`
- `date` 字段存储：打卡当日日期减去 1 天（关联到前一天的晚上）

## Testing Decisions

- 测试各维度打卡记录的增删改查（外部行为）
- 测试三角点亮的边界条件（有点亮/无记录）
- 测试睡眠时长跨天计算正确性
- 测试睡眠记录日期关联（前一天）
- 测试照片上传和展示
- 测试 Tab 切换状态保持

## Out of Scope

- 云端同步（`syncedAt` 字段预置，暂不实现同步逻辑）
- 体重/睡眠数据的推送通知
- 体重/睡眠历史趋势图表
- 训练、睡眠、体重之间的数据关联分析
- 打卡后编辑/删除（训练已注明暂不实现，体重和睡眠同样）
- 社交分享

## Further Notes

- 三维度共用 `CheckInDailyOverview` 或独立存储，由 `hasCheckIn` / `hasWeightRecord` / `hasSleepRecord` 三布尔字段共同决定三角是否点亮
- 体重单位固定为 kg，前端保留一位小数
- 睡眠和训练的日期逻辑不同：训练打卡日期 = 当天；睡眠打卡日期 = 前一天晚上
- 照片后续接图床时只需在各 ConfirmSheet 的 `handleConfirm` 中，将本地 URI 替换为上传后的图床 URL 即可
