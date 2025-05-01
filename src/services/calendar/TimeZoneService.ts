
import { DateTime } from 'luxon';
import { CalendarErrorHandler } from './CalendarErrorHandler';

/**
 * Service for handling timezone operations throughout the calendar system.
 * This is the single source of truth for all timezone operations.
 */
export class TimeZoneService {
  /**
   * Ensure the timezone is in a valid IANA format.
   * @param timezone The timezone string to validate
   * @returns A valid IANA timezone string
   * @throws Error if the timezone is invalid
   */
  static ensureIANATimeZone(timezone: string | null | undefined): string {
    try {
      // Default to UTC if no timezone is provided
      if (!timezone) return 'UTC';
      
      // Check if the timezone is valid
      const dt = DateTime.now().setZone(timezone);
      if (!dt.isValid) {
        console.error(`[TimeZoneService] Invalid timezone: ${timezone}, reason: ${dt.invalidReason}. Using UTC.`);
        return 'UTC';
      }
      
      return timezone;
    } catch (error) {
      console.error(`[TimeZoneService] Error validating timezone ${timezone}:`, error);
      return 'UTC'; // Default to UTC on error
    }
  }

  /**
   * Convert a datetime from one timezone to another.
   * @param dateTime The datetime to convert (ISO string or DateTime object)
   * @param sourceZone The source timezone
   * @param targetZone The target timezone
   * @returns A DateTime object in the target timezone
   */
  static convertDateTime(
    dateTime: string | DateTime, 
    sourceZone: string, 
    targetZone: string
  ): DateTime {
    try {
      const validSourceZone = this.ensureIANATimeZone(sourceZone);
      const validTargetZone = this.ensureIANATimeZone(targetZone);
      
      let dt: DateTime;
      if (typeof dateTime === 'string') {
        dt = DateTime.fromISO(dateTime, { zone: validSourceZone });
      } else {
        dt = dateTime.setZone(validSourceZone);
      }
      
      if (!dt.isValid) {
        throw new Error(`Invalid datetime: ${dt.invalidReason}`);
      }
      
      return dt.setZone(validTargetZone);
    } catch (error) {
      console.error('[TimeZoneService] Error converting datetime:', error);
      throw CalendarErrorHandler.createError(
        `Failed to convert datetime: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TIMEZONE_CONVERSION_ERROR'
      );
    }
  }

  /**
   * Format a datetime for display according to the specified format in the target timezone.
   * @param dateTime The datetime to format (ISO string or DateTime object)
   * @param format The format to use (e.g., 'yyyy-MM-dd HH:mm:ss')
   * @param timezone The target timezone
   * @returns A formatted string
   */
  static formatDateTime(
    dateTime: string | DateTime,
    format: string,
    timezone: string
  ): string {
    try {
      const validTimeZone = this.ensureIANATimeZone(timezone);
      
      let dt: DateTime;
      if (typeof dateTime === 'string') {
        dt = DateTime.fromISO(dateTime, { zone: validTimeZone });
      } else {
        dt = dateTime.setZone(validTimeZone);
      }
      
      if (!dt.isValid) {
        throw new Error(`Invalid datetime: ${dt.invalidReason}`);
      }
      
      return dt.toFormat(format);
    } catch (error) {
      console.error('[TimeZoneService] Error formatting datetime:', error);
      return 'Invalid Date';
    }
  }

  /**
   * Convert a datetime from UTC to the target timezone.
   * @param utcDateTime The UTC datetime string
   * @param timezone The target timezone
   * @returns A DateTime object in the target timezone
   */
  static fromUTCTimestamp(utcDateTime: string, timezone: string): DateTime {
    try {
      const validTimeZone = this.ensureIANATimeZone(timezone);
      const dt = DateTime.fromISO(utcDateTime, { zone: 'UTC' });
      
      if (!dt.isValid) {
        throw new Error(`Invalid UTC datetime: ${dt.invalidReason}`);
      }
      
      return dt.setZone(validTimeZone);
    } catch (error) {
      console.error('[TimeZoneService] Error converting from UTC:', error);
      throw CalendarErrorHandler.createError(
        `Failed to convert from UTC: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TIMEZONE_CONVERSION_ERROR'
      );
    }
  }

