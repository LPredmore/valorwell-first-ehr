
/**
 * TimeZoneService - THE OFFICIAL SOURCE OF TRUTH for all timezone operations
 * 
 * Core Principles:
 * - All timezone operations MUST use Luxon through this class
 * - All dates/times MUST be stored in UTC in the database
 * - All timezone conversions MUST happen at the display layer only
 * - All timezone strings MUST be in IANA format (e.g., 'America/New_York')
 */

import { DateTime } from 'luxon';
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
  | string;               // Any custom Luxon format string

/**
 * Standard date/time formats used across the application
 */
export const DATETIME_FORMATS = {
  DATE_FULL: 'MMMM d, yyyy',
  DATE_SHORT: 'M/d/yyyy',
  TIME_12H: 'h:mm a',
  TIME_24H: 'HH:mm',
  DATETIME_FULL: 'MMMM d, yyyy, h:mm a',
  DATETIME_SHORT: 'M/d/yyyy, h:mm a',
};

/**
 * TimeZoneService - Unified service for all timezone operations
 */
export class TimeZoneService {
  /**
   * Ensure a timezone string is in valid IANA format
   * @param timeZone The timezone string to validate
   * @returns A valid IANA timezone string
   */
  static ensureIANATimeZone(timeZone: string): string {
    try {
      if (!timeZone || DateTime.local().setZone(timeZone).invalidReason) {
        console.warn(`Invalid timezone ${timeZone}, falling back to UTC`);
        return 'UTC';
      }
      return timeZone;
    } catch (error) {
      console.error('Error validating timezone:', error);
      return 'UTC';
    }
  }

  /**
   * Format a timezone for display with name and offset
   * @param timezone IANA timezone string
   * @returns Formatted timezone display string
   */
  static formatTimeZoneDisplay(timezone: string): string {
    try {
      const now = DateTime.now().setZone(timezone);
      if (now.isValid) {
        return `${now.zoneName} (${now.toFormat('ZZZZ')})`;
      }
      return timezone;
    } catch (error) {
      console.error('Error formatting timezone:', error);
      return timezone;
    }
  }

  /**
   * Format a time string
   * @param time Time string or ISO datetime
   * @param format Format string or predefined format
   * @param timezone Optional timezone
   * @returns Formatted time string
   */
  static formatTime(time: string, format: DateTimeFormat = 'TIME_12H', timezone?: string): string {
    try {
      let dt = DateTime.fromISO(time);
      if (timezone) {
        dt = dt.setZone(timezone);
      }
      
      const formatString = DATETIME_FORMATS[format] || format;
      return dt.toFormat(formatString);
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
    }
  }

  /**
   * Convert a local date and time to UTC
   * @param date Date string or object
   * @param time Time string
   * @param timezone Source timezone
   * @returns UTC ISO timestamp
   */
  static toUTCTimestamp(date: Date | string, time: string, timezone: string): string {
    try {
      const dateStr = typeof date === 'string' ? date : DateTime.fromJSDate(date).toISODate();
      const dt = DateTime.fromFormat(`${dateStr} ${time}`, 'yyyy-MM-dd HH:mm', { zone: timezone });
      return dt.toUTC().toISO();
    } catch (error) {
      console.error('Error converting to UTC timestamp:', error);
      throw error;
    }
  }

  /**
   * Convert a UTC timestamp to a local DateTime
   * @param timestamp UTC timestamp
   * @param timezone Target timezone
   * @returns Luxon DateTime in target timezone
   */
  static fromUTCTimestamp(timestamp: string, timezone: string): DateTime {
    try {
      return DateTime.fromISO(timestamp).setZone(timezone);
    } catch (error) {
      console.error('Error converting from UTC timestamp:', error);
      throw error;
    }
  }

  /**
   * Format UTC time for display to user
   * @param time UTC time string
   * @param timezone User's timezone
   * @returns Formatted time string
   */
  static formatTimeForUser(time: string, timezone: string): string {
    try {
      return this.fromUTCTimestamp(time, timezone).toFormat('h:mm a');
    } catch (error) {
      console.error('Error formatting time for user:', error);
      return time;
    }
  }

