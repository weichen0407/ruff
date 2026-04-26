/**
 * Plan Operations
 *
 * CRUD operations for Plan, WeeklyPlan, DailyPlan, and Unit
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { plan, weeklyPlan, dailyPlan, unit } from '../../db/schema';
import { generateId, now } from '../../db/utils';
import { calculateVdot, getPaceZones } from '../vdot';
import type {
  Plan,
  CreatePlanInput,
  WeeklyPlan,
  CreateWeeklyPlanInput,
  DailyPlan,
  CreateDailyPlanInput,
  UnitInPlan,
} from './types';
import type { TargetDistance } from '../../db/schema/types';

const TARGET_DISTANCE_MAP: Record<TargetDistance, number> = {
  '5k': 5,
  '10k': 10,
  'half': 21.0975,
  'full': 42.195,
};

/**
 * Create a new training plan
 * Creates Plan, WeeklyPlan, and DailyPlan records (not Units)
 */
export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  // Calculate VDOT
  const distanceKm = TARGET_DISTANCE_MAP[input.targetDistance];
  const vdot = calculateVdot(distanceKm, input.targetTime);

  // Calculate pace zones
  const paceZones = getPaceZones(vdot);

  // Create plan
  const planId = generateId();
  const nowStr = now();

  await db.insert(plan).values({
    id: planId,
    name: input.name,
    targetDistance: input.targetDistance,
    targetTime: input.targetTime,
    vdot,
    paceE: paceZones.zones.E,
    paceM: paceZones.zones.M,
    paceT: paceZones.zones.T,
    paceI: paceZones.zones.I,
    paceR: paceZones.zones.R,
    weeks: input.weeks,
    desc: input.desc ?? null,
    createdAt: nowStr,
    updatedAt: nowStr,
  });

  // Create weekly and daily plans
  for (let weekIndex = 1; weekIndex <= input.weeks; weekIndex++) {
    const weeklyPlanId = generateId();

    await db.insert(weeklyPlan).values({
      id: weeklyPlanId,
      planId,
      weekIndex,
      desc: `第${weekIndex}周`,
    });

    for (let dayIndex = 1; dayIndex <= 7; dayIndex++) {
      await db.insert(dailyPlan).values({
        id: generateId(),
        weeklyPlanId,
        dayIndex,
        desc: `第${weekIndex}周 第${dayIndex}天`,
      });
    }
  }

  const created = await db.query.plan.findFirst({
    where: eq(plan.id, planId),
  });

  return created as Plan;
}

/**
 * Get a plan by ID
 */
export async function getPlan(planId: string): Promise<Plan | null> {
  const result = await db.query.plan.findFirst({
    where: eq(plan.id, planId),
  });

  return result as Plan | null;
}

/**
 * Get all plans
 */
export async function getAllPlans(): Promise<Plan[]> {
  const results = await db.query.plan.findMany();
  return results as Plan[];
}

/**
 * Update a plan
 */
export async function updatePlan(
  planId: string,
  input: Partial<CreatePlanInput>
): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: now(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.targetDistance !== undefined) updates.targetDistance = input.targetDistance;
  if (input.targetTime !== undefined) updates.targetTime = input.targetTime;
  if (input.weeks !== undefined) updates.weeks = input.weeks;
  if (input.desc !== undefined) updates.desc = input.desc;

  // Recalculate VDOT if target changed
  if (input.targetDistance !== undefined || input.targetTime !== undefined) {
    const current = await getPlan(planId);
    if (current) {
      const distanceKm = TARGET_DISTANCE_MAP[input.targetDistance ?? current.targetDistance];
      const time = input.targetTime ?? current.targetTime;
      const vdot = calculateVdot(distanceKm, time);
      const paceZones = getPaceZones(vdot);

      updates.vdot = vdot;
      updates.paceE = paceZones.zones.E;
      updates.paceM = paceZones.zones.M;
      updates.paceT = paceZones.zones.T;
      updates.paceI = paceZones.zones.I;
      updates.paceR = paceZones.zones.R;
    }
  }

  await db.update(plan).set(updates).where(eq(plan.id, planId));
}

/**
 * Delete a plan (cascade delete weekly, daily, units)
 */
