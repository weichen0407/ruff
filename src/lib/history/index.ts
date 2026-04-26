/**
 * History Query Index
 *
 * @example
 * import { getMonthlyStats, getMonthlyCalendarView } from './history';
 *
 * // Get stats for April 2026
 * const stats = await getMonthlyStats(2026, 4);
 *
 * // Get calendar view for April 2026
 * const calendar = await getMonthlyCalendarView(2026, 4);
 */

// Types
export type {
  DailyRecord,
  MonthlyStats,
  MonthlyCalendarView,
  CalendarDateInfo,
} from './types';

// Operations
export {
  getRecordsByMonth,
  getMonthlyStats,
  getMonthlyCalendarView,
  getMonthName,
  getRecordsInRange,
} from './operations';
