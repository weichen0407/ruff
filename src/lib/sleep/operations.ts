/**
 * Sleep Record Service
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { sleepRecord, checkInDailyOverview } from '../../db/schema';
import { generateId, now, getTodayDateString } from '../../db/utils';

export interface SleepRecord {
  id: string;
  date: string;
  wakeTime: string;
  sleepTime: string;
  duration: number | null;
  photos: string[] | null;
  comment: string | null;
  createdAt: string;
  syncedAt: string | null;
}

export interface CreateSleepRecordInput {
  date: string;
  wakeTime: string;
  sleepTime: string;
  photos?: string[];
  comment?: string;
}

/**
 * Calculate sleep duration in minutes.
 * Handles overnight sleep: e.g., 22:30 to 07:00 = 8.5 hours
 */
function calcDuration(sleepTime: string, wakeTime: string): number {
  const [sh, sm] = sleepTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  const sleepMins = sh * 60 + sm;
  const wakeMins = wh * 60 + wm;

  if (wakeMins >= sleepMins) {
    // Same day (rare, daytime nap)
    return wakeMins - sleepMins;
  } else {
    // Overnight: sleep from evening to morning
    return (24 * 60 - sleepMins) + wakeMins;
  }
}

/**
 * Get the date string for yesterday (previous day)
 */
export function getYesterdayDateString(): string {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  return today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
}

async function ensureDailyOverview(date: string): Promise<void> {
  const existing = await db.query.checkInDailyOverview.findFirst({
    where: eq(checkInDailyOverview.date, date),
  });

  if (existing) {
    await db.update(checkInDailyOverview)
      .set({ hasSleepRecord: true })
      .where(eq(checkInDailyOverview.date, date));
  } else {
    await db.insert(checkInDailyOverview).values({
      id: generateId(),
      date,
      hasCheckIn: false,
      hasWeightRecord: false,
      hasSleepRecord: true,
    });
  }
}

export async function createSleepRecord(
  input: CreateSleepRecordInput
): Promise<SleepRecord> {
  const id = generateId();
  const nowStr = now();
  const duration = input.sleepTime !== '--:--' && input.wakeTime !== '--:--'
    ? calcDuration(input.sleepTime, input.wakeTime)
    : null;

  await db.insert(sleepRecord).values({
    id,
    date: input.date,
    wakeTime: input.wakeTime,
    sleepTime: input.sleepTime,
    duration,
    photos: input.photos ? JSON.stringify(input.photos) : null,
    comment: input.comment ?? null,
    createdAt: nowStr,
  });

  await ensureDailyOverview(input.date);

  const record = await db.query.sleepRecord.findFirst({
    where: eq(sleepRecord.id, id),
  });

  return {
    ...record!,
    photos: record!.photos ? JSON.parse(record!.photos as unknown as string) : null,
  } as SleepRecord;
}

export async function getSleepRecordForDate(
  date: string
): Promise<SleepRecord | null> {
  const record = await db.query.sleepRecord.findFirst({
    where: eq(sleepRecord.date, date),
  });

  if (!record) return null;

  return {
    ...record,
    photos: record.photos ? JSON.parse(record.photos as unknown as string) : null,
  } as SleepRecord;
}

export async function getYesterdaySleepRecord(): Promise<SleepRecord | null> {
  const yesterday = getYesterdayDateString();
  return getSleepRecordForDate(yesterday);
}

export async function getTodaySleepRecord(): Promise<SleepRecord | null> {
  const today = getTodayDateString();
  return getSleepRecordForDate(today);
}
