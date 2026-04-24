/**
 * Unit Model Types
 *
 * Defines the types for training units (the smallest atomic unit of training)
 */

import type { PaceZoneType } from '../vdot';

// Unit type: run, rest, or other
export type UnitType = 'run' | 'rest' | 'other';

// Pace mode: vdot-based or custom
export type PaceMode = 'vdot' | 'custom';

// Standard type: time or distance
export type StandardType = 'time' | 'distance';

// VDOT zone expression like 'E', 'E+10', 'R-5'
export type VdotExpression = `${PaceZoneType}${'+' | '-'}${number}` | PaceZoneType;

// Feeling after training
export type Feeling = 'easy' | 'moderate' | 'hard' | 'painful';

// Run unit
export interface RunUnit {
  type: 'run';
  paceMode: PaceMode;
  paceValue: VdotExpression | string; // vdot: 'E+10'; custom: '4:30'
  standardType: StandardType;
  standardValue: number; // seconds (time) or centimeters (distance)
}

// Rest unit
export interface RestUnit {
  type: 'rest';
  standard: StandardType;
  standardValue: number; // seconds or centimeters
}

// Other unit (cross-training, etc.)
export interface OtherUnit {
  type: 'other';
  content: string;
}

// Union type for all units
export type Unit = RunUnit | RestUnit | OtherUnit;

// Create unit input types
export interface CreateRunUnitInput {
  paceMode: PaceMode;
  paceValue: string;
  standardType: StandardType;
  standardValue: number;
}

export interface CreateRestUnitInput {
  standard: StandardType;
  standardValue: number;
}

export interface CreateOtherUnitInput {
  content: string;
}
