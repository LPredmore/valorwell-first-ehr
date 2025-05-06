
import { DateTime } from 'luxon';
import { toast } from '@/hooks/use-toast';

/**
 * TimeZoneService provides timezone handling functionality for the entire application
 * following the Timezone Handling Standards.
 */
export class TimeZoneService {
  /**
   * Ensures that a timezone string is a valid IANA timezone.
   * If invalid, falls back to a default timezone and logs the error.
   */
  static ensureIANATimeZone(timezone: string | null | undefined): string {
    if (!timezone) {
      console.warn('Empty timezone provided, falling back to America/Chicago');
      return 'America/Chicago';
    }

    try {
      // Check if timezone is a valid IANA timezone
      const dt = DateTime.now().setZone(timezone);
      if (dt.isValid) {
        return timezone;
      }
      
      console.warn(`Invalid timezone: ${timezone}, falling back to America/Chicago`);
      return 'America/Chicago';
    } catch (error) {
      console.error(`Error validating timezone: ${timezone}`, error);
      return 'America/Chicago';
    }
  }

  /**
   * Creates a DateTime object from date and time strings in the specified timezone
   */
  static createDateTime(dateStr: string, timeStr: string, timezone: string): DateTime {
    const safeTimezone = this.ensureIANATimeZone(timezone);
    const fullDateTimeStr = `${dateStr}T${timeStr}`;
    
    try {
      const dt = DateTime.fromISO(fullDateTimeStr, { zone: safeTimezone });
      if (!dt.isValid) {
        console.error(`Invalid DateTime created: ${dt.invalidReason}: ${dt.invalidExplanation}`);
      }
      return dt;
    } catch (error) {
      console.error(`Error creating DateTime from: ${fullDateTimeStr} in timezone ${safeTimezone}`, error);
      // Return current time as fallback
      return DateTime.now().setZone(safeTimezone);
    }
  }

  /**
   * Converts a DateTime object from one timezone to another
   */
  static convertDateTime(dt: DateTime, fromTimezone: string, toTimezone: string): DateTime {
    const safeFromTimezone = this.ensureIANATimeZone(fromTimezone);
    const safeToTimezone = this.ensureIANATimeZone(toTimezone);
    
    try {
      return dt.setZone(safeFromTimezone).setZone(safeToTimezone);
    } catch (error) {
      console.error(`Error converting timezone from ${safeFromTimezone} to ${safeToTimezone}`, error);
      return dt;
    }
  }

  /**
   * Formats a DateTime object according to the specified format and timezone
   */
  static formatDateTime(dt: DateTime, format: string, timezone: string): string {
    const safeTimezone = this.ensureIANATimeZone(timezone);
    
    try {
      return dt.setZone(safeTimezone).toFormat(format);
    } catch (error) {
      console.error(`Error formatting DateTime in timezone ${safeTimezone}`, error);
      return dt.toFormat(format);
    }
  }

  /**
   * Converts a DateTime to UTC for database storage
   */
  static toUTC(dt: DateTime): string {
    try {
      return dt.toUTC().toISO();
    } catch (error) {
      console.error('Error converting to UTC', error);
      return DateTime.utc().toISO();
    }
  }

  /**
   * Converts a UTC string from the database to the user's timezone
   */
  static fromUTC(utcStr: string, userTimezone: string): DateTime {
    const safeTimezone = this.ensureIANATimeZone(userTimezone);
    
    try {
      return DateTime.fromISO(utcStr, { zone: 'utc' }).setZone(safeTimezone);
    } catch (error) {
      console.error(`Error converting from UTC to ${safeTimezone}`, error);
      return DateTime.now().setZone(safeTimezone);
    }
  }

  /**
   * Converts a calendar event to the user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimezone: string): any {
    if (!event) return null;
    
    try {
      const safeTimezone = this.ensureIANATimeZone(userTimezone);
      
      // Deep clone the event to avoid modifying the original
      const localEvent = JSON.parse(JSON.stringify(event));
      
      // Convert start and end times
      if (localEvent.start) {
        const startDt = DateTime.fromISO(localEvent.start);
        localEvent.start = startDt.setZone(safeTimezone).toISO();
      }
      
      if (localEvent.end) {
        const endDt = DateTime.fromISO(localEvent.end);
        localEvent.end = endDt.setZone(safeTimezone).toISO();
      }
      
      return localEvent;
    } catch (error) {
      console.error('Error converting event to user timezone', error);
      return event;
    }
  }
}
