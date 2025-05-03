
import { DateTime, IANAZone, Zone } from 'luxon';

/**
 * Service to handle timezone conversions and validations
 */
export class TimeZoneService {
  /**
   * Ensure a timezone string is a valid IANA timezone
   */
  static ensureIANATimeZone(timezone?: string): string {
    if (!timezone) {
      console.warn('[TimeZoneService] No timezone provided, falling back to UTC');
      return 'UTC';
    }

    try {
      // Check if timezone is a valid IANA timezone
      if (IANAZone.isValidZone(timezone)) {
        return timezone;
      }

      console.warn(`[TimeZoneService] Invalid timezone: ${timezone}, falling back to UTC`);
      return 'UTC';
    } catch (error) {
      console.error('[TimeZoneService] Error validating timezone:', error);
      return 'UTC';
    }
  }

  /**
   * Get a formatted display name for a timezone
   */
  static getDisplayNameFromIANA(timezone: string): string {
    const validZone = this.ensureIANATimeZone(timezone);
    try {
      // Get current time in the timezone
      const now = DateTime.now().setZone(validZone);
      
      // Format as "City (GMT+/-XX:XX)"
      const offset = now.toFormat('ZZ'); // Format like "+05:30"
      const zoneName = validZone.replace(/_/g, ' ').split('/').pop() || validZone;
      
      return `${zoneName} (GMT${offset})`;
    } catch (error) {
      console.error('[TimeZoneService] Error getting display name:', error);
      return validZone;
    }
  }

  /**
   * Get IANA timezone from a display name
   */
  static getIANAFromDisplayName(displayName: string): string | null {
    try {
      // Extract the timezone name from the display format "City (GMT+/-XX:XX)"
      const match = displayName.match(/^(.+?)\s+\(GMT/);
      if (match && match[1]) {
        const zoneName = match[1].trim();
        
        // Try to find the matching IANA timezone
        // This is a simplified approach, a real implementation would need a proper mapping
        const allZones = IANAZone.create(zoneName);
        if (allZones) {
          return zoneName;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[TimeZoneService] Error getting IANA from display name:', error);
      return null;
    }
  }

  /**
   * Get timezone offset string like "+05:30"
   */
  static getTimezoneOffsetString(timezone: string): string {
    const validZone = this.ensureIANATimeZone(timezone);
    try {
      const now = DateTime.now().setZone(validZone);
      return now.toFormat('ZZ'); // Format like "+05:30"
    } catch (error) {
      console.error('[TimeZoneService] Error getting timezone offset:', error);
      return '+00:00'; // Default to UTC
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
   * Format a DateTime object according to a format string and timezone
   */
  static formatDateTime(
    date: DateTime | Date | string,
    format: string,
    timezone: string
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
      
      // Format DateTime
      return dt.toFormat(format);
    } catch (error) {
      console.error('[TimeZoneService] Error formatting DateTime:', error);
      return DateTime.now().setZone(validZone).toFormat(format);
    }
  }

  /**
   * Format a time in 12-hour format
   */
  static formatTime(
    date: DateTime | Date | string,
    format: string = 'h:mm a',
    timezone: string
  ): string {
    return this.formatDateTime(date, format, timezone);
  }

  /**
   * Format a date and time to 12-hour format
   */
  static formatDateToTime12Hour(
    date: DateTime | Date | string,
    timezone: string
  ): string {
    return this.formatTime(date, 'h:mm a', timezone);
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
   * Convert a calendar event to the user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimezone: string): any {
    const validZone = this.ensureIANATimeZone(userTimezone);
    const sourceZone = event.sourceTimeZone || event.timezone || 'UTC';
    
    try {
      // Convert the start and end times to the user's timezone
      const startDateTime = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start, { zone: sourceZone }) 
        : DateTime.fromJSDate(event.start, { zone: sourceZone });
      
      const endDateTime = typeof event.end === 'string' 
        ? DateTime.fromISO(event.end, { zone: sourceZone }) 
        : DateTime.fromJSDate(event.end, { zone: sourceZone });
      
      const localStartDateTime = startDateTime.setZone(validZone);
      const localEndDateTime = endDateTime.setZone(validZone);
      
      // Create a new event with converted times
      return {
        ...event,
        display_start: localStartDateTime.toFormat('h:mm a'),
        display_end: localEndDateTime.toFormat('h:mm a'),
        display_date: localStartDateTime.toFormat('yyyy-MM-dd'),
        display_day: localStartDateTime.toFormat('cccc'),
        timezone: validZone,
        extendedProps: {
          ...event.extendedProps,
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
