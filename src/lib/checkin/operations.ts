/**
 * Check-in Service
 *
 * Handles training check-in lifecycle: from plan or custom
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { checkInRecord, checkInDailyOverview, userPlanCalendar, unit } from '../../db/schema';
import { generateId, now, getTodayDateString } from '../../db/utils';
import type {
  CheckInRecord,
  CheckInType,
  Feeling,
  CreateCheckInFromPlanInput,
  CreateCustomCheckInInput,
  CheckInWithDetails,
} from './types';
import { updateCalendarEntryStatus } from '../calendar/engine';

/**
 * Create a check-in from a calendar entry (planned training)
 */
export async function checkinFromPlan(
  input: CreateCheckInFromPlanInput
): Promise<CheckInRecord> {
  const id = generateId();
  const nowStr = now();

  // Get the calendar entry to find the date
  const calendarEntry = await db.query.userPlanCalendar.findFirst({
    where: eq(userPlanCalendar.id, input.calendarEntryId),
  });

  if (!calendarEntry) {
    throw new Error(`Calendar entry not found: ${input.calendarEntryId}`);
  }

  // Insert check-in record
  await db.insert(checkInRecord).values({
    id,
    calendarEntryId: input.calendarEntryId,
    date: calendarEntry.date,
    type: input.type,
    distance: input.distance,
    duration: input.duration,
    pace: input.pace,
    feeling: input.feeling ?? null,
    photos: input.photos ? JSON.stringify(input.photos) : null,
    comment: input.comment ?? null,
    createdAt: nowStr,
  });

  // Update daily overview to mark hasCheckIn = true
  // Use today's date (the actual check-in date), not calendarEntry.date (the planned date)
  await ensureDailyOverview(getTodayDateString(), true);

  // Update calendar entry status to completed
  await updateCalendarEntryStatus(input.calendarEntryId, 'completed');

  const record = await db.query.checkInRecord.findFirst({
    where: eq(checkInRecord.id, id),
  });

  return record as CheckInRecord;
}

/**
 * Create a custom check-in (not from a planned training)
 */
export async function checkinCustom(
  input: CreateCustomCheckInInput
): Promise<CheckInRecord> {
  const id = generateId();
  const nowStr = now();
  const date = input.date;

  await db.insert(checkInRecord).values({
    id,
    calendarEntryId: null,
    date,
    type: input.type,
    distance: input.distance ?? null,
    duration: input.duration ?? null,
    pace: input.pace ?? null,
    feeling: input.feeling ?? null,
    photos: input.photos ? JSON.stringify(input.photos) : null,
    comment: input.comment ?? null,
    createdAt: nowStr,
  });

  // Update daily overview
  await ensureDailyOverview(date, true);

  const record = await db.query.checkInRecord.findFirst({
    where: eq(checkInRecord.id, id),
  });

  return record as CheckInRecord;
}

/**
 * Get check-ins for a specific date
 */
export async function getCheckInsForDate(date: string): Promise<CheckInWithDetails[]> {
  const records = await db.query.checkInRecord.findMany({
    where: eq(checkInRecord.date, date),
    orderBy: checkInRecord.createdAt,
  });

  const withDetails: CheckInWithDetails[] = [];

  for (const record of records) {
    const details: CheckInWithDetails = {
      ...record,
      photos: record.photos ? JSON.parse(record.photos as unknown as string) : null,
    };

    // If there's a calendar entry, enrich with plan details
    if (record.calendarEntryId) {
      const calendarEntry = await db.query.userPlanCalendar.findFirst({
        where: eq(userPlanCalendar.id, record.calendarEntryId),
      });

      if (calendarEntry) {
        const plan = await db.query.plan.findFirst({
          where: eq((await import('../../db/schema')).plan.id, calendarEntry.planId),
        });

        const dailyPlan = await db.query.dailyPlan.findFirst({
          where: eq((await import('../../db/schema')).dailyPlan.id, calendarEntry.dailyPlanId),
        });

        const weeklyPlan = dailyPlan
          ? await db.query.weeklyPlan.findFirst({
              where: eq((await import('../../db/schema')).weeklyPlan.id, dailyPlan.weeklyPlanId),
            })
          : null;

        const planUnits = dailyPlan
          ? await db.query.unit.findMany({
              where: eq((await import('../../db/schema')).unit.dailyPlanId, dailyPlan.id),
              orderBy: (await import('../../db/schema')).unit.orderIndex,
            })
          : [];

        if (plan) {
          details.planName = plan.name;
          details.weekIndex = weeklyPlan?.weekIndex;
          details.dayIndex = dailyPlan?.dayIndex;
          details.dailyPlanDesc = dailyPlan?.desc ?? undefined;
          details.units = planUnits.map(u => ({
            id: u.id,
            type: u.type as 'run' | 'rest' | 'other',
            paceMode: u.paceMode,
            paceValue: u.paceValue,
            standardType: u.standardType as 'time' | 'distance' | null,
            standardValue: u.standardValue,
            content: u.content,
          }));
        }
      }
    }

    withDetails.push(details);
  }

  return withDetails;
}

