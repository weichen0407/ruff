/**
 * Duration Formatter
 *
 * Handles conversion between seconds (storage) and hh:mm:ss (display)
 */

/**
 * Format seconds to hh:mm:ss string
 * @param seconds - Total seconds
 * @returns Formatted string like '1:01:01', '45:00', '5'
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${secs}`;
  }
}

/**
 * Parse hh:mm:ss string to seconds
 * @param str - String like '1:01:01', '45:00', '5'
 * @returns Total seconds
 */
export function parseDuration(str: string): number {
  const parts = str.trim().split(':').map(Number);

  if (parts.length === 1) {
    // Just seconds: '5'
    return parts[0];
  } else if (parts.length === 2) {
    // mm:ss: '45:00'
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // hh:mm:ss: '1:01:01'
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  throw new Error(`Invalid duration format: ${str}`);
}

/**
 * Format seconds to human-readable string
 * @param seconds - Total seconds
 * @returns Like '1小时1分1秒', '45分', '5秒'
 */
export function formatDurationReadable(seconds: number): string {
  if (seconds < 0) {
    return '0秒';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}小时`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}分`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}秒`);
  }

  return parts.join('');
}
