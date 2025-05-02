
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
   * Validates a timezone string
   * @param tz Timezone string to validate
   * @returns True if valid timezone
   */
  static validateTimeZone(tz: string): boolean {
    if (!tz) return false;
    
    try {
      const dt = DateTime.now().setZone(tz);
      return dt.isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets the current local timezone of the browser
   */
  static getLocalTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  /**
   * Gets the user's timezone, alias for getLocalTimeZone
   * Added for compatibility with existing code
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
   * Format a time string (e.g. "14:30") for display
   * @param timeStr Time string in 24h format (HH:mm)
   * @returns Formatted time string (e.g. "2:30 PM")
   */
  static formatTime(timeStr: string, format: string = 'h:mm a', timeZone?: string): string {
    try {
      // Handle time-only strings (e.g., "14:30")
      if (typeof timeStr === 'string' && timeStr.includes(':') && !timeStr.includes('T')) {
        // Create a DateTime object from the time string
        const [hours, minutes] = timeStr.split(':').map(Number);
        const dt = DateTime.fromObject({ hour: hours, minute: minutes });
        
        // Apply timezone if specified
        const dateTimeWithZone = timeZone ? dt.setZone(this.ensureIANATimeZone(timeZone)) : dt;
        
        return dateTimeWithZone.toFormat(format);
      }
      
      // For other cases, use formatDateTime
      return this.formatDateTime(timeStr, format, timeZone);
    } catch (error) {
      console.error('[TimeZoneService] Error formatting time:', error);
      return String(timeStr); // Return the original if there's an error
    }
  }

  /**
   * Format a date to specified format
   * @param date Date to format
   * @param format Format string
   * @returns Formatted date string
   */
  static formatDate(date: Date | string, format: string = 'yyyy-MM-dd'): string {
    try {
      const dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
      return dt.toFormat(format);
    } catch (error) {
      console.error('[TimeZoneService] Error formatting date:', error);
      return String(date);
    }
  }

  /**
   * Convert local date and time to UTC timestamp
   * @param dateStr Date string (YYYY-MM-DD)
   * @param timeStr Time string (HH:MM)
   * @returns UTC ISO string
   */
  static toUTCTimestamp(dateStr: string, timeStr: string, timeZone: string = 'UTC'): string {
    try {
      const dt = this.createDateTime(dateStr, timeStr, timeZone).toUTC();
      return dt.toISO();
    } catch (error) {
      console.error('[TimeZoneService] Error converting to UTC timestamp:', error);
      throw new Error(`Failed to convert date and time to UTC: ${dateStr} ${timeStr}`);
    }
  }

  /**
   * Convert UTC timestamp to local date and time
   * @param timestamp UTC timestamp string
   * @param targetTimeZone Target timezone
   * @returns DateTime in target timezone
   */
  static fromUTCTimestamp(timestamp: string, targetTimeZone: string = 'UTC'): DateTime {
    try {
      const validTimeZone = this.ensureIANATimeZone(targetTimeZone);
      return DateTime.fromISO(timestamp, { zone: 'UTC' }).setZone(validTimeZone);
    } catch (error) {
      console.error('[TimeZoneService] Error converting from UTC timestamp:', error);
      throw new Error(`Failed to convert UTC timestamp to local time: ${timestamp}`);
    }
  }

  /**
   * Add a duration to a DateTime
   * @param date Base date
   * @param duration Duration to add
   * @returns New date with duration added
   */
  static addDuration(date: Date | string | DateTime, duration: { 
    hours?: number, 
    minutes?: number, 
    days?: number,
    weeks?: number
  }): DateTime {
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = DateTime.fromISO(date);
    }
    
    return dt.plus(duration);
  }

  /**
   * Check if two dates are on the same day
   * @param date1 First date
   * @param date2 Second date
   * @returns True if the dates are on the same day
   */
  static isSameDay(date1: Date | string | DateTime, date2: Date | string | DateTime): boolean {
    let dt1: DateTime;
    let dt2: DateTime;
    
    if (date1 instanceof DateTime) {
      dt1 = date1;
    } else if (date1 instanceof Date) {
      dt1 = DateTime.fromJSDate(date1);
    } else {
      dt1 = DateTime.fromISO(date1);
    }
    
    if (date2 instanceof DateTime) {
      dt2 = date2;
    } else if (date2 instanceof Date) {
      dt2 = DateTime.fromJSDate(date2);
    } else {
      dt2 = DateTime.fromISO(date2);
    }
    
    return dt1.hasSame(dt2, 'day');
  }

  /**
   * Parse a date string with timezone info
   * @param dateStr Date string
   * @param format Format of the date string
   * @param timeZone Timezone
   * @returns DateTime object
   */
  static parseWithZone(dateStr: string, format: string, timeZone: string): DateTime {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    return DateTime.fromFormat(dateStr, format, { zone: validTimeZone });
  }

  /**
   * Get weekday name from date
   * @param date Date to get weekday from
   * @returns Weekday name
   */
  static getWeekdayName(date: Date | string | DateTime): string {
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = DateTime.fromISO(date);
    }
    
    return dt.toFormat('cccc');
  }

  /**
   * Get month name from date
   * @param date Date to get month from
   * @returns Month name
   */
  static getMonthName(date: Date | string | DateTime): string {
    let dt: DateTime;
    
    if (date instanceof DateTime) {
      dt = date;
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = DateTime.fromISO(date);
    }
    
    return dt.toFormat('LLLL');
  }

  /**
   * Format a date to 12-hour time format
   * @param date Date to format
   * @returns Formatted time string
   */
  static formatDateToTime12Hour(date: Date | string | DateTime): string {
    return this.formatDateTime(date, 'h:mm a');
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
}

export default TimeZoneService;
