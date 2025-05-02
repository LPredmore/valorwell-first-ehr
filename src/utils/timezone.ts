
import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';

export class TimeZoneService {
  /**
   * Gets the user's timezone
   */
  static getUserTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  /**
   * Ensures a timezone string is in IANA format
   */
  static ensureIANATimeZone(tz?: string | null, defaultTz = 'UTC'): string {
    if (!tz) return defaultTz;
    
    try {
      const dt = DateTime.now().setZone(tz);
      if (dt.isValid) {
        return tz;
      }
      console.warn(`[TimeZoneService] Invalid timezone: ${tz}, using ${defaultTz}`);
      return defaultTz;
    } catch (error) {
      console.warn(`[TimeZoneService] Error validating timezone ${tz}:`, error);
      return defaultTz;
    }
  }

  /**
   * Formats a timezone for display
   */
  static formatTimeZoneDisplay(timeZone: string): string {
    try {
      const now = DateTime.now().setZone(timeZone);
      if (!now.isValid) return timeZone;
      
      const offset = now.toFormat('ZZ');
      const label = timeZone.replace(/_/g, ' ');
      return `${label} (GMT${offset})`;
    } catch (error) {
      return timeZone;
    }
  }

  /**
   * Creates a DateTime object from date and time strings
   */
  static createDateTime(dateStr: string, timeStr: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    const fullDateTimeStr = `${dateStr}T${timeStr}`;
    
    return DateTime.fromISO(fullDateTimeStr, { zone: validTimeZone });
  }

  /**
   * Converts a DateTime from one timezone to another
   */
  static convertDateTime(dateTime: DateTime | string | Date, fromZone: string, toZone: string): DateTime {
    const validFromZone = this.ensureIANATimeZone(fromZone);
    const validToZone = this.ensureIANATimeZone(toZone);
    
    let dt: DateTime;
    
    if (dateTime instanceof DateTime) {
      dt = dateTime.setZone(validFromZone);
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime, { zone: validFromZone });
    } else {
      dt = DateTime.fromISO(dateTime, { zone: validFromZone });
    }
    
    return dt.setZone(validToZone);
  }

  /**
   * Formats a DateTime according to specified format
   */
  static formatDateTime(dateTime: DateTime | Date | string, format: string = 'full', timeZone?: string): string {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    let dt: DateTime;
    
    if (dateTime instanceof DateTime) {
      dt = dateTime.setZone(validTimeZone);
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime, { zone: validTimeZone });
    } else {
      dt = DateTime.fromISO(dateTime, { zone: validTimeZone });
    }
    
    if (!dt.isValid) return 'Invalid date';
    
    // Handle predefined formats
    switch (format) {
      case 'full':
        return dt.toLocaleString(DateTime.DATETIME_FULL);
      case 'date':
        return dt.toLocaleString(DateTime.DATE_FULL);
      case 'time':
        return dt.toLocaleString(DateTime.TIME_SIMPLE);
      default:
        return dt.toFormat(format);
    }
  }

  /**
   * Format just the time part
   */
  static formatTime(time: string | Date | DateTime, format: string = 'h:mm a', timeZone?: string): string {
    return this.formatDateTime(time, format, timeZone);
  }

  /**
   * Format just the date part
   */
  static formatDate(date: DateTime | Date | string, format: string = 'yyyy-MM-dd', timeZone?: string): string {
    return this.formatDateTime(date, format, timeZone);
  }

  /**
   * Converts a calendar event's dates to the user's timezone
   */
  static convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
    const validTimeZone = this.ensureIANATimeZone(userTimeZone);
    const sourceTimeZone = event.extendedProps?.sourceTimeZone || 'UTC';
    
    let eventStart: DateTime;
    let eventEnd: DateTime;
    
    // Convert start time
    if (typeof event.start === 'string') {
      eventStart = DateTime.fromISO(event.start, { zone: sourceTimeZone }).setZone(validTimeZone);
    } else {
      eventStart = DateTime.fromJSDate(event.start, { zone: sourceTimeZone }).setZone(validTimeZone);
    }
    
    // Convert end time
    if (typeof event.end === 'string') {
      eventEnd = DateTime.fromISO(event.end, { zone: sourceTimeZone }).setZone(validTimeZone);
    } else {
      eventEnd = DateTime.fromJSDate(event.end, { zone: sourceTimeZone }).setZone(validTimeZone);
    }
    
    // Create additional display fields for the event
    const displayStart = this.formatTime(eventStart);
    const displayEnd = this.formatTime(eventEnd);
    const displayDay = eventStart.toFormat('cccc');
    const displayDate = eventStart.toFormat('MMM d, yyyy');
    
    // Return the event with converted times and display fields
    return {
      ...event,
      start: eventStart.toJSDate(),
      end: eventEnd.toJSDate(),
      extendedProps: {
        ...event.extendedProps,
        sourceTimeZone,
        displayStart,
        displayEnd,
        displayDay,
        displayDate,
        _userTimeZone: validTimeZone
      }
    };
  }

  /**
   * Converts a DateTime to UTC
   */
  static toUTC(date: Date | DateTime): DateTime {
    if (date instanceof DateTime) {
      return date.toUTC();
    }
    return DateTime.fromJSDate(date).toUTC();
  }

  /**
   * Converts a UTC string to a DateTime in the specified timezone
   */
  static fromUTC(utcStr: string, timezone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timezone);
    return DateTime.fromISO(utcStr, { zone: 'UTC' }).setZone(validTimeZone);
  }

  /**
   * Parse a date string with timezone
   */
  static parseWithZone(dateString: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(dateString, { zone: validTimeZone });
  }
}

export default TimeZoneService;
