/**
 * Plan Hierarchy Queries
 *
 * Queries that return nested plan structures
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { plan, weeklyPlan, dailyPlan, unit } from '../../db/schema';
import type {
  Plan,
  WeeklyPlan,
  DailyPlan,
  UnitInPlan,
  PlanWithHierarchy,
  WeeklyPlanWithDailyPlans,
  DailyPlanWithUnits,
} from './types';
import { getUnits } from './operations';

/**
 * Get a plan with its complete hierarchy (weekly plans, daily plans, units)
 */
export async function getPlanHierarchy(
  planId: string
): Promise<PlanWithHierarchy | null> {
  // Get the plan
  const planResult = await db.query.plan.findFirst({
    where: eq(plan.id, planId),
  });

  if (!planResult) {
    return null;
  }

  const p = planResult as Plan;

  // Get weekly plans
  const weeklyPlans = await db.query.weeklyPlan.findMany({
    where: eq(weeklyPlan.planId, planId),
    orderBy: weeklyPlan.weekIndex,
  });

  // Build hierarchy
  const weeklyPlansWithDailyPlans: WeeklyPlanWithDailyPlans[] = [];

  for (const wp of weeklyPlans) {
    const w = wp as WeeklyPlan;

    // Get daily plans for this week
    const dailyPlans = await db.query.dailyPlan.findMany({
      where: eq(dailyPlan.weeklyPlanId, w.id),
      orderBy: dailyPlan.dayIndex,
    });

    // Get units for each daily plan
    const dailyPlansWithUnits: DailyPlanWithUnits[] = [];

    for (const dp of dailyPlans) {
      const d = dp as DailyPlan;
      const units = await getUnits(d.id);

      dailyPlansWithUnits.push({
        dailyPlan: d,
        units,
      });
    }

    weeklyPlansWithDailyPlans.push({
      weeklyPlan: w,
      dailyPlans: dailyPlansWithUnits,
    });
  }

  return {
    plan: p,
    weeklyPlans: weeklyPlansWithDailyPlans,
  };
}

/**
 * Get a daily plan with its units
 */
export async function getDailyPlanWithUnits(
  dailyPlanId: string
): Promise<DailyPlanWithUnits | null> {
  const dailyPlanResult = await db.query.dailyPlan.findFirst({
    where: eq(dailyPlan.id, dailyPlanId),
  });

  if (!dailyPlanResult) {
    return null;
  }

  const dp = dailyPlanResult as DailyPlan;
  const units = await getUnits(dailyPlanId);

  return {
    dailyPlan: dp,
    units,
  };
}

/**
 * Get a weekly plan with its daily plans and units
 */
export async function getWeeklyPlanWithDailyPlans(
  weeklyPlanId: string
): Promise<WeeklyPlanWithDailyPlans | null> {
  const weeklyPlanResult = await db.query.weeklyPlan.findFirst({
    where: eq(weeklyPlan.id, weeklyPlanId),
  });

  if (!weeklyPlanResult) {
    return null;
  }

  const wp = weeklyPlanResult as WeeklyPlan;

  // Get daily plans
  const dailyPlans = await db.query.dailyPlan.findMany({
    where: eq(dailyPlan.weeklyPlanId, weeklyPlanId),
    orderBy: dailyPlan.dayIndex,
  });

  // Get units for each daily plan
  const dailyPlansWithUnits: DailyPlanWithUnits[] = [];

  for (const dp of dailyPlans) {
    const d = dp as DailyPlan;
    const units = await getUnits(d.id);

    dailyPlansWithUnits.push({
      dailyPlan: d,
      units,
    });
  }

  return {
    weeklyPlan: wp,
    dailyPlans: dailyPlansWithUnits,
  };
}
