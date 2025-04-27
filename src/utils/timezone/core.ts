
import { DateTime } from 'luxon';
import { TimeZoneError } from './TimeZoneError';

/**
 * Map of common timezone display names to IANA format
 */
export const TIMEZONE_NAME_MAP: Record<string, string> = {
  'Eastern Time (ET)': 'America/New_York',
  'Central Time (CT)': 'America/Chicago',
  'Mountain Time (MT)': 'America/Denver',
  'Pacific Time (PT)': 'America/Los_Angeles',
  'Alaska Time': 'America/Anchorage',
  'Hawaii Time': 'Pacific/Honolulu',
  'Arizona': 'America/Phoenix'
};

/**
 * Common timezone options
 */
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' }
];

/**
 * Ensure a timezone string is in valid IANA format
 * @param timeZone Input timezone string
 * @returns Valid IANA timezone
 */
export function ensureIANATimeZone(timeZone?: string): string {
  try {
    if (!timeZone) {
      console.warn('[TimeZoneService] No timezone provided, defaulting to UTC');
      return 'UTC';
    }
    
    const now = DateTime.now();
    const validZone = now.setZone(timeZone);
    
    if (!validZone.isValid) {
      console.error(`[TimeZoneService] Invalid timezone: ${timeZone}, reason: ${validZone.invalidReason}, defaulting to UTC`);
      return 'UTC';
    }
    
    return timeZone;
  } catch (error) {
    console.error('[TimeZoneService] Error validating timezone:', error);
    return 'UTC';
  }
}

/**
 * Convert DateTime to UTC
 * @param dateTime DateTime object to convert
 * @returns DateTime in UTC
 */
export function toUTC(dateTime: DateTime): DateTime {
  try {
    return dateTime.toUTC();
  } catch (error) {
    console.error('[TimeZoneService] Error converting to UTC:', error);
    throw new TimeZoneError(
      'Failed to convert time to UTC',
      'UTC_CONVERSION_ERROR',
      { dateTime: dateTime.toString() }
    );
  }
}

/**
 * Convert UTC ISO string to DateTime in specified timezone
 * @param utcStr UTC ISO string
 * @param timeZone Target timezone
 * @returns DateTime in specified timezone
 */
export function fromUTC(utcStr: string, timeZone: string): DateTime {
  try {
    const validTimeZone = ensureIANATimeZone(timeZone);
    return DateTime.fromISO(utcStr).setZone(validTimeZone);
  } catch (error) {
    console.error('[TimeZoneService] Error converting from UTC:', error);
    throw new TimeZoneError(
      'Failed to convert time from UTC',
      'UTC_CONVERSION_ERROR',
      { utcStr, timeZone }
    );
  }
}

/**
 * Parse datetime string with timezone
 * @param dateTimeStr Datetime string
 * @param timeZone Timezone to parse with
 * @returns DateTime object
 */
export function parseWithZone(dateTimeStr: string, timeZone: string): DateTime {
  try {
    const validTimeZone = ensureIANATimeZone(timeZone);
    return DateTime.fromISO(dateTimeStr, { zone: validTimeZone });
  } catch (error) {
    console.error('[TimeZoneService] Error parsing datetime with timezone:', error);
    throw new TimeZoneError(
      'Failed to parse datetime with timezone',
      'PARSE_ERROR',
      { dateTimeStr, timeZone }
    );
  }
}

/**
 * Get current DateTime in specified timezone
 * @param timeZone Target timezone
 * @returns Current DateTime in specified timezone
 */
export function getCurrentDateTime(timeZone?: string): DateTime {
  try {
    const validTimeZone = ensureIANATimeZone(timeZone);
    return DateTime.now().setZone(validTimeZone);
  } catch (error) {
    console.error('[TimeZoneService] Error getting current datetime:', error);
    throw new TimeZoneError(
      'Failed to get current datetime',
      'CURRENT_TIME_ERROR',
      { timeZone }
    );
  }
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: DateTime, date2: DateTime): boolean {
  return date1.hasSame(date2, 'day');
}

/**
 * Add time duration to DateTime
 */
