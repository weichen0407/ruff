/**
 * Pace Formatter
 *
 * Handles conversion between seconds/km (storage) and mm:ss (display)
 */

/**
 * Format pace (seconds per km) to mm:ss string
 * @param secondsPerKm - Pace in seconds per kilometer
 * @returns Formatted string like '4:30', '5:00'
 */
export function formatPace(secondsPerKm: number): string {
  if (secondsPerKm < 0) {
    return '0:00';
  }

  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parse pace string in mm:ss format to seconds per km
 * @param str - Pace string like '4:30', '5:00'
 * @returns Pace in seconds per kilometer
 */
export function parsePace(str: string): number {
  const parts = str.trim().split(':');

  if (parts.length !== 2) {
    throw new Error(`Invalid pace format: ${str}. Expected mm:ss`);
  }

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);

  if (isNaN(minutes) || isNaN(seconds)) {
    throw new Error(`Invalid pace format: ${str}`);
  }

  if (minutes < 0 || seconds < 0 || seconds >= 60) {
    throw new Error(`Invalid pace values: ${str}`);
  }

  return minutes * 60 + seconds;
}

/**
 * Format pace with description
 * @param secondsPerKm - Pace in seconds per kilometer
 * @param label - Optional label like 'E', 'M', etc.
 * @returns Formatted string like 'E 4:30'
 */
export function formatPaceWithLabel(secondsPerKm: number, label?: string): string {
  const paceStr = formatPace(secondsPerKm);

  if (label) {
    return `${label} ${paceStr}`;
  }

  return paceStr;
}

/**
 * Calculate pace from distance and duration
 * @param distanceKm - Distance in kilometers
 * @param durationSeconds - Duration in seconds
 * @returns Pace in seconds per kilometer
 */
export function calculatePace(distanceKm: number, durationSeconds: number): number | null {
  if (distanceKm <= 0 || durationSeconds <= 0) {
    return null;
  }

  return Math.round(durationSeconds / distanceKm);
}

/**
 * Calculate duration from distance and pace
 * @param distanceKm - Distance in kilometers
 * @param secondsPerKm - Pace in seconds per kilometer
 * @returns Duration in seconds
 */
export function calculateDuration(distanceKm: number, secondsPerKm: number): number {
  return Math.round(distanceKm * secondsPerKm);
}
