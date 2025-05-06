
import { DateTime, Settings, Interval } from 'luxon';

/**
 * TimeZoneService - Central utility for handling all timezone operations in the application
 * Using Luxon to ensure consistent timezone handling and formatting
 */
export class TimeZoneService {
  // Default timezone to use when none is specified
  static readonly DEFAULT_TIMEZONE = 'America/New_York';
  
  // Standard format strings
  static readonly DATE_FORMAT = 'yyyy-MM-dd';
  static readonly TIME_FORMAT_24 = 'HH:mm';
  static readonly TIME_FORMAT_AMPM = 'h:mm a';
  static readonly DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
  
  /**
   * Ensures a timezone string is a valid IANA timezone
   * Provides fallback to default timezone if invalid
   */
  static ensureIANATimeZone(timezone: string | null | undefined): string {
    if (!timezone) return this.DEFAULT_TIMEZONE;
    
    // Check if the timezone is valid
    try {
      const dt = DateTime.now().setZone(timezone);
      if (dt.isValid) {
        return timezone;
      }
    } catch (error) {
      console.error(`Invalid timezone: ${timezone}`, error);
    }
    
    // Common timezone abbreviation mappings
    const timezoneMap: Record<string, string> = {
      'EST': 'America/New_York',
      'EDT': 'America/New_York',
      'CST': 'America/Chicago',
      'CDT': 'America/Chicago',
      'MST': 'America/Denver',
      'MDT': 'America/Denver',
      'PST': 'America/Los_Angeles',
      'PDT': 'America/Los_Angeles',
    };
    
    // Check if it's a known abbreviation
    if (timezone in timezoneMap) {
      return timezoneMap[timezone];
    }
    
    // If all else fails, return the default
    return this.DEFAULT_TIMEZONE;
  }
  
  /**
   * Convert a date string and time string to an ISO string in UTC
   * @param dateStr Date string in format 'YYYY-MM-DD'
   * @param timeStr Time string in format 'HH:MM'
   * @param timezone IANA timezone string
   * @returns ISO string in UTC
   */
  static toUTC(dateStr: string, timeStr: string, timezone: string): string {
    const safeZone = this.ensureIANATimeZone(timezone);
    
    const dt = this.createDateTime(dateStr, timeStr, safeZone);
    return dt.toUTC().toISO();
  }
  
  /**
   * Convert a UTC ISO string to local time
   * @param isoStr ISO string in UTC
   * @param timezone IANA timezone string
   * @returns DateTime object in the specified timezone
   */
  static fromUTC(isoStr: string | null, timezone: string): DateTime {
    if (!isoStr) return DateTime.now().setZone(this.ensureIANATimeZone(timezone));
    
    const safeZone = this.ensureIANATimeZone(timezone);
    return DateTime.fromISO(isoStr).setZone(safeZone);
  }
  
  /**
   * Create a DateTime object from separate date and time strings
   * @param dateStr Date string in format 'YYYY-MM-DD'
   * @param timeStr Time string in format 'HH:MM'
   * @param timezone IANA timezone string
   * @returns DateTime object
   */
  static createDateTime(dateStr: string, timeStr: string, timezone: string): DateTime {
    const safeZone = this.ensureIANATimeZone(timezone);
    
    // If time contains seconds, format is 'HH:MM:SS', otherwise 'HH:MM'
    const format = timeStr.split(':').length > 2 ? 
      `yyyy-MM-dd'T'HH:mm:ss` : 
      `yyyy-MM-dd'T'HH:mm`;
      
    // Join date and time
    const dateTimeStr = `${dateStr}T${timeStr}`;
    
    const dt = DateTime.fromFormat(dateTimeStr, format, { zone: safeZone });
    
    if (!dt.isValid) {
      console.error(`Invalid date/time: ${dateTimeStr} in timezone ${safeZone}`);
      console.error(`Reason: ${dt.invalidReason}, ${dt.invalidExplanation}`);
      // Return current time as fallback
      return DateTime.now().setZone(safeZone);
    }
    
    return dt;
  }
  
