/**
 * VDOT Engine
 *
 * Core module for VDOT calculation and pace zone management.
 * Based on Jack Daniels' Running Formula.
 *
 * @example
 * import { calculateVdot, getPaceZones } from './vdot';
 *
 * const vdot = calculateVdot(5, 20 * 60); // 5K in 20 minutes
 * const zones = getPaceZones(vdot);
 * console.log(zones.zones.E); // Easy pace in seconds/km
 */

// Calculate VDOT from distance and time
export { calculateVdot, estimateTime, TARGET_DISTANCE_MAP } from './calculateVdot';

// Get pace zones from VDOT
export { getPaceZones, getZonePace, getPaceZonesSimple } from './getPaceZones';
export type { PaceZone, PaceZones, PaceZoneType } from './getPaceZones';

// Pace adjustment expressions
export { adjustPace, parseAdjustExpression, getPaceFromExpression, parsePace } from './adjustPace';
export type { ParseAdjustResult } from './adjustPace';

// Formatters
export { formatPace, formatPaceWithZone, ZONE_COLORS, ZONE_NAMES } from './formatters';
