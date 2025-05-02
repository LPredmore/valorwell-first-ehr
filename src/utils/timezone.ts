
import { DateTime } from 'luxon';

export class TimeZoneService {
  /**
   * Ensures the provided timezone is a valid IANA timezone string
   */
  static ensureIANATimeZone(timezone?: string): string {
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
  static formatDateTime(date: Date | string, format?: string, timezone?: string): string {
    const dt = typeof date === 'string' 
      ? DateTime.fromISO(date, { zone: timezone || 'UTC' })
      : DateTime.fromJSDate(date, { zone: timezone || 'UTC' });
      
    return dt.toFormat(format || 'yyyy-MM-dd HH:mm');
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

  /* Additional methods needed to fix build errors */
  
  /**
   * Format a date string
   */
  static formatDate(date: string | Date | DateTime, format: string = 'yyyy-MM-dd'): string {
    if (date instanceof DateTime) {
      return date.toFormat(format);
    } else if (date instanceof Date) {
      return DateTime.fromJSDate(date).toFormat(format);
    }
    return DateTime.fromISO(date).toFormat(format);
  }

  /**
   * Format a time string
   */
  static formatTime(time: string | Date | DateTime, format: string = 'h:mm a', timezone?: string): string {
    if (time instanceof DateTime) {
      return time.toFormat(format);
    } else if (time instanceof Date) {
      return DateTime.fromJSDate(time).toFormat(format);
    }
    return DateTime.fromISO(time, { zone: timezone || 'UTC' }).toFormat(format);
  }

  /**
   * Add duration to a datetime
   */
  static addDuration(date: DateTime | Date | string, amount: number, unit: any): DateTime {
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = DateTime.fromISO(date);
    }
    
    return dt.plus({ [unit]: amount });
  }

  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: DateTime | Date | string, date2: DateTime | Date | string): boolean {
    const dt1 = date1 instanceof DateTime ? date1 : 
               (date1 instanceof Date ? DateTime.fromJSDate(date1) : DateTime.fromISO(date1));
    
    const dt2 = date2 instanceof DateTime ? date2 : 
               (date2 instanceof Date ? DateTime.fromJSDate(date2) : DateTime.fromISO(date2));
    
    return dt1.hasSame(dt2, 'day');
  }

  /**
   * Parse a date string with timezone
   */
  static parseWithZone(dateString: string, timezone: string): DateTime {
    return DateTime.fromISO(dateString, { zone: this.ensureIANATimeZone(timezone) });
  }

  /**
   * Get current datetime in specified timezone
   */
  static getCurrentDateTime(timezone: string): DateTime {
    return DateTime.now().setZone(this.ensureIANATimeZone(timezone));
  }

  /**
   * Get current time in specified timezone
   */
  static getCurrentTimeIn(timezone: string): DateTime {
    return DateTime.now().setZone(this.ensureIANATimeZone(timezone));
  }

  /**
   * Get weekday name from date
   */
  static getWeekdayName(date: DateTime | Date | string): string {
    const dt = date instanceof DateTime ? date : 
              (date instanceof Date ? DateTime.fromJSDate(date) : DateTime.fromISO(date));
    
    return dt.toFormat('cccc'); // Full weekday name
  }

  /**
   * Get month name from date
   */
  static getMonthName(date: DateTime | Date | string): string {
    const dt = date instanceof DateTime ? date : 
              (date instanceof Date ? DateTime.fromJSDate(date) : DateTime.fromISO(date));
    
    return dt.toFormat('MMMM'); // Full month name
  }

  /**
   * Format timezone display
   */
  static formatTimeZoneDisplay(timezone: string): string {
    const tz = this.ensureIANATimeZone(timezone);
    const now = DateTime.now().setZone(tz);
    const offset = now.toFormat('ZZ');
    const abbr = now.toFormat('ZZZZ');
    
    return `${tz} (${abbr}, UTC${offset})`;
  }

  /**
   * Convert timestamp to UTC
   */
  static toUTCTimestamp(date: Date | string, timezone: string): string {
    const dt = typeof date === 'string' 
      ? DateTime.fromISO(date, { zone: this.ensureIANATimeZone(timezone) })
      : DateTime.fromJSDate(date, { zone: this.ensureIANATimeZone(timezone) });
    
    return dt.toUTC().toISO();
  }

  /**
   * Convert UTC timestamp to local
   */
  static fromUTCTimestamp(utcDate: string, timezone: string): DateTime {
    return DateTime.fromISO(utcDate, { zone: 'UTC' })
      .setZone(this.ensureIANATimeZone(timezone));
  }

  /**
   * Get user's timezone
   */
  static getUserTimeZone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago';
    } catch (e) {
      return 'America/Chicago';
    }
  }
  
  // Define timezone options for selects
  static TIMEZONE_OPTIONS = [
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'Pacific/Honolulu', label: 'Hawaii' },
    { value: 'UTC', label: 'UTC' }
  ];
}