  /**
   * Convert a DateTime between timezones
   * @param dateTime Date string or object
   * @param sourceTimeZone Source timezone
   * @param targetTimeZone Target timezone
   * @returns Luxon DateTime in target timezone
   */
  static convertDateTime(
    dateTime: string | Date,
    sourceTimeZone: string,
    targetTimeZone: string
  ): DateTime {
    try {
      const validSourceZone = this.ensureIANATimeZone(sourceTimeZone);
      const validTargetZone = this.ensureIANATimeZone(targetTimeZone);
      
      const dt = typeof dateTime === 'string' 
        ? DateTime.fromISO(dateTime, { zone: validSourceZone })
        : DateTime.fromJSDate(dateTime).setZone(validSourceZone);
      return dt.setZone(validTargetZone);
    } catch (error) {
      console.error('Error converting datetime between timezones:', error);
      throw error;
    }
  }

  /**
   * Create an ISO datetime string from date and time components
   * @param date Date string or object
   * @param time Time string
   * @param timezone Timezone
   * @returns ISO datetime string
   */
  static createISODateTimeString(date: Date | string, time: string, timezone: string): string {
    try {
      const dateStr = typeof date === 'string' ? date : DateTime.fromJSDate(date).toISODate();
      return DateTime.fromFormat(`${dateStr} ${time}`, 'yyyy-MM-dd HH:mm', { zone: timezone }).toISO();
    } catch (error) {
      console.error('Error creating ISO datetime string:', error);
      throw error;
    }
  }

  /**
   * Format a date/time with a specific timezone
   * @param date Date string or object
   * @param format Format string or predefined format
   * @param timezone Timezone
   * @returns Formatted date/time string
   */
  static formatWithTimeZone(date: Date | string, format: DateTimeFormat, timezone: string): string {
    try {
      const validTimeZone = this.ensureIANATimeZone(timezone);
      const dt = typeof date === 'string' 
        ? DateTime.fromISO(date, { zone: validTimeZone })
        : DateTime.fromJSDate(date).setZone(validTimeZone);
        
      const formatString = DATETIME_FORMATS[format] || format;
      return dt.toFormat(formatString);
    } catch (error) {
      console.error('Error formatting with timezone:', error);
      return typeof date === 'string' ? date : date.toISOString();
    }
  }

