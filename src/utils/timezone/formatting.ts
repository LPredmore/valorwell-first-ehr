import { DateTime } from 'luxon';
import { ensureIANATimeZone, TIMEZONE_OPTIONS, getUserTimeZone } from './core';
import { TimeZoneError } from './TimeZoneError';

export type DateTimeFormat = 
  | 'DATE_FULL'           // September 21, 2024
  | 'DATE_SHORT'          // 9/21/2024
  | 'TIME_12H'            // 3:45 PM
  | 'TIME_24H'            // 15:45
  | 'DATETIME_FULL'       // September 21, 2024, 3:45 PM
  | 'DATETIME_SHORT'      // 9/21/2024, 3:45 PM
  | 'ISO'                 // 2024-09-21T15:45:00.000Z
  | 'SQL'                 // 2024-09-21 15:45:00
  | 'RELATIVE';           // 3 days ago, in 5 hours, etc.

/**
 * Format timezone for display
 */
export function formatTimeZoneDisplay(timeZone: string): string {
  const validTimeZone = ensureIANATimeZone(timeZone);
  
  const tzOption = TIMEZONE_OPTIONS.find(option => option.value === validTimeZone);
  if (tzOption) {
    return tzOption.label;
  }
  
  try {
    const now = DateTime.now().setZone(validTimeZone);
    return now.toFormat('ZZZZ');
  } catch (error) {
    return validTimeZone.split('/').pop()?.replace('_', ' ') || validTimeZone;
  }
}

/**
 * Format DateTime to string
 */
export function formatDateTime(
  dateTime: DateTime | Date | string, 
  format: string | DateTimeFormat = 'DATETIME_SHORT', 
  timeZone?: string
): string {
  try {
    let dt: DateTime;
    
    if (dateTime instanceof DateTime) {
      dt = dateTime;
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime);
    } else {
      dt = DateTime.fromISO(dateTime);
    }
    
    if (timeZone) {
      const validTimeZone = ensureIANATimeZone(timeZone);
      dt = dt.setZone(validTimeZone);
    }
    
    switch (format) {
      case 'DATE_FULL':
        return dt.toFormat('MMMM d, yyyy');
      case 'DATE_SHORT':
        return dt.toFormat('M/d/yyyy');
      case 'TIME_12H':
        return dt.toFormat('h:mm a');
      case 'TIME_24H':
        return dt.toFormat('HH:mm');
      case 'DATETIME_FULL':
        return dt.toFormat('MMMM d, yyyy, h:mm a');
      case 'DATETIME_SHORT':
        return dt.toFormat('M/d/yyyy, h:mm a');
      case 'ISO':
        return dt.toISO() || '';
      case 'SQL':
        return dt.toFormat('yyyy-MM-dd HH:mm:ss');
      case 'RELATIVE':
        return dt.toRelative() || dt.toFormat('M/d/yyyy, h:mm a');
      default:
        return dt.toFormat(format);
    }
  } catch (error) {
    console.error('[TimeZoneService] Error formatting datetime:', error);
    throw new TimeZoneError(
      'Failed to format datetime',
      'FORMAT_ERROR',
      { dateTime, format, timeZone }
    );
  }
}

/**
 * Format time string or Date to formatted time string
 */
export function formatTime(time: string | Date, format: string = 'h:mm a', timeZone?: string): string {
  try {
    let dt: DateTime;
    
    if (time instanceof Date) {
      dt = DateTime.fromJSDate(time);
    } else if (typeof time === 'string') {
      if (time.includes('T') && (time.includes('Z') || time.includes('+'))) {
        dt = DateTime.fromISO(time);
      } else if (time.includes(':')) {
        const parts = time.split(':').map(Number);
        dt = DateTime.now().set({
          hour: parts[0] || 0,
          minute: parts[1] || 0,
          second: parts[2] || 0,
          millisecond: 0
        });
      } else {
        throw new TimeZoneError('Unsupported time format', 'FORMAT_ERROR', { time });
      }
    } else {
      throw new TimeZoneError('Time must be a string or Date object', 'TYPE_ERROR', { time });
    }
    
    if (timeZone) {
      const validTimeZone = ensureIANATimeZone(timeZone);
      dt = dt.setZone(validTimeZone);
    }
    
    return dt.toFormat(format);
  } catch (error) {
    console.error('[TimeZoneService] Error formatting time:', error);
    return String(time);
  }
}

/**
 * Format a date (DateTime, Date, or string) to a string
 */
export function formatDate(date: DateTime | Date | string, format: string = 'yyyy-MM-dd'): string {
  try {
    let dt: DateTime;
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = DateTime.fromISO(date);
    }
    return dt.toFormat(format);
  } catch (error) {
    console.error('[TimeZoneService] Error formatting date:', error);
    throw new TimeZoneError(
      'Failed to format date',
      'FORMAT_ERROR',
      { date, format }
    );
  }
}

/**
 * Format a time to 12-hour format
 */
export function formatDateToTime12Hour(date: Date | string): string {
  try {
    const dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
    return dt.toFormat('h:mm a');
  } catch (error) {
    console.error('[TimeZoneService] Error formatting to 12-hour time:', error);
    throw new TimeZoneError(
      'Failed to format time to 12-hour format',
      'FORMAT_ERROR',
      { date }
    );
  }
}

/**
 * Get weekday name from DateTime
 */
export function getWeekdayName(date: DateTime, format: 'long' | 'short' = 'long'): string {
  try {
    return date.toFormat(format === 'long' ? 'cccc' : 'ccc');
  } catch (error) {
    console.error('[TimeZoneService] Error getting weekday name:', error);
    throw new TimeZoneError(
      'Failed to get weekday name',
      'FORMAT_ERROR',
      { date: date.toString(), format }
    );
  }
}

/**
 * Get month name from DateTime
 */
export function getMonthName(date: DateTime, format: 'long' | 'short' = 'long'): string {
  try {
    return date.toFormat(format === 'long' ? 'MMMM' : 'MMM');
  } catch (error) {
    console.error('[TimeZoneService] Error getting month name:', error);
    throw new TimeZoneError(
      'Failed to get month name',
      'FORMAT_ERROR',
      { date: date.toString(), format }
    );
  }
}

/**
 * Get display name from IANA timezone
 */
export function getDisplayNameFromIANA(timeZone: string): string {
  const validTimeZone = ensureIANATimeZone(timeZone);
  const option = TIMEZONE_OPTIONS.find(tz => tz.value === validTimeZone);
  return option?.label || validTimeZone;
}

/**
 * Get IANA timezone from display name
 */
export function getIANAFromDisplayName(displayName: string): string {
  const option = TIMEZONE_OPTIONS.find(tz => tz.label === displayName);
  if (option) {
    return option.value;
  }
  
  // Use system timezone as fallback
  const systemZone = getUserTimeZone();
  console.warn(`No IANA timezone found for display name: ${displayName}, using system timezone: ${systemZone}`);
  return systemZone;
}

/**
 * Get timezone offset string (e.g. "+05:00")
 */
export function getTimezoneOffsetString(timeZone: string): string {
  try {
    const validTimeZone = ensureIANATimeZone(timeZone);
    return DateTime.now().setZone(validTimeZone).toFormat('ZZ');
  } catch (error) {
    console.error('[TimeZoneService] Error getting timezone offset:', error);
    throw new TimeZoneError(
      'Failed to get timezone offset',
      'TIMEZONE_OFFSET_ERROR',
      { timeZone }
    );
  }
}
