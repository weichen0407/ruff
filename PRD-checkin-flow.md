# Check-in Flow PRD

## Problem Statement

用户需要一个完整的每日训练打卡流程。当前问题：
- `CreatePlanSheet` 可以创建训练单元，但没有"确认并继续"步骤
- `rest` 类型单元缺少时间标准（只有简单的时间分钟输入）
- 没有上传照片、选择感受、保存 `checkInRecord` 到数据库的 UI
- `checkinFromPlan` / `checkinCustom` 函数存在但从未被 UI 调用

## Solution

重构 `CreatePlanSheet` 为多步骤流程，将打卡确认步骤提取为可复用的 `CheckInConfirmSheet` 组件。

## User Stories

1. 作为跑者，当选择 unit type = 休息时，下面只需要输入时间（分钟），不需要配速区间那些复杂字段
2. 作为跑者，我希望每个训练单元底部有**"确定"按钮**，填完后立即折叠成一行摘要
3. 作为跑者，我希望折叠的单元显示**对勾和摘要**（如 `跑步 E+10 5:30 3km` / `休息 30分钟`）
4. 作为跑者，我希望**点击折叠行重新展开**以便修改
5. 作为跑者，我希望所有单元确认后显示**"下一页"按钮**，进入打卡确认步骤
6. 作为跑者，我希望**上传照片**作为打卡记录
7. 作为跑者，我希望选择**感受**（轻松 / 适中 / 吃力 / 痛苦）
8. 作为跑者，我希望在确认页看到**计划单元摘要**
9. 作为跑者，我希望确认打卡后保存 `checkInRecord` 并将 `userPlanCalendar.status` 标记为 `completed`
10. 作为跑者，我希望跳过照片直接提交感受
11. 作为跑者，我希望点击今日计划卡片直接打开打卡确认页面
12. 作为跑者，我希望系统自动计算配速（配速 = 时间 / 距离）
13. 作为跑者，我希望 `checkInDailyOverview` 自动更新

## Implementation Decisions

### 1. create-plan-sheet.tsx 重构

**Rest 单元简化：**
- `rest` 类型：只有一个时间分钟输入框 `restMinutes`
- 不需要配速区间 / 数值 / 调整那些复杂字段
- 折叠后显示 `休息 {N}分钟`

**Run 单元保持不变：**
- 配速区间 + 调整 + 训练量（时间/距离）完整保留

**折叠流程：**
- "确定"按钮移至卡片底部
- 点击 → `isDone: true`，折叠为单行
- 点击折叠行 → `isDone: false`，重新展开
- 移除顶部 ○/✓ 切换按钮

**"下一页"按钮：**
- 所有单元 `isDone: true` 后显示
- 点击打开 `CheckInConfirmSheet`

### 2. CheckInConfirmSheet（新组件）

**Props：**
```typescript
interface CheckInConfirmSheetProps {
  calendarEntryId?: string;
  date: string;
  units: CheckInUnit[];
  onClose: () => void;
  onConfirm: (record: CheckInRecord) => void;
}
```

**布局：**
1. Header — "确认打卡"标题，关闭按钮
2. 计划摘要 — 只读单元列表
3. 实际数值 — 时长(分钟)输入、距离(公里)输入、自动配速(只读)
4. 照片区 — 添加照片按钮 + 缩略图网格
5. 感受区 — 4个胶囊：轻松/适中/吃力/痛苦
6. 确认按钮 — "确认打卡"

**行为：**
- 调用 `checkinFromPlan`（有 calendarEntryId）或 `checkinCustom`（无）
- 时长 → 秒（×60），距离 → 公里
- 配速自动计算：`duration_seconds / distance_km`
- 照片存为 `string[]`，感受存为枚举
- 成功 → `onConfirm(record)`，关闭 sheet，刷新 Track

### 3. track.tsx 更新

- 今日计划卡片点击 → 打开 `CheckInConfirmSheet`
- 移除 `CheckInTriangle`
- `handleToggleComplete` 替换为 `handleOpenCheckIn`

### 4. operations.ts — 无需修改

`checkinFromPlan` 和 `checkinCustom` 签名正确，无需更改。

### 5. Schema — 无需修改

现有表支持所有字段。

## Out of Scope

- 相机/相册图片选择器实现（使用 expo-image-picker）
- 推送通知
- 打卡记录云同步
- 打卡后编辑/删除
- 社交媒体分享
- 每天多次训练
