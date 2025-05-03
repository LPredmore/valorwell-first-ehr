import { DateTime, IANAZone, Info } from 'luxon';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneError } from './TimeZoneError';

/**
 * Centralized service for timezone operations
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
   * Validates that a timezone string is a valid IANA timezone
   */
  static validateTimeZone(timeZone: string): string {
    if (!timeZone || typeof timeZone !== 'string') {
      console.warn('[TimeZoneService] Empty or invalid timezone provided, defaulting to UTC');
      return 'UTC';
    }

    try {
      if (IANAZone.isValidZone(timeZone)) {
        return timeZone;
      }

      console.warn(`[TimeZoneService] Invalid timezone: ${timeZone}, defaulting to UTC`);
      return 'UTC';
    } catch (error) {
      console.warn(`[TimeZoneService] Error validating timezone:`, error);
      return 'UTC';
    }
  }

  /**
   * Ensures a timezone string is a valid IANA timezone
   */
  static ensureIANATimeZone(timeZone?: string | null, defaultTimeZone: string = 'UTC'): string {
    if (!timeZone) {
      return defaultTimeZone;
    }
    
    try {
      if (IANAZone.isValidZone(timeZone)) {
        return timeZone;
      }
      
      // Try to match with common timezone aliases
      const tzAliases: Record<string, string> = {
        'EST': 'America/New_York',
        'CST': 'America/Chicago',
        'MST': 'America/Denver',
        'PST': 'America/Los_Angeles',
        'EDT': 'America/New_York',
        'CDT': 'America/Chicago',
        'MDT': 'America/Denver',
        'PDT': 'America/Los_Angeles'
      };
      
      if (tzAliases[timeZone]) {
        return tzAliases[timeZone];
      }
      
      // Fall back to browser's timezone
      const browserTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (IANAZone.isValidZone(browserTZ)) {
        console.warn(`[TimeZoneService] Invalid timezone: ${timeZone}, using browser timezone: ${browserTZ}`);
        return browserTZ;
      }
      
      console.warn(`[TimeZoneService] Invalid timezone: ${timeZone}, defaulting to ${defaultTimeZone}`);
      return defaultTimeZone;
    } catch (error) {
      console.warn(`[TimeZoneService] Error ensuring IANA timezone:`, error);
      return defaultTimeZone;
    }
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
   * Format a timezone for display
   */
  static formatTimeZoneDisplay(timezone: string): string {
    const validZone = this.ensureIANATimeZone(timezone);
    
    // Check if it's in our standard options
    const option = this.TIMEZONE_OPTIONS.find(opt => opt.value === validZone);
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
   * Creates a DateTime object from a date string and time string in a timezone
   */
  static createDateTime(
    dateStr: string,
    timeStr: string,
    timezone: string
  ): DateTime {
    const validZone = this.validateTimeZone(timezone);
    
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
   * Convert a DateTime from one timezone to another
   */
  static convertDateTime(
    date: DateTime | Date | string,
    sourceZone: string,
    targetZone: string
  ): DateTime {
    const validSourceZone = this.validateTimeZone(sourceZone);
    const validTargetZone = this.validateTimeZone(targetZone);
    
    try {
      let dt: DateTime;
      
      // Convert input to DateTime
      if (date instanceof DateTime) {
        dt = date.setZone(validSourceZone);
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
   * Convert timezone for a specific time
   */
  static convertTimeZone(
    time: string,
    sourceZone: string,
    targetZone: string
  ): string {
    try {
      // Create a base date with the time
      const today = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      
      const dt = DateTime.fromObject({
        year: today.getFullYear(),
        month: today.getMonth() + 1, 
        day: today.getDate(),
        hour: hours,
        minute: minutes
      }, { zone: sourceZone });
      
      // Convert to target timezone
      const convertedDt = dt.setZone(targetZone);
      
      // Return just the time portion
      return convertedDt.toFormat('HH:mm');
    } catch (error) {
      console.error('[TimeZoneService] Error converting time zone:', error);
      return time;
    }
  }

  /**
   * Format a DateTime object according to format and timezone
   */
  static formatDateTime(
    date: DateTime | Date | string,
    format: string | 'short' | 'full' = 'full',
    timezone: string = 'UTC'
  ): string {
    const validZone = this.ensureIANATimeZone(timezone);
    
    try {
      let dt: DateTime;
      
      // Convert input to DateTime
      if (date instanceof DateTime) {
        dt = date.setZone(validZone);
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date, { zone: validZone });
      } else {
        dt = DateTime.fromISO(date, { zone: validZone });
      }
      
      // Handle predefined formats
      if (format === 'full') {
        return dt.toFormat('MMMM d, yyyy h:mm a');
      } else if (format === 'short') {
        return dt.toFormat('MM/dd/yyyy h:mm a');
      } else if (format === 'date') {
        return dt.toFormat('yyyy-MM-dd');
      } else if (format === 'time') {
        return dt.toFormat('HH:mm');
      } else {
        // Use custom format
        return dt.toFormat(format);
      }
    } catch (error) {
      console.error('[TimeZoneService] Error formatting DateTime:', error);
      return typeof date === 'string' ? date : 'Invalid Date';
    }
  }

  /**
   * Format a time in 12-hour format
   */
  static formatTime(
    time: string | Date | DateTime,
    format: string = 'h:mm a',
    timezone: string = 'UTC'
  ): string {
    try {
      let dt: DateTime;
      
      if (typeof time === 'string') {
        // Handle time strings like "14:30"
        if (time.includes(':')) {
          const [hours, minutes] = time.split(':').map(Number);
          const today = new Date();
          dt = DateTime.fromObject({
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate(),
            hour: hours,
            minute: minutes
          }, { zone: timezone });
        } else {
          dt = DateTime.fromISO(time, { zone: timezone });
        }
      } else if (time instanceof Date) {
        dt = DateTime.fromJSDate(time, { zone: timezone });
      } else {
        dt = time.setZone(timezone);
      }
      
      return dt.toFormat(format);
    } catch (error) {
      console.error('[TimeZoneService] Error formatting time:', error);
      return typeof time === 'string' ? time : 'Invalid Time';
    }
  }

  /**
   * Format a date with the specified format
   */
  static formatDate(
    date: DateTime | Date | string,
    format: string = 'yyyy-MM-dd',
    timezone: string = 'UTC'
  ): string {
    return this.formatDateTime(date, format, timezone);
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
   * Convert from UTC to a specific timezone
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
   * Get a list of common timezones
   */
  static getCommonTimezones(): { value: string; label: string }[] {
    // Use predefined list instead of Info.zones() which is unreliable
    const commonZones = [
      'America/New_York',
      'America/Chicago', 
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu',
      'America/Phoenix',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Australia/Sydney',
      'UTC'
    ];
    
    // Map to value/label format
    return commonZones.map(zone => {
      const now = DateTime.now().setZone(zone);
      const offset = now.toFormat('ZZZZ');
      const label = `${zone.replace(/_/g, ' ')} (${offset})`;
      
      return {
        value: zone,
        label
      };
    });
  }

  /**
   * Convert a calendar event to user's timezone
   */
  static convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
    const validTimeZone = this.ensureIANATimeZone(userTimeZone);
    
    if (!event.start || !event.end) {
      return event;
    }
    
    try {
      let startDt: DateTime;
      let endDt: DateTime;
      
      if (event.start instanceof Date) {
        startDt = DateTime.fromJSDate(event.start);
      } else {
        startDt = DateTime.fromISO(String(event.start));
      }
      
      if (event.end instanceof Date) {
        endDt = DateTime.fromJSDate(event.end);
      } else {
        endDt = DateTime.fromISO(String(event.end));
      }
      
      // If it's an all-day event, keep the dates as is but set to user timezone
      if (event.allDay) {
        const newEvent = {
          ...event,
          extendedProps: {
            ...(event.extendedProps || {}),
            timezone: validTimeZone,
            displayStart: startDt.toFormat('h:mm a'),
            displayEnd: endDt.toFormat('h:mm a'),
            displayDay: startDt.toFormat('ccc'),
            displayDate: startDt.toFormat('MMM d')
          }
        };
        return newEvent;
      }
      
      // Otherwise convert to user timezone
      const userStartDt = startDt.setZone(validTimeZone);
      const userEndDt = endDt.setZone(validTimeZone);
      
      return {
        ...event,
        start: userStartDt.toISO() || '',
        end: userEndDt.toISO() || '',
        extendedProps: {
          ...(event.extendedProps || {}),
          timezone: validTimeZone,
          displayStart: userStartDt.toFormat('h:mm a'),
          displayEnd: userEndDt.toFormat('h:mm a'),
          displayDay: userStartDt.toFormat('ccc'),
          displayDate: userStartDt.toFormat('MMM d')
        }
      };
    } catch (error) {
      console.error('[TimeZoneService] Error converting event to user timezone:', error);
      return event;
    }
  }

  /**
   * Parse a string into a DateTime object with the specified timezone
   */
  static parseWithZone(dateTimeStr: string, timezone: string): DateTime {
    try {
      const zone = this.validateTimeZone(timezone);
      let dt = DateTime.fromISO(dateTimeStr, { zone });
      
      if (!dt.isValid) {
        // Try SQL format
        dt = DateTime.fromSQL(dateTimeStr, { zone });
      }
      
      if (!dt.isValid) {
        // Try HTTP format
        dt = DateTime.fromHTTP(dateTimeStr, { zone });
      }
      
      if (!dt.isValid) {
        throw new Error(`Failed to parse date string: ${dateTimeStr}`);
      }
      
      return dt;
    } catch (error) {
      console.error('[TimeZoneService] Error parsing with zone:', error);
      throw error;
    }
  }
}

export default TimeZoneService;
