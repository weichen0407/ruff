/**
 * Calendar Engine
 *
 * Maps Plans to real calendar dates and manages plan execution status
 */

import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../../db';
import { userPlanCalendar, plan, weeklyPlan, dailyPlan } from '../../db/schema';
import { generateId, now } from '../../db/utils';
import type {
  CalendarEntry,
  CalendarEntryWithDetails,
  CalendarEntryStatus,
  ScheduleForDate,
  ScheduleForWeek,
  StartOption,
} from './types';
import {
  getThisWeekMonday,
  getNextWeekMonday,
  formatDateString,
  getWeekDates,
  addDays,
} from './dateUtils';
import { getUnits } from '../plan/operations';
import type { Plan, WeeklyPlan, DailyPlan } from '../plan/types';
import type { UnitInPlan } from '../plan/types';

/**
 * Activate a plan starting from this week or next week
 * Creates calendar entries for the entire plan duration
 */
export async function activatePlan(
  planId: string,
  startOption: StartOption
): Promise<CalendarEntry[]> {
  // Get the plan
  const planResult = await db.query.plan.findFirst({
    where: eq(plan.id, planId),
  });

  if (!planResult) {
    throw new Error(`Plan not found: ${planId}`);
  }

  const p = planResult as Plan;

  // Determine start date (Monday)
  const startDate = startOption === 'this_week'
    ? getThisWeekMonday()
    : getNextWeekMonday();

  // Get weekly plans for this plan
  const weeklyPlans = await db.query.weeklyPlan.findMany({
    where: eq(weeklyPlan.planId, planId),
    orderBy: weeklyPlan.weekIndex,
  });

  const entries: CalendarEntry[] = [];

  // Create calendar entries for each week
  for (let weekOffset = 0; weekOffset < p.weeks; weekOffset++) {
    const weekStartDate = addDays(startDate, weekOffset * 7);
    const weekDates = getWeekDates(weekStartDate);

    // Find the weekly plan for this week (weekIndex is 1-based)
    const weeklyPlanForWeek = weeklyPlans.find(wp => wp.weekIndex === weekOffset + 1);

    if (!weeklyPlanForWeek) continue;

    // Get daily plans for this weekly plan
    const dailyPlans = await db.query.dailyPlan.findMany({
      where: eq(dailyPlan.weeklyPlanId, weeklyPlanForWeek.id),
      orderBy: dailyPlan.dayIndex,
    });

    // Create entry for each day (dayIndex 1-7 = Mon-Sun)
    for (const dp of dailyPlans) {
      // dayIndex 1 = Monday, 7 = Sunday
      const dayIndex = dp.dayIndex;
      const entryDate = weekDates[dayIndex - 1];

      if (!entryDate) continue;

      const entry: CalendarEntry = {
        id: generateId(),
        planId,
        date: formatDateString(entryDate),
        dailyPlanId: dp.id,
        status: 'pending',
      };

      await db.insert(userPlanCalendar).values({
        id: entry.id,
        planId: entry.planId,
        date: entry.date,
        dailyPlanId: entry.dailyPlanId,
        status: 'pending',
      });

      entries.push(entry);
    }
  }

  return entries;
}

/**
 * Get schedule for a specific date
 */
export async function getScheduleForDate(
  date: string
): Promise<ScheduleForDate> {
  // Get all calendar entries for this date
  const entries = await db.query.userPlanCalendar.findMany({
    where: eq(userPlanCalendar.date, date),
  });

  // Enrich with details
  const entriesWithDetails: CalendarEntryWithDetails[] = [];

  for (const entry of entries) {
    const details = await getCalendarEntryWithDetails(entry);
    if (details) {
      entriesWithDetails.push(details);
    }
  }

  // Check if there's a check-in for this date
  const overview = await db.query.checkInDailyOverview.findFirst({
    where: eq((await import('../../db/schema')).checkInDailyOverview.date, date),
  });

  return {
    date,
    entries: entriesWithDetails,
    hasCheckIn: overview?.hasCheckIn ?? false,
  };
}

/**
 * Get schedule for a week (Monday to Sunday)
 */