  /**
   * Create DateTime from just a date string
   */
  static fromDateString(dateStr: string, timezone: string = 'UTC'): DateTime {
    const safeZone = this.ensureIANATimeZone(timezone);
    const dt = DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: safeZone });
    
    if (!dt.isValid) {
      console.error(`Invalid date string: ${dateStr}`);
      return DateTime.now().setZone(safeZone);
    }
    
    return dt;
  }
  
  /**
   * Create DateTime from just a time string
   */
  static fromTimeString(timeStr: string, timezone?: string): DateTime {
    const safeZone = timezone ? this.ensureIANATimeZone(timezone) : 'UTC';
    
    // Use today's date with the given time
    const today = DateTime.now().setZone(safeZone).startOf('day');
    
    // Handle different time string formats
    let dt: DateTime;
    if (timeStr.split(':').length === 3) {
      // HH:MM:SS
      dt = DateTime.fromFormat(timeStr, 'HH:mm:ss', { zone: safeZone });
    } else {
      // HH:MM
      dt = DateTime.fromFormat(timeStr, 'HH:mm', { zone: safeZone });
    }
    
    if (!dt.isValid) {
      console.error(`Invalid time string: ${timeStr}`);
      return today;
    }
    
    // Combine today's date with the parsed time
    return today.set({
      hour: dt.hour,
      minute: dt.minute,
      second: dt.second
    });
  }
  
  /**
   * Convert JavaScript Date to Luxon DateTime
   */
  static fromJSDate(date: Date, timezone?: string): DateTime {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date provided to fromJSDate');
      return DateTime.now().setZone(timezone ? this.ensureIANATimeZone(timezone) : 'UTC');
    }
    
    if (timezone) {
      return DateTime.fromJSDate(date).setZone(this.ensureIANATimeZone(timezone));
    }
    
    return DateTime.fromJSDate(date);
  }
  
  /**
   * Format a DateTime object to a date string
   */
  static formatDate(dt: DateTime, format: string = this.DATE_FORMAT): string {
    if (!dt.isValid) {
      console.error('Attempted to format invalid DateTime', dt.invalidReason, dt.invalidExplanation);
      return 'Invalid date';
    }
    return dt.toFormat(format);
  }
  
  /**
   * Format a DateTime object to a time string
   */
  static formatTime(dt: DateTime, format: string = this.TIME_FORMAT_AMPM): string {
    if (!dt.isValid) {
      console.error('Attempted to format invalid DateTime', dt.invalidReason, dt.invalidExplanation);
      return 'Invalid time';
    }
    return dt.toFormat(format);
  }
  
  /**
   * Format a DateTime object to a 24-hour time string
   */
  static formatTime24(dt: DateTime): string {
    return this.formatTime(dt, this.TIME_FORMAT_24);
  }
  
  /**
   * Format a DateTime object to a date and time string
   */
  static formatDateTime(dt: DateTime, format: string = `${this.DATE_FORMAT} ${this.TIME_FORMAT_AMPM}`): string {
    if (!dt.isValid) {
      console.error('Attempted to format invalid DateTime', dt.invalidReason, dt.invalidExplanation);
      return 'Invalid date/time';
    }
    return dt.toFormat(format);
  }
  
  /**
   * Get current DateTime in the specified timezone
   */
  static now(timezone: string = this.DEFAULT_TIMEZONE): DateTime {
    return DateTime.now().setZone(this.ensureIANATimeZone(timezone));
  }
  
  /**
   * Get today's date as DateTime at midnight in the specified timezone
   */
  static today(timezone: string = this.DEFAULT_TIMEZONE): DateTime {
    return this.now(timezone).startOf('day');
  }
  
  /**
   * Add days to a DateTime
   */
  static addDays(dt: DateTime, days: number): DateTime {
    return dt.plus({ days });
  }
  
  /**
   * Add months to a DateTime
   */
  static addMonths(dt: DateTime, months: number): DateTime {
    return dt.plus({ months });
  }
  
  /**
   * Convert a calendar event to user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimeZone: string): any {
    if (!event) return null;
    
    const safeZone = this.ensureIANATimeZone(userTimeZone);
    
    // Deep clone the event to avoid mutating the original
    const localEvent = JSON.parse(JSON.stringify(event));
    
    // Convert start and end times if they exist in ISO format
    if (localEvent.start_time_utc) {
      const startDt = this.fromUTC(localEvent.start_time_utc, safeZone);
      localEvent.start_time = this.formatTime24(startDt);
      localEvent.formatted_start_time = this.formatTime(startDt);
    }
    
    if (localEvent.end_time_utc) {
      const endDt = this.fromUTC(localEvent.end_time_utc, safeZone);
      localEvent.end_time = this.formatTime24(endDt);
      localEvent.formatted_end_time = this.formatTime(endDt);
    }
    
    return localEvent;
  }
  
  /**
   * Get the display name for a timezone
   */
  static getTimeZoneDisplayName(timezone: string): string {
    const safeZone = this.ensureIANATimeZone(timezone);
    
    try {
      const now = this.now(safeZone);
      const abbr = now.toFormat('ZZZZ'); // timezone abbreviation
      
      // Format the timezone name more friendly
      let friendlyName = safeZone.split('/').pop()?.replace('_', ' ');
      
      if (abbr !== safeZone) {
        return `${friendlyName} (${abbr})`;
      } else {
        return friendlyName || safeZone;
      }
    } catch (error) {
      console.error('Error getting timezone display name:', error);
      return safeZone;
    }
  }

  /**
   * Get the first day of the month for a given date
   * @param date The DateTime object to get the first day of the month for
   * @returns DateTime object representing the first day of the month
   */
  static startOfMonth(date: DateTime): DateTime {
    return date.startOf('month');
  }

  /**
   * Get the last day of the month for a given date
   * @param date The DateTime object to get the last day of the month for
   * @returns DateTime object representing the last day of the month
   */
  static endOfMonth(date: DateTime): DateTime {
    return date.endOf('month');
  }

  /**
   * Get the first day of the week for a given date
   * @param date The DateTime object to get the first day of the week for
   * @param weekStartsOn Optional. Day of week the week starts on (0 = Sunday, 1 = Monday, etc.)
   * @returns DateTime object representing the first day of the week
   */
  static startOfWeek(date: DateTime, weekStartsOn: number = 0): DateTime {
    const weekday = date.weekday % 7; // Convert to 0-based (Sunday = 0)
    const diff = (weekday - weekStartsOn + 7) % 7;
    return date.minus({ days: diff }).startOf('day');
  }

  /**
   * Get the last day of the week for a given date
   * @param date The DateTime object to get the last day of the week for
   * @param weekStartsOn Optional. Day of week the week starts on (0 = Sunday, 1 = Monday, etc.)
   * @returns DateTime object representing the last day of the week
   */
  static endOfWeek(date: DateTime, weekStartsOn: number = 0): DateTime {
    const start = this.startOfWeek(date, weekStartsOn);
    return start.plus({ days: 6 }).endOf('day');
  }

  /**
   * Get an array of DateTime objects for each day in the interval
   * @param start The start of the interval
   * @param end The end of the interval
   * @returns Array of DateTime objects for each day in the interval
   */
  static eachDayOfInterval(start: DateTime, end: DateTime): DateTime[] {
    const days: DateTime[] = [];
    let current = start.startOf('day');
    const lastDay = end.startOf('day');
    
    while (current <= lastDay) {
      days.push(current);
      current = current.plus({ days: 1 });
    }
    
    return days;
  }

  /**
   * Convert a DateTime from one timezone to another
   * @param dateTime The DateTime object to convert
   * @param fromZone The source timezone
   * @param toZone The target timezone
   * @returns DateTime object in the target timezone
   */
  static convertDateTime(dateTime: DateTime, fromZone: string, toZone: string): DateTime {
    const safeFromZone = this.ensureIANATimeZone(fromZone);
    const safeToZone = this.ensureIANATimeZone(toZone);
    
    // First ensure the DateTime is in the source timezone
    const dtInFromZone = dateTime.setZone(safeFromZone);
    
    // Then convert to the target timezone
    return dtInFromZone.setZone(safeToZone);
  }

  /**
   * Check if two DateTime objects represent the same day
   * @param date1 First DateTime object
   * @param date2 Second DateTime object
   * @returns Boolean indicating if both DateTimes are on the same day
   */
  static isSameDay(date1: DateTime, date2: DateTime): boolean {
    return date1.hasSame(date2, 'day');
  }
}

// Configure Luxon settings globally
Settings.defaultLocale = 'en';