export function addDuration(date: DateTime, amount: number, unit: string): DateTime {
  try {
    return date.plus({ [unit]: amount });
  } catch (error) {
    console.error('[TimeZoneService] Error adding duration:', error);
    throw new TimeZoneError(
      'Failed to add duration to date',
      'DURATION_ERROR',
      { date: date.toString(), amount, unit }
    );
  }
}

/**
 * Create DateTime from separate date and time strings
 */
export function createDateTime(dateStr: string, timeStr: string, timeZone: string): DateTime {
  try {
    const validTimeZone = ensureIANATimeZone(timeZone);
    const timeFormat = timeStr.includes(':') ? 
      (timeStr.split(':').length > 2 ? 'HH:mm:ss' : 'HH:mm') : 'HH';
    
    return DateTime.fromFormat(`${dateStr} ${timeStr}`, `yyyy-MM-dd ${timeFormat}`, { zone: validTimeZone });
  } catch (error) {
    console.error('[TimeZoneService] Error creating datetime:', error);
    throw new TimeZoneError(
      'Failed to create datetime from date and time strings',
      'CREATE_DATETIME_ERROR',
      { dateStr, timeStr, timeZone }
    );
  }
}

/**
 * Convert DateTime between timezones
 */
export function convertDateTime(dateTime: DateTime, fromZone: string, toZone: string): DateTime {
  try {
    const validFromZone = ensureIANATimeZone(fromZone);
    const validToZone = ensureIANATimeZone(toZone);
    
    return dateTime.setZone(validFromZone).setZone(validToZone);
  } catch (error) {
    console.error('[TimeZoneService] Error converting between timezones:', error);
    throw new TimeZoneError(
      'Failed to convert between timezones',
      'TIMEZONE_CONVERSION_ERROR',
      { dateTime: dateTime.toString(), fromZone, toZone }
    );
  }
}

/**
 * Get browser's timezone
 */
export function getUserTimeZone(): string {
  try {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return ensureIANATimeZone(browserTimeZone);
  } catch (error) {
    console.warn('[TimeZoneService] Error detecting browser timezone:', error);
    return 'America/Chicago';
  }
}

/**
 * Convert date/time to UTC timestamp
 * 
 * This function supports multiple parameter combinations:
 * 1. (dateTime: Date | string, timeZone: string)
 * 2. (dateStr: string, timeStr: string, timeZone: string)
 */
export function toUTCTimestamp(dateOrDateStr: Date | string, timeOrTimeZone: string, timeZone?: string): string {
  try {
    // Case 1: dateStr, timeStr, timeZone
    if (typeof dateOrDateStr === 'string' && timeZone) {
      const validTimeZone = ensureIANATimeZone(timeZone);
      return createDateTime(dateOrDateStr, timeOrTimeZone, validTimeZone)
        .toUTC()
        .toISO() || '';
    }
    
    // Case 2: date/dateStr, timeZone
    let dt: DateTime;
    if (dateOrDateStr instanceof Date) {
      dt = DateTime.fromJSDate(dateOrDateStr);
    } else {
      dt = DateTime.fromISO(dateOrDateStr);
    }
    
    // Set to the specified timezone before converting to UTC
    const validTimeZone = ensureIANATimeZone(timeOrTimeZone);
    return dt.setZone(validTimeZone).toUTC().toISO() || '';
  } catch (error) {
    console.error('[TimeZoneService] Error converting to UTC timestamp:', error);
    throw new TimeZoneError(
      'Failed to convert to UTC timestamp',
      'UTC_TIMESTAMP_ERROR',
      { dateOrDateStr, timeOrTimeZone, timeZone }
    );
  }
}

/**
 * Convert UTC timestamp to DateTime in specified timezone
 */
export function fromUTCTimestamp(timestamp: string, timeZone: string): DateTime {
  try {
    const validTimeZone = ensureIANATimeZone(timeZone);
    return DateTime.fromISO(timestamp).setZone(validTimeZone);
  } catch (error) {
    console.error('[TimeZoneService] Error converting from UTC timestamp:', error);
    throw new TimeZoneError(
      'Failed to convert from UTC timestamp',
      'UTC_TIMESTAMP_ERROR',
      { timestamp, timeZone }
    );
  }
}
