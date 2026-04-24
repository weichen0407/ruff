/**
 * Calculate pace zones based on VDOT
 *
 * The five training zones based on Jack Daniels' Running Formula:
 * - E (Easy): 59%-84% of VDOT max pace
 * - M (Marathon): 75%-84% of VDOT max pace
 * - T (Threshold): 84%-88% of VDOT max pace
 * - I (Interval): 95%-100% of VDOT max pace
 * - R (Repetition): 107%+ of VDOT max pace
 */

export type PaceZoneType = 'E' | 'M' | 'T' | 'I' | 'R';

export interface PaceZone {
  paceSecondsPerKm: number;
  description: string;
}

export interface PaceZones {
  vdot: number;
  zones: Record<PaceZoneType, number>;
  descriptions: Record<PaceZoneType, string>;
}

// Percentage ranges for each zone (as decimal)
const ZONE_PERCENTAGES: Record<PaceZoneType, { min: number; max: number; description: string }> = {
  E: { min: 0.59, max: 0.84, description: 'Easy run - conversational pace' },
  M: { min: 0.75, max: 0.84, description: 'Marathon pace - sustainable for long runs' },
  T: { min: 0.84, max: 0.88, description: 'Threshold pace - lactate threshold' },
  I: { min: 0.95, max: 1.00, description: 'Interval pace - VO2max development' },
  R: { min: 1.07, max: 1.20, description: 'Repetition pace - speed/cadence work' },
};

/**
 * Get the velocity (meters per minute) corresponding to VDOT
 * Inverse of the VO2 formula used in calculateVdot
 */
function vdotToVelocity(vdot: number): number {
  // From VO2 = -4.6 + 0.182258 * v + 0.000104 * v^2
  // Solving for v: v = (-0.182258 + sqrt(0.0332 + 0.000416 * (VO2 + 4.6))) / 0.000208
  const a = 0.000104;
  const b = 0.182258;
  const c = -(vdot + 4.6);

  const discriminant = b * b - 4 * a * c;
  const velocityMpm = (-b + Math.sqrt(discriminant)) / (2 * a);

  return velocityMpm;
}

/**
 * Convert velocity (meters per minute) to pace (seconds per kilometer)
 */
function velocityToPaceSecondsPerKm(velocityMpm: number): number {
  // velocity = meters per minute
  // pace = seconds per kilometer = (1000 meters / velocity) * 60 seconds
  const secondsPerKm = (1000 / velocityMpm) * 60;
  return Math.round(secondsPerKm);
}

/**
 * Get pace zones for a given VDOT
 * @param vdot - VDOT value
 * @returns Pace zones with paces in seconds per kilometer
 */
export function getPaceZones(vdot: number): PaceZones {
  const vdotVelocity = vdotToVelocity(vdot);

  const zones: Record<PaceZoneType, number> = {
    E: 0,
    M: 0,
    T: 0,
    I: 0,
    R: 0,
  };

  const descriptions: Record<PaceZoneType, string> = {
    E: ZONE_PERCENTAGES.E.description,
    M: ZONE_PERCENTAGES.M.description,
    T: ZONE_PERCENTAGES.T.description,
    I: ZONE_PERCENTAGES.I.description,
    R: ZONE_PERCENTAGES.R.description,
  };

  // Calculate pace for each zone
  for (const zone of ['E', 'M', 'T', 'I', 'R'] as PaceZoneType[]) {
    const percentages = ZONE_PERCENTAGES[zone];
    // Use the midpoint of the percentage range
    const midpointPercentage = (percentages.min + percentages.max) / 2;
    const zoneVelocity = vdotVelocity * midpointPercentage;
    zones[zone] = velocityToPaceSecondsPerKm(zoneVelocity);
  }

  return { vdot, zones, descriptions };
}

/**
 * Get pace for a specific zone
 * @param vdot - VDOT value
 * @param zone - Zone type (E, M, T, I, R)
 * @returns Pace in seconds per kilometer
 */
export function getZonePace(vdot: number, zone: PaceZoneType): number {
  const zones = getPaceZones(vdot);
  return zones.zones[zone];
}

/**
 * Get pace zones using simple percentage of VDOT max pace
 * This is a simplified version that calculates paces directly from velocity
 */
export function getPaceZonesSimple(vdot: number): PaceZones {
  // Reference: at VDOT 50, E pace is about 5:50/km (350 sec/km)
  // Using this to calibrate the relationship

  const zones = getPaceZones(vdot);
  return zones;
}
