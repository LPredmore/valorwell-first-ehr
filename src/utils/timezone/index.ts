
/**
 * Timezone utilities
 * 
 * This module provides timezone handling functionality throughout the application.
 * It serves as the central point for all timezone-related operations.
 */

import { DateTime } from 'luxon';

/**
 * Service for handling timezone operations throughout the application
 */
export class TimeZoneService {
  /**
   * Ensure the timezone is in a valid IANA format.
   * @param timezone The timezone string to validate
   * @returns A valid IANA timezone string
   */
  static ensureIANATimeZone(timezone: string | null | undefined): string {
    try {
      // Default to UTC if no timezone is provided
      if (!timezone) return 'UTC';
      
      // Check if the timezone is valid
      const dt = DateTime.now().setZone(timezone);
      if (!dt.isValid) {
        console.error(`[TimeZoneUtils] Invalid timezone: ${timezone}, reason: ${dt.invalidReason}. Using UTC.`);
        return 'UTC';
      }
      
      return timezone;
    } catch (error) {
      console.error(`[TimeZoneUtils] Error validating timezone ${timezone}:`, error);
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
      console.error('[TimeZoneUtils] Error converting datetime:', error);
      throw new Error(`Failed to convert datetime: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.error('[TimeZoneUtils] Error formatting datetime:', error);
      return 'Invalid Date';
    }
  }

  /**
   * Convert a datetime from UTC to the target timezone.
   * @param utcDateTime The UTC datetime string
   * @param timezone The target timezone
   * @returns A DateTime object in the target timezone
   */
  static fromUTC(utcDateTime: string, timezone: string): DateTime {
    try {
      const validTimeZone = this.ensureIANATimeZone(timezone);
      const dt = DateTime.fromISO(utcDateTime, { zone: 'UTC' });
      
      if (!dt.isValid) {
        throw new Error(`Invalid UTC datetime: ${dt.invalidReason}`);
      }
      
      return dt.setZone(validTimeZone);
    } catch (error) {
      console.error('[TimeZoneUtils] Error converting from UTC:', error);
      throw new Error(`Failed to convert from UTC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert a datetime from the source timezone to UTC.
   * @param dateTime The datetime string in the source timezone
   * @param timezone The source timezone
   * @returns A UTC timestamp string
   */
  static toUTC(dateTime: string, timezone: string): string {
    try {
      const validTimeZone = this.ensureIANATimeZone(timezone);
      const dt = DateTime.fromISO(dateTime, { zone: validTimeZone });
      
      if (!dt.isValid) {
        throw new Error(`Invalid datetime: ${dt.invalidReason}`);
      }
      
      return dt.toUTC().toISO();
    } catch (error) {
      console.error('[TimeZoneUtils] Error converting to UTC:', error);
      throw new Error(`Failed to convert to UTC: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.error('[TimeZoneUtils] Error parsing datetime with zone:', error);
      throw new Error(`Failed to parse datetime: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.error('[TimeZoneUtils] Error formatting timezone display:', error);
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
      console.error('[TimeZoneUtils] Error getting user timezone:', error);
      return 'UTC';
    }
  }
}

// Export the class as default for backward compatibility
export default TimeZoneService;
