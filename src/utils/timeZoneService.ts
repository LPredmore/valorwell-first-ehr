
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
}