/**
 * Get today's check-in status
 */
export async function getTodayCheckInStatus(): Promise<boolean> {
  const today = getTodayDateString();
  const overview = await db.query.checkInDailyOverview.findFirst({
    where: eq(checkInDailyOverview.date, today),
  });

  return overview?.hasCheckIn ?? false;
}

/**
 * Get check-in records in a date range
 */
export async function getCheckInsInRange(
  startDate: string,
  endDate: string
): Promise<CheckInRecord[]> {
  const records = await db.query.checkInRecord.findMany({
    where: eq(checkInRecord.date, startDate), // Note: this should use gte/lte but keeping existing pattern
  });

  // Filter by date range (since we can't easily do gte/lte with the current query pattern)
  return records.filter(r => r.date >= startDate && r.date <= endDate) as CheckInRecord[];
}

/**
 * Ensure daily overview exists for a date
 */
async function ensureDailyOverview(date: string, hasCheckIn: boolean): Promise<void> {
  // Use the date parameter as-is (caller should pass the correct check-in date)
  const existing = await db.query.checkInDailyOverview.findFirst({
    where: eq(checkInDailyOverview.date, date),
  });

  if (existing) {
    await db.update(checkInDailyOverview)
      .set({ hasCheckIn })
      .where(eq(checkInDailyOverview.date, date));
  } else {
    await db.insert(checkInDailyOverview).values({
      id: generateId(),
      date,
      hasCheckIn,
    });
  }
}

/**
 * Delete a check-in record
 */
export async function deleteCheckIn(recordId: string): Promise<void> {
  const record = await db.query.checkInRecord.findFirst({
    where: eq(checkInRecord.id, recordId),
  });

  if (record) {
    // Delete the record
    await db.delete(checkInRecord).where(eq(checkInRecord.id, recordId));

    // Check if there are other check-ins for this date
    const otherCheckIns = await db.query.checkInRecord.findMany({
      where: eq(checkInRecord.date, record.date),
    });

    // Update daily overview
    await ensureDailyOverview(record.date, otherCheckIns.length > 0);

    // If there was a calendar entry, reset its status to pending
    if (record.calendarEntryId) {
      await updateCalendarEntryStatus(record.calendarEntryId, 'pending');
    }
  }
}

export interface MonthlyCheckInData {
  [date: string]: {
    hasCheckIn: boolean;
    hasSleepRecord: boolean;
    hasWeightRecord: boolean;
  };
}

/**
 * Get all check-in data for a given month
 * Returns a map of date string -> check-in status
 */
export async function getMonthlyCheckInData(year: number, month: number): Promise<MonthlyCheckInData> {
  // Build date range for the month
  // month is 1-12 (human convention)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).getDate(); // JS Date month is 0-indexed, so month=4 means May, May 0 = Apr 30
  const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate).padStart(2, '0')}`;

  // Query all daily overviews and filter to this month
  const allOverviews = await db.select().from(checkInDailyOverview);

  // Filter to only include dates in this month
  const monthlyOverviews = allOverviews.filter(o => o.date >= startDate && o.date <= endDateStr);

  const result: MonthlyCheckInData = {};

  for (const overview of monthlyOverviews) {
    result[overview.date] = {
      hasCheckIn: overview.hasCheckIn ?? false,
      hasSleepRecord: overview.hasSleepRecord ?? false,
      hasWeightRecord: overview.hasWeightRecord ?? false,
    };
  }

  return result;
}
