/**
 * User Model Index
 *
 * @example
 * import { getUserProfile, updateRunningGoal, updateVdot } from './user';
 *
 * // Get user profile
 * const profile = await getUserProfile();
 *
 * // Update running goal
 * await updateRunningGoal('5k', 20 * 60);
 *
 * // Update VDOT directly
 * await updateVdot(45.2);
 */

// Types
export type {
  UserProfile,
  UpdateUserProfileInput,
} from './types';

// Operations
export {
  getUserProfile,
  upsertUserProfile,
  updateRunningGoal,
  updateVdot,
  updateSleepGoal,
  updateWeightGoal,
  clearGoals,
} from './operations';
