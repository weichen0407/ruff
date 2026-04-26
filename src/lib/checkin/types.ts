/**
 * Check-in Service Types
 */

export type CheckInType = 'run' | 'rest' | 'other';

export type Feeling = 'easy' | 'moderate' | 'hard' | 'painful';

export interface CheckInRecord {
  id: string;
  calendarEntryId: string | null;
  date: string; // YYYY-MM-DD
  type: CheckInType;
  distance: number | null; // km
  duration: number | null; // seconds
  pace: number | null; // seconds/km
  feeling: Feeling | null;
  photos: string[] | null; // JSON array of file paths
  createdAt: string;
  syncedAt: string | null;
}

export interface CreateCheckInFromPlanInput {
  calendarEntryId: string;
  type: CheckInType;
  distance: number;
  duration: number;
  pace: number;
  feeling?: Feeling;
  photos?: string[];
}

export interface CreateCustomCheckInInput {
  date: string;
  type: CheckInType;
  distance?: number;
  duration?: number;
  pace?: number;
  feeling?: Feeling;
  photos?: string[];
  // For linking to a daily plan even if not from calendar
  dailyPlanId?: string;
}

export interface CheckInWithDetails extends CheckInRecord {
  planName?: string;
  weekIndex?: number;
  dayIndex?: number;
  dailyPlanDesc?: string;
}
