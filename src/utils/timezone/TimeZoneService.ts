import { DateTime, IANAZone, Info } from 'luxon';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneError } from './TimeZoneError';

/**
 * Standard timezone options for dropdowns
 */
const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'UTC', label: 'UTC' },
];

export class TimeZoneService {
  /**
   * Get standard timezone options
   */
  static get TIMEZONE_OPTIONS() {
    return TIMEZONE_OPTIONS;
  }

  /**
   * Get the local timezone from the browser
   */
  static getLocalTimeZone(): string {
    try {
      const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return this.ensureIANATimeZone(browserTimeZone);
    } catch (error) {
      console.error('[TimeZoneService] Error getting local timezone:', error);
      return 'UTC';
    }
  }

  /**
   * Get user timezone (alias for getLocalTimeZone for compatibility)
   */
  static getUserTimeZone(): string {
    return this.getLocalTimeZone();
  }

  /**
   * Ensure a timezone string is a valid IANA timezone
   */
  static ensureIANATimeZone(timezone?: string | null, defaultTimeZone: string = 'UTC'): string {
    if (!timezone) {
      return defaultTimeZone;
    }

    try {
      // Check if timezone is a valid IANA timezone
      if (IANAZone.isValidZone(timezone)) {
        return timezone;
      }

      console.warn(`[TimeZoneService] Invalid timezone: ${timezone}, falling back to default:`, defaultTimeZone);
      return defaultTimeZone;
    } catch (error) {
      console.error('[TimeZoneService] Error validating timezone:', error);
      return defaultTimeZone;
    }
  }

  /**
   * Format a timezone for display
   */
  static formatTimeZoneDisplay(timezone: string): string {
    const validZone = this.ensureIANATimeZone(timezone);
    
    // Check if it's in our standard options
    const option = TIMEZONE_OPTIONS.find(opt => opt.value === validZone);
    if (option) {
      return option.label;
    }
    
    try {
      // Otherwise create a display name from the IANA name
      const now = DateTime.now().setZone(validZone);
      const offset = now.toFormat('ZZ'); // Format like "+05:30"
      const zoneName = validZone.replace(/_/g, ' ').split('/').pop() || validZone;
      
      return `${zoneName} (GMT${offset})`;
    } catch (error) {
      console.error('[TimeZoneService] Error formatting timezone display:', error);
      return validZone;
    }
  }

  /**
   * Create a DateTime object from separate date and time strings
   */
  static createDateTime(
    dateStr: string,
    timeStr: string,
    timezone: string
  ): DateTime {
    const validZone = this.ensureIANATimeZone(timezone);
    
    try {
      // Parse date and time separately
      const [year, month, day] = dateStr.split('-').map(Number);
      let [hours, minutes] = timeStr.split(':').map(Number);
      
      // Handle AM/PM format
      if (timeStr.toLowerCase().includes('pm') && hours < 12) {
        hours += 12;
      } else if (timeStr.toLowerCase().includes('am') && hours === 12) {
        hours = 0;
      }
      
      // Create DateTime object in the specified timezone
      return DateTime.fromObject(
        {
          year,
          month,
          day,
          hour: hours,
          minute: minutes
        },
        { zone: validZone }
      );
    } catch (error) {
      console.error('[TimeZoneService] Error creating DateTime:', error);
      return DateTime.now().setZone(validZone);
    }
  }

