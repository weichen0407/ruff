/**
 * History Query Operations
 *
 * Provides calendar view data, monthly stats, and record aggregation
 */

import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../../db';
import { checkInRecord, checkInDailyOverview } from '../../db/schema';
import type { DailyRecord, MonthlyStats, MonthlyCalendarView, CalendarDateInfo } from './types';
import { getCheckInsForDate } from '../checkin/operations';
import { formatDateString } from '../calendar/dateUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Get records for a specific month
 */
export async function getRecordsByMonth(
  year: number,
  month: number
): Promise<DailyRecord[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  // Get all daily overviews for this month
  const overviews = await db.query.checkInDailyOverview.findMany({
    where: and(
      gte(checkInDailyOverview.date, startDate),
      lte(checkInDailyOverview.date, endDate)
    ),
    orderBy: checkInDailyOverview.date,
  });

  const records: DailyRecord[] = [];

  for (const overview of overviews) {
    const checkIns = await getCheckInsForDate(overview.date);

    // Calculate totals
    let totalDistance = 0;
    let totalDuration = 0;

    for (const checkIn of checkIns) {
      if (checkIn.distance) totalDistance += checkIn.distance;
      if (checkIn.duration) totalDuration += checkIn.duration;
    }

    records.push({
      date: overview.date,
      hasCheckIn: overview.hasCheckIn,
      checkInCount: checkIns.length,
      totalDistance: totalDistance > 0 ? totalDistance : null,
      totalDuration: totalDuration > 0 ? totalDuration : null,
      records: checkIns,
    });
  }

  return records;
}

/**
 * Get monthly statistics
 */
export async function getMonthlyStats(
  year: number,
  month: number
): Promise<MonthlyStats> {
  const records = await getRecordsByMonth(year, month);

  let totalDistance = 0;
  let totalDuration = 0;
  let trainingDays = 0;
  let totalCheckIns = 0;

  for (const record of records) {
    totalCheckIns += record.checkInCount;
    if (record.hasCheckIn) {
      trainingDays++;
      totalDistance += record.totalDistance ?? 0;
      totalDuration += record.totalDuration ?? 0;
    }
  }

  return {
    year,
    month,
    totalDistance,
    totalDuration,
    trainingDays,
    totalCheckIns,
  };
}

/**
 * Get calendar view for a month (for calendar UI)
 */
export async function getMonthlyCalendarView(
  year: number,
  month: number
): Promise<MonthlyCalendarView> {
  // Get first day of month and number of days
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();

  // Get day of week for first day (0 = Sunday, adjust for Monday start)
  let firstDayOfWeek = firstDay.getDay();
  firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek; // Monday = 1

  // Today's date for comparison
  const today = new Date();
  const todayStr = formatDateString(today);

  // Get overviews for this month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const overviews = await db.query.checkInDailyOverview.findMany({
    where: and(
      gte(checkInDailyOverview.date, startDate),
      lte(checkInDailyOverview.date, endDate)
    ),
  });

  // Create a map for quick lookup
  const overviewMap = new Map<string, typeof overviews[0]>();
  for (const overview of overviews) {
    overviewMap.set(overview.date, overview);
  }

  const dates: CalendarDateInfo[] = [];

  // Add days from previous month to fill the first week
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();

  for (let i = firstDayOfWeek - 1; i >= 1; i--) {
    const day = prevMonthLastDay - i + 1;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dates.push({
      date: dateStr,
      dayOfMonth: day,
      isCurrentMonth: false,
      hasCheckIn: false,
      checkInCount: 0,
      totalDistance: null,
      isToday: false,
    });
  }

  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const overview = overviewMap.get(dateStr);
    const isToday = dateStr === todayStr;

    // Get check-ins for this date to calculate distance
    let totalDistance: number | null = null;
    if (overview?.hasCheckIn) {
      const checkIns = await getCheckInsForDate(dateStr);
      let dist = 0;
      for (const checkIn of checkIns) {
        dist += checkIn.distance ?? 0;
      }
      totalDistance = dist > 0 ? dist : null;
    }

    dates.push({
      date: dateStr,
      dayOfMonth: day,
      isCurrentMonth: true,
      hasCheckIn: overview?.hasCheckIn ?? false,
      checkInCount: overview ? 1 : 0, // Simplified - would need actual count
      totalDistance,
      isToday,
    });
  }

  // Add days from next month to complete the last week
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const remainingDays = 7 - (dates.length % 7);
  if (remainingDays < 7) {
    for (let day = 1; day <= remainingDays; day++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dates.push({
        date: dateStr,
        dayOfMonth: day,
        isCurrentMonth: false,
        hasCheckIn: false,
        checkInCount: 0,
        totalDistance: null,
        isToday: false,
      });
    }
  }

  return {
    year,
    month,
    dates,
  };
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || '';
}

/**
 * Get records in a date range
 */
export async function getRecordsInRange(
  startDate: string,
  endDate: string
): Promise<DailyRecord[]> {
  const overviews = await db.query.checkInDailyOverview.findMany({
    where: and(
      gte(checkInDailyOverview.date, startDate),
      lte(checkInDailyOverview.date, endDate)
    ),
    orderBy: checkInDailyOverview.date,
  });

  const records: DailyRecord[] = [];

  for (const overview of overviews) {
    const checkIns = await getCheckInsForDate(overview.date);

    let totalDistance = 0;
    let totalDuration = 0;

    for (const checkIn of checkIns) {
      if (checkIn.distance) totalDistance += checkIn.distance;
      if (checkIn.duration) totalDuration += checkIn.duration;
    }

    records.push({
      date: overview.date,
      hasCheckIn: overview.hasCheckIn,
      checkInCount: checkIns.length,
      totalDistance: totalDistance > 0 ? totalDistance : null,
      totalDuration: totalDuration > 0 ? totalDuration : null,
      records: checkIns,
    });
  }

  return records;
}
