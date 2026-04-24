/**
 * Distance Formatter
 *
 * Handles conversion between kilometers (storage) and user-friendly display
 *
 * Storage: kilometers as number (e.g., 5.0, 0.8)
 * Display: <1km shows as meters (800m), >=1km shows as km (5.0km)
 */

/**
 * Format kilometers to user-friendly display
 * @param km - Distance in kilometers
 * @returns Formatted string like '800m', '5.0km', '21.1km'
 */
export function formatDistance(km: number): string {
  if (km < 0) {
    return '0m';
  }

  // If less than 1 km, show as meters
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters}m`;
  }

  // If 1 km or more, show as km with one decimal
  if (km < 10) {
    return `${km.toFixed(1)}km`;
  }

  // For larger distances, show without decimal if whole number
  if (Number.isInteger(km)) {
    return `${km}km`;
  }

  return `${km.toFixed(1)}km`;
}

/**
 * Format centimeters to user-friendly display
 * (Used for database storage where distance is stored as centimeters)
 * @param cm - Distance in centimeters (e.g., 8000 = 80m = 0.08km... wait, that's wrong)
 * @returns Formatted string
 *
 * Note: In the database, distance for units is stored in a simplified format
 * For simplicity, we'll store as meters directly (e.g., 5000 = 5000 meters = 5km)
 */
export function formatDistanceFromMeters(meters: number): string {
  const km = meters / 1000;
  return formatDistance(km);
}

/**
 * Convert meters to kilometers
 */
export function metersToKm(meters: number): number {
  return meters / 1000;
}

/**
 * Convert kilometers to meters
 */
export function kmToMeters(km: number): number {
  return km * 1000;
}

/**
 * Parse distance string to kilometers
 * @param str - String like '5km', '800m', '5.5'
 * @returns Kilometers
 */
export function parseDistance(str: string): number {
  const trimmed = str.trim().toLowerCase();

  if (trimmed.endsWith('km')) {
    return parseFloat(trimmed.slice(0, -2));
  }

  if (trimmed.endsWith('m')) {
    return parseFloat(trimmed.slice(0, -1)) / 1000;
  }

  // Just a number
  return parseFloat(trimmed);
}

/**
 * Format distance for standard display (always show km)
 * @param km - Distance in kilometers
 * @returns Formatted string like '5.0km', '0.8km'
 */
export function formatDistanceStandard(km: number): string {
  if (km < 0) {
    return '0.0km';
  }

  if (km < 10) {
    return `${km.toFixed(1)}km`;
  }

  if (Number.isInteger(km)) {
    return `${km}km`;
  }

  return `${km.toFixed(1)}km`;
}
