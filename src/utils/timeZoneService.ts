import { DateTime, Settings, Interval } from 'luxon';

/**
 * TimeZoneService - Central utility for handling all timezone operations in the application
 * Following the UTC-only approach: store all timestamps in UTC, convert only for display
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
   * Convert local datetime to UTC
   * @param localDateTimeStr ISO string in local time
   * @param localTimeZone IANA timezone string
   */
  static convertLocalToUTC(localDateTimeStr: string, localTimeZone: string): DateTime {
    const safeZone = this.ensureIANATimeZone(localTimeZone);
    
    // Parse the local datetime in its timezone
    const localDT = DateTime.fromISO(localDateTimeStr, { zone: safeZone });
    
    if (!localDT.isValid) {
      console.error(`Invalid local datetime: ${localDateTimeStr} in ${localTimeZone}`);
      console.error(`Reason: ${localDT.invalidReason}, ${localDT.invalidExplanation}`);
      // Return current UTC time as fallback
      return DateTime.now().toUTC();
    }
    
    // Convert to UTC
    return localDT.toUTC();
  }
  
  /**
   * Convert a date string and time string to a DateTime object in UTC
   * @param dateStr Date string in format 'YYYY-MM-DD'
   * @param timeStr Time string in format 'HH:MM'
   * @param timezone IANA timezone string
   * @returns DateTime object in UTC
   */
  static createDateTimeUTC(dateStr: string, timeStr: string, timezone: string): DateTime {
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
    
    return dt.toUTC();
  }
  
  /**
   * Convert UTC ISO string to local time
   * @param utcIsoStr ISO string in UTC
   * @param timezone IANA timezone string
   * @returns DateTime object in the specified timezone
   */
  static fromUTC(utcIsoStr: string | null | undefined, timezone: string): DateTime {
    if (!utcIsoStr) return DateTime.now().setZone(this.ensureIANATimeZone(timezone));
    
    const safeZone = this.ensureIANATimeZone(timezone);
    try {
      return DateTime.fromISO(utcIsoStr).setZone(safeZone);
    } catch (error) {
      console.error(`Error converting UTC ISO string to local time: ${error}`);
      return DateTime.now().setZone(safeZone);
    }
  }
  
  /**
   * Format a DateTime object for display based on the specified format
   * @param dt DateTime object
   * @param format Format string
   * @returns Formatted string
   */
  static formatDateTime(dt: DateTime, format: string = `${this.DATE_FORMAT} ${this.TIME_FORMAT_AMPM}`): string {
    if (!dt.isValid) {
      console.error('Attempted to format invalid DateTime', dt.invalidReason, dt.invalidExplanation);
      return 'Invalid date/time';
    }
    return dt.toFormat(format);
  }
  
  /**
   * Format a UTC ISO string for display in the specified timezone
   * @param utcIsoStr ISO string in UTC
   * @param timezone IANA timezone string
   * @param format Format string
   * @returns Formatted string in local time
   */
  static formatUTCInTimezone(
    utcIsoStr: string | null, 
    timezone: string, 
    format: string = this.TIME_FORMAT_AMPM
  ): string {
    if (!utcIsoStr) return 'N/A';
    try {
      const localDT = this.fromUTC(utcIsoStr, timezone);
      return this.formatDateTime(localDT, format);
    } catch (error) {
      console.error(`Error formatting UTC in timezone: ${error}`);
      return 'Error';
    }
  }
  
  /**
   * Format just the time portion of a DateTime
   */
  static formatTime(dt: DateTime, format: string = this.TIME_FORMAT_AMPM): string {
    if (!dt.isValid) {
      console.error('Attempted to format invalid DateTime', dt.invalidReason, dt.invalidExplanation);
      return 'Invalid time';
    }
    return dt.toFormat(format);
  }
  
  /**
   * Format time in 24-hour format
   */
  static formatTime24(dt: DateTime): string {
    return this.formatTime(dt, this.TIME_FORMAT_24);
  }
  
  /**
   * Format just the date portion of a DateTime
   */
  static formatDate(dt: DateTime, format: string = this.DATE_FORMAT): string {
    if (!dt.isValid) {
      console.error('Attempted to format invalid DateTime', dt.invalidReason, dt.invalidExplanation);
      return 'Invalid date';
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
   * Convert a calendar event to user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimeZone: string): any {
    if (!event) return null;
    
    const safeZone = this.ensureIANATimeZone(userTimeZone);
    
    // Deep clone the event to avoid mutating the original
    const localEvent = JSON.parse(JSON.stringify(event));
    
    // Convert start and end times if they exist
    if (localEvent.start_at) {
      const startDt = this.fromUTC(localEvent.start_at, safeZone);
      localEvent.formatted_start_time = this.formatTime(startDt);
      localEvent.formatted_date = startDt.toFormat(this.DATE_FORMAT);
    }
    
    if (localEvent.end_at) {
      const endDt = this.fromUTC(localEvent.end_at, safeZone);
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
   * Convert JavaScript Date to Luxon DateTime in the specified timezone
   */
  static fromJSDate(jsDate: Date, timezone: string = this.DEFAULT_TIMEZONE): DateTime {
    return DateTime.fromJSDate(jsDate).setZone(this.ensureIANATimeZone(timezone));
  }

  /**
   * Convert from date string to DateTime object
   */
  static fromDateString(dateStr: string, timezone: string = this.DEFAULT_TIMEZONE): DateTime {
    const safeZone = this.ensureIANATimeZone(timezone);
    return DateTime.fromISO(dateStr).setZone(safeZone);
  }
  
  /**
   * Convert from time string (HH:MM or HH:MM:SS) to DateTime object
   * Uses today's date in the specified timezone
   */
  static fromTimeString(timeStr: string, timezone: string = this.DEFAULT_TIMEZONE): DateTime {
    const safeZone = this.ensureIANATimeZone(timezone);
    const today = this.today(safeZone);
    const todayStr = this.formatDate(today);
    
    // Handle both HH:MM and HH:MM:SS formats
    const format = timeStr.split(':').length > 2 ? 
      `yyyy-MM-dd'T'HH:mm:ss` : 
      `yyyy-MM-dd'T'HH:mm`;
      
    const dateTimeStr = `${todayStr}T${timeStr}`;
    
    const dt = DateTime.fromFormat(dateTimeStr, format, { zone: safeZone });
    
    if (!dt.isValid) {
      console.error(`Invalid time string: ${timeStr} in timezone ${safeZone}`);
      console.error(`Reason: ${dt.invalidReason}, ${dt.invalidExplanation}`);
      // Return current time as fallback
      return DateTime.now().setZone(safeZone);
    }
    
    return dt;
  }

  /**
   * Create DateTime from date and time strings in specific timezone
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
   * Convert DateTime between timezones
   */
  static convertDateTime(dt: DateTime, fromTimezone: string, toTimezone: string): DateTime {
    const safeFromZone = this.ensureIANATimeZone(fromTimezone);
    const safeToZone = this.ensureIANATimeZone(toTimezone);
    
    if (!dt.isValid) {
      console.error('Attempted to convert invalid DateTime', dt.invalidReason, dt.invalidExplanation);
      return DateTime.now().setZone(safeToZone);
    }
    
    return dt.setZone(safeFromZone).setZone(safeToZone);
  }

  // Additional calendar-related methods
  static startOfWeek(date: DateTime, weekStartsOn: number = 0): DateTime {
    const weekday = date.weekday % 7; // Convert to 0-based (Sunday = 0)
    const diff = (weekday - weekStartsOn + 7) % 7;
    return date.minus({ days: diff }).startOf('day');
  }

  static endOfWeek(date: DateTime, weekStartsOn: number = 0): DateTime {
    const start = this.startOfWeek(date, weekStartsOn);
    return start.plus({ days: 6 }).endOf('day');
  }

  static startOfMonth(date: DateTime): DateTime {
    return date.startOf('month');
  }

  static endOfMonth(date: DateTime): DateTime {
    return date.endOf('month');
  }

  static isSameDay(date1: DateTime, date2: DateTime): boolean {
    return date1.hasSame(date2, 'day');
  }
  
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
}

// Configure Luxon settings globally
Settings.defaultLocale = 'en';
