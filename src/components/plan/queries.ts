/**
 * Plan Queries
 * Query functions for fetching plan data from database
 */

import { db, getDatabase, schema } from '@/db';
import { eq, asc } from 'drizzle-orm';
import type { PlanInfo, WeeklyPlanInfo, DailyPlanInfo, UnitInfo, WeekPlan, PlanDetail, DayPlan } from './types';

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/**
 * Get the current/last created plan
 */
export async function getCurrentPlan(): Promise<PlanInfo | null> {
  await getDatabase();
  const plans = await db.select().from(schema.plan).orderBy(schema.plan.createdAt).all();
  console.log('[getCurrentPlan] raw plans count:', plans.length);
  console.log('[getCurrentPlan] raw plans:', JSON.stringify(plans, null, 2));
  if (plans.length === 0) return null;
  const p = plans[plans.length - 1];
  return {
    id: p.id,
    name: p.name,
    targetDistance: p.targetDistance,
    targetTime: p.targetTime,
    vdot: p.vdot,
    paceE: p.paceE,
    paceM: p.paceM,
    paceT: p.paceT,
    paceI: p.paceI,
    paceR: p.paceR,
    weeks: p.weeks,
    desc: p.desc ?? undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/**
 * Get weekly plans for a plan
 */
export async function getWeeklyPlans(planId: string): Promise<WeeklyPlanInfo[]> {
  const weeks = await db
    .select()
    .from(schema.weeklyPlan)
    .where(eq(schema.weeklyPlan.planId, planId))
    .orderBy(asc(schema.weeklyPlan.weekIndex))
    .all();
  return weeks.map((w) => ({
    id: w.id,
    planId: w.planId,
    weekIndex: w.weekIndex,
    desc: w.desc ?? undefined,
  }));
}

/**
 * Get daily plans for a weekly plan
 */
export async function getDailyPlans(weeklyPlanId: string): Promise<DailyPlanInfo[]> {
  const days = await db
    .select()
    .from(schema.dailyPlan)
    .where(eq(schema.dailyPlan.weeklyPlanId, weeklyPlanId))
    .orderBy(asc(schema.dailyPlan.dayIndex))
    .all();
  return days.map((d) => ({
    id: d.id,
    weeklyPlanId: d.weeklyPlanId,
    dayIndex: d.dayIndex,
    desc: d.desc ?? undefined,
  }));
}

/**
 * Get units for a daily plan
 */
export async function getUnits(dailyPlanId: string): Promise<UnitInfo[]> {
  const units = await db
    .select()
    .from(schema.unit)
    .where(eq(schema.unit.dailyPlanId, dailyPlanId))
    .orderBy(asc(schema.unit.orderIndex))
    .all();
  return units.map((u) => ({
    id: u.id,
    dailyPlanId: u.dailyPlanId,
    type: u.type,
    orderIndex: u.orderIndex,
    paceMode: u.paceMode as UnitInfo['paceMode'],
    paceValue: u.paceValue ?? undefined,
    standardType: u.standardType ?? undefined,
    standardValue: u.standardValue ?? undefined,
    standard: u.standard ?? undefined,
    content: u.content ?? undefined,
  }));
}

/**
 * Build day plan with units
 */
async function buildDayPlan(dailyPlan: DailyPlanInfo): Promise<DayPlan> {
  const units = await getUnits(dailyPlan.id);
  return {
    dayIndex: dailyPlan.dayIndex,
    dayName: DAY_NAMES[dailyPlan.dayIndex - 1],
    units,
    desc: dailyPlan.desc,
  };
}

/**
 * Build week plan with all days
 */
async function buildWeekPlan(weeklyPlan: WeeklyPlanInfo): Promise<WeekPlan> {
  const dailyPlans = await getDailyPlans(weeklyPlan.id);
  const days = await Promise.all(dailyPlans.map(buildDayPlan));
  return {
    weekIndex: weeklyPlan.weekIndex,
    days,
    desc: weeklyPlan.desc,
  };
}

/**
 * Get complete plan detail with all weeks and days
 */
export async function getPlanDetail(planId: string): Promise<PlanDetail | null> {
  await getDatabase();
  const plan = await db.select().from(schema.plan).where(eq(schema.plan.id, planId)).get();
  if (!plan) return null;

  const planInfo: PlanInfo = {
    id: plan.id,
    name: plan.name,
    targetDistance: plan.targetDistance,
    targetTime: plan.targetTime,
    vdot: plan.vdot,
    paceE: plan.paceE,
    paceM: plan.paceM,
    paceT: plan.paceT,
    paceI: plan.paceI,
    paceR: plan.paceR,
    weeks: plan.weeks,
    desc: plan.desc ?? undefined,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };

  const weeklyPlans = await getWeeklyPlans(planId);
  const weeks = await Promise.all(weeklyPlans.map(buildWeekPlan));

  return { plan: planInfo, weeks };
}

/**
 * Get current plan detail
 */
export async function getCurrentPlanDetail(): Promise<PlanDetail | null> {
  const plan = await getCurrentPlan();
  if (!plan) return null;
  return getPlanDetail(plan.id);
}

/**
 * Format seconds to pace string (e.g., "5:30")
 */
export function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to duration string (e.g., "1h 30m")
 */
export function formatDuration(seconds: number): string {
  const hour = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  if (hour > 0) {
    return `${hour}h ${min}m`;
  }
  return `${min}m`;
}

/**
 * Format target distance to display string
 */
export function formatTargetDistance(distance: string): string {
  const map: Record<string, string> = {
    '5k': '5公里',
    '10k': '10公里',
    half: '半马',
    full: '全马',
  };
  return map[distance] ?? distance;
}
