# Ruff — 产品需求文档 (v2.0)

> **优先级声明**：本 PRD 覆盖 Ruff 项目的全部核心功能，优先级高于 `prd/` 目录下所有 v1.0 文档。若存在冲突，以本文档为准。
>
> 旧版文档（`ruff-mini-prd.md`、`ruff-mini-architecture.md`、`ruff-mini-data-model.md`、`ruff-mini-ui-theme.md`、`ruff-mini-reusable-components.md`）中的设计思路可作为技术参考，但需求边界、模块定义、数据模型均以本文档为准。

---

## Problem Statement

跑步爱好者需要一款**极简、本地优先、专注训练全链路**的记录工具。现有应用要么过于复杂（包含社交、商城、直播等非核心功能），要么过于简单（只有单一的跑步记录，缺乏计划-执行-回顾的闭环）。

用户的核心痛点：
1. **计划与执行脱节**：制定了训练计划，但执行时无法快速关联到当天的计划内容，导致计划沦为摆设。
2. **记录繁琐**：每次训练后需要手动填写大量字段，缺乏基于计划的快速打卡能力。
3. **数据不透明**：历史记录分散，无法按日历维度回顾训练历程，难以分析进步趋势。
4. **配速计算复杂**：丹尼尔斯 VDOT 训练法的配速区间计算门槛高，普通跑者难以手动计算 E/M/T/I/R 各区间配速。

---

## Solution

Ruff 是一款围绕**「计划 → 打卡 → 历史」**核心链路设计的本地优先跑步追踪应用。产品采用三个主 Tab 对应三个核心动作：

- **计划**：创建、管理和使用训练计划。支持 VDOT 智能配速计算，将计划映射到真实日历。
- **打卡**：基于当日计划一键完成训练，或创建自定义训练。支持记录感受与照片。
- **历史**：以日历为核心视图，回顾每一天的训练记录，形成完整的训练档案。

产品坚持**本地优先**原则：所有数据首先写入本地 SQLite，确保无网络环境下完整可用。界面遵循极简设计哲学，核心操作一步完成。

---

## User Stories

### 计划模块

1. 作为跑步爱好者，我希望创建一个长期训练计划，以便系统化地准备比赛。
2. 作为跑步爱好者，我希望为计划设定目标距离（5K/10K/半马/全马）和目标完赛时间，以便应用自动计算我的 VDOT 和配速区间。
3. 作为跑步爱好者，我希望基于 VDOT 自动获得 E/M/T/I/R 五个配速区间的标准，以便科学安排训练强度。
4. 作为跑步爱好者，我希望在 VDOT 配速基础上进行微调（如 E+10秒、R-5秒），以便适配个人体感差异。
5. 作为跑步爱好者，我希望将计划拆解为周计划，并进一步拆解为每日训练单元，以便精细化安排训练内容。
6. 作为跑步爱好者，我希望每日训练单元包含多种类型（跑步、休息、其他），以便覆盖完整的训练周期。
7. 作为跑步爱好者，我希望为跑步单元设定配速标准（VDOT 区间或自定义）和度量标准（时间或距离），以便明确训练目标。
8. 作为跑步爱好者，我希望为休息日设定度量标准（时间或距离，如慢跑恢复），以便记录轻量活动。
9. 作为跑步爱好者，我希望使用已创建的计划，并选择从本周或下周开始执行，以便将计划与真实日期关联。
10. 作为跑步爱好者，我希望在计划执行期间查看未来几天的训练安排，以便提前做好准备。
11. 作为跑步爱好者，我希望暂停或切换正在使用的计划，以便应对伤病或生活变化。

### 打卡模块

12. 作为跑步爱好者，我希望在打卡时看到今日计划内容，以便按计划执行训练。
13. 作为跑步爱好者，我希望一键完成今日计划训练并记录实际数据，以便快速打卡。
14. 作为跑步爱好者，我希望在今日没有计划或计划不适合时，创建自定义训练内容，以便灵活应对。
15. 作为跑步爱好者，我希望记录实际跑步的距离、时长和配速，以便与计划目标对比。
16. 作为跑步爱好者，我希望在一天内进行多次打卡，以便记录多组训练（如早晨跑步、晚上力量训练）。
17. 作为跑步爱好者，我希望记录每次训练后的主观感受（如轻松/疲劳/痛苦），以便追踪身体状态。
18. 作为跑步爱好者，我希望为每次训练添加照片，以便留下训练记忆。
19. 作为跑步爱好者，我希望看到今日是否已完成打卡的状态指示，以便养成每日记录的习惯。
20. 作为跑步爱好者，我希望打卡时距离小于 1 公里自动显示为米（如 800m），以便符合跑步习惯。
21. 作为跑步爱好者，我希望时间按 hh:mm:ss 格式显示和输入，以便直观理解时长。

