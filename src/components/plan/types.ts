/**
 * Plan Page Types
 */

export type PaceMode = 'E' | 'M' | 'T' | 'I' | 'R';

export interface PlanInfo {
  id: string;
  name: string;
  targetDistance: '5k' | '10k' | 'half' | 'full';
  targetTime: number; // seconds
  vdot: number;
  paceE: number;
  paceM: number;
  paceT: number;
  paceI: number;
  paceR: number;
  weeks: number;
  desc?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPlanInfo {
  id: string;
  planId: string;
  weekIndex: number;
  desc?: string;
}

export interface DailyPlanInfo {
  id: string;
  weeklyPlanId: string;
  dayIndex: number; // 1-7
  desc?: string;
}

export interface UnitInfo {
  id: string;
  dailyPlanId: string;
  type: 'run' | 'rest' | 'other';
  orderIndex: number;
  paceMode?: PaceMode | 'E+10';
  paceValue?: string;
  standardType?: 'time' | 'distance';
  standardValue?: number;
  standard?: string;
  content?: string;
}

export interface DayPlan {
  dayIndex: number;
  dayName: string;
  units: UnitInfo[];
  desc?: string;
}

export interface WeekPlan {
  weekIndex: number;
  days: DayPlan[];
  desc?: string;
}

export interface PlanDetail {
  plan: PlanInfo;
  weeks: WeekPlan[];
}