  /**
   * Convert a DateTime object from one timezone to another
   */
  static convertDateTime(
    date: DateTime | Date | string,
    sourceZone: string,
    targetZone: string
  ): DateTime {
    const validSourceZone = this.ensureIANATimeZone(sourceZone);
    const validTargetZone = this.ensureIANATimeZone(targetZone);
    
    try {
      let dt: DateTime;
      
      // Convert input to DateTime
      if (date instanceof DateTime) {
        dt = date;
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date, { zone: validSourceZone });
      } else {
        dt = DateTime.fromISO(date, { zone: validSourceZone });
      }
      
      // Convert to target timezone
      return dt.setZone(validTargetZone);
    } catch (error) {
      console.error('[TimeZoneService] Error converting DateTime:', error);
      return DateTime.now().setZone(validTargetZone);
    }
  }

  /**
   * Convert timezone (alias for convertDateTime)
   */
  static convertTimeZone(
    date: DateTime | Date | string,
    sourceZone: string,
    targetZone: string
  ): DateTime {
    return this.convertDateTime(date, sourceZone, targetZone);
  }

  /**
   * Format a DateTime object according to a format string and timezone
   */
  static formatDateTime(
    date: DateTime | Date | string,
    format: string | 'short' | 'full' = 'full',
    timezone?: string
  ): string {
    const validZone = timezone ? this.ensureIANATimeZone(timezone) : undefined;
    
    try {
      let dt: DateTime;
      
      // Convert input to DateTime
      if (date instanceof DateTime) {
        dt = validZone ? date.setZone(validZone) : date;
      } else if (date instanceof Date) {
        dt = validZone ? 
          DateTime.fromJSDate(date, { zone: validZone }) : 
          DateTime.fromJSDate(date);
      } else {
        dt = validZone ? 
          DateTime.fromISO(date, { zone: validZone }) : 
          DateTime.fromISO(date);
      }
      
      // Format DateTime based on format type
      if (format === 'short') {
        return dt.toFormat('M/d/yyyy, h:mm a');
      } else if (format === 'full') {
        return dt.toFormat('MMMM d, yyyy, h:mm a');
      } else {
        return dt.toFormat(format);
      }
    } catch (error) {
      console.error('[TimeZoneService] Error formatting DateTime:', error);
      return String(date);
    }
  }

  /**
   * Format a time in 12-hour format
   */
  static formatTime(
    time: DateTime | Date | string,
    format: string = 'h:mm a',
    timezone?: string
  ): string {
    try {
      let dt: DateTime;
      const validZone = timezone ? this.ensureIANATimeZone(timezone) : undefined;
      
      // Convert input to DateTime
      if (time instanceof DateTime) {
        dt = validZone ? time.setZone(validZone) : time;
      } else if (time instanceof Date) {
        dt = validZone ? 
          DateTime.fromJSDate(time, { zone: validZone }) : 
          DateTime.fromJSDate(time);
      } else if (typeof time === 'string') {
        if (time.includes('T') || time.includes('Z') || time.includes('+')) {
          // ISO format
          dt = validZone ? 
            DateTime.fromISO(time, { zone: validZone }) : 
            DateTime.fromISO(time);
        } else if (time.includes(':')) {
          // Time-only format
          const [hour, minute] = time.split(':').map(Number);
          dt = DateTime.now().set({ hour, minute });
          if (validZone) {
            dt = dt.setZone(validZone);
          }
        } else {
          throw new TimeZoneError('Invalid time format', 'FORMAT_ERROR', { time });
        }
      } else {
        throw new TimeZoneError('Invalid time type', 'TYPE_ERROR', { time });
      }
      
      return dt.toFormat(format);
    } catch (error) {
      console.error('[TimeZoneService] Error formatting time:', error, { time, format, timezone });
      return String(time);
    }
  }

  /**
   * Format a date with the specified format
   */
  static formatDate(
    date: DateTime | Date | string,
    format: string | 'short' | 'full' = 'full',
    timezone?: string
  ): string {
    try {
      let dt: DateTime;
      const validZone = timezone ? this.ensureIANATimeZone(timezone) : undefined;
      
      // Convert input to DateTime
      if (date instanceof DateTime) {
        dt = validZone ? date.setZone(validZone) : date;
      } else if (date instanceof Date) {
        dt = validZone ? 
          DateTime.fromJSDate(date, { zone: validZone }) : 
          DateTime.fromJSDate(date);
      } else {
        dt = validZone ? 
          DateTime.fromISO(date, { zone: validZone }) : 
          DateTime.fromISO(date);
      }
      
      // Format DateTime based on format type
      if (format === 'short') {
        return dt.toFormat('M/d/yyyy');
      } else if (format === 'full') {
        return dt.toFormat('MMMM d, yyyy');
      } else {
        return dt.toFormat(format);
      }
    } catch (error) {
      console.error('[TimeZoneService] Error formatting date:', error);
      return String(date);
    }
  }

  /**
   * Format a date and time to 12-hour format
   */
  static formatDateToTime12Hour(
    date: DateTime | Date | string
  ): string {
    return this.formatTime(date, 'h:mm a');
  }

  /**
   * Convert a DateTime to UTC
   */
  static toUTC(date: DateTime | Date | string): DateTime {
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
      
      // Convert to UTC
      return dt.toUTC();
    } catch (error) {
      console.error('[TimeZoneService] Error converting to UTC:', error);
      return DateTime.now().toUTC();
    }
  }

  /**
   * Convert a UTC DateTime to a specific timezone
   */
  static fromUTC(date: DateTime | Date | string, timezone: string): DateTime {
    const validZone = this.ensureIANATimeZone(timezone);
    
    try {
      let dt: DateTime;
      
      // Convert input to DateTime in UTC
      if (date instanceof DateTime) {
        dt = date.toUTC();
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date, { zone: 'UTC' });
      } else {
        dt = DateTime.fromISO(date, { zone: 'UTC' });
      }
      
      // Convert from UTC to target timezone
      return dt.setZone(validZone);
    } catch (error) {
      console.error('[TimeZoneService] Error converting from UTC:', error);
      return DateTime.now().setZone(validZone);
    }
  }

  /**
   * Convert to UTC timestamp
   */
  static toUTCTimestamp(date: DateTime | Date | string, timezone: string): string {
    try {
      let dt: DateTime;
      const validZone = this.ensureIANATimeZone(timezone);
      
      // Convert input to DateTime
      if (date instanceof DateTime) {
        dt = date.setZone(validZone);
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date, { zone: validZone });
      } else {
        dt = DateTime.fromISO(date, { zone: validZone });
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
      const validZone = this.ensureIANATimeZone(timezone);
      return DateTime.fromISO(timestamp).setZone(validZone);
    } catch (error) {
      console.error('[TimeZoneService] Error converting from UTC timestamp:', error);
      return DateTime.now().setZone(timezone);
    }
  }

  /**
   * Parse a string with timezone information
   */
  static parseWithZone(dateString: string, timezone: string): DateTime {
    try {
      const validZone = this.ensureIANATimeZone(timezone);
      return DateTime.fromISO(dateString, { zone: validZone });
    } catch (error) {
      console.error('[TimeZoneService] Error parsing with zone:', error);
      return DateTime.now().setZone(timezone);
    }
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
  static isSameDay(date1: DateTime | Date | string, date2: DateTime | Date | string): boolean {
    try {
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
    } catch (error) {
      console.error('[TimeZoneService] Error checking if same day:', error);
      return false;
    }
  }

  /**
   * Add a duration to a date
   */
  static addDuration(date: DateTime | Date | string, amount: number, unit: string): DateTime {
    try {
      let dt: DateTime;
      
      if (date instanceof DateTime) {
        dt = date;
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date);
      } else {
        dt = DateTime.fromISO(date);
      }
      
      return dt.plus({ [unit]: amount });
    } catch (error) {
      console.error('[TimeZoneService] Error adding duration:', error);
      if (date instanceof DateTime) {
        return date;
      } else {
        return DateTime.now();
      }
    }
  }

  /**
   * Get weekday name from date
   */
  static getWeekdayName(date: DateTime | Date | string, format: 'long' | 'short' = 'long'): string {
    try {
      let dt: DateTime;
      
      if (date instanceof DateTime) {
        dt = date;
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date);
      } else {
        dt = DateTime.fromISO(date);
      }
      
      return dt.toFormat(format === 'long' ? 'cccc' : 'ccc');
    } catch (error) {
      console.error('[TimeZoneService] Error getting weekday name:', error);
      return '';
    }
  }

  /**
   * Get month name from date
   */
  static getMonthName(date: DateTime | Date | string, format: 'long' | 'short' = 'long'): string {
    try {
      let dt: DateTime;
      
      if (date instanceof DateTime) {
        dt = date;
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date);
      } else {
        dt = DateTime.fromISO(date);
      }
      
      return dt.toFormat(format === 'long' ? 'MMMM' : 'MMM');
    } catch (error) {
      console.error('[TimeZoneService] Error getting month name:', error);
      return '';
    }
  }

  /**
   * Get a list of common timezones
   */
  static getCommonTimezones(): { value: string; label: string }[] {
    return TIMEZONE_OPTIONS;
  }

  /**
   * Get display name from IANA timezone
   */
  static getDisplayNameFromIANA(timeZone: string): string {
    const validTimeZone = this.ensureIANATimeZone(timeZone);
    const option = TIMEZONE_OPTIONS.find(tz => tz.value === validTimeZone);
    return option?.label || validTimeZone;
  }

  /**
   * Get IANA timezone from display name
   */
  static getIANAFromDisplayName(displayName: string): string {
    const option = TIMEZONE_OPTIONS.find(tz => tz.label === displayName);
    if (option) {
      return option.value;
    }
    
    // Use system timezone as fallback
    const systemZone = this.getUserTimeZone();
    console.warn(`[TimeZoneService] No IANA timezone found for display name: ${displayName}, using system timezone: ${systemZone}`);
    return systemZone;
  }

  /**
   * Get timezone offset string (e.g. "+05:00")
   */
  static getTimezoneOffsetString(timeZone: string): string {
    try {
      const validTimeZone = this.ensureIANATimeZone(timeZone);
      return DateTime.now().setZone(validTimeZone).toFormat('ZZ');
    } catch (error) {
      console.error('[TimeZoneService] Error getting timezone offset:', error);
      return '+00:00'; // Default to UTC
    }
  }

  /**
   * Convert a calendar event to user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimezone: string): any {
    if (!event || !event.start || !event.end) {
      return event;
    }
    
    try {
      const validZone = this.ensureIANATimeZone(userTimezone);
      const sourceZone = event.sourceTimeZone || event.timezone || 'UTC';
      
      // Convert the start and end times to the user's timezone
      const startDateTime = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start, { zone: sourceZone }) 
        : DateTime.fromJSDate(event.start, { zone: sourceZone });
      
      const endDateTime = typeof event.end === 'string' 
        ? DateTime.fromISO(event.end, { zone: sourceZone }) 
        : DateTime.fromJSDate(event.end, { zone: sourceZone });
      
      if (!startDateTime.isValid || !endDateTime.isValid) {
        return event;
      }
      
      const localStartDateTime = startDateTime.setZone(validZone);
      const localEndDateTime = endDateTime.setZone(validZone);
      
      // Create a new event with converted times
      return {
        ...event,
        start: localStartDateTime.toISO(),
        end: localEndDateTime.toISO(),
        display_start: localStartDateTime.toFormat('h:mm a'),
        display_end: localEndDateTime.toFormat('h:mm a'),
        display_date: localStartDateTime.toFormat('yyyy-MM-dd'),
        display_day: localStartDateTime.toFormat('cccc'),
        timezone: validZone,
        extendedProps: {
          ...(event.extendedProps || {}),
          displayStart: localStartDateTime.toFormat('h:mm a'),
          displayEnd: localEndDateTime.toFormat('h:mm a'),
          displayDate: localStartDateTime.toFormat('yyyy-MM-dd'),
          displayDay: localStartDateTime.toFormat('cccc'),
          targetTimeZone: validZone,
          sourceTimeZone: sourceZone
        }
      };
    } catch (error) {
      console.error('[TimeZoneService] Error converting event to user timezone:', error);
      return event;
    }
  }
}

export default TimeZoneService;
