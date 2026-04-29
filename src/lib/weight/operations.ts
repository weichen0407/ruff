/**
 * Weight Record Service
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { weightRecord, checkInDailyOverview } from '../../db/schema';
import { generateId, now, getTodayDateString } from '../../db/utils';

export interface WeightRecord {
  id: string;
  date: string;
  weight: number;
  photos: string[] | null;
  comment: string | null;
  createdAt: string;
  syncedAt: string | null;
}

export interface CreateWeightRecordInput {
  date: string;
  weight: number;
  photos?: string[];
  comment?: string;
}

async function ensureDailyOverview(date: string): Promise<void> {
  const existing = await db.query.checkInDailyOverview.findFirst({
    where: eq(checkInDailyOverview.date, date),
  });

  if (existing) {
    await db.update(checkInDailyOverview)
      .set({ hasWeightRecord: true })
      .where(eq(checkInDailyOverview.date, date));
  } else {
    await db.insert(checkInDailyOverview).values({
      id: generateId(),
      date,
      hasCheckIn: false,
      hasWeightRecord: true,
      hasSleepRecord: false,
    });
  }
}

export async function createWeightRecord(
  input: CreateWeightRecordInput
): Promise<WeightRecord> {
  const id = generateId();
  const nowStr = now();
  const date = input.date;

  await db.insert(weightRecord).values({
    id,
    date,
    weight: input.weight,
    photos: input.photos ? JSON.stringify(input.photos) : null,
    comment: input.comment ?? null,
    createdAt: nowStr,
  });

  await ensureDailyOverview(date);

  const record = await db.query.weightRecord.findFirst({
    where: eq(weightRecord.id, id),
  });

  return {
    ...record!,
    photos: record!.photos ? JSON.parse(record!.photos as unknown as string) : null,
  } as WeightRecord;
}

export async function getWeightRecordForDate(
  date: string
): Promise<WeightRecord | null> {
  const record = await db.query.weightRecord.findFirst({
    where: eq(weightRecord.date, date),
  });

  if (!record) return null;

  return {
    ...record,
    photos: record.photos ? JSON.parse(record.photos as unknown as string) : null,
  } as WeightRecord;
}

export async function getTodayWeightRecord(): Promise<WeightRecord | null> {
  const today = getTodayDateString();
  return getWeightRecordForDate(today);
}

export async function updateWeightRecord(
  id: string,
  updates: { weight?: number; photos?: string[]; comment?: string }
): Promise<void> {
  const setValues: Record<string, unknown> = {};
  if (updates.weight !== undefined) setValues.weight = updates.weight;
  if (updates.photos !== undefined) {
    setValues.photos = updates.photos.length > 0 ? JSON.stringify(updates.photos) : null;
  }
  if (updates.comment !== undefined) setValues.comment = updates.comment ?? null;

  await db.update(weightRecord).set(setValues).where(eq(weightRecord.id, id));
}