  /**
   * Convert a datetime from the source timezone to UTC.
   * @param dateTime The datetime string in the source timezone
   * @param timezone The source timezone
   * @returns A UTC timestamp string
   */
  static toUTCTimestamp(dateTime: string, timezone: string): string {
    try {
      const validTimeZone = this.ensureIANATimeZone(timezone);
      const dt = DateTime.fromISO(dateTime, { zone: validTimeZone });
      
      if (!dt.isValid) {
        throw new Error(`Invalid datetime: ${dt.invalidReason}`);
      }
      
      return dt.toUTC().toISO();
    } catch (error) {
      console.error('[TimeZoneService] Error converting to UTC:', error);
      throw CalendarErrorHandler.createError(
        `Failed to convert to UTC: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TIMEZONE_CONVERSION_ERROR'
      );
    }
  }

  /**
   * Parse a datetime string with timezone information.
   * @param dateTimeStr The datetime string to parse
   * @param defaultZone The default timezone to use if none is specified
   * @returns A DateTime object
   */
  static parseWithZone(dateTimeStr: string, defaultZone: string = 'UTC'): DateTime {
    try {
      const validTimeZone = this.ensureIANATimeZone(defaultZone);
      const dt = DateTime.fromISO(dateTimeStr, { zone: validTimeZone });
      
      if (!dt.isValid) {
        throw new Error(`Invalid datetime string: ${dt.invalidReason}`);
      }
      
      return dt;
    } catch (error) {
      console.error('[TimeZoneService] Error parsing datetime with zone:', error);
      throw CalendarErrorHandler.createError(
        `Failed to parse datetime: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TIMEZONE_PARSE_ERROR'
      );
    }
  }

  /**
   * Format a timezone for display
   * @param timezone The timezone to format
   * @returns A formatted timezone string
   */
  static formatTimeZoneDisplay(timezone: string | null | undefined): string {
    try {
      const validTimeZone = this.ensureIANATimeZone(timezone);
      const now = DateTime.now().setZone(validTimeZone);
      
      if (!now.isValid) {
        return 'UTC';
      }
      
      const offset = now.toFormat('ZZ');
      const abbreviation = now.toFormat('ZZZZ');
      
      return `${validTimeZone} (${abbreviation}, ${offset})`;
    } catch (error) {
      console.error('[TimeZoneService] Error formatting timezone display:', error);
      return 'UTC';
    }
  }

  /**
   * Get user's timezone from the browser
   * @returns The user's timezone string
   */
  static getUserTimeZone(): string {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return this.ensureIANATimeZone(timeZone);
    } catch (error) {
      console.error('[TimeZoneService] Error getting user timezone:', error);
      return 'UTC';
    }
  }

  /**
   * Create a DateTime object from date and time strings
   * @param dateStr The date string (e.g., '2023-05-01')
   * @param timeStr The time string (e.g., '14:30')
   * @param timezone The timezone
   * @returns A DateTime object
   */
  static createDateTime(dateStr: string, timeStr: string, timezone: string): DateTime {
    try {
      const validTimeZone = this.ensureIANATimeZone(timezone);
      const combinedStr = `${dateStr}T${timeStr}`;
      const dt = DateTime.fromISO(combinedStr, { zone: validTimeZone });
      
      if (!dt.isValid) {
        throw new Error(`Invalid date/time: ${dt.invalidReason}`);
      }
      
      return dt;
    } catch (error) {
      console.error('[TimeZoneService] Error creating DateTime:', error);
      throw CalendarErrorHandler.createError(
        `Failed to create datetime: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DATETIME_CREATION_ERROR'
      );
    }
  }

  /**
   * Convert an event to user's timezone
   * @param event The event object
   * @param userTimeZone The user's timezone
   * @returns The event with times converted to user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimeZone: string): any {
    if (!event) return null;
    
    const validTimeZone = this.ensureIANATimeZone(userTimeZone);
    const sourceTimeZone = event.extendedProps?.sourceTimeZone || 'UTC';
    
    try {
      // Convert start and end times
      let convertedStart = null;
      let convertedEnd = null;
      
      if (event.start) {
        convertedStart = this.convertDateTime(
          event.start, 
          sourceTimeZone, 
          validTimeZone
        );
      }
      
      if (event.end) {
        convertedEnd = this.convertDateTime(
          event.end, 
          sourceTimeZone, 
          validTimeZone
        );
      }
      
      // Create a new event object with converted times
      return {
        ...event,
        start: convertedStart ? convertedStart.toISO() : event.start,
        end: convertedEnd ? convertedEnd.toISO() : event.end,
        extendedProps: {
          ...event.extendedProps,
          timezone: validTimeZone,
          displayStart: convertedStart ? convertedStart.toFormat('h:mm a') : undefined,
          displayEnd: convertedEnd ? convertedEnd.toFormat('h:mm a') : undefined,
          displayDay: convertedStart ? convertedStart.toFormat('ccc') : undefined,
          displayDate: convertedStart ? convertedStart.toFormat('MMM d') : undefined
        }
      };
    } catch (error) {
      console.error('[TimeZoneService] Error converting event to user timezone:', error);
      return event; // Return original event on error
    }
  }
}
