
/**
 * TimeZoneService - Responsible for all timezone operations in the calendar system
 * This is the official source of truth for all timezone-related functionality
 */

import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';
import { CalendarError } from './CalendarErrorHandler';

// Define TimeZoneError for backward compatibility
class TimeZoneError extends CalendarError {
  constructor(message: string, code: string) {
    super(message, 'CALENDAR_TIMEZONE_ERROR');
    this.name = 'TimeZoneError';
  }
}

// Constants for supported timezone formats and display
export const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Honolulu',
  'America/Puerto_Rico',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland'
];

/**
 * TimeZoneService class for handling all timezone operations
 */
export class TimeZoneService {
  /**
   * Validates and ensures a timezone is in IANA format
   * 
   * @param timeZone - The timezone to validate
   * @returns The validated timezone string
   * @throws TimeZoneError if the timezone is invalid
   */
  static ensureIANATimeZone(timeZone?: string): string {
    // If no timezone provided, use default
    if (!timeZone) {
      return 'America/Chicago';
    }
    
    try {
      // Try to create a DateTime with the provided timezone
      const now = DateTime.now().setZone(timeZone);
      
      if (!now.isValid) {
        throw new TimeZoneError(`Invalid timezone: ${timeZone}`, 'INVALID_TIMEZONE');
      }
      
      return timeZone;
    } catch (error) {
      console.error('[TimeZoneService] Error validating timezone:', {
        timeZone,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return default timezone on error
      return 'America/Chicago';
    }
  }

  /**
   * Validates a timezone
   * @deprecated Use ensureIANATimeZone instead
   */
  static validateTimeZone(timeZone?: string): string {
    return this.ensureIANATimeZone(timeZone);
  }

  /**
   * Creates a DateTime object with the specified date, time, and timezone
   * 
   * @param dateStr - Date string in yyyy-MM-dd format
   * @param timeStr - Time string in HH:mm format
   * @param timeZone - Timezone string in IANA format
   * @returns A DateTime object
   */
  static createDateTime(dateStr: string, timeStr: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    
    // Combine date and time strings
    const dateTimeStr = `${dateStr}T${timeStr}`;
    
    // Parse with the specified timezone
    const dateTime = DateTime.fromISO(dateTimeStr, { zone: validTimeZone });
    
    if (!dateTime.isValid) {
      throw new TimeZoneError(
        `Invalid date/time: ${dateTimeStr} in timezone: ${validTimeZone}`,
        'INVALID_DATETIME'
      );
    }
    
    return dateTime;
  }

  /**
   * Converts a DateTime to UTC
   * 
   * @param dateTime - The DateTime to convert
   * @returns The DateTime in UTC
   */
  static toUTC(dateTime: DateTime): DateTime {
    return dateTime.toUTC();
  }

  /**
   * Converts a UTC string to a local DateTime in the specified timezone
   * 
   * @param utcStr - UTC datetime string
   * @param timeZone - Target timezone
   * @returns The DateTime in the specified timezone
   */
  static fromUTC(utcStr: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    
    // Parse as UTC
    const utcDateTime = DateTime.fromISO(utcStr, { zone: 'utc' });
    
    if (!utcDateTime.isValid) {
      throw new TimeZoneError(`Invalid UTC datetime: ${utcStr}`, 'INVALID_DATETIME');
    }
    
    // Convert to target timezone
    return utcDateTime.setZone(validTimeZone);
  }

  /**
   * Convert a DateTime between two timezones
   * 
   * @param dateTime - The DateTime to convert
   * @param fromZone - Source timezone
   * @param toZone - Target timezone
   * @returns The DateTime in the target timezone
   */
  static convertDateTime(dateTime: DateTime, fromZone: string, toZone: string): DateTime {
    const validFromZone = this.ensureIANATimeZone(fromZone);
    const validToZone = this.ensureIANATimeZone(toZone);
    
    // Ensure the datetime has the correct source timezone
    const withSourceZone = dateTime.setZone(validFromZone);
    
    // Convert to target timezone
    return withSourceZone.setZone(validToZone);
  }

  /**
   * Convert between timezones (legacy support)
   * @deprecated Use convertDateTime instead
   */
  static convertTimeZone(dateTime: DateTime, fromZone: string, toZone: string): DateTime {
    return this.convertDateTime(dateTime, fromZone, toZone);
  }

  /**
   * Parse a datetime string with a specified timezone
   * 
   * @param dateTimeStr - The datetime string to parse
   * @param timeZone - The timezone to use
   * @returns A DateTime object
   */
  static parseWithZone(dateTimeStr: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    
    const dateTime = DateTime.fromISO(dateTimeStr, { zone: validTimeZone });
    
    if (!dateTime.isValid) {
      throw new TimeZoneError(
        `Invalid datetime string: ${dateTimeStr} with timezone: ${validTimeZone}`,
        'INVALID_DATETIME'
      );
    }
    
    return dateTime;
  }

  /**
   * Get the current date and time in the specified timezone
   * 
   * @param timeZone - The timezone to use
   * @returns A DateTime object representing the current time
   */
  static getCurrentDateTime(timeZone?: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.now().setZone(validTimeZone);
  }

  /**
   * Check if two dates are on the same day
   * 
   * @param date1 - First DateTime
   * @param date2 - Second DateTime
   * @returns true if both dates are on the same day
   */
  static isSameDay(date1: DateTime, date2: DateTime): boolean {
    return (
      date1.year === date2.year &&
      date1.month === date2.month &&
      date1.day === date2.day
    );
  }

  /**
   * Add a duration to a date
   * 
   * @param date - The base date
   * @param amount - The amount to add
   * @param unit - The unit of the amount
   * @returns A new DateTime with the duration added
   */
  static addDuration(
    date: DateTime,
    amount: number,
    unit: 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
  ): DateTime {
    return date.plus({ [unit]: amount });
  }

  /**
   * Get the user's timezone, with fallback to system timezone
   * 
   * @returns The user's timezone
   */
  static getUserTimeZone(): string {
    try {
      // Try to get from browser
      const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (browserTimeZone) {
        // Validate it's a proper IANA timezone
        const validatedTimeZone = this.ensureIANATimeZone(browserTimeZone);
        return validatedTimeZone;
      }
    } catch (error) {
      console.warn('[TimeZoneService] Error getting browser timezone:', error);
    }
    
    // Default timezone as fallback
    return 'America/Chicago';
  }

  /**
   * Format a timezone for display
   * 
   * @param timeZone - The timezone to format
   * @returns A user-friendly string representation of the timezone
   */
  static formatTimeZoneDisplay(timeZone: string): string {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    
    try {
      // Get the current time in the timezone
      const now = DateTime.now().setZone(validTimeZone);
      
      // Format as "America/New_York (EDT)" or similar
      const abbreviation = now.toFormat('ZZZZ');
      const offset = now.toFormat('ZZ');
      
      return `${validTimeZone} (${abbreviation}, ${offset})`;
    } catch (error) {
      console.error('[TimeZoneService] Error formatting timezone display:', error);
      return validTimeZone;
    }
  }

  /**
   * Format a DateTime for display
   * 
   * @param dateTime - The DateTime, Date, or string to format
   * @param format - The format to use (a Luxon format string or predefined format)
   * @param timeZone - The timezone to use for display
   * @returns A formatted string
   */
  static formatDateTime(
    dateTime: DateTime | Date | string,
    format: string = 'yyyy-MM-dd HH:mm',
    timeZone?: string
  ): string {
    let dt: DateTime;
    
    // Handle different input types
    if (dateTime instanceof DateTime) {
      dt = dateTime;
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime);
    } else if (typeof dateTime === 'string') {
      dt = DateTime.fromISO(dateTime);
    } else {
      throw new TimeZoneError('Invalid datetime input', 'INVALID_DATETIME');
    }
    
    // Set the timezone if provided
    if (timeZone) {
      const validTimeZone = this.ensureIANATimeZone(timeZone);
      dt = dt.setZone(validTimeZone);
    }
    
    // Handle predefined formats
    if (format === 'full') {
      return dt.toLocaleString(DateTime.DATETIME_FULL);
    } else if (format === 'date') {
      return dt.toLocaleString(DateTime.DATE_MED);
    } else if (format === 'time') {
      return dt.toLocaleString(DateTime.TIME_SIMPLE);
    }
    
    // Custom format
    return dt.toFormat(format);
  }

  /**
   * Format a time string
   * 
   * @param time - The time to format
   * @param format - The format to use
   * @param timeZone - The timezone to use
   * @returns A formatted time string
   */
  static formatTime(
    time: string | Date,
    format: string = 'h:mm a',
    timeZone?: string
  ): string {
    let dt: DateTime;
    
    if (time instanceof Date) {
      dt = DateTime.fromJSDate(time);
    } else {
      // If it's just a time string like "14:30", prepend today's date
      if (time.length <= 8) {
        const today = DateTime.now().toFormat('yyyy-MM-dd');
        dt = DateTime.fromISO(`${today}T${time}`);
      } else {
        dt = DateTime.fromISO(time);
      }
    }
    
    if (timeZone) {
      const validTimeZone = this.ensureIANATimeZone(timeZone);
      dt = dt.setZone(validTimeZone);
    }
    
    return dt.toFormat(format);
  }

  /**
   * Format a date
   * 
   * @param date - The date to format
   * @param format - The format to use
   * @returns A formatted date string
   */
  static formatDate(
    date: DateTime | Date | string,
    format: string = 'yyyy-MM-dd'
  ): string {
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = DateTime.fromISO(date);
    }
    
    return dt.toFormat(format);
  }