### 历史模块

22. 作为跑步爱好者，我希望以日历视图查看历史训练记录，以便纵览训练历程。
23. 作为跑步爱好者，我希望点击日历上的某一天查看当天的详细训练记录，以便回顾具体训练内容。
24. 作为跑步爱好者，我希望看到每个月的训练统计数据（总距离、总时长、训练次数），以便评估月度训练量。
25. 作为跑步爱好者，我希望区分已完成计划训练的日子和自定义训练的日子，以便分析计划执行率。
26. 作为跑步爱好者，我希望在日历上标记未打卡的空白日期，以便发现训练断档。

### 系统与体验

27. 作为跑步爱好者，我希望应用在无网络环境下完整可用，以便在户外、健身房等场景正常使用。
28. 作为跑步爱好者，我希望数据存储在本地确保隐私，以便放心记录个人健康数据。
29. 作为用户，我希望应用在冷启动时快速加载（<2秒），以便即时使用。
30. 作为用户，我希望界面简洁、核心操作一步完成，以便减少使用负担。
31. 作为跑步爱好者，我希望应用支持深色模式，以便在夜间或低光环境下舒适使用。
32. 作为跑步爱好者，我希望设置个人跑步目标（目标距离、目标时间）并保存到本地，以便应用据此计算 VDOT。

---

## Implementation Decisions

### 模块划分（深模块优先）

以下模块按照「深模块」原则设计——每个模块封装复杂功能，对外暴露简单、稳定的接口。

#### 1. VDOT Engine（VDOT 计算引擎）
- **职责**：根据目标距离和目标时间计算 VDOT 值；由 VDOT 推导 E/M/T/I/R 五个配速区间（秒/公里）；支持配速微调表达式解析（如 "E+10", "R-5"）。
- **接口**：`calculateVdot(distanceKm, timeSeconds) → vdot`; `getPaceZones(vdot) → PaceZones`; `adjustPace(basePace, expression) → adjustedPaceSeconds`.
- **测试重点**：核心计算逻辑必须有单元测试覆盖，因为这是整个配速体系的基石。

#### 2. Unit Model（训练单元模型）
- **职责**：定义训练的最小原子（Unit），支持三种类型：跑步（run）、休息（rest）、其他（other）。处理时间与距离的存储/显示转换（秒 ↔ hh:mm:ss，公里 ↔ 米）。处理配速的存储/显示转换（秒/公里 ↔ mm:ss）。
- **接口**：`createRunUnit(paceMode, paceValue, standardType, standardValue) → Unit`; `formatDuration(seconds) → "hh:mm:ss"`; `formatDistance(km) → "800m" | "5.0km"`; `formatPace(secondsPerKm) → "4:30"`.
- **测试重点**：格式化/解析函数是独立的纯函数，必须全覆盖测试。

#### 3. Plan Builder（计划构建器）
- **职责**：将 Unit 组合为 DailyPlan，DailyPlan 组合为 WeeklyPlan，WeeklyPlan 组合为 Plan。管理计划层级关系（desc 描述字段）。支持计划的增删改查。
- **接口**：`createPlan(targetDistance, targetTime, weeks, desc) → Plan`; `addDailyToWeekly(weeklyPlanId, dailyPlan, dayIndex) → void`; `getPlanHierarchy(planId) → PlanWithWeekliesAndDailies`.

#### 4. Calendar Engine（日历引擎）
- **职责**：将 Plan 映射到真实日期（user_plan_calendar）。处理「本周开始」或「下周开始」的日期计算。管理计划执行状态（进行中、已暂停、已完成）。提供指定日期范围的训练安排查询。
- **接口**：`activatePlan(planId, startOption: "this_week" | "next_week") → CalendarEntries[]`; `getScheduleForDate(date) → CalendarEntry | null`; `getScheduleForWeek(weekStartDate) → CalendarEntry[]`.

