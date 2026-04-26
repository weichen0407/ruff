/**
 * Plan Module Types
 */

import type { TargetDistance } from '../../db/schema/types';

// Plan types
export interface Plan {
  id: string;
  name: string;
  targetDistance: TargetDistance;
  targetTime: number; // seconds
  vdot: number;
  paceE: number; // seconds/km
  paceM: number;
  paceT: number;
  paceI: number;
  paceR: number;
  weeks: number;
  desc: string | null;
  createdAt: string;
  updatedAt: string;
  cloudId: string | null;
}

export interface CreatePlanInput {
  name: string;
  targetDistance: TargetDistance;
  targetTime: number; // seconds
  weeks: number;
  desc?: string;
}

// WeeklyPlan types
export interface WeeklyPlan {
  id: string;
  planId: string;
  weekIndex: number;
  desc: string | null;
}

export interface CreateWeeklyPlanInput {
  planId: string;
  weekIndex: number;
  desc?: string;
}

// DailyPlan types
export interface DailyPlan {
  id: string;
  weeklyPlanId: string;
  dayIndex: number; // 1-7 (Mon-Sun)
  desc: string | null;
}

export interface CreateDailyPlanInput {
  weeklyPlanId: string;
  dayIndex: number;
  desc?: string;
}

// Hierarchy types
export interface UnitInPlan {
  id: string;
  dailyPlanId: string;
  type: 'run' | 'rest' | 'other';
  orderIndex: number;
  paceMode: 'vdot' | 'custom' | null;
  paceValue: string | null;
  standardType: 'time' | 'distance' | null;
  standardValue: number | null;
  standard: 'time' | 'distance' | null;
  content: string | null;
}

export interface DailyPlanWithUnits {
  dailyPlan: DailyPlan;
  units: UnitInPlan[];
}

export interface WeeklyPlanWithDailyPlans {
  weeklyPlan: WeeklyPlan;
  dailyPlans: DailyPlanWithUnits[];
}

export interface PlanWithHierarchy {
  plan: Plan;
  weeklyPlans: WeeklyPlanWithDailyPlans[];
}
