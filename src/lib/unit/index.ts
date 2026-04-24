/**
 * Unit Index
 *
 * Re-exports all unit-related functions
 */

// Types
export type {
  Unit,
  RunUnit,
  RestUnit,
  OtherUnit,
  UnitType,
  PaceMode,
  StandardType,
  VdotExpression,
  Feeling,
  CreateRunUnitInput,
  CreateRestUnitInput,
  CreateOtherUnitInput,
} from './types';

// Factory
export {
  createRunUnit,
  createRestUnit,
  createOtherUnit,
  createUnitFromRow,
  getUnitDescription,
} from './factory';

// Duration formatter
export {
  formatDuration,
  parseDuration,
  formatDurationReadable,
} from './formatDuration';

// Distance formatter
export {
  formatDistance,
  formatDistanceFromMeters,
  metersToKm,
  kmToMeters,
  parseDistance,
  formatDistanceStandard,
} from './formatDistance';

// Pace formatter
export {
  formatPace,
  parsePace,
  formatPaceWithLabel,
  calculatePace,
  calculateDuration,
} from './formatPace';
