/**
 * User Model Types
 */

import type { TargetDistance } from '../../db/schema/types';

export interface UserProfile {
  id: 'local';
  // Running goals
  runningGoalDistance: TargetDistance | null;
  runningGoalTime: number | null; // seconds
  vdot: number | null;
  // Sleep goals (Phase 2)
  sleepGoalBedtime: string | null; // HH:mm
  sleepGoalWakeTime: string | null; // HH:mm
  // Weight goal (Phase 2)
  weightGoal: number | null; // kg
  // Metadata
  updatedAt: string;
}

export interface UpdateUserProfileInput {
  runningGoalDistance?: TargetDistance | null;
  runningGoalTime?: number | null;
  vdot?: number | null;
  sleepGoalBedtime?: string | null;
  sleepGoalWakeTime?: string | null;
  weightGoal?: number | null;
}
