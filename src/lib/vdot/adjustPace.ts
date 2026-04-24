/**
 * Pace adjustment expression parser and applier
 *
 * Supports expressions like:
 * - 'E+10' - E zone pace + 10 seconds/km
 * - 'M-5' - M zone pace - 5 seconds/km
 * - 'T+0' - T zone pace unchanged
 * - 'R-10' - R zone pace - 10 seconds/km
 * - 'E' - Just E zone pace
 * - 'M' - Just M zone pace
 */

import type { PaceZoneType } from './getPaceZones';
import { getZonePace } from './getPaceZones';

/**
 * Result of parsing an adjustment expression
 */
export interface ParseAdjustResult {
  zone: PaceZoneType | null;
  adjustment: number; // seconds per km, can be negative
  isValid: boolean;
  error?: string;
}

/**
 * Parse a pace adjustment expression
 * @param expression - Expression like 'E+10', 'R-5', 'M', etc.
 * @returns Parsed result
 */
export function parseAdjustExpression(expression: string): ParseAdjustResult {
  if (!expression || typeof expression !== 'string') {
    return {
      zone: null,
      adjustment: 0,
      isValid: false,
      error: 'Expression is empty',
    };
  }

  const trimmed = expression.trim().toUpperCase();

  // Match zone letter (E, M, T, I, R) optionally followed by +/-
  // and a number
  const match = trimmed.match(/^([EMTIR])([+-]?\d*)?$/);

  if (!match) {
    return {
      zone: null,
      adjustment: 0,
      isValid: false,
      error: `Invalid expression: ${expression}`,
    };
  }

  const zone = match[1] as PaceZoneType;
  const adjustmentStr = match[2];

  // If no adjustment is specified (just 'E', 'M', etc.), use 0
  let adjustment = 0;
  if (adjustmentStr !== undefined && adjustmentStr !== '') {
    adjustment = parseInt(adjustmentStr, 10);
    if (isNaN(adjustment)) {
      return {
        zone: null,
        adjustment: 0,
        isValid: false,
        error: `Invalid adjustment value: ${adjustmentStr}`,
      };
    }
  }

  return {
    zone,
    adjustment,
    isValid: true,
  };
}

/**
 * Apply pace adjustment to VDOT-based zone pace
 * @param vdot - VDOT value
 * @param expression - Adjustment expression like 'E+10', 'R-5'
 * @returns Adjusted pace in seconds per kilometer
 */
export function adjustPace(vdot: number, expression: string): number {
  const parsed = parseAdjustExpression(expression);

  if (!parsed.isValid || !parsed.zone) {
    throw new Error(`Invalid adjustment expression: ${expression}`);
  }

  const basePace = getZonePace(vdot, parsed.zone);
  return basePace + parsed.adjustment;
}

/**
 * Get pace value from expression (handles both zone references and custom paces)
 * @param vdot - VDOT value
 * @param expression - 'E+10', 'R-5', or custom pace like '4:30'
 * @returns Pace in seconds per kilometer
 */
export function getPaceFromExpression(vdot: number, expression: string): number {
  const trimmed = expression.trim().toUpperCase();

  // Check if it's a zone expression (starts with E, M, T, I, R)
  if (/^[EMTIR]/.test(trimmed)) {
    return adjustPace(vdot, expression);
  }

  // Otherwise, treat as custom pace in mm:ss format
  return parsePace(expression);
}

/**
 * Parse a pace string in mm:ss format to seconds per kilometer
 * @param paceStr - Pace string like '4:30', '5:00'
 * @returns Pace in seconds per kilometer
 */
export function parsePace(paceStr: string): number {
  const parts = paceStr.trim().split(':');

  if (parts.length !== 2) {
    throw new Error(`Invalid pace format: ${paceStr}. Expected mm:ss`);
  }

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);

  if (isNaN(minutes) || isNaN(seconds)) {
    throw new Error(`Invalid pace format: ${paceStr}`);
  }

  if (minutes < 0 || seconds < 0 || seconds >= 60) {
    throw new Error(`Invalid pace values: ${paceStr}`);
  }

  return minutes * 60 + seconds;
}
