/**
 * Plan Module
 *
 * @example
 * import { createPlan, getPlanHierarchy } from './plan';
 *
 * const plan = await createPlan({
 *   name: '5K Training',
 *   targetDistance: '5k',
 *   targetTime: 20 * 60,
 *   weeks: 8,
 * });
 */

// Types
export type {
  Plan,
  CreatePlanInput,
  WeeklyPlan,
  CreateWeeklyPlanInput,
  DailyPlan,
  CreateDailyPlanInput,
  UnitInPlan,
  PlanWithHierarchy,
  WeeklyPlanWithDailyPlans,
  DailyPlanWithUnits,
} from './types';

// Operations
export {
  createPlan,
  getPlan,
  getAllPlans,
  updatePlan,
  deletePlan,
  getWeeklyPlans,
  getDailyPlans,
  addUnit,
  addUnits,
  getUnits,
  updateUnit,
  deleteUnit,
  clearUnits,
} from './operations';

// Hierarchy queries
export {
  getPlanHierarchy,
  getDailyPlanWithUnits,
  getWeeklyPlanWithDailyPlans,
} from './hierarchy';
