/**
 * History Query Types
 */

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  hasCheckIn: boolean;
  checkInCount: number;
  totalDistance: number | null; // km
  totalDuration: number | null; // seconds
  records: import('../checkin/types').CheckInWithDetails[];
}

export interface MonthlyStats {
  year: number;
  month: number; // 1-12
  totalDistance: number; // km
  totalDuration: number; // seconds
  trainingDays: number; // days with at least one check-in
  totalCheckIns: number; // total number of check-in records
}

export interface MonthlyCalendarView {
  year: number;
  month: number;
  dates: CalendarDateInfo[];
}

export interface CalendarDateInfo {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  isCurrentMonth: boolean;
  hasCheckIn: boolean;
  checkInCount: number;
  totalDistance: number | null;
  isToday: boolean;
}