  /**
   * Format a date to a 12-hour time string
   * 
   * @param date - The date to format
   * @returns A time string in 12-hour format
   */
  static formatDateToTime12Hour(date: Date | string): string {
    let dt: DateTime;
    
    if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = DateTime.fromISO(date);
    }
    
    return dt.toFormat('h:mm a');
  }

  /**
   * Get the weekday name from a DateTime
   * 
   * @param date - The DateTime
   * @param format - The format of the weekday name
   * @returns The weekday name
   */
  static getWeekdayName(date: DateTime, format: 'long' | 'short' = 'long'): string {
    return format === 'long' ? date.weekdayLong : date.weekdayShort;
  }

  /**
   * Get the month name from a DateTime
   * 
   * @param date - The DateTime
   * @param format - The format of the month name
   * @returns The month name
   */
  static getMonthName(date: DateTime, format: 'long' | 'short' = 'long'): string {
    return format === 'long' ? date.monthLong : date.monthShort;
  }

  /**
   * Get the display name for an IANA timezone
   * 
   * @param timeZone - The IANA timezone
   * @returns A user-friendly display name
   */
  static getDisplayNameFromIANA(timeZone: string): string {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    
    // Format the timezone for display
    const parts = validTimeZone.split('/');
    const location = parts[parts.length - 1].replace(/_/g, ' ');
    
    // Get current abbreviation
    const now = DateTime.now().setZone(validTimeZone);
    const abbreviation = now.toFormat('ZZZZ');
    
    return `${location} (${abbreviation})`;
  }

  /**
   * Get a user-friendly display name for a timezone
   *
   * @param timeZone - The IANA timezone
   * @returns A user-friendly display name
   */
  static getTimeZoneDisplayName(timeZone: string): string {
    return this.getDisplayNameFromIANA(timeZone);
  }

  /**
   * Get the IANA timezone from a display name
   *
   * @param displayName - The display name
   * @returns The IANA timezone
   */
  static getIANAFromDisplayName(displayName: string): string {
    // Try to extract the IANA name from the display name
    const match = displayName.match(/^(.*?)(?:\s+\(.*\))?$/);
    if (match && match[1]) {
      const ianaCandidate = match[1].replace(/\s+/g, '_');
      
      // Check if it's a valid timezone by matching against our list
      for (const tz of TIMEZONE_OPTIONS) {
        if (tz.endsWith(ianaCandidate)) {
          return tz;
        }
      }
    }
    
    // Default timezone if no match found
    return 'America/Chicago';
  }

  /**
   * Get the timezone offset as a string
   * 
   * @param timeZone - The timezone
   * @returns The offset string (e.g., "UTC-05:00")
   */
  static getTimezoneOffsetString(timeZone: string): string {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    const now = DateTime.now().setZone(validTimeZone);
    return `UTC${now.toFormat('ZZ')}`;
  }

  /**
   * Convert a calendar event to the user's timezone
   * 
   * @param event - The calendar event
   * @param userTimeZone - The user's timezone
   * @returns The event with times converted to the user's timezone
   */
  static convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
    const validTimeZone = this.ensureIANATimeZone(userTimeZone);
    const sourceTimeZone = event.extendedProps?.timezone || event.extendedProps?.sourceTimeZone || 'America/Chicago';
    
    // Parse start and end as DateTime objects in the source timezone
    const startDt = DateTime.fromISO(event.start.toString(), { zone: sourceTimeZone });
    const endDt = DateTime.fromISO(event.end.toString(), { zone: sourceTimeZone });
    
    // Convert to the user's timezone
    const localStartDt = startDt.setZone(validTimeZone);
    const localEndDt = endDt.setZone(validTimeZone);
    
    // Create a new event with the converted times
    return {
      ...event,
      start: localStartDt.toJSDate(),
      end: localEndDt.toJSDate(),
      extendedProps: {
        ...event.extendedProps,
        sourceTimeZone: sourceTimeZone,
        timezone: validTimeZone,
        displayTimeZone: validTimeZone
      }
    };
  }

  /**
   * Convert a datetime to UTC timestamp
   * 
   * @param dateTime - The datetime to convert
   * @param timeZone - The source timezone
   * @returns A UTC ISO string
   */
  static toUTCTimestamp(dateTime: Date | string, timeZone: string): string;
  static toUTCTimestamp(dateStr: string, timeStr: string, timeZone: string): string;
  static toUTCTimestamp(
    dateTime: Date | string,
    timeStrOrTimeZone: string,
    timeZone?: string
  ): string {
    let dt: DateTime;
    
    if (timeZone) {
      // Handle the (dateStr, timeStr, timeZone) signature
      const dateStr = dateTime as string;
      const timeStr = timeStrOrTimeZone;
      const validTimeZone = this.ensureIANATimeZone(timeZone);
      
      dt = this.createDateTime(dateStr, timeStr, validTimeZone);
    } else {
      // Handle the (dateTime, timeZone) signature
      const validTimeZone = this.ensureIANATimeZone(timeStrOrTimeZone);
      
      if (dateTime instanceof Date) {
        dt = DateTime.fromJSDate(dateTime).setZone(validTimeZone);
      } else {
        dt = DateTime.fromISO(dateTime as string, { zone: validTimeZone });
      }
    }
    
    return dt.toUTC().toISO();
  }

  /**
   * Convert a UTC timestamp to a local DateTime
   * 
   * @param timestamp - The UTC timestamp
   * @param timeZone - The target timezone
   * @returns A DateTime in the target timezone
   */
  static fromUTCTimestamp(timestamp: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    
    const utcDt = DateTime.fromISO(timestamp, { zone: 'utc' });
    return utcDt.setZone(validTimeZone);
  }
}
