import { DateTime } from 'luxon';

/**
 * TimeZoneService
 * 
 * Centralized service for handling all timezone-related operations.
 * This service uses Luxon for all timezone handling to ensure consistency
 * across the application.
 */
export class TimeZoneService {
  /**
   * List of common IANA timezone options
   */
  static TIMEZONE_OPTIONS = [
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'Pacific/Honolulu', label: 'Hawaii' },
    { value: 'America/Phoenix', label: 'Arizona' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Europe/Berlin', label: 'Berlin' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Shanghai' },
    { value: 'Australia/Sydney', label: 'Sydney' },
    { value: 'UTC', label: 'UTC' },
  ];

  /**
   * Legacy method for tests - redirects to ensureIANATimeZone
   * @deprecated Use ensureIANATimeZone instead
   */
  static validateTimeZone(tz?: string | null, defaultTz = 'UTC'): string {
    return this.ensureIANATimeZone(tz, defaultTz);
  }
  
  /**
   * Validates and ensures a timezone string is in IANA format
   * @param tz Timezone string to validate
   * @param defaultTz Default timezone to use if input is invalid
   * @returns Valid IANA timezone string
   */
  static ensureIANATimeZone(tz?: string | null, defaultTz = 'UTC'): string {
    if (!tz) return defaultTz;
    
    try {
      // Check if Luxon recognizes this timezone
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
   * Gets the current local timezone of the browser
   */
  static getLocalTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  /**
   * Gets the user's timezone - alias for getLocalTimeZone for backward compatibility
   * @deprecated Use getLocalTimeZone instead
   */
  static getUserTimeZone(): string {
    return this.getLocalTimeZone();
  }

  /**
   * Formats timezone for display
   * @param timeZone IANA timezone string
   */
  static formatTimeZoneDisplay(timeZone: string): string {
    // First ensure it's valid
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    
    // Find the label if it's in our options
    const tzOption = this.TIMEZONE_OPTIONS.find(opt => opt.value === validTimeZone);
    if (tzOption) {
      return tzOption.label;
    }
    
    try {
      // Otherwise, format it nicely using DateTime
      const now = DateTime.now().setZone(validTimeZone);
      const offset = now.toFormat('Z');
      const name = now.toFormat('ZZZZ');
      
      return `${name} (GMT${offset})`;
    } catch (error) {
      return validTimeZone;
    }
  }

  /**
   * Creates a DateTime object from date and time strings
   * @param dateStr Date string
   * @param timeStr Time string
   * @param timeZone Timezone to use
   */
  static createDateTime(dateStr: string, timeStr: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromFormat(
      `${dateStr} ${timeStr}`,
      'yyyy-MM-dd HH:mm',
      { zone: validTimeZone }
    );
  }

  /**
   * Gets the current date and time in a specific timezone
   * @param timeZone IANA timezone string
   */
  static getCurrentDateTime(timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.now().setZone(validTimeZone);
  }

  /**
   * Alias for getCurrentDateTime for backward compatibility
   * @param timeZone IANA timezone string
   */
  static getCurrentTimeIn(timeZone: string): DateTime {
    return this.getCurrentDateTime(timeZone);
  }

  /**
   * Converts a DateTime from one timezone to another
   * @param dateTime DateTime object or string to convert
   * @param fromZone Source timezone
   * @param toZone Target timezone
   */
  static convertDateTime(dateTime: DateTime | string | Date, fromZone: string, toZone: string): DateTime {
    const validFromZone = this.ensureIANATimeZone(fromZone);
    const validToZone = this.ensureIANATimeZone(toZone);
    
    let dt: DateTime;
    
    if (dateTime instanceof DateTime) {
      dt = dateTime;
    } else if (dateTime instanceof Date) {
      dt = DateTime.fromJSDate(dateTime).setZone(validFromZone);
    } else {
      // Handle ISO string
      dt = DateTime.fromISO(dateTime, { zone: validFromZone });
    }
    
    return dt.setZone(validToZone);
  }

  /**
   * Format a time string
   * @param timeStr Time string to format
   * @param format Optional format string (defaults to h:mm a)
   * @param timeZone Optional timezone to use
   * @returns Formatted time string
   */
  static formatTime(timeStr: string, format: string = 'h:mm a', timeZone?: string): string {
    try {
      // If timeStr is just a time (not date+time), append a date
      if (!timeStr.includes('T') && !timeStr.includes(' ')) {
        const today = DateTime.now().toISODate();
        timeStr = `${today}T${timeStr}`;
      }
      
      // Parse the time string
      let dt: DateTime;
      if (timeStr.includes('T')) {
        dt = DateTime.fromISO(timeStr);
      } else {
        dt = DateTime.fromFormat(timeStr, 'yyyy-MM-dd HH:mm');
      }
      
      // Set timezone if provided
      if (timeZone) {
        dt = dt.setZone(this.ensureIANATimeZone(timeZone));
      }
      
      // Format the time
      return dt.toFormat(format);
    } catch (error) {
      console.error('[TimeZoneService] Error formatting time:', error);
      return timeStr; // Return original string as fallback
    }
  }

  /**
   * Formats a DateTime object according to the specified format
   * @param dateTime DateTime object to format
   * @param format Format string or predefined format
   * @param timeZone Timezone to use for formatting
   */
  static formatDateTime(dateTime: DateTime | Date | string, format: string = 'full', timeZone?: string): string {
    let dt: DateTime;
    
    const validTimeZone = timeZone ? this.ensureIANATimeZone(timeZone) : undefined;
    
    if (dateTime instanceof DateTime) {
      dt = validTimeZone ? dateTime.setZone(validTimeZone) : dateTime;
    } else if (dateTime instanceof Date) {
      dt = validTimeZone 
        ? DateTime.fromJSDate(dateTime).setZone(validTimeZone)
        : DateTime.fromJSDate(dateTime);
    } else {
      dt = validTimeZone 
        ? DateTime.fromISO(dateTime).setZone(validTimeZone)
        : DateTime.fromISO(dateTime);
    }
    
    // Handle predefined formats
    switch (format) {
      case 'full':
        return dt.toFormat('DDDD, t');
      case 'date':
        return dt.toFormat('yyyy-MM-dd');
      case 'time':
        return dt.toFormat('HH:mm');
      default:
        return dt.toFormat(format);
    }
  }

  /**
   * Converts a calendar event to the user's timezone
   * @param event Calendar event to convert
   * @param userTimeZone User's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimeZone: string): any {
    const validTimeZone = this.ensureIANATimeZone(userTimeZone);
    const eventSourceTimeZone = event.extendedProps?.sourceTimeZone || 'UTC';
    
    // Clone the event to avoid modifying the original
    const convertedEvent = { ...event };
    
    // Convert start and end times
    if (event.start) {
      const startDt = DateTime.fromJSDate(new Date(event.start))
        .setZone(eventSourceTimeZone)
        .setZone(validTimeZone);
      
      convertedEvent.start = startDt.toJSDate();
      
      // Add display properties
      convertedEvent.extendedProps = {
        ...convertedEvent.extendedProps,
        displayStart: startDt.toFormat('t'),
        displayDay: startDt.toFormat('cccc'),
        displayDate: startDt.toFormat('MMM d, yyyy')
      };
    }
    
    if (event.end) {
      const endDt = DateTime.fromJSDate(new Date(event.end))
        .setZone(eventSourceTimeZone)
        .setZone(validTimeZone);
      
      convertedEvent.end = endDt.toJSDate();
      
      // Add display end time
      if (convertedEvent.extendedProps) {
        convertedEvent.extendedProps.displayEnd = endDt.toFormat('t');
      }
    }
    
    // Mark this event as converted and store the user's timezone
    if (convertedEvent.extendedProps) {
      convertedEvent.extendedProps._userTimeZone = validTimeZone;
    }
    
    return convertedEvent;
  }

  /**
   * Converts a JS Date to UTC DateTime
   * @param date Date to convert
   */
  static toUTC(date: Date | DateTime): DateTime {
    if (date instanceof DateTime) {
      return date.toUTC();
    }
    return DateTime.fromJSDate(date).toUTC();
  }

  /**
   * Converts a UTC string to a DateTime in the specified timezone
   * @param utcStr UTC date string
   * @param timezone Target timezone
   */
  static fromUTC(utcStr: string, timezone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timezone);
    return DateTime.fromISO(utcStr, { zone: 'UTC' }).setZone(validTimeZone);
  }

  /**
   * Converts a UTC timestamp to a DateTime in the specified timezone
   * @param timestamp UTC timestamp string
   * @param timezone Target timezone
   */
  static fromUTCTimestamp(timestamp: string, timezone: string): DateTime {
    return this.fromUTC(timestamp, timezone);
  }

  /**
   * Get weekday name from DateTime
   * @param date DateTime object
   * @param format Format (long or short)
   * @returns Weekday name
   */
  static getWeekdayName(date: DateTime, format: 'long' | 'short' = 'long'): string {
    return date.toFormat(format === 'long' ? 'EEEE' : 'EEE');
  }

  /**
   * Get month name from DateTime
   * @param date DateTime object
   * @param format Format (long or short)
   * @returns Month name
   */
  static getMonthName(date: DateTime, format: 'long' | 'short' = 'long'): string {
    return date.toFormat(format === 'long' ? 'MMMM' : 'MMM');
  }

  /**
   * Parse a datetime string with timezone
   * @param dateTimeStr Datetime string
   * @param timeZone Timezone to parse with
   * @returns DateTime object
   */
  static parseWithZone(dateTimeStr: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(dateTimeStr, { zone: validTimeZone });
  }
}

export default TimeZoneService;
