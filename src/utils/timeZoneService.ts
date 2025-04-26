
/**
 * TimeZoneService - THE OFFICIAL SOURCE OF TRUTH for all timezone operations
 * 
 * Core Principles:
 * - All timezone operations MUST use Luxon through this class
 * - All dates/times MUST be stored in UTC in the database
 * - All timezone conversions MUST happen at the display layer only
 * - All timezone strings MUST be in IANA format (e.g., 'America/New_York')
 */

import { DateTime, Duration } from 'luxon';
import { CalendarEvent } from '@/types/calendar';

/**
 * @typedef TimeUnit Type representing valid Luxon time units
 */
export type TimeUnit = 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';

/**
 * @typedef DateTimeFormat Standard formats available for date/time
 */
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
 * List of common IANA timezone options for UI selection
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

// Also export as timezoneOptions for backward compatibility
export const timezoneOptions = TIMEZONE_OPTIONS;

/**
 * Mapping between common timezone display names and IANA format
 */
const TIMEZONE_NAME_MAP: Record<string, string> = {
  'Eastern Time (ET)': 'America/New_York',
  'Central Time (CT)': 'America/Chicago',
  'Mountain Time (MT)': 'America/Denver',
  'Pacific Time (PT)': 'America/Los_Angeles',
  'Alaska Time': 'America/Anchorage',
  'Hawaii Time': 'Pacific/Honolulu',
  'Arizona': 'America/Phoenix'
};

/**
 * Central TimeZoneService class for all timezone operations
 */
export class TimeZoneService {
  /**
   * List of common IANA timezone options for UI selection
   */
  static TIMEZONE_OPTIONS = TIMEZONE_OPTIONS;
  
  /**
   * Ensures a timezone string is a valid IANA timezone
   * 
   * @param timeZone Timezone string to validate
   * @returns Valid IANA timezone string
   */
  static ensureIANATimeZone(timeZone: string | null | undefined): string {
    if (!timeZone) return 'America/Chicago';
    
    try {
      // Try to create a DateTime with the given timeZone to validate it
      const test = DateTime.now().setZone(timeZone);
      if (test.invalidReason) {
        console.warn(`Invalid timezone: ${timeZone}, falling back to America/Chicago`);
        return 'America/Chicago';
      }
      return timeZone;
    } catch (error) {
      console.warn(`Error validating timezone: ${timeZone}, falling back to America/Chicago`);
      return 'America/Chicago';
    }
  }

  /**
   * Format a timezone string for display (e.g., "America/New_York" to "Eastern Time")
   * 
   * @param timeZone IANA timezone string
   * @returns Human-readable timezone string
   */
  static formatTimeZoneDisplay(timeZone: string): string {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    
    // Check if we have a predefined label
    const tzOption = TIMEZONE_OPTIONS.find(option => option.value === validTimeZone);
    if (tzOption) {
      return tzOption.label;
    }
    
    // Try to create a nice display from the IANA name
    try {
      const now = DateTime.now().setZone(validTimeZone);
      return now.toFormat('ZZZZ');
    } catch (error) {
      // Fall back to just cleaning up the IANA name
      return validTimeZone.split('/').pop()?.replace('_', ' ') || validTimeZone;
    }
  }

  /**
   * Create a DateTime object from date and time strings in a specific timezone
   * 
   * @param dateStr Date string in format yyyy-MM-dd
   * @param timeStr Time string in format HH:mm or HH:mm:ss
   * @param timeZone IANA timezone string
   * @returns Luxon DateTime object
   */
  static createDateTime(dateStr: string, timeStr: string, timeZone: string): DateTime {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    const timeFormat = timeStr.includes(':') ? (timeStr.split(':').length > 2 ? 'HH:mm:ss' : 'HH:mm') : 'HH';
    
    return DateTime.fromFormat(`${dateStr} ${timeStr}`, `yyyy-MM-dd ${timeFormat}`, { zone: validTimeZone });
  }