#### 5. Check-in Service（打卡服务）
- **职责**：处理训练打卡的完整生命周期。支持「按计划完成」（关联 calendar entry）和「自定义训练」（基于 dailyPlan 创建）。支持多次打卡。记录感受（feeling）、照片（photoUrls）。维护每日打卡状态布尔值。
- **接口**：`checkinFromPlan(calendarEntryId, actualData, feeling?, photos?) → CheckInRecord`; `checkinCustom(dailyPlanData, actualData, feeling?, photos?) → CheckInRecord`; `getTodayCheckInStatus() → boolean`; `getCheckInsForDate(date) → CheckInRecord[]`.

#### 6. History Query（历史查询服务）
- **职责**：按日期范围聚合训练记录。提供日历视图所需的数据（按月分组，标记有/无记录日期）。计算月度统计数据（总距离、总时长、次数）。
- **接口**：`getRecordsByMonth(year, month) → DailyRecord[]`; `getMonthlyStats(year, month) → { totalDistance, totalDuration, count }`; `getRecordsInRange(startDate, endDate) → DailyRecord[]`.

#### 7. Database Layer（数据库层）
- **职责**：本地 SQLite 的 Schema 定义、Drizzle ORM 封装、数据库迁移。对外暴露类型安全的 CRUD 操作。
- **核心表**：`user`（用户目标配置）、`plans`（长期计划）、`weekly_plans`（周计划）、`daily_plans`（日计划）、`units`（训练单元）、`user_plan_calendar`（计划-日期映射）、`check_in_records`（打卡记录）、`check_in_daily_overview`（每日打卡总览，含布尔状态）。

### 数据模型关键决策

- **时间统一存储为秒**：所有 duration 字段在数据库中存储为 INTEGER（秒），仅在界面层格式化为 hh:mm:ss。避免字符串解析的歧义。
- **距离统一存储为公里**：distance 字段在数据库中存储为 REAL（公里），界面层 <1km 显示为米（如 0.8 → "800m"）。
- **配速统一存储为秒/公里**：pace 字段在数据库中存储为 INTEGER（秒/公里），界面层格式化为 mm:ss。
- **VDOT 存储为 REAL**：支持小数精度（如 45.2）。
- **计划使用状态分离**：`plans` 表只存储计划模板，`user_plan_calendar` 表存储计划与真实日期的映射关系。一旦用户选择使用计划，后续逻辑全部基于 calendar 表。
- **每日打卡布尔状态**：`check_in_daily_overview` 表记录每一天是否有任何打卡记录，默认 false。该字段直接服务于前端「今日是否已打卡」的快速状态查询。

### 架构决策

- **本地优先，暂不实现云端同步**：当前版本所有数据存储在本地 SQLite。云端同步（Neon PostgreSQL + Hono.js backend）作为未来迭代项，在数据库层预留 `syncedAt`、`cloudId` 字段即可，不做实际同步逻辑。
- **状态管理分层**：
  - **Zustand**：管理 UI 状态（当前选中日期、当前周、Modal 开关等）。
  - **TanStack Query**：管理服务端状态（数据库查询的缓存、失效、重试）。
  - **Drizzle ORM**：直接的数据库操作，不经过额外抽象层。
- **路由结构**：保持现有三 Tab 结构（计划 / 打卡 / 历史），打卡页作为独立 Tab 而非 Modal，以强化「打卡」作为核心动作的心智模型。

### 技术栈

| 层级 | 选型 | 说明 |
|------|------|------|
| 移动端框架 | React Native 0.83 + Expo 55 | 跨平台 |
| 路由 | expo-router | 文件路由 |
| 样式 | NativeWind (Tailwind CSS v3) | 实用优先 |
| 本地存储 | expo-sqlite + Drizzle ORM | SQLite |
| 状态管理 | Zustand + TanStack Query | UI 状态 + 服务端状态 |
| 图标 | lucide-react-native | 统一图标库 |
| 字体 | Lexend (标题) + Manrope (正文) | 品牌一致性 |

### 界面设计原则