export async function getScheduleForWeek(
  weekStartDate: string
): Promise<ScheduleForWeek> {
  const startDate = new Date(weekStartDate);
  const endDate = addDays(startDate, 6);

  const startStr = formatDateString(startDate);
  const endStr = formatDateString(endDate);

  const entries = await db.query.userPlanCalendar.findMany({
    where: and(
      gte(userPlanCalendar.date, startStr),
      lte(userPlanCalendar.date, endStr)
    ),
    orderBy: userPlanCalendar.date,
  });

  const entriesWithDetails: CalendarEntryWithDetails[] = [];

  for (const entry of entries) {
    const details = await getCalendarEntryWithDetails(entry);
    if (details) {
      entriesWithDetails.push(details);
    }
  }

  return {
    weekStartDate: startStr,
    weekEndDate: endStr,
    entries: entriesWithDetails,
  };
}

/**
 * Get a single calendar entry with full details
 */
export async function getCalendarEntryWithDetails(
  entry: typeof userPlanCalendar.$inferSelect
): Promise<CalendarEntryWithDetails | null> {
  // Get the plan
  const planResult = await db.query.plan.findFirst({
    where: eq(plan.id, entry.planId),
  });

  if (!planResult) return null;

  // Get the daily plan
  const dailyPlanResult = await db.query.dailyPlan.findFirst({
    where: eq(dailyPlan.id, entry.dailyPlanId),
  });

  if (!dailyPlanResult) return null;

  // Get the weekly plan to find week index
  const weeklyPlanResult = await db.query.weeklyPlan.findFirst({
    where: eq(weeklyPlan.id, dailyPlanResult.weeklyPlanId),
  });

  if (!weeklyPlanResult) return null;

  // Get units for this daily plan
  const units = await getUnits(entry.dailyPlanId);

  return {
    id: entry.id,
    planId: entry.planId,
    date: entry.date,
    dailyPlanId: entry.dailyPlanId,
    status: entry.status as CalendarEntryStatus,
    planName: planResult.name,
    weekIndex: weeklyPlanResult.weekIndex,
    dayIndex: dailyPlanResult.dayIndex,
    dailyPlanDesc: dailyPlanResult.desc,
    dailyPlanUnits: units,
  };
}

/**
 * Update calendar entry status
 */
export async function updateCalendarEntryStatus(
  entryId: string,
  status: CalendarEntryStatus
): Promise<void> {
  await db.update(userPlanCalendar)
    .set({ status })
    .where(eq(userPlanCalendar.id, entryId));
}

/**
 * Get active plan IDs (plans with pending calendar entries)
 */
export async function getActivePlanIds(): Promise<string[]> {
  const entries = await db.query.userPlanCalendar.findMany({
    where: eq(userPlanCalendar.status, 'pending'),
  });

  const planIds = new Set(entries.map(e => e.planId));
  return Array.from(planIds);
}

/**
 * Get calendar entries for a plan
 */
export async function getCalendarEntriesForPlan(
  planId: string
): Promise<CalendarEntry[]> {
  const entries = await db.query.userPlanCalendar.findMany({
    where: eq(userPlanCalendar.planId, planId),
    orderBy: userPlanCalendar.date,
  });

  return entries as CalendarEntry[];
}

/**
 * Skip a calendar entry
 */
export async function skipCalendarEntry(entryId: string): Promise<void> {
  await updateCalendarEntryStatus(entryId, 'skipped');
}

/**
 * Get upcoming calendar entries (from today onwards, pending only)
 */
export async function getUpcomingEntries(limit: number = 7): Promise<CalendarEntryWithDetails[]> {
  const today = formatDateString(new Date());

  const entries = await db.query.userPlanCalendar.findMany({
    where: and(
      gte(userPlanCalendar.date, today),
      eq(userPlanCalendar.status, 'pending')
    ),
    orderBy: userPlanCalendar.date,
    limit,
  });

  const withDetails: CalendarEntryWithDetails[] = [];

  for (const entry of entries) {
    const details = await getCalendarEntryWithDetails(entry);
    if (details) {
      withDetails.push(details);
    }
  }

  return withDetails;
}
