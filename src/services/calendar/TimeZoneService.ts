// Import or create if missing 
// This file should be in src/services/calendar/TimeZoneService.ts
// Add the necessary methods for availability management

import { DateTime, IANAZone, Info } from 'luxon';
import { CalendarError } from './CalendarErrorHandler';

/**
 * Centralized service for timezone operations
 */
export class TimeZoneService {
  /**
   * Validates that a timezone string is a valid IANA timezone
   */
  static validateTimeZone(timeZone: string): string {
    if (!timeZone || typeof timeZone !== 'string') {
      console.warn('[TimeZoneService] Empty or invalid timezone provided, defaulting to UTC');
      return 'UTC';
    }

    try {
      if (IANAZone.isValidZone(timeZone)) {
        return timeZone;
      }
      console.warn(`[TimeZoneService] Invalid timezone provided: ${timeZone}, defaulting to UTC`);
      return 'UTC';
    } catch (error) {
      console.warn(`[TimeZoneService] Error validating timezone: ${timeZone}`, error);
      return 'UTC';
    }
  }

  /**
   * Ensures a timezone string is a valid IANA timezone
   * Similar to validateTimeZone but more permissive with fallbacks
   */
  static ensureIANATimeZone(timeZone: string | undefined | null): string {
    if (!timeZone) {
      return 'UTC';
    }
    
    try {
      if (IANAZone.isValidZone(timeZone)) {
        return timeZone;
      }
      
      // Try to match with common timezone aliases
      const tzAliases: Record<string, string> = {
        'EST': 'America/New_York',
        'CST': 'America/Chicago',
        'MST': 'America/Denver',
        'PST': 'America/Los_Angeles',
        'EDT': 'America/New_York',
        'CDT': 'America/Chicago',
        'MDT': 'America/Denver',
        'PDT': 'America/Los_Angeles'
      };
      
      if (tzAliases[timeZone]) {
        return tzAliases[timeZone];
      }
      
      // Fall back to browser's timezone
      const browserTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (IANAZone.isValidZone(browserTZ)) {
        console.warn(`[TimeZoneService] Invalid timezone: ${timeZone}, using browser timezone: ${browserTZ}`);
        return browserTZ;
      }
      
      console.warn(`[TimeZoneService] Invalid timezone: ${timeZone}, defaulting to UTC`);
      return 'UTC';
    } catch (error) {
      console.warn(`[TimeZoneService] Error ensuring IANA timezone: ${timeZone}`, error);
      return 'UTC';
    }
  }