  /**
   * Parse a string with timezone
   * @param dateStr Date/time string
   * @param timezone Timezone
   * @returns Luxon DateTime
   */
  static parseWithZone(dateStr: string, timezone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timezone);
    return DateTime.fromISO(dateStr, { zone: validTimeZone });
  }

  /**
   * Convert a UTC string to a DateTime in specified timezone
   * @param utcStr UTC string
   * @param timezone Target timezone
   * @returns Luxon DateTime in target timezone
   */
  static fromUTC(utcStr: string, timezone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timezone);
    return DateTime.fromISO(utcStr, { zone: 'UTC' }).setZone(validTimeZone);
  }

  /**
   * Convert a local DateTime to UTC
   * @param localDateTime DateTime or string
   * @returns Luxon DateTime in UTC
   */
  static toUTC(localDateTime: DateTime | string): DateTime {
    const dt = typeof localDateTime === 'string' ? DateTime.fromISO(localDateTime) : localDateTime;
    return dt.toUTC();
  }

  /**
   * Format a date
   * @param date Date string or object
   * @param format Format string or predefined format
   * @param timezone Optional timezone
   * @returns Formatted date string
   */
  static formatDate(date: Date | string, format: DateTimeFormat = 'DATE_SHORT', timezone?: string): string {
    try {
      let dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
      if (timezone) {
        dt = dt.setZone(this.ensureIANATimeZone(timezone));
      }
      
      const formatString = DATETIME_FORMATS[format] || format;
      return dt.toFormat(formatString);
    } catch (error) {
      console.error('Error formatting date:', error);
      return typeof date === 'string' ? date : date.toISOString();
    }
  }

  /**
   * Format a date and time
   * @param date Date/time string or object
   * @param format Format string or predefined format
   * @param timezone Optional timezone
   * @returns Formatted date/time string
   */
  static formatDateTime(date: Date | string, format: DateTimeFormat = 'DATETIME_SHORT', timezone?: string): string {
    try {
      let dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
      if (timezone) {
        dt = dt.setZone(this.ensureIANATimeZone(timezone));
      }
      
      const formatString = DATETIME_FORMATS[format] || format;
      return dt.toFormat(formatString);
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return typeof date === 'string' ? date : date.toISOString();
    }
  }

  /**
   * Get weekday name from a date
   * @param date Date string or object
   * @param timezone Optional timezone
   * @returns Weekday name
   */
  static getWeekdayName(date: Date | string, timezone?: string): string {
    try {
      let dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
      if (timezone) {
        dt = dt.setZone(this.ensureIANATimeZone(timezone));
      }
      return dt.weekdayLong || '';
    } catch (error) {
      console.error('Error getting weekday name:', error);
      return '';
    }
  }

  /**
   * Get month name from a date
   * @param date Date string or object
   * @param timezone Optional timezone
   * @returns Month name
   */
  static getMonthName(date: Date | string, timezone?: string): string {
    try {
      let dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
      if (timezone) {
        dt = dt.setZone(this.ensureIANATimeZone(timezone));
      }
      return dt.monthLong || '';
    } catch (error) {
      console.error('Error getting month name:', error);
      return '';
    }
  }

  /**
   * Get current DateTime in a specific timezone
   * @param timezone Timezone
   * @returns Current Luxon DateTime in specified timezone
   */
  static getCurrentDateTime(timezone: string): DateTime {
    return DateTime.now().setZone(this.ensureIANATimeZone(timezone));
  }

  /**
   * Check if two dates are the same day
   * @param date1 First date
   * @param date2 Second date
   * @returns True if same day
   */
  static isSameDay(date1: Date | string, date2: Date | string): boolean {
    try {
      const dt1 = typeof date1 === 'string' ? DateTime.fromISO(date1) : DateTime.fromJSDate(date1);
      const dt2 = typeof date2 === 'string' ? DateTime.fromISO(date2) : DateTime.fromJSDate(date2);
      return dt1.hasSame(dt2, 'day');
    } catch (error) {
      console.error('Error comparing dates:', error);
      return false;
    }
  }

  /**
   * Add a duration to a date
   * @param date Base date
   * @param amount Amount to add
   * @param unit Unit of time
   * @param timezone Optional timezone
   * @returns New Luxon DateTime
   */
  static addDuration(date: Date | string, amount: number, unit: TimeUnit, timezone?: string): DateTime {
    try {
      let dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
      if (timezone) {
        dt = dt.setZone(this.ensureIANATimeZone(timezone));
      }
      return dt.plus({ [unit]: amount });
    } catch (error) {
      console.error('Error adding duration:', error);
      throw error;
    }
  }

  /**
   * Format a Date to 12-hour time
   * @param date Date object
   * @returns Formatted time string (e.g. "3:45 PM")
   */
  static formatDateToTime12Hour(date: Date): string {
    return DateTime.fromJSDate(date).toFormat('h:mm a');
  }

  /**
   * Convert a calendar event to user's timezone
   * @param event Calendar event object
   * @param userTimeZone User's timezone
   * @returns Calendar event with times in user's timezone
   */
  static convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
    try {
      const validTimeZone = this.ensureIANATimeZone(userTimeZone);
      
      // Convert start time
      const startDt = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start, { zone: 'UTC' })
        : DateTime.fromJSDate(event.start as Date);
      
      // Convert end time
      const endDt = typeof event.end === 'string'
        ? DateTime.fromISO(event.end, { zone: 'UTC' })
        : DateTime.fromJSDate(event.end as Date);

      return {
        ...event,
        start: startDt.setZone(validTimeZone).toJSDate(),
        end: endDt.setZone(validTimeZone).toJSDate()
      };
    } catch (error) {
      console.error('Error converting event timezone:', error);
      return event;
    }
  }

  /**
   * Create a DateTime from separate date and time strings
   * @param dateStr Date string (YYYY-MM-DD)
   * @param timeStr Time string (HH:MM)
   * @param timezone Timezone
   * @returns Luxon DateTime
   */
  static createDateTime(dateStr: string, timeStr: string, timezone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timezone);
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    return DateTime.fromObject(
      { year, month, day, hour: hours, minute: minutes },
      { zone: validTimeZone }
    );
  }
}

// Create a singleton instance for use in imports
export const timeZoneService = new TimeZoneService();
