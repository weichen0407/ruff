/**
 * VDOT Calculator based on Jack Daniels' Running Formula
 *
 * VDOT represents your aerobic capacity and is used to calculate
 * training pace zones (E, M, T, I, R).
 */

// Constants for VDOT calculation
const METER_IN_MILE = 1609.344;
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_MINUTE = 60;

/**
 * Calculate VDOT based on distance and time
 * @param distanceKm - Distance in kilometers (e.g., 5 for 5K, 42.195 for marathon)
 * @param timeSeconds - Time in seconds
 * @returns VDOT value (decimal)
 */
export function calculateVdot(distanceKm: number, timeSeconds: number): number {
  // Convert km to meters
  const distanceMeters = distanceKm * 1000;
  // Convert to miles
  const distanceMiles = distanceMeters / METER_IN_MILE;
  // Time in minutes
  const timeMinutes = timeSeconds / SECONDS_IN_MINUTE;

  // Calculate velocity (meters per minute)
  const velocityMpm = distanceMeters / timeMinutes;

  // Calculate VO2max (ml/kg/min)
  // Daniels formula: VO2max = -4.6 + 0.182258 * velocity + 0.000104 * velocity^2
  // where velocity is in meters per minute
  const vo2max = -4.6 + 0.182258 * velocityMpm + 0.000104 * velocityMpm * velocityMpm;

  // Convert to VDOT (which is essentially VO2max adjusted for running economy)
  // For a standard track 1500m to 5000m, VDOT ≈ VO2max
  const vdot = Math.max(20, Math.min(85, vo2max)); // Clamp to reasonable range

  // Round to one decimal place
  return Math.round(vdot * 10) / 10;
}

/**
 * Target distance mappings
 */
export const TARGET_DISTANCE_MAP: Record<string, number> = {
  '5k': 5,
  '10k': 10,
  'half': 21.0975,
  'full': 42.195,
};

/**
 * Estimate race time based on VDOT and distance
 * This is the inverse of calculateVdot
 * @param vdot - VDOT value
 * @param distanceKm - Distance in kilometers
 * @returns Estimated time in seconds
 */
export function estimateTime(vdot: number, distanceKm: number): number {
  const distanceMeters = distanceKm * 1000;
  const distanceMiles = distanceMeters / METER_IN_MILE;

  // Inverse calculation from Daniels formula
  // VO2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity^2
  // Solving for velocity:
  // 0.000104 * v^2 + 0.182258 * v - (VO2 + 4.6) = 0
  // Using quadratic formula

  const a = 0.000104;
  const b = 0.182258;
  const c = -(vdot + 4.6);

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    throw new Error('Invalid VDOT value');
  }

  const velocityMpm = (-b + Math.sqrt(discriminant)) / (2 * a);
  const timeMinutes = distanceMeters / velocityMpm;

  return Math.round(timeMinutes * SECONDS_IN_MINUTE);
}
