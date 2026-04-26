/**
 * Calendar Engine Types
 */

export type StartOption = 'this_week' | 'next_week';

export type CalendarEntryStatus = 'pending' | 'completed' | 'skipped';

export interface CalendarEntry {
  id: string;
  planId: string;
  date: string; // YYYY-MM-DD
  dailyPlanId: string;
  status: CalendarEntryStatus;
}

export interface CalendarEntryWithDetails extends CalendarEntry {
  planName: string;
  weekIndex: number;
  dayIndex: number;
  dailyPlanDesc: string | null;
  dailyPlanUnits: import('../plan/types').UnitInPlan[];
}

export interface ScheduleForDate {
  date: string;
  entries: CalendarEntryWithDetails[];
  hasCheckIn: boolean;
}

export interface ScheduleForWeek {
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string; // YYYY-MM-DD (Sunday)
  entries: CalendarEntryWithDetails[];
}
