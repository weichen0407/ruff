/**
 * Calendar Date Utilities
 */

/**
 * Get Monday of this week
 */
export function getThisWeekMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get Monday of next week
 */
export function getNextWeekMonday(date: Date = new Date()): Date {
  const thisMonday = getThisWeekMonday(date);
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  return nextMonday;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get all dates in a week (Monday to Sunday)
 */
export function getWeekDates(weekStartDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Get the week start date (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  return getThisWeekMonday(date);
}

/**
 * Get the week end date (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const monday = getThisWeekMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return sunday;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get day index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * Adjusts for Monday = 1 start
 */
export function getDayIndex(date: Date): number {
  let day = date.getDay();
  return day === 0 ? 7 : day; // Convert Sunday (0) to 7
}
