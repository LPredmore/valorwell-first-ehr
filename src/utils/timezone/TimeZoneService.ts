import { DateTime } from 'luxon';
import { TimeUnit, DateTimeFormat } from './types';

/**
 * TimeZone Service - A unified service for all timezone operations
 * This serves as the single source of truth for timezone handling throughout the application
 * All timezone operations MUST use this service to ensure consistency
 */
export class TimeZoneService {
  /**
   * Ensures that a timezone string is a valid IANA timezone
   * Falls back to UTC if an invalid timezone is provided
   */
  static ensureIANATimeZone(timezone: string | undefined | null): string {
    if (!timezone) {
      console.log('[TimeZoneService] No timezone provided, defaulting to UTC');
      return 'UTC';
    }

    try {
      // Try to create a DateTime object with the timezone to validate it
      const dt = DateTime.now().setZone(timezone);
      
      if (!dt.isValid) {
        console.warn(`[TimeZoneService] Invalid timezone: ${timezone}, defaulting to UTC`);
        return 'UTC';
      }
      
      return timezone;
    } catch (error) {
      console.warn(`[TimeZoneService] Error validating timezone: ${timezone}`, error);
      return 'UTC';
    }
  }

  /**
   * Format a display string for a timezone (e.g. "America/New_York (EDT)")
   */
  static formatTimeZoneDisplay(timezone: string): string {
    const validZone = this.ensureIANATimeZone(timezone);
    try {
      const now = DateTime.now().setZone(validZone);
      return `${validZone} (${now.offsetNameShort})`;
    } catch (error) {
      return validZone;
    }
  }

  /**
   * Create a DateTime object from date and time strings in a specific timezone
   */
  static createDateTime(dateStr: string, timeStr: string, timezone: string): DateTime {
    console.log(`[TimeZoneService] Creating DateTime from: date=${dateStr}, time=${timeStr}, timezone=${timezone}`);
    const validZone = this.ensureIANATimeZone(timezone);
    
    // If date string is already in ISO format, use it directly
    if (dateStr.includes('T')) {
      return DateTime.fromISO(dateStr, { zone: validZone });
    }
    
    // Otherwise, combine date and time
    const combinedStr = `${dateStr}T${timeStr}`;
    return DateTime.fromISO(combinedStr, { zone: validZone });
  }

  /**
   * Convert a DateTime between timezones
   */
  static convertDateTime(date: DateTime | Date | string, sourceZone: string, targetZone: string): DateTime {
    console.log(`[TimeZoneService] Converting DateTime from ${sourceZone} to ${targetZone}`);
    const validSourceZone = this.ensureIANATimeZone(sourceZone);
    const validTargetZone = this.ensureIANATimeZone(targetZone);
    
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date.setZone(validSourceZone);
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date, { zone: validSourceZone });
    } else {
      dt = DateTime.fromISO(date, { zone: validSourceZone });
    }
    
    if (!dt.isValid) {
      console.error(`[TimeZoneService] Invalid date: ${date}`);
      throw new Error(`Invalid date: ${date}`);
    }
    
    return dt.setZone(validTargetZone);
  }

  /**
   * Format a DateTime for display
   */
  static formatDateTime(date: DateTime | Date | string, format: DateTimeFormat, timezone: string): string {
    console.log(`[TimeZoneService] Formatting DateTime with format: ${format}, timezone: ${timezone}`);
    const validZone = this.ensureIANATimeZone(timezone);
    
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date.setZone(validZone);
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date, { zone: validZone });
    } else {
      dt = DateTime.fromISO(date, { zone: validZone });
    }
    
    if (!dt.isValid) {
      console.error(`[TimeZoneService] Invalid date for formatting: ${date}`);
      return 'Invalid Date';
    }
    
    return dt.toFormat(format);
  }

  /**
   * Format a time string for display
   */
  static formatTime(date: DateTime | Date | string, format: string, timezone: string): string {
    return this.formatDateTime(date, format, timezone);
  }

  /**
   * Convert a local time to UTC
   */
  static toUTC(date: DateTime | Date | string, timezone?: string): DateTime {
    console.log(`[TimeZoneService] Converting to UTC from timezone: ${timezone}`);
    const sourceZone = this.ensureIANATimeZone(timezone);
    
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date.setZone(sourceZone);
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date, { zone: sourceZone });
    } else {
      dt = DateTime.fromISO(date, { zone: sourceZone });
    }
    
    return dt.setZone('UTC');
  }

  /**
   * Convert a UTC time to local time
   */
  static fromUTC(date: string | Date | DateTime, timezone?: string): DateTime {
    console.log(`[TimeZoneService] Converting from UTC to timezone: ${timezone}`);
    const targetZone = this.ensureIANATimeZone(timezone);
    
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date.setZone('UTC');
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date, { zone: 'UTC' });
    } else {
      dt = DateTime.fromISO(date, { zone: 'UTC' });
    }
    
    return dt.setZone(targetZone);
  }

  /**
   * Convert a calendar event to a user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimezone: string): any {
    console.log(`[TimeZoneService] Converting event to user timezone: ${userTimezone}`);
    try {
      const validZone = this.ensureIANATimeZone(userTimezone);
      const sourceZone = this.ensureIANATimeZone(event.source_time_zone || event.sourceTimeZone || 'UTC');
      
      // Deep clone the event to avoid modifying the original
      const convertedEvent = JSON.parse(JSON.stringify(event));
      
      // Convert start and end times
      if (event.start || event.startTime || event.start_time) {
        const start = event.start || event.startTime || event.start_time;
        const startDateTime = this.convertDateTime(start, sourceZone, validZone);
        
        // Set both camelCase and snake_case properties
        convertedEvent.display_start_time = startDateTime.toFormat('HH:mm');
        convertedEvent.displayStartTime = startDateTime.toFormat('HH:mm');
      }
      
      if (event.end || event.endTime || event.end_time) {
        const end = event.end || event.endTime || event.end_time;
        const endDateTime = this.convertDateTime(end, sourceZone, validZone);
        
        // Set both camelCase and snake_case properties
        convertedEvent.display_end_time = endDateTime.toFormat('HH:mm');
        convertedEvent.displayEndTime = endDateTime.toFormat('HH:mm');
      }
      
      // Store the user timezone for reference
      convertedEvent.display_time_zone = validZone;
      convertedEvent.displayTimeZone = validZone;
      
      return convertedEvent;
    } catch (error) {
      console.error('[TimeZoneService] Error converting event to user timezone:', error);
      return event; // Return original event if conversion fails
    }
  }
  
  /**
   * Debug utility to print timezone information
   */
  static logTimeZoneInfo(): void {
    console.log('======= TIMEZONE DEBUG INFO =======');
    console.log('Current system timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    const now = new Date();
    console.log('Current time (local):', now.toString());
    console.log('Current time (ISO):', now.toISOString());
    
    const luxonNow = DateTime.now();
    console.log('Luxon current timezone:', luxonNow.zoneName);
    console.log('Luxon offset minutes:', luxonNow.offset);
    console.log('Luxon offset name:', luxonNow.offsetNameShort);
    console.log('==================================');
  }
}

export default TimeZoneService;