export async function deletePlan(planId: string): Promise<void> {
  // Get all weekly plans for this plan
  const weeklyPlans = await db.query.weeklyPlan.findMany({
    where: eq(weeklyPlan.planId, planId),
  });

  // Delete units for each weekly plan's daily plans
  for (const wp of weeklyPlans) {
    const dailyPlans = await db.query.dailyPlan.findMany({
      where: eq(dailyPlan.weeklyPlanId, wp.id),
    });

    for (const dp of dailyPlans) {
      await db.delete(unit).where(eq(unit.dailyPlanId, dp.id));
    }

    // Delete daily plans
    await db.delete(dailyPlan).where(eq(dailyPlan.weeklyPlanId, wp.id));
  }

  // Delete weekly plans
  await db.delete(weeklyPlan).where(eq(weeklyPlan.planId, planId));

  // Delete calendar entries
  await db.delete(plan).where(eq(plan.id, planId));
}

/**
 * Get weekly plans for a plan
 */
export async function getWeeklyPlans(planId: string): Promise<WeeklyPlan[]> {
  const results = await db.query.weeklyPlan.findMany({
    where: eq(weeklyPlan.planId, planId),
    orderBy: weeklyPlan.weekIndex,
  });

  return results as WeeklyPlan[];
}

/**
 * Get daily plans for a weekly plan
 */
export async function getDailyPlans(weeklyPlanId: string): Promise<DailyPlan[]> {
  const results = await db.query.dailyPlan.findMany({
    where: eq(dailyPlan.weeklyPlanId, weeklyPlanId),
    orderBy: dailyPlan.dayIndex,
  });

  return results as DailyPlan[];
}

/**
 * Add a unit to a daily plan
 */
export async function addUnit(
  dailyPlanId: string,
  unitData: Omit<UnitInPlan, 'id' | 'dailyPlanId'>
): Promise<UnitInPlan> {
  const id = generateId();

  await db.insert(unit).values({
    id,
    dailyPlanId,
    type: unitData.type,
    orderIndex: unitData.orderIndex,
    paceMode: unitData.paceMode,
    paceValue: unitData.paceValue,
    standardType: unitData.standardType,
    standardValue: unitData.standardValue,
    standard: unitData.standard,
    content: unitData.content,
  });

  return { id, dailyPlanId, ...unitData };
}

/**
 * Add multiple units to a daily plan
 */
export async function addUnits(
  dailyPlanId: string,
  units: Omit<UnitInPlan, 'id' | 'dailyPlanId'>[]
): Promise<void> {
  const values = units.map((u, index) => ({
    id: generateId(),
    dailyPlanId,
    type: u.type,
    orderIndex: u.orderIndex,
    paceMode: u.paceMode,
    paceValue: u.paceValue,
    standardType: u.standardType,
    standardValue: u.standardValue,
    standard: u.standard,
    content: u.content,
  }));

  await db.insert(unit).values(values);
}

/**
 * Get units for a daily plan
 */
export async function getUnits(dailyPlanId: string): Promise<UnitInPlan[]> {
  const results = await db.query.unit.findMany({
    where: eq(unit.dailyPlanId, dailyPlanId),
    orderBy: unit.orderIndex,
  });

  return results as UnitInPlan[];
}

/**
 * Update a unit
 */
export async function updateUnit(
  unitId: string,
  updates: Partial<Omit<UnitInPlan, 'id' | 'dailyPlanId'>>
): Promise<void> {
  const setClause: Record<string, unknown> = {};

  if (updates.type !== undefined) setClause.type = updates.type;
  if (updates.orderIndex !== undefined) setClause.orderIndex = updates.orderIndex;
  if (updates.paceMode !== undefined) setClause.paceMode = updates.paceMode;
  if (updates.paceValue !== undefined) setClause.paceValue = updates.paceValue;
  if (updates.standardType !== undefined) setClause.standardType = updates.standardType;
  if (updates.standardValue !== undefined) setClause.standardValue = updates.standardValue;
  if (updates.standard !== undefined) setClause.standard = updates.standard;
  if (updates.content !== undefined) setClause.content = updates.content;

  await db.update(unit).set(setClause).where(eq(unit.id, unitId));
}

/**
 * Delete a unit
 */
export async function deleteUnit(unitId: string): Promise<void> {
  await db.delete(unit).where(eq(unit.id, unitId));
}

/**
 * Delete all units for a daily plan
 */
export async function clearUnits(dailyPlanId: string): Promise<void> {
  await db.delete(unit).where(eq(unit.dailyPlanId, dailyPlanId));
}
