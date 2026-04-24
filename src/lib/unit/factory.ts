/**
 * Unit Factory
 *
 * Creates unit instances with proper typing
 */

import type {
  Unit,
  RunUnit,
  RestUnit,
  OtherUnit,
  CreateRunUnitInput,
  CreateRestUnitInput,
  CreateOtherUnitInput,
} from './types';

/**
 * Create a run unit
 */
export function createRunUnit(input: CreateRunUnitInput): RunUnit {
  return {
    type: 'run',
    paceMode: input.paceMode,
    paceValue: input.paceValue,
    standardType: input.standardType,
    standardValue: input.standardValue,
  };
}

/**
 * Create a rest unit
 */
export function createRestUnit(input: CreateRestUnitInput): RestUnit {
  return {
    type: 'rest',
    standard: input.standard,
    standardValue: input.standardValue,
  };
}

/**
 * Create an other unit (cross-training, etc.)
 */
export function createOtherUnit(input: CreateOtherUnitInput): OtherUnit {
  return {
    type: 'other',
    content: input.content,
  };
}

/**
 * Create a unit from database row
 */
export function createUnitFromRow(row: Record<string, unknown>): Unit {
  const type = row.type as 'run' | 'rest' | 'other';

  if (type === 'run') {
    return {
      type: 'run',
      paceMode: row.pace_mode as 'vdot' | 'custom',
      paceValue: row.pace_value as string,
      standardType: row.standard_type as 'time' | 'distance',
      standardValue: row.standard_value as number,
    };
  } else if (type === 'rest') {
    return {
      type: 'rest',
      standard: row.standard as 'time' | 'distance',
      standardValue: row.standard_value as number,
    };
  } else {
    return {
      type: 'other',
      content: row.content as string,
    };
  }
}

/**
 * Get unit display description
 */
export function getUnitDescription(unit: Unit): string {
  switch (unit.type) {
    case 'run':
      return `Run: ${unit.paceValue} - ${unit.standardType} ${unit.standardValue}`;
    case 'rest':
      return `Rest: ${unit.standard} ${unit.standardValue}`;
    case 'other':
      return `Other: ${unit.content}`;
  }
}
