
import { DateTime } from 'luxon';
import { TimeZoneError } from './TimeZoneError';
import { TimeZoneService } from '@/utils/timezone';

/**
 * Utility functions for standardizing DateTime handling across the application
 * These functions help prevent type mismatches between string and Luxon DateTime objects
 */

/**
 * Ensures a value is a valid Luxon DateTime object
 * @param value - A DateTime object, Date object, ISO string, or any other value
 * @param timeZone - The timezone to use if converting from a string or Date
 * @returns A Luxon DateTime object
 * @throws TimeZoneError if the value cannot be converted to a valid DateTime
 */
export function ensureDateTime(value: DateTime | Date | string, timeZone: string): DateTime {
  // If it's already a DateTime, just return it
  if (value instanceof DateTime) {
    if (!value.isValid) {
      throw new TimeZoneError('Invalid DateTime object provided', 'INVALID_DATETIME');
    }
    return value;
  }

  // If it's a Date object, convert it to DateTime
  if (value instanceof Date) {
    const dt = DateTime.fromJSDate(value).setZone(timeZone);
    if (!dt.isValid) {
      throw new TimeZoneError('Invalid Date object provided', 'INVALID_DATE');
    }
    return dt;
  }

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    // Try ISO format first
    let dt = DateTime.fromISO(value, { zone: timeZone });
    
    // If that fails, try other formats
    if (!dt.isValid) {
      // Try SQL date format
      dt = DateTime.fromSQL(value, { zone: timeZone });
    }
    
    if (!dt.isValid) {
      // Try HTTP date format
      dt = DateTime.fromHTTP(value, { zone: timeZone });
    }
    
    if (dt.isValid) {
      return dt;
    }
    
    throw new TimeZoneError(`Could not parse string "${value}" as DateTime`, 'PARSE_ERROR');
  }

  throw new TimeZoneError(`Unsupported value type: ${typeof value}`, 'TYPE_ERROR');
}

/**
 * Converts a DateTime object to an ISO string
 * @param dateTime - The DateTime object to convert
 * @returns An ISO string representation of the DateTime
 */
export function toISOString(dateTime: DateTime | Date | string, timeZone: string): string {
  const dt = ensureDateTime(dateTime, timeZone);
  return dt.toISO();
}

/**
 * Safely converts a value to a DateTime object in the specified timezone
 * Returns null instead of throwing if the conversion fails
 * @param value - The value to convert
 * @param timeZone - The timezone to use
 * @returns A DateTime object or null if conversion fails
 */
export function safeToDateTime(value: any, timeZone: string): DateTime | null {
  try {
    return ensureDateTime(value, timeZone);
  } catch (error) {
    console.warn('Failed to convert value to DateTime:', error);
    return null;
  }
}

/**
 * Converts a string or Date to a DateTime object for use in calendar operations
 * @param date - The date to convert
 * @param timeZone - The timezone to use
 * @returns A DateTime object
 */
export function calendarDateToDateTime(date: string | Date, timeZone: string): DateTime {
  try {
    return ensureDateTime(date, timeZone);
  } catch (error) {
    throw new TimeZoneError(
      `Failed to convert calendar date: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CALENDAR_CONVERSION_ERROR'
    );
  }
}

/**
 * Compares two DateTime-like values for equality
 * @param a - First value
 * @param b - Second value
 * @param timeZone - Timezone to use for conversion
 * @returns True if the DateTimes represent the same moment
 */
export function areDateTimesEqual(
  a: DateTime | Date | string,
  b: DateTime | Date | string,
  timeZone: string
): boolean {
  try {
    const dtA = ensureDateTime(a, timeZone);
    const dtB = ensureDateTime(b, timeZone);
    return dtA.equals(dtB);
  } catch (error) {
    return false;
  }
}

/**
 * Converts a DateTime-like value to a format suitable for API requests
 * @param value - The value to convert
 * @param timeZone - The timezone to use
 * @returns An ISO string in UTC
 */
export function toAPIDateTime(value: DateTime | Date | string, timeZone: string): string {
  const dt = ensureDateTime(value, timeZone);
  return dt.toUTC().toISO();
}

/**
 * Converts a DateTime-like value to a user-friendly display format
 * @param value - The value to convert
 * @param timeZone - The timezone to use
 * @param format - The format to use (defaults to 'datetime')
 * @returns A formatted string
 */
export function toDisplayDateTime(
  value: DateTime | Date | string,
  timeZone: string,
  format: 'datetime' | 'date' | 'time' = 'datetime'
): string {
  const dt = ensureDateTime(value, timeZone);
  
  switch (format) {
    case 'date':
      return TimeZoneService.formatDate(dt, 'full');
    case 'time':
      return TimeZoneService.formatTime(dt.toJSDate(), 'h:mm a', timeZone);
    case 'datetime':
    default:
      return TimeZoneService.formatDateTime(dt, 'full', timeZone);
  }
}