- **三 Tab 对应三动作**：计划（制定）→ 打卡（执行）→ 历史（回顾）。
- **卡片圆角 28px，按钮圆角 16px**，主色 #FF6B00（能量橙）。
- **配速区间颜色**：E(绿 #22C55E)、M(蓝 #3B82F6)、T(橙 #F97316)、I(红 #EF4444)、R(灰 #6B7280)。
- **空状态引导**：每个列表/日历在无数据时展示空状态插画 + 引导操作。
- **核心操作一步完成**：打卡流程不超过 3 次点击。

---

## Testing Decisions

### 什么是好的测试
- **只测外部行为，不测实现细节**。例如测试 `formatDuration(3661)` 返回 `"1:01:01"`，而不是测试函数内部是否调用了 `Math.floor`。
- **优先覆盖纯函数和核心计算逻辑**，这些测试稳定、快速、价值高。
- **UI 组件测试聚焦交互流程**，而非快照测试。

### 必须测试的模块

1. **VDOT Engine**：全部函数必须有单元测试。
   - `calculateVdot`：多种距离/时间组合的期望 VDOT 值。
   - `getPaceZones`：已知 VDOT 对应的五区间配速。
   - `adjustPace`：表达式解析（E+10, R-5, M+0 等）。

2. **Unit Model**：格式化/解析函数必须有单元测试。
   - `formatDuration`：边界值（0, 59, 60, 3600, 3661）。
   - `formatDistance`：0.8 → "800m"，1.0 → "1.0km"，12.5 → "12.5km"。
   - `formatPace`：270 → "4:30"，61 → "1:01"。
   - `parseDuration` / `parsePace`：与 format 互为逆运算。

3. **Calendar Engine**：日期计算逻辑必须有单元测试。
   - `activatePlan("this_week")`：正确映射到本周一。
   - `activatePlan("next_week")`：正确映射到下周一。
   - 跨月、跨年的周计算。

4. **Plan Builder**：CRUD 操作的集成测试（基于内存 SQLite）。

### 暂不测试的模块
- **UI 组件**：当前阶段以手动验证为主，核心交互稳定后再补充自动化测试。
- **History Query**：以 Drizzle ORM 查询为主，逻辑简单，依赖 ORM 自身测试。

---

## Out of Scope

以下功能**明确不在**当前版本范围内，但可在数据库层预留扩展字段：

1. **云端同步**：不上传数据到云端，无后端 API，无用户认证。本地 SQLite 是唯一直实数据源。
2. **睡眠记录**：ruff.md 中提及的睡眠模块作为未来迭代项。
3. **体重记录**：ruff.md 中提及的体重模块作为未来迭代项。
4. **社交分享**：无分享功能、无社区、无计划广场。
5. **数据导出（CSV）**：历史模块仅支持查看，不支持导出。
6. **推送提醒**：无本地/远程推送。
7. **多设备同步**：单设备使用。
8. **计划模板市场**：用户只能创建和使用自己的计划，不能浏览/下载他人计划。
9. **间歇跑计时器**：打卡时记录总时长/距离，不提供分段计时功能。
10. **GPS 轨迹记录**：不集成定位，手动输入距离和时长。

---

## Further Notes

### 与旧版 PRD 的关键差异

| 维度 | 旧版 PRD (v1.0) | 新版 PRD (v2.0) |
|------|----------------|----------------|
| 核心模块 | 训练 + 睡眠 + 体重 | 训练计划 + 打卡 + 历史（睡眠/体重延后） |
| 数据同步 | 云端同步为核心架构 | 本地优先，云端同步明确排除 |
| 计划模型 | 简单的 training_plan + schedule | 完整的 Unit → DailyPlan → WeeklyPlan → Plan 层级 |
| VDOT | 仅提及配速区间 | VDOT Engine 作为核心深模块，含计算与微调 |
| 打卡 | 单次记录 | 支持多次打卡 + 计划完成/自定义训练双路径 |
| 后端 | Hono.js + Neon PostgreSQL | 无后端，纯本地 |
| 体重/睡眠 | P0 必须实现 | 明确 Out of Scope |

### 实施顺序建议

1. **Database Layer** — Schema 设计 + Drizzle 配置 + 迁移系统
2. **VDOT Engine + Unit Model** — 纯函数模块，可独立开发与测试
3. **Plan Builder** — 计划的增删改查
4. **Calendar Engine** — 计划激活与日期映射
5. **Check-in Service** — 打卡逻辑
6. **History Query** — 日历视图数据查询
7. **UI 页面实现** — 三 Tab 页面 + 表单 Modal
8. **设计系统适配** — 颜色、字体、组件统一

### 数据库预留字段

以下表建议预留字段，为将来扩展做准备：
- `plans.cloud_id` (TEXT, nullable)
- `check_in_records.synced_at` (TEXT, nullable)
- `user.sleep_goal_bedtime`, `user.sleep_goal_wake_time` (TEXT, nullable)
- `user.weight_target` (REAL, nullable)

---

*文档版本：v2.0*
*最后更新：2026-04-24*
*优先级：高于 `prd/` 目录下所有 v1.0 文档*
