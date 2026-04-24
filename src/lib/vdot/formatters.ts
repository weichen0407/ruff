/**
 * Formatters for VDOT-related values
 */

import type { PaceZoneType } from './getPaceZones';

/**
 * Format pace (seconds per km) to mm:ss string
 * @param secondsPerKm - Pace in seconds per kilometer
 * @returns Formatted pace like '4:30'
 */
export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format pace with zone indicator
 * @param secondsPerKm - Pace in seconds per kilometer
 * @param zone - Zone type
 * @param adjustment - Adjustment in seconds (optional)
 * @returns Formatted string like 'E 4:30 (+10s)'
 */
export function formatPaceWithZone(
  secondsPerKm: number,
  zone: PaceZoneType,
  adjustment?: number
): string {
  const paceStr = formatPace(secondsPerKm);
  let result = `${zone} ${paceStr}`;

  if (adjustment !== undefined && adjustment !== 0) {
    const sign = adjustment > 0 ? '+' : '';
    result += ` (${sign}${adjustment}s)`;
  }

  return result;
}

/**
 * Zone colors for UI display
 */
export const ZONE_COLORS: Record<PaceZoneType, string> = {
  E: '#22C55E', // Green
  M: '#3B82F6', // Blue
  T: '#F97316', // Orange
  I: '#EF4444', // Red
  R: '#6B7280', // Gray
};

/**
 * Zone names for UI display
 */
export const ZONE_NAMES: Record<PaceZoneType, string> = {
  E: 'Easy',
  M: 'Marathon',
  T: 'Threshold',
  I: 'Interval',
  R: 'Repetition',
};
