// TypeScript types for database schema
import type {
  user,
  plan,
  weeklyPlan,
  dailyPlan,
  unit,
  userPlanCalendar,
  checkInRecord,
  checkInDailyOverview,
} from './index';

// User types
export type User = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;

// Plan types
export type Plan = typeof plan.$inferSelect;
export type InsertPlan = typeof plan.$inferInsert;

// WeeklyPlan types
export type WeeklyPlan = typeof weeklyPlan.$inferSelect;
export type InsertWeeklyPlan = typeof weeklyPlan.$inferInsert;

// DailyPlan types
export type DailyPlan = typeof dailyPlan.$inferSelect;
export type InsertDailyPlan = typeof dailyPlan.$inferInsert;

// Unit types
export type Unit = typeof unit.$inferSelect;
export type InsertUnit = typeof unit.$inferInsert;

// Calendar types
export type CalendarEntry = typeof userPlanCalendar.$inferSelect;
export type InsertCalendarEntry = typeof userPlanCalendar.$inferInsert;

// Check-in types
export type CheckInRecord = typeof checkInRecord.$inferSelect;
export type InsertCheckInRecord = typeof checkInRecord.$inferInsert;

// Daily overview types
export type CheckInDailyOverview = typeof checkInDailyOverview.$inferSelect;
export type InsertCheckInDailyOverview = typeof checkInDailyOverview.$inferInsert;

// Enums
export type TargetDistance = '5k' | '10k' | 'half' | 'full';
export type PaceZone = 'E' | 'M' | 'T' | 'I' | 'R';
export type UnitType = 'run' | 'rest' | 'other';
export type PaceMode = 'vdot' | 'custom';
export type StandardType = 'time' | 'distance';
export type CalendarStatus = 'pending' | 'completed' | 'skipped';
export type Feeling = 'easy' | 'moderate' | 'hard' | 'painful';
