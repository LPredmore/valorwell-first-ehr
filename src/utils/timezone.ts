
import { DateTime } from 'luxon';

export class TimeZoneService {
  /**
   * Ensures the provided timezone is a valid IANA timezone string
   */
  static ensureIANATimeZone(timezone: string): string {
    if (!timezone) {
      return 'America/Chicago'; // Default timezone
    }
    
    try {
      // Validate by trying to create a DateTime object with this timezone
      const dt = DateTime.now().setZone(timezone);
      return dt.isValid ? timezone : 'America/Chicago';
    } catch (e) {
      console.error('Invalid timezone:', timezone);
      return 'America/Chicago';
    }
  }
  
  /**
   * Convert an event to the user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimezone: string): any {
    // If no event or it's already in the correct timezone, return as is
    if (!event) return event;
    
    const safeTz = this.ensureIANATimeZone(userTimezone);
    
    // Make a deep copy to avoid modifying the original
    const newEvent = { ...event };
    
    // Convert start and end dates if they exist
    if (newEvent.start) {
      if (newEvent.start instanceof Date) {
        const dt = DateTime.fromJSDate(newEvent.start).setZone(safeTz);
        newEvent.start = dt.toJSDate();
      } else if (typeof newEvent.start === 'string') {
        const dt = DateTime.fromISO(newEvent.start).setZone(safeTz);
        newEvent.start = dt.toJSDate();
      }
    }
    
    if (newEvent.end) {
      if (newEvent.end instanceof Date) {
        const dt = DateTime.fromJSDate(newEvent.end).setZone(safeTz);
        newEvent.end = dt.toJSDate();
      } else if (typeof newEvent.end === 'string') {
        const dt = DateTime.fromISO(newEvent.end).setZone(safeTz);
        newEvent.end = dt.toJSDate();
      }
    }
    
    // Add timezone to extendedProps if not present
    if (!newEvent.extendedProps) {
      newEvent.extendedProps = {};
    }
    newEvent.extendedProps.timeZone = safeTz;
    
    return newEvent;
  }

  /**
   * Format a DateTime object according to the specified format and timezone
   */
  static formatDateTime(date: Date | string, format: string, timezone?: string): string {
    const dt = typeof date === 'string' 
      ? DateTime.fromISO(date, { zone: timezone || 'UTC' })
      : DateTime.fromJSDate(date, { zone: timezone || 'UTC' });
      
    return dt.toFormat(format);
  }

  /**
   * Create a DateTime object from date and time strings
   */
  static createDateTime(dateStr: string, timeStr: string, timezone: string): DateTime {
    const safeTz = this.ensureIANATimeZone(timezone);
    return DateTime.fromFormat(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', { zone: safeTz });
  }

  /**
   * Convert DateTime between timezones
   */
  static convertDateTime(date: Date | string | DateTime, sourceZone: string, targetZone: string): DateTime {
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date.setZone(this.ensureIANATimeZone(sourceZone));
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date, { zone: this.ensureIANATimeZone(sourceZone) });
    } else {
      dt = DateTime.fromISO(date, { zone: this.ensureIANATimeZone(sourceZone) });
    }
    
    return dt.setZone(this.ensureIANATimeZone(targetZone));
  }

  /**
   * Convert to UTC
   */
  static toUTC(localDateTime: Date | string | DateTime, sourceZone?: string): string {
    let dt: DateTime;
    
    if (localDateTime instanceof DateTime) {
      dt = localDateTime;
    } else if (localDateTime instanceof Date) {
      dt = DateTime.fromJSDate(localDateTime, { zone: sourceZone || 'local' });
    } else {
      dt = DateTime.fromISO(localDateTime, { zone: sourceZone || 'local' });
    }
    
    return dt.toUTC().toISO();
  }

  /**
   * Convert from UTC to local timezone
   */
  static fromUTC(utcStr: string, targetZone: string): DateTime {
    return DateTime.fromISO(utcStr, { zone: 'UTC' }).setZone(this.ensureIANATimeZone(targetZone));
  }
}
