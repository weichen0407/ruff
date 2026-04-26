/**
 * Calendar Engine Index
 *
 * @example
 * import { activatePlan, getScheduleForDate } from './calendar';
 *
 * // Activate a plan starting from next week
 * const entries = await activatePlan(planId, 'next_week');
 *
 * // Get today's schedule
 * const schedule = await getScheduleForDate('2026-04-24');
 */

// Types
export type {
  StartOption,
  CalendarEntry,
  CalendarEntryWithDetails,
  CalendarEntryStatus,
  ScheduleForDate,
  ScheduleForWeek,
} from './types';

// Date utilities
export {
  getThisWeekMonday,
  getNextWeekMonday,
  formatDateString,
  parseDateString,
  getWeekDates,
  getWeekStart,
  getWeekEnd,
  isSameDay,
  addDays,
  getDayIndex,
} from './dateUtils';

// Engine operations
export {
  activatePlan,
  getScheduleForDate,
  getScheduleForWeek,
  getCalendarEntryWithDetails,
  updateCalendarEntryStatus,
  getActivePlanIds,
  getCalendarEntriesForPlan,
  skipCalendarEntry,
  getUpcomingEntries,
} from './engine';
