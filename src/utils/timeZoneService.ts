
import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';

/**
 * TimeZoneService - A utility class for handling timezone operations
 * This is the official source of truth for timezone operations in the app
 * All timezone operations should go through this service
 */
export class TimeZoneService {
  /**
   * Ensures a timezone string is a valid IANA timezone
   * @param timezone The timezone string to validate
   * @param defaultTimezone The default timezone to use if the input is invalid (defaults to UTC)
   * @returns A valid IANA timezone string
   */
  static ensureIANATimeZone(timezone: string | null | undefined, defaultTimezone: string = 'UTC'): string {
    if (!timezone) {
      console.log(`[TimeZoneService] Invalid timezone provided: ${timezone}, using default: ${defaultTimezone}`);
      return defaultTimezone;
    }
    
    // Check if it's a valid timezone
    try {
      const dt = DateTime.now().setZone(timezone);
      if (dt.invalidReason) {
        console.log(`[TimeZoneService] Invalid timezone: ${timezone}, using default: ${defaultTimezone}`);
        return defaultTimezone;
      }
      return timezone;
    } catch (error) {
      console.log(`[TimeZoneService] Error validating timezone: ${timezone}, using default: ${defaultTimezone}`);
      return defaultTimezone;
    }
  }

  /**
   * Gets the local timezone from the browser
   * @returns The local timezone string
   */
  static getLocalTimeZone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (error) {
      console.error('[TimeZoneService] Error getting local timezone:', error);
      return 'UTC';
    }
  }

  /**
   * Format a timezone for display
   * @param timezone The timezone string to format
   * @returns A formatted timezone string for display
   */
  static formatTimeZoneDisplay(timezone: string): string {
    // Define common timezone display names
    const timezoneDisplayMap: Record<string, string> = {
      'America/New_York': 'Eastern Time (US & Canada)',
      'America/Chicago': 'Central Time (US & Canada)',
      'America/Denver': 'Mountain Time (US & Canada)',
      'America/Los_Angeles': 'Pacific Time (US & Canada)',
      'America/Phoenix': 'Arizona',
      'America/Anchorage': 'Alaska',
      'Pacific/Honolulu': 'Hawaii',
      'Europe/London': 'London',
      'Europe/Paris': 'Paris',
      'Asia/Tokyo': 'Tokyo',
      'Australia/Sydney': 'Sydney',
      'UTC': 'UTC',
    };
    
    if (timezoneDisplayMap[timezone]) {
      return timezoneDisplayMap[timezone];
    }
    
    // Try to format the timezone in a user-friendly way
    try {
      const now = DateTime.now().setZone(timezone);
      return now.zoneName || timezone;
    } catch (error) {
      // If all else fails, return the original timezone string
      return timezone;
    }
  }

  /**
   * Create a DateTime object from date and time strings
   * @param date The date string (YYYY-MM-DD)
   * @param time The time string (HH:MM)
   * @param timezone The timezone to use
   * @returns A Luxon DateTime object
   */
  static createDateTime(date: string, time: string, timezone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timezone);
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    
    return DateTime.fromObject({
      year,
      month,
      day,
      hour,
      minute,
    }, { zone: validTimeZone });
  }

  /**
   * Get the current date and time in a specific timezone
   * @param timezone The timezone to use
   * @returns A Luxon DateTime object
   */
  static getCurrentDateTime(timezone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timezone);
    return DateTime.now().setZone(validTimeZone);
  }

  /**
   * Convert a datetime to a different timezone
   * @param dateTime The datetime to convert (Luxon DateTime, JS Date, or ISO string)
   * @param fromZone The source timezone
   * @param toZone The target timezone
   * @returns A Luxon DateTime object in the target timezone
   */
  static convertDateTime(
    dateTime: DateTime | Date | string,
    fromZone: string,
    toZone: string
  ): DateTime {
    const validFromZone = this.ensureIANATimeZone(fromZone);
    const validToZone = this.ensureIANATimeZone(toZone);
    
    let dt: DateTime;
    
    if (dateTime instanceof DateTime) {
      dt = dateTime.setZone(validFromZone);
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime).setZone(validFromZone);
    } else {
      dt = DateTime.fromISO(dateTime).setZone(validFromZone);
    }
    
    return dt.setZone(validToZone);
  }

  /**
   * Format a datetime object according to a specific format
   * @param dateTime The datetime to format (Luxon DateTime, JS Date, or ISO string)
   * @param format The format string or predefined format name
   * @param timezone Optional timezone to convert to before formatting
   * @returns A formatted string
   */
  static formatDateTime(
    dateTime: DateTime | Date | string,
    format: string,
    timezone?: string
  ): string {
    let dt: DateTime;
    
    if (dateTime instanceof DateTime) {
      dt = dateTime;
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime);
    } else {
      dt = DateTime.fromISO(dateTime);
    }
    
    if (timezone) {
      dt = dt.setZone(this.ensureIANATimeZone(timezone));
    }
    
    // Handle predefined formats
    switch (format) {
      case 'date':
        return dt.toFormat('yyyy-MM-dd');
      case 'time':
        return dt.toFormat('HH:mm');
      case 'datetime':
        return dt.toFormat('yyyy-MM-dd HH:mm');
      case 'full':
        return dt.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ');
      default:
        return dt.toFormat(format);
    }
  }

  /**
   * Convert a datetime to UTC
   * @param dateTime The datetime to convert (Luxon DateTime, JS Date, or ISO string)
   * @returns A Luxon DateTime object in UTC
   */
  static toUTC(dateTime: DateTime | Date | string): DateTime {
    let dt: DateTime;
    
    if (dateTime instanceof DateTime) {
      dt = dateTime;
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime);
    } else {
      dt = DateTime.fromISO(dateTime);
    }
    
    return dt.toUTC();
  }

  /**
   * Convert a UTC datetime to a specific timezone
   * @param utcDateTime The UTC datetime (ISO string or Luxon DateTime)
   * @param timezone The target timezone
   * @returns A Luxon DateTime object in the target timezone
   */
  static fromUTC(utcDateTime: string | DateTime, timezone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timezone);
    
    let dt: DateTime;
    if (utcDateTime instanceof DateTime) {
      dt = utcDateTime;
    } else {
      dt = DateTime.fromISO(utcDateTime);
    }
    
    // Ensure we're starting with UTC
    dt = dt.toUTC();
    
    // Convert to the target timezone
    return dt.setZone(validTimeZone);
  }

  /**
   * Convert a calendar event from UTC to user timezone
   * @param event The calendar event to convert
   * @param userTimeZone The user's timezone
   * @returns The converted calendar event
   */
  static convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
    const validTimeZone = this.ensureIANATimeZone(userTimeZone);
    const sourceTimeZone = this.ensureIANATimeZone(
      event.extendedProps?.sourceTimeZone || event.extendedProps?.timezone || 'UTC'
    );

    try {
      // Clone the event to avoid mutating the original
      const convertedEvent = { ...event };
      
      // Convert start time
      const startDt = typeof event.start === 'string'
        ? DateTime.fromISO(event.start).setZone(sourceTimeZone)
        : DateTime.fromJSDate(event.start).setZone(sourceTimeZone);
      
      // Convert end time
      const endDt = typeof event.end === 'string'
        ? DateTime.fromISO(event.end).setZone(sourceTimeZone)
        : DateTime.fromJSDate(event.end).setZone(sourceTimeZone);
      
      // Convert to user timezone
      const userStartDt = startDt.setZone(validTimeZone);
      const userEndDt = endDt.setZone(validTimeZone);
      
      // Update the event
      convertedEvent.start = userStartDt.toJSDate();
      convertedEvent.end = userEndDt.toJSDate();
      
      // Add display information in extendedProps
      convertedEvent.extendedProps = {
        ...(convertedEvent.extendedProps || {}),
        displayTimeZone: validTimeZone,
        sourceTimeZone,
        displayStart: userStartDt.toLocaleString(DateTime.DATETIME_SHORT),
        displayEnd: userEndDt.toLocaleString(DateTime.DATETIME_SHORT),
        displayDay: userStartDt.toLocaleString({ weekday: 'long' }),
        displayDate: userStartDt.toLocaleString(DateTime.DATE_MED),
      };
      
      // Track the user timezone
      convertedEvent._userTimeZone = validTimeZone;
      
      return convertedEvent;
    } catch (error) {
      console.error(
        `[TimeZoneService] Error converting event timezone from ${sourceTimeZone} to ${validTimeZone}:`, 
        error
      );
      return event; // Return original event on error
    }
  }
}

// Alias the class for backward compatibility with existing imports
export const timezone = TimeZoneService;
