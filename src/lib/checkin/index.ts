/**
 * Check-in Service Index
 *
 * @example
 * import { checkinFromPlan, getTodayCheckInStatus } from './checkin';
 *
 * // Check in from a planned training
 * const record = await checkinFromPlan({
 *   calendarEntryId: '...',
 *   type: 'run',
 *   distance: 5.2,
 *   duration: 1800,
 *   pace: 346,
 *   feeling: 'easy',
 * });
 *
 * // Check today's status
 * const hasCheckedIn = await getTodayCheckInStatus();
 */

// Types
export type {
  CheckInType,
  Feeling,
  CheckInRecord,
  CreateCheckInFromPlanInput,
  CreateCustomCheckInInput,
  CheckInWithDetails,
} from './types';

// Operations
export {
  checkinFromPlan,
  checkinCustom,
  getCheckInsForDate,
  getTodayCheckInStatus,
  getCheckInsInRange,
  deleteCheckIn,
} from './operations';