  /**
   * Convert a DateTime object to UTC
   * 
   * @param dateTime Luxon DateTime object
   * @returns UTC DateTime object
   */
  static toUTC(dateTime: DateTime): DateTime {
    return dateTime.toUTC();
  }

  /**
   * Convert a date and time to a UTC ISO string
   * 
   * @param dateStr Date string in format yyyy-MM-dd
   * @param timeStr Time string in format HH:mm or HH:mm:ss
   * @param timeZone IANA timezone string
   * @returns UTC ISO string
   */
  static toUTCTimestamp(dateStr: string, timeStr: string, timeZone: string): string {
    const dt = TimeZoneService.createDateTime(dateStr, timeStr, timeZone);
    return dt.toUTC().toISO();
  }

  /**
   * Convert a UTC string to a DateTime in a specific timezone
   * 
   * @param utcStr UTC string
   * @param timeZone IANA timezone string
   * @returns DateTime in the specified timezone
   */
  static fromUTC(utcStr: string, timeZone: string): DateTime {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(utcStr).setZone(validTimeZone);
  }

  /**
   * Convert a UTC timestamp to a DateTime in a specific timezone
   * 
   * @param utcTimestamp UTC timestamp string
   * @param timeZone IANA timezone string
   * @returns DateTime in the specified timezone
   */
  static fromUTCTimestamp(utcTimestamp: string, timeZone: string): DateTime {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(utcTimestamp).setZone(validTimeZone);
  }

  /**
   * Convert a DateTime between timezones
   * 
   * @param dateTime DateTime to convert
   * @param fromZone Source timezone
   * @param toZone Target timezone
   * @returns Converted DateTime
   */
  static convertDateTime(dateTime: DateTime, fromZone: string, toZone: string): DateTime {
    const validFromZone = TimeZoneService.ensureIANATimeZone(fromZone);
    const validToZone = TimeZoneService.ensureIANATimeZone(toZone);
    
    return dateTime.setZone(validFromZone).setZone(validToZone);
  }

  /**
   * Format a DateTime with a specific format in a timezone
   * 
   * @param dateTime DateTime to format
   * @param format Format string or predefined format
   * @param timeZone IANA timezone string
   * @returns Formatted date string
   */
  static formatDateTime(dateTime: DateTime | Date | string, format: string | DateTimeFormat = 'DATETIME_SHORT', timeZone?: string): string {
    let dt: DateTime;
    
    // Convert input to DateTime
    if (dateTime instanceof DateTime) {
      dt = dateTime;
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime);
    } else {
      dt = DateTime.fromISO(dateTime);
    }
    
    // Set timezone if provided
    if (timeZone) {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      dt = dt.setZone(validTimeZone);
    }
    
