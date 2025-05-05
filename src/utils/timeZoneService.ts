
// Centralized TimeZoneService that provides timezone functionality
import { DateTime, IANAZone, Info } from 'luxon';

/**
 * Service for managing time zones and date/time conversions
 */
export class TimeZoneService {
  /**
   * Standard timezone options for dropdowns
   */
  static TIMEZONE_OPTIONS = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
    { value: 'America/Phoenix', label: 'Arizona' },
    { value: 'UTC', label: 'UTC' },
  ];

  /**
   * Ensure we have a valid IANA timezone string
   * @param timezone The timezone to validate
   * @param defaultTimeZone Default timezone to use if none provided
   * @returns A valid IANA timezone string
   */
  static ensureIANATimeZone(timezone?: string | null, defaultTimeZone = 'UTC'): string {
    if (!timezone) {
      return defaultTimeZone;
    }

    try {
      // Check if this is a valid timezone by trying to create a DateTime with it
      const dt = DateTime.now().setZone(timezone);
      return dt.isValid ? timezone : defaultTimeZone;
    } catch (error) {
      console.error(`Invalid timezone: ${timezone}, using ${defaultTimeZone} instead`);
      return defaultTimeZone;
    }
  }

  /**
   * Get the local time zone from the browser
   * @returns The local timezone string
   */
  static getLocalTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Get user timezone (alias for getLocalTimeZone for compatibility)
   */
  static getUserTimeZone(): string {
    return this.getLocalTimeZone();
  }

  /**
   * Format a time string (HH:MM) to a display format
   * @param timeStr Time string in 24-hour format (HH:MM)
   * @param format Format to use (default: 'h:mm a')
   * @returns Formatted time string
   */
  static formatTime(timeStr: string, format: string = 'h:mm a'): string {
    if (!timeStr) return '';
    
    try {
      // Extract hours and minutes
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Create a DateTime object with today's date and the specified time
      const dt = DateTime.now().set({ hour: hours, minute: minutes });
      
      // Format the time according to the specified format
      return dt.toFormat(format);
    } catch (error) {
      console.error(`Error formatting time ${timeStr}:`, error);
      return timeStr;
    }
  }

  /**
   * Convert a time string from one timezone to another
   * @param timeStr Time string in 24-hour format (HH:MM)
   * @param fromTimeZone Source timezone
   * @param toTimeZone Target timezone
   * @returns Time string in target timezone
   */
  static convertTime(timeStr: string, fromTimeZone: string, toTimeZone: string): string {
    if (!timeStr) return '';
    
    try {
      // Extract hours and minutes
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Create a DateTime object with today's date and the specified time
      const dt = DateTime.now()
        .setZone(this.ensureIANATimeZone(fromTimeZone))
        .set({ hour: hours, minute: minutes });
      
      // Convert to target timezone
      const converted = dt.setZone(this.ensureIANATimeZone(toTimeZone));
      
      // Return the time in HH:MM format
      return converted.toFormat('HH:mm');
    } catch (error) {
      console.error(`Error converting time ${timeStr}:`, error);
      return timeStr;
    }
  }

  /**
   * Convert timezone for display purposes
   * @param time Time to convert
   * @param fromZone Source timezone
   * @param toZone Target timezone
   * @returns Converted time
   */
  static convertTimeZone(time: string, fromZone: string, toZone: string): string {
    return this.convertTime(time, fromZone, toZone);
  }

  /**
   * Format a timezone for display
   * @param timezone The timezone to format
   * @returns A formatted timezone string
   */
  static formatTimeZoneDisplay(timezone: string): string {
    try {
      const dt = DateTime.now().setZone(timezone);
      const offset = dt.toFormat('ZZ');
      const name = timezone.replace(/_/g, ' ').split('/').pop();
      return `${name} (GMT${offset})`;
    } catch (error) {
      return timezone;
    }
  }

  /**
   * Get a list of common timezones
   * @returns An array of timezone objects with value and label properties
   */
  static getCommonTimezones(): { value: string, label: string }[] {
    const commonZones = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'America/Honolulu',
      'America/Mexico_City',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Dubai',
      'Asia/Singapore',
      'Australia/Sydney',
      'Pacific/Auckland'
    ];

    return commonZones.map(zone => ({
      value: zone,
      label: this.formatTimeZoneDisplay(zone)
    }));
  }

  /**
   * Convert event to user timezone
   * @param event The calendar event to convert
   * @param userTimezone The user's timezone
   * @returns A new event object with times converted to user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimezone: string): any {
    if (!event || !userTimezone) return event;

    try {
      const eventTimezone = event.extendedProps?.timezone || 'UTC';
      const startInUserTz = DateTime.fromISO(event.start)
        .setZone(eventTimezone)
        .setZone(userTimezone);
      
      const endInUserTz = event.end 
        ? DateTime.fromISO(event.end).setZone(eventTimezone).setZone(userTimezone)
        : startInUserTz.plus({ hours: 1 });

      return {
        ...event,
        start: startInUserTz.toISO(),
        end: endInUserTz.toISO(),
        extendedProps: {
          ...event.extendedProps,
          originalTimezone: eventTimezone,
          userTimezone
        }
      };
    } catch (error) {
      console.error('Error converting event timezone:', error);
      return event;
    }
  }

  /**
   * Create a DateTime object from date and time strings
   * @param dateStr Date string in YYYY-MM-DD format
   * @param timeStr Time string in HH:MM format
   * @param timezone Timezone to use
   * @returns A Luxon DateTime object
   */
  static createDateTime(dateStr: string, timeStr: string, timezone: string): DateTime {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    return DateTime.fromObject(
      { year, month, day, hour: hours, minute: minutes },
      { zone: this.ensureIANATimeZone(timezone) }
    );
  }

  /**
   * Convert a DateTime object from one timezone to another
   * @param date A Luxon DateTime object, Date object or ISO string
   * @param sourceZone Source timezone
   * @param targetZone Target timezone
   * @returns A new DateTime object in the target timezone
   */
  static convertDateTime(date: string | Date | DateTime, sourceZone: string, targetZone: string): DateTime {
    let dt: DateTime;
    
    if (typeof date === 'string') {
      dt = DateTime.fromISO(date, { zone: this.ensureIANATimeZone(sourceZone) });
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date).setZone(this.ensureIANATimeZone(sourceZone));
    } else {
      dt = date.setZone(this.ensureIANATimeZone(sourceZone));
    }
    
    return dt.setZone(this.ensureIANATimeZone(targetZone));
  }

  /**
   * Format a DateTime object to a string
   * @param date A Luxon DateTime object, Date object or ISO string
   * @param format Format string or preset ('short'/'full')
   * @param timezone Timezone to use
   * @returns A formatted date-time string
   */
  static formatDateTime(date: string | Date | DateTime, format: string | 'short' | 'full' = 'short', timezone?: string): string {
    let dt: DateTime;
    
    if (typeof date === 'string') {
      dt = DateTime.fromISO(date);
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date);
    } else {
      dt = date;
    }
    
    if (timezone) {
      dt = dt.setZone(this.ensureIANATimeZone(timezone));
    }
    
    if (format === 'short') {
      return dt.toLocaleString(DateTime.DATETIME_SHORT);
    } else if (format === 'full') {
      return dt.toLocaleString(DateTime.DATETIME_FULL);
    } else {
      return dt.toFormat(format);
    }
  }

  /**
   * Parse a string with timezone information
   * @param dateString Date string to parse
   * @param timezone Timezone to use
   * @returns A DateTime object
   */
  static parseWithZone(dateString: string, timezone: string): DateTime {
    const validZone = this.ensureIANATimeZone(timezone);
    return DateTime.fromISO(dateString, { zone: validZone });
  }

  /**
   * Convert a datetime to UTC
   * @param localDateTime DateTime in local timezone
   * @returns DateTime in UTC
   */
  static toUTC(localDateTime: string | Date | DateTime): DateTime {
    let dt: DateTime;
    
    if (typeof localDateTime === 'string') {
      dt = DateTime.fromISO(localDateTime);
    } else if (localDateTime instanceof Date) {
      dt = DateTime.fromJSDate(localDateTime);
    } else {
      dt = localDateTime;
    }
    
    return dt.toUTC();
  }

  /**
   * Convert a UTC datetime to local timezone
   * @param utcStr UTC datetime string
   * @param timezone Target timezone
   * @returns DateTime in local timezone
   */
  static fromUTC(utcStr: string, timezone: string): DateTime {
    return DateTime.fromISO(utcStr, { zone: 'UTC' }).setZone(this.ensureIANATimeZone(timezone));
  }
  
  /**
   * Get current date/time in a specific timezone
   */
  static getCurrentDateTime(timezone?: string): DateTime {
    const validZone = this.ensureIANATimeZone(timezone || 'UTC');
    return DateTime.now().setZone(validZone);
  }

  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: DateTime, date2: DateTime): boolean {
    return date1.hasSame(date2, 'day');
  }

  /**
   * Add a duration to a date
   */
  static addDuration(date: DateTime, amount: number, unit: string): DateTime {
    try {
      return date.plus({ [unit]: amount });
    } catch (error) {
      console.error('[TimeZoneService] Error adding duration:', error);
      return date;
    }
  }

  /**
   * Format date to 12 hour time format
   */
  static formatDateToTime12Hour(
    date: DateTime | Date | string,
    timezone: string = 'UTC'
  ): string {
    return this.formatDateTime(date, 'h:mm a', timezone);
  }

  /**
   * Convert to UTC timestamp
   */
  static toUTCTimestamp(date: DateTime | Date | string): string {
    try {
      let dt: DateTime;
      
      // Convert input to DateTime
      if (date instanceof DateTime) {
        dt = date;
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date);
      } else {
        dt = DateTime.fromISO(date);
      }
      
      // Convert to UTC and return ISO string
      return dt.toUTC().toISO() || '';
    } catch (error) {
      console.error('[TimeZoneService] Error converting to UTC timestamp:', error);
      return DateTime.now().toUTC().toISO() || '';
    }
  }

  /**
   * Convert from UTC timestamp
   */
  static fromUTCTimestamp(timestamp: string, timezone: string): DateTime {
    try {
      return DateTime.fromISO(timestamp).setZone(timezone);
    } catch (error) {
      console.error('[TimeZoneService] Error converting from UTC timestamp:', error);
      return DateTime.now().setZone(timezone);
    }
  }

  /**
   * Get weekday name from date
   */
  static getWeekdayName(date: DateTime, format: 'long' | 'short' = 'long'): string {
    try {
      return date.toFormat(format === 'long' ? 'cccc' : 'ccc');
    } catch (error) {
      console.error('[TimeZoneService] Error getting weekday name:', error);
      return '';
    }
  }

  /**
   * Get month name from date
   */
  static getMonthName(date: DateTime, format: 'long' | 'short' = 'long'): string {
    try {
      return date.toFormat(format === 'long' ? 'MMMM' : 'MMM');
    } catch (error) {
      console.error('[TimeZoneService] Error getting month name:', error);
      return '';
    }
  }
}

export default TimeZoneService;