  /**
   * Creates a DateTime object from a date string and time string in a timezone
   */
  static createDateTime(dateStr: string, timeStr: string, timeZone: string): DateTime {
    try {
      const validatedTimeZone = this.validateTimeZone(timeZone);
      
      // Normalize date string
      if (typeof dateStr !== 'string') {
        dateStr = new Date(dateStr).toISOString().split('T')[0];
      }
      
      // Parse the date and time strings
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Create DateTime object
      const dt = DateTime.fromObject({
        year,
        month,
        day,
        hour: hours,
        minute: minutes
      }, { zone: validatedTimeZone });
      
      if (!dt.isValid) {
        throw new CalendarError(
          'Failed to create DateTime object',
          'CALENDAR_INVALID_DATETIME',
          { dateStr, timeStr, timeZone, invalidReason: dt.invalidReason }
        );
      }
      
      return dt;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create DateTime object',
        'CALENDAR_UNKNOWN_ERROR',
        { dateStr, timeStr, timeZone, error }
      );
    }
  }

  /**
   * Converts a DateTime from one timezone to another
   */
  static convertDateTime(dateTime: string | Date, sourceZone: string, targetZone: string): Date {
    try {
      const validatedSourceZone = this.validateTimeZone(sourceZone);
      const validatedTargetZone = this.validateTimeZone(targetZone);
      
      let dt: DateTime;
      
      if (typeof dateTime === 'string') {
        dt = DateTime.fromISO(dateTime, { zone: validatedSourceZone });
      } else {
        dt = DateTime.fromJSDate(dateTime, { zone: validatedSourceZone });
      }
      
      if (!dt.isValid) {
        throw new CalendarError(
          'Invalid DateTime for conversion',
          'CALENDAR_INVALID_DATETIME',
          { dateTime, sourceZone, targetZone, invalidReason: dt.invalidReason }
        );
      }
      
      return dt.setZone(validatedTargetZone).toJSDate();
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to convert DateTime between timezones',
        'CALENDAR_CONVERSION_ERROR',
        { dateTime, sourceZone, targetZone, error }
      );
    }
  }

  /**
   * Converts a timezone string to UTC
   */
  static toUTC(dateTime: Date | string, sourceZone?: string): DateTime {
    try {
      if (typeof dateTime === 'string') {
        // If sourceZone is provided, parse with that zone, otherwise assume ISO string
        if (sourceZone) {
          return DateTime.fromISO(dateTime, { zone: this.validateTimeZone(sourceZone) }).toUTC();
        } else {
          return DateTime.fromISO(dateTime).toUTC();
        }
      } else {
        // If sourceZone is provided, convert from JS Date with that zone, otherwise use local
        if (sourceZone) {
          return DateTime.fromJSDate(dateTime, { zone: this.validateTimeZone(sourceZone) }).toUTC();
        } else {
          return DateTime.fromJSDate(dateTime).toUTC();
        }
      }
    } catch (error) {
      console.error('[TimeZoneService] Error converting to UTC:', error);
      // Return current time as fallback
      return DateTime.now().toUTC();
    }
  }

  /**
   * Parses a string into a DateTime object with the specified timezone
   */
  static parseWithZone(dateTimeStr: string, timezone: string): DateTime {
    try {
      const zone = this.validateTimeZone(timezone);
      let dt = DateTime.fromISO(dateTimeStr, { zone });
      
      if (!dt.isValid) {
        // Try SQL format
        dt = DateTime.fromSQL(dateTimeStr, { zone });
      }
      
      if (!dt.isValid) {
        // Try HTTP format
        dt = DateTime.fromHTTP(dateTimeStr, { zone });
      }
      
      if (!dt.isValid) {
        throw new Error(`Failed to parse date string: ${dateTimeStr}`);
      }
      
      return dt;
    } catch (error) {
      console.error('[TimeZoneService] Error parsing with zone:', error);
      throw error;
    }
  }

  /**
   * Format a date for user display
   */
  static formatDate(date: DateTime | Date, format: 'full' | 'short' = 'full'): string {
    try {
      const dt = date instanceof DateTime ? date : DateTime.fromJSDate(date);
      
      if (format === 'full') {
        return dt.toFormat('MMMM d, yyyy');
      } else {
        return dt.toFormat('MM/dd/yyyy');
      }
    } catch (error) {
      console.error('[TimeZoneService] Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  /**
   * Format a time for user display
   */
  static formatTime(time: DateTime | Date, format: string = 'h:mm a', timezone?: string): string {
    try {
      let dt = time instanceof DateTime ? time : DateTime.fromJSDate(time);
      
      if (timezone) {
        dt = dt.setZone(this.validateTimeZone(timezone));
      }
      
      return dt.toFormat(format);
    } catch (error) {
      console.error('[TimeZoneService] Error formatting time:', error);
      return 'Invalid Time';
    }
  }

  /**
   * Format a datetime for user display
   */
  static formatDateTime(datetime: DateTime | Date, format: 'full' | 'short' = 'full', timezone?: string): string {
    try {
      let dt = datetime instanceof DateTime ? datetime : DateTime.fromJSDate(datetime);
      
      if (timezone) {
        dt = dt.setZone(this.validateTimeZone(timezone));
      }
      
      if (format === 'full') {
        return dt.toFormat('MMMM d, yyyy h:mm a');
      } else {
        return dt.toFormat('MM/dd/yyyy h:mm a');
      }
    } catch (error) {
      console.error('[TimeZoneService] Error formatting datetime:', error);
      return 'Invalid DateTime';
    }
  }

  /**
   * Format a timezone for user-friendly display
   */
  static formatTimeZoneDisplay(timezone: string): string {
    try {
      const zone = this.validateTimeZone(timezone);
      const now = DateTime.now().setZone(zone);
      const formatted = now.toFormat('ZZZZ');
      
      // Get cleaner timezone name
      const zoneName = zone.replace(/_/g, ' ').replace(/\//g, ' / ');
      
      return `${zoneName} (${formatted})`;
    } catch (error) {
      console.error('[TimeZoneService] Error formatting timezone display:', error);
      return timezone;
    }
  }

  /**
   * Get a list of common timezones
   */
  static getCommonTimezones(): { value: string; label: string }[] {
    // Get all IANA timezones
    const allZones = Info.features().zones ? Info.zones() : [];
    
    // Filter to common/major zones
    const commonZones = allZones
      .filter(zone => 
        zone.includes('America/') ||
        zone.includes('Europe/') ||
        zone.includes('Asia/') ||
        zone.includes('Australia/') ||
        zone === 'UTC'
      )
      .sort();
    
    // Map to value/label format
    return commonZones.map(zone => {
      const now = DateTime.now().setZone(zone);
      const offset = now.toFormat('ZZZZ');
      const label = `${zone.replace(/_/g, ' ')} (${offset})`;
      
      return {
        value: zone,
        label
      };
    });
  }
}

export default TimeZoneService;
