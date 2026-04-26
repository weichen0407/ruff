/**
 * User Model Operations
 *
 * Manages user profile including running goals, VDOT, and future sleep/weight goals
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { user } from '../../db/schema';
import { now } from '../../db/utils';
import type { UserProfile, UpdateUserProfileInput } from './types';
import type { TargetDistance } from '../../db/schema/types';

const LOCAL_USER_ID = 'local' as const;

/**
 * Get the local user profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const result = await db.query.user.findFirst({
    where: eq(user.id, LOCAL_USER_ID),
  });

  if (!result) return null;

  return {
    id: result.id as 'local',
    runningGoalDistance: result.runningGoalDistance as UserProfile['runningGoalDistance'],
    runningGoalTime: result.runningGoalTime ?? null,
    vdot: result.vdot ?? null,
    sleepGoalBedtime: result.sleepGoalBedtime ?? null,
    sleepGoalWakeTime: result.sleepGoalWakeTime ?? null,
    weightGoal: result.weightGoal ?? null,
    updatedAt: result.updatedAt,
  };
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(
  input: UpdateUserProfileInput
): Promise<UserProfile> {
  const nowStr = now();

  const existing = await getUserProfile();

  if (existing) {
    // Update existing
    const updates: Record<string, unknown> = { updatedAt: nowStr };

    if (input.runningGoalDistance !== undefined) updates.runningGoalDistance = input.runningGoalDistance;
    if (input.runningGoalTime !== undefined) updates.runningGoalTime = input.runningGoalTime;
    if (input.vdot !== undefined) updates.vdot = input.vdot;
    if (input.sleepGoalBedtime !== undefined) updates.sleepGoalBedtime = input.sleepGoalBedtime;
    if (input.sleepGoalWakeTime !== undefined) updates.sleepGoalWakeTime = input.sleepGoalWakeTime;
    if (input.weightGoal !== undefined) updates.weightGoal = input.weightGoal;

    await db.update(user)
      .set(updates)
      .where(eq(user.id, LOCAL_USER_ID));
  } else {
    // Create new
    await db.insert(user).values({
      id: LOCAL_USER_ID,
      runningGoalDistance: input.runningGoalDistance ?? null,
      runningGoalTime: input.runningGoalTime ?? null,
      vdot: input.vdot ?? null,
      sleepGoalBedtime: input.sleepGoalBedtime ?? null,
      sleepGoalWakeTime: input.sleepGoalWakeTime ?? null,
      weightGoal: input.weightGoal ?? null,
      updatedAt: nowStr,
    });
  }

  const updated = await getUserProfile();
  return updated!;
}

/**
 * Update running goals
 */
export async function updateRunningGoal(
  distance: TargetDistance,
  time: number
): Promise<UserProfile> {
  return upsertUserProfile({
    runningGoalDistance: distance,
    runningGoalTime: time,
  });
}

/**
 * Update VDOT directly
 */
export async function updateVdot(vdot: number): Promise<UserProfile> {
  return upsertUserProfile({ vdot });
}

/**
 * Update sleep goals (Phase 2)
 */
export async function updateSleepGoal(
  bedtime: string,
  wakeTime: string
): Promise<UserProfile> {
  return upsertUserProfile({
    sleepGoalBedtime: bedtime,
    sleepGoalWakeTime: wakeTime,
  });
}

/**
 * Update weight goal (Phase 2)
 */
export async function updateWeightGoal(weight: number): Promise<UserProfile> {
  return upsertUserProfile({ weightGoal: weight });
}

/**
 * Clear all goals
 */
export async function clearGoals(): Promise<UserProfile> {
  return upsertUserProfile({
    runningGoalDistance: null,
    runningGoalTime: null,
    vdot: null,
    sleepGoalBedtime: null,
    sleepGoalWakeTime: null,
    weightGoal: null,
  });
}
