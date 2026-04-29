import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ============================================================================
// User Table
// ============================================================================

export const user = sqliteTable('user', {
  id: text('id').$type<'local'>().primaryKey().default('local'),
  // 跑步目标
  runningGoalDistance: text('running_goal_distance').$type<'5k' | '10k' | 'half' | 'full'>(),
  runningGoalTime: integer('running_goal_time'), // 秒
  vdot: real('vdot'),
  // 睡眠目标（第二阶段）
  sleepGoalBedtime: text('sleep_goal_bedtime'), // HH:mm
  sleepGoalWakeTime: text('sleep_goal_wake_time'), // HH:mm
  // 体重目标（第二阶段）
  weightGoal: real('weight_goal'), // 公斤
  // 元数据
  updatedAt: text('updated_at').notNull(),
});

// ============================================================================
// Plan Tables (Unit → DailyPlan → WeeklyPlan → Plan)
// ============================================================================

export const plan = sqliteTable('plan', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetDistance: text('target_distance').$type<'5k' | '10k' | 'half' | 'full'>().notNull(),
  targetTime: integer('target_time').notNull(), // 秒
  vdot: real('vdot').notNull(),
  paceE: integer('pace_e').notNull(), // 秒/公里
  paceM: integer('pace_m').notNull(),
  paceT: integer('pace_t').notNull(),
  paceI: integer('pace_i').notNull(),
  paceR: integer('pace_r').notNull(),
  weeks: integer('weeks').notNull(),
  desc: text('desc'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  // 预留扩展字段
  cloudId: text('cloud_id'),
});

export const weeklyPlan = sqliteTable('weekly_plan', {
  id: text('id').primaryKey(),
  planId: text('plan_id').references(() => plan.id).notNull(),
  weekIndex: integer('week_index').notNull(), // 1, 2, 3...
  desc: text('desc'),
});

export const dailyPlan = sqliteTable('daily_plan', {
  id: text('id').primaryKey(),
  weeklyPlanId: text('weekly_plan_id').references(() => weeklyPlan.id).notNull(),
  dayIndex: integer('day_index').notNull(), // 1-7
  desc: text('desc'),
});

export const unit = sqliteTable('unit', {
  id: text('id').primaryKey(),
  dailyPlanId: text('daily_plan_id').references(() => dailyPlan.id).notNull(),
  type: text('type').$type<'run' | 'rest' | 'other'>().notNull(),
  orderIndex: integer('order_index').notNull(), // 同一天内的顺序
  // 跑步类型字段
  paceMode: text('pace_mode').$type<'vdot' | 'custom'>(),
  paceValue: text('pace_value'), // vdot: 'E','M','T','I','R','E+10' 等; custom: '4:30'
  standardType: text('standard_type').$type<'time' | 'distance'>(),
  standardValue: integer('standard_value'), // 秒（时间）或 厘米（距离，如 800m 存 8000）
  // 休息类型字段
  standard: text('standard').$type<'time' | 'distance'>(),
  // 其他类型字段
  content: text('content'),
});

// ============================================================================
// Calendar & Check-in Tables
// ============================================================================

export const userPlanCalendar = sqliteTable('user_plan_calendar', {
  id: text('id').primaryKey(),
  planId: text('plan_id').references(() => plan.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  dailyPlanId: text('daily_plan_id').references(() => dailyPlan.id).notNull(),
  status: text('status').$type<'pending' | 'completed' | 'skipped'>().notNull().default('pending'),
});

export const checkInRecord = sqliteTable('check_in_record', {
  id: text('id').primaryKey(),
  calendarEntryId: text('calendar_entry_id').references(() => userPlanCalendar.id), // nullable
  date: text('date').notNull(), // YYYY-MM-DD
  type: text('type').$type<'run' | 'rest' | 'other'>().notNull(),
  distance: real('distance'), // 公里
  duration: integer('duration'), // 秒
  pace: integer('pace'), // 秒/公里
  feeling: text('feeling').$type<'easy' | 'moderate' | 'hard'>(),
  photos: text('photos'), // JSON array of file paths
  comment: text('comment'), // 用户心得评论
  createdAt: text('created_at').notNull(),
  // 预留扩展字段
  syncedAt: text('synced_at'),
});

export const checkInDailyOverview = sqliteTable('check_in_daily_overview', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  hasCheckIn: integer('has_check_in', { mode: 'boolean' }).notNull().default(false),
  hasWeightRecord: integer('has_weight_record', { mode: 'boolean' }).notNull().default(false),
  hasSleepRecord: integer('has_sleep_record', { mode: 'boolean' }).notNull().default(false),
});

export const weightRecord = sqliteTable('weight_record', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD 打卡日期
  weight: real('weight').notNull(), // kg，精确到 0.1
  photos: text('photos'), // JSON array of file paths
  comment: text('comment'), // 用户心得
  createdAt: text('created_at').notNull(),
  syncedAt: text('synced_at'),
});

export const sleepRecord = sqliteTable('sleep_record', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD 关联日期（打卡前一天）
  wakeTime: text('wake_time').notNull(), // HH:MM 起床时间
  sleepTime: text('sleep_time').notNull(), // HH:MM 入睡时间
  duration: integer('duration'), // 分钟，计算得出
  photos: text('photos'), // JSON array of file paths
  comment: text('comment'), // 用户心得
  createdAt: text('created_at').notNull(),
  syncedAt: text('synced_at'),
});

// ============================================================================
// Template Table
// ============================================================================

export const template = sqliteTable('template', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  dailyPlanId: text('daily_plan_id').references(() => dailyPlan.id).notNull(),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

// ============================================================================
// User Favorite Table (用户收藏的训练计划)
// ============================================================================

export const userFavorite = sqliteTable('user_favorite', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  units: text('units').notNull(), // JSON string of units array
  createdAt: text('created_at').notNull(),
});