    // Handle predefined formats
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
        return dt.toISO();
      case 'SQL':
        return dt.toFormat('yyyy-MM-dd HH:mm:ss');
      case 'RELATIVE':
        return dt.toRelative() || dt.toFormat('M/d/yyyy, h:mm a');
      default:
        return dt.toFormat(format);
    }
  }

  /**
   * Format a time string (e.g., "14:30") to a formatted time (e.g., "2:30 PM")
   * 
   * @param time Time string or Date object
   * @param format Format string (default: 'h:mm a')
   * @param timeZone Optional timezone
   * @returns Formatted time string
   */
  static formatTime(time: string | Date, format: string = 'h:mm a', timeZone?: string): string {
    try {
      let dt: DateTime;
      
      if (time instanceof Date) {
        dt = DateTime.fromJSDate(time);
      } else if (typeof time === 'string') {
        // Handle different time formats
        if (time.includes('T') && (time.includes('Z') || time.includes('+'))) {
          // ISO format
          dt = DateTime.fromISO(time);
        } else if (time.includes(':')) {
          // HH:MM format - use today's date
          const parts = time.split(':').map(Number);
          dt = DateTime.now().set({
            hour: parts[0] || 0,
            minute: parts[1] || 0,
            second: parts[2] || 0,
            millisecond: 0
          });
        } else {
          throw new Error(`Unsupported time format: ${time}`);
        }
      } else {
        throw new Error('Time must be a string or Date object');
      }
      
      if (timeZone) {
        const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
        dt = dt.setZone(validTimeZone);
      }
      
      return dt.toFormat(format);
    } catch (error) {
      console.error('Error formatting time:', error);
      return String(time);
    }
  }

  /**
   * Convert a calendar event to the user's timezone
   * 
   * @param event Calendar event with UTC times
   * @param userTimeZone User's timezone
   * @returns Event with converted times
   */
  static convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    if (!event.start || !event.end) {
      return event;
    }
    
    try {
      const startDt = DateTime.fromISO(event.start).setZone(validTimeZone);
      const endDt = DateTime.fromISO(event.end).setZone(validTimeZone);
      
      return {
        ...event,
        start: startDt.toISO(),
        end: endDt.toISO(),
        title: event.title || '',
        displayStart: startDt.toFormat('h:mm a'),
        displayEnd: endDt.toFormat('h:mm a'),
        displayDay: startDt.toFormat('ccc'),
        displayDate: startDt.toFormat('MMM d')
      };
    } catch (error) {
      console.error('Error converting event to user timezone:', error);
      return event;
    }
  }

  /**
   * Get the user's browser timezone
   * 
   * @returns IANA timezone string
   */
  static getUserTimeZone(): string {
    try {
      const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return TimeZoneService.ensureIANATimeZone(browserTimeZone);
    } catch (error) {
      console.warn('Error detecting browser timezone:', error);
      return 'America/Chicago'; // Default fallback
    }
  }

  /**
   * Parse a date string with timezone information
   * 
   * @param dateString Date string to parse
   * @param timeZone Timezone to use if not specified in string
   * @returns DateTime object
   */
  static parseWithZone(dateString: string, timeZone?: string): DateTime {
    let dt: DateTime;
    
    if (dateString.includes('Z') || dateString.includes('+')) {
      // ISO format with timezone info
      dt = DateTime.fromISO(dateString);
    } else if (dateString.includes('T')) {
      // ISO-like format without timezone
      dt = DateTime.fromISO(dateString, { zone: timeZone || 'UTC' });
    } else if (dateString.includes('-') && !dateString.includes(':')) {
      // Date only format (YYYY-MM-DD)
      dt = DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: timeZone || 'UTC' });
    } else {
      // Try to parse as a flexible format
      dt = DateTime.fromSQL(dateString, { zone: timeZone || 'UTC' });
    }
    
    if (!dt.isValid) {
      console.error(`Invalid date string: ${dateString}, reason: ${dt.invalidReason}`);
      return DateTime.now().setZone(timeZone || 'UTC');
    }
    
    return dt;
  }

  /**
   * Format date to 12-hour time
   * 
   * @param date Date to format
   * @param timeZone Timezone to use
   * @returns Formatted time string (e.g. "2:30 PM")
   */
  static formatDateToTime12Hour(date: Date | string | DateTime, timeZone?: string): string {
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = TimeZoneService.parseWithZone(date, timeZone);
    }
    
    if (timeZone) {
      dt = dt.setZone(TimeZoneService.ensureIANATimeZone(timeZone));
    }
    
    return dt.toFormat('h:mm a');
  }

  /**
   * Get the current date and time in a specific timezone
   * 
   * @param timeZone IANA timezone string
   * @returns DateTime object for current time in specified timezone
   */
  static getCurrentDateTime(timeZone?: string): DateTime {
    const validTimeZone = timeZone ? 
      TimeZoneService.ensureIANATimeZone(timeZone) : 
      TimeZoneService.getUserTimeZone();
    
    return DateTime.now().setZone(validTimeZone);
  }

  /**
   * Check if two dates are the same day
   * 
   * @param date1 First date
   * @param date2 Second date
   * @param timeZone Timezone to use for comparison
   * @returns Boolean indicating if dates are the same day
   */
  static isSameDay(date1: Date | string | DateTime, date2: Date | string | DateTime, timeZone?: string): boolean {
    let dt1: DateTime, dt2: DateTime;
    
    if (date1 instanceof DateTime) {
      dt1 = date1;
    } else if (date1 instanceof Date) {
      dt1 = DateTime.fromJSDate(date1);
    } else {
      dt1 = TimeZoneService.parseWithZone(date1, timeZone);
    }
    
    if (date2 instanceof DateTime) {
      dt2 = date2;
    } else if (date2 instanceof Date) {
      dt2 = DateTime.fromJSDate(date2);
    } else {
      dt2 = TimeZoneService.parseWithZone(date2, timeZone);
    }
    
    if (timeZone) {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      dt1 = dt1.setZone(validTimeZone);
      dt2 = dt2.setZone(validTimeZone);
    }
    
    return dt1.hasSame(dt2, 'day');
  }

  /**
   * Add a duration to a date
   * 
   * @param date Base date
   * @param amount Amount to add
   * @param unit Unit for the amount
   * @returns New DateTime with duration added
   */
  static addDuration(date: Date | string | DateTime, amount: number, unit: TimeUnit): DateTime {
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = TimeZoneService.parseWithZone(date);
    }
    
    return dt.plus({ [unit]: amount });
  }

  /**
   * Get the name of a weekday from a date
   * 
   * @param date Date to extract weekday from
   * @param format Format for weekday name
   * @returns Weekday name
   */
  static getWeekdayName(date: Date | string | DateTime, format: 'long' | 'short' = 'long'): string {
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = TimeZoneService.parseWithZone(date);
    }
    
    return dt.toFormat(format === 'long' ? 'cccc' : 'ccc');
  }

  /**
   * Get the name of a month from a date
   * 
   * @param date Date to extract month from
   * @param format Format for month name
   * @returns Month name
   */
  static getMonthName(date: Date | string | DateTime, format: 'long' | 'short' = 'long'): string {
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = TimeZoneService.parseWithZone(date);
    }
    
    return dt.toFormat(format === 'long' ? 'LLLL' : 'LLL');
  }

  /**
   * Format a date using a standard format
   * 
   * @param date Date to format
   * @param format Format to use
   * @param timeZone Timezone to use
   * @returns Formatted date string
   */
  static formatDate(date: Date | string | DateTime, format: string | DateTimeFormat = 'DATE_SHORT', timeZone?: string): string {
    return TimeZoneService.formatDateTime(date, format, timeZone);
  }

  /**
   * Get display name from IANA timezone
   * 
   * @param ianaName IANA timezone name
   * @returns User-friendly display name
   */
  static getDisplayNameFromIANA(ianaName: string): string {
    return TimeZoneService.formatTimeZoneDisplay(ianaName);
  }

  /**
   * Get IANA timezone from display name
   * 
   * @param displayName Display name of timezone
   * @returns IANA timezone name
   */
  static getIANAFromDisplayName(displayName: string): string {
    return TIMEZONE_NAME_MAP[displayName] || TimeZoneService.ensureIANATimeZone(displayName);
  }

  /**
   * Get timezone offset string (e.g., GMT+2)
   * 
   * @param timeZone IANA timezone identifier
   * @returns Formatted timezone offset string
   */
  static getTimezoneOffsetString(timeZone: string): string {
    try {
      const now = DateTime.now().setZone(TimeZoneService.ensureIANATimeZone(timeZone));
      return now.toFormat('ZZZZ');
    } catch (error) {
      console.error('Error getting timezone offset string:', error);
      return '';
    }
  }
}
