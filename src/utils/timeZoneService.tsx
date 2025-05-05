
import { DateTime } from 'luxon';

export class TimeZoneService {
  /**
   * Ensures a timezone string is a valid IANA timezone
   */
  static ensureIANATimeZone(timezone: string | null | undefined): string {
    if (!timezone) {
      return 'America/Chicago'; // Default fallback
    }
    
    try {
      // Check if the timezone is valid by attempting to create a DateTime with it
      const now = DateTime.now().setZone(timezone);
      if (!now.isValid || now.invalidReason) {
        console.warn(`Invalid timezone: ${timezone}, falling back to America/Chicago`);
        return 'America/Chicago';
      }
      return timezone;
    } catch (error) {
      console.warn(`Error validating timezone: ${timezone}`, error);
      return 'America/Chicago';
    }
  }
  
  /**
   * Creates a DateTime object from date and time strings in the specified timezone
   */
  static createDateTime(dateStr: string, timeStr: string, timezone: string): DateTime {
    const safeTimezone = this.ensureIANATimeZone(timezone);
    return DateTime.fromFormat(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', { zone: safeTimezone });
  }
  
  /**
   * Converts a DateTime from one timezone to another
   */
  static convertDateTime(date: DateTime, sourceZone: string, targetZone: string): DateTime {
    const safeSourceZone = this.ensureIANATimeZone(sourceZone);
    const safeTargetZone = this.ensureIANATimeZone(targetZone);
    
    // Ensure date is in the source timezone first
    const dateInSourceZone = date.setZone(safeSourceZone);
    // Then convert to target timezone
    return dateInSourceZone.setZone(safeTargetZone);
  }
  
  /**
   * Formats a DateTime object according to the specified format and timezone
   */
  static formatDateTime(date: DateTime, format: string, timezone: string): string {
    const safeTimezone = this.ensureIANATimeZone(timezone);
    return date.setZone(safeTimezone).toFormat(format);
  }
  
  /**
   * Converts a datetime to UTC
   */
  static toUTC(date: DateTime): DateTime {
    return date.toUTC();
  }
  
  /**
   * Converts a UTC datetime string to a DateTime in the specified timezone
   */
  static fromUTC(utcStr: string, timezone: string): DateTime {
    const safeTimezone = this.ensureIANATimeZone(timezone);
    return DateTime.fromISO(utcStr, { zone: 'utc' }).setZone(safeTimezone);
  }

  /**
   * Converts a calendar event from UTC to a user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimezone: string): any {
    if (!event) return null;
    
    const safeTimezone = this.ensureIANATimeZone(userTimezone);
    
    // Create a deep copy of the event to avoid modifying the original
    const localEvent = { ...event };
    
    if (event.start_time) {
      // Assuming start_time is in HH:MM format
      const [hours, minutes] = event.start_time.split(':').map(Number);
      const dt = DateTime.fromObject({ 
        year: new Date(event.date).getFullYear(),
        month: new Date(event.date).getMonth() + 1, 
        day: new Date(event.date).getDate(),
        hour: hours,
        minute: minutes 
      }, { zone: 'utc' }).setZone(safeTimezone);
      
      localEvent.start_time = dt.toFormat('HH:mm');
    }
    
    if (event.end_time) {
      // Assuming end_time is in HH:MM format
      const [hours, minutes] = event.end_time.split(':').map(Number);
      const dt = DateTime.fromObject({ 
        year: new Date(event.date).getFullYear(),
        month: new Date(event.date).getMonth() + 1, 
        day: new Date(event.date).getDate(),
        hour: hours,
        minute: minutes 
      }, { zone: 'utc' }).setZone(safeTimezone);
      
      localEvent.end_time = dt.toFormat('HH:mm');
    }
    
    return localEvent;
  }
}
