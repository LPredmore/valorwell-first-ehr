
import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';

/**
 * TimeZoneService - A centralized service for handling all timezone operations
 * This ensures consistent timezone handling across the application
 */
export class TimeZoneService {
  /**
   * Default timezone to use when none is provided
   */
  static readonly DEFAULT_TIMEZONE = 'UTC';

  /**
   * Validates and ensures a timezone string is in IANA format
   * Returns a valid timezone or falls back to the default
   */
  static ensureIANATimeZone(timezone?: string): string {
    if (!timezone) {
      console.warn('[TimeZoneService] No timezone provided, using default:', this.DEFAULT_TIMEZONE);
      return this.DEFAULT_TIMEZONE;
    }

    try {
      // Simple validation: attempt to create a DateTime object with the timezone
      const now = DateTime.now().setZone(timezone);
      if (!now.isValid) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }
      return timezone;
    } catch (error) {
      console.error('[TimeZoneService] Invalid timezone:', timezone, error);
      
      // Try to find a similar timezone as a fallback
      const fallback = this.findSimilarTimezone(timezone);
      if (fallback) {
        console.warn(`[TimeZoneService] Using fallback timezone: ${fallback} for invalid timezone: ${timezone}`);
        return fallback;
      }
      
      console.warn(`[TimeZoneService] Using default timezone: ${this.DEFAULT_TIMEZONE} for invalid timezone: ${timezone}`);
      return this.DEFAULT_TIMEZONE;
    }
  }

  /**
   * Find a similar valid timezone based on a partial match
   */
  static findSimilarTimezone(timezone: string): string | null {
    // Common timezone mappings
    const commonMappings: Record<string, string> = {
      'EST': 'America/New_York',
      'CST': 'America/Chicago',
      'MST': 'America/Denver',
      'PST': 'America/Los_Angeles',
      'EDT': 'America/New_York',
      'CDT': 'America/Chicago',
      'MDT': 'America/Denver',
      'PDT': 'America/Los_Angeles',
      'GMT': 'Etc/GMT',
      'UTC': 'UTC',
    };

    // Check direct mapping first
    if (commonMappings[timezone]) {
      return commonMappings[timezone];
    }

    // Check for partial matches in IANA timezones
    try {
      // Get user's current timezone as a fallback
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (userTimezone) {
        return userTimezone;
      }
    } catch (error) {
      console.error('[TimeZoneService] Error getting user timezone:', error);
    }

    return null;
  }

  /**
   * Create a DateTime object from date and time strings
   */
  static createDateTime(dateStr: string, timeStr: string, timezone: string): DateTime {
    const validTimezone = this.ensureIANATimeZone(timezone);
    
    try {
      // Combine date and time
      const combinedStr = `${dateStr}T${timeStr}`;
      
      // Parse with the specified timezone
      const dt = DateTime.fromISO(combinedStr, { zone: validTimezone });
      
      if (!dt.isValid) {
        throw new Error(`Invalid DateTime: ${dt.invalidReason} - ${dt.invalidExplanation}`);
      }
      
      return dt;
    } catch (error) {
      console.error('[TimeZoneService] Error creating DateTime:', error, {
        dateStr,
        timeStr,
        timezone: validTimezone
      });
      // Return current time as fallback
      return DateTime.now().setZone(validTimezone);
    }
  }

  /**
   * Convert a DateTime from one timezone to another
   */
  static convertDateTime(date: DateTime, fromZone: string, toZone: string): DateTime {
    const validFromZone = this.ensureIANATimeZone(fromZone);
    const validToZone = this.ensureIANATimeZone(toZone);
    
    try {
      // Ensure the date is in the source timezone
      const dateInFromZone = date.setZone(validFromZone);
      
      // Convert to target timezone
      return dateInFromZone.setZone(validToZone);
    } catch (error) {
      console.error('[TimeZoneService] Error converting DateTime between timezones:', error, {
        date: date.toString(),
        fromZone: validFromZone,
        toZone: validToZone
      });
      return date; // Return original as fallback
    }
  }

  /**
   * Format a DateTime for display
   */
  static formatDateTime(date: DateTime, format: string, timezone?: string): string {
    const validTimezone = timezone ? this.ensureIANATimeZone(timezone) : date.zone?.name;
    
    try {
      const dateInZone = validTimezone ? date.setZone(validTimezone) : date;
      return dateInZone.toFormat(format);
    } catch (error) {
      console.error('[TimeZoneService] Error formatting DateTime:', error, {
        date: date.toString(),
        format,
        timezone: validTimezone
      });
      // Return ISO format as fallback
      return date.toISO() || date.toString();
    }
  }

  /**
   * Parse a string with timezone awareness
   */
  static parseWithZone(dateStr: string, timezone: string): DateTime {
    const validTimezone = this.ensureIANATimeZone(timezone);
    
    try {
      // Try ISO format first
      let dt = DateTime.fromISO(dateStr, { zone: validTimezone });
      
      // If that's not valid, try other formats
      if (!dt.isValid) {
        // Try SQL date format
        dt = DateTime.fromSQL(dateStr, { zone: validTimezone });
      }
      
      if (!dt.isValid) {
        // Try HTTP date format
        dt = DateTime.fromHTTP(dateStr, { zone: validTimezone });
      }
      
      if (!dt.isValid) {
        throw new Error(`Could not parse date string: ${dateStr}`);
      }
      
      return dt;
    } catch (error) {
      console.error('[TimeZoneService] Error parsing date string:', error, {
        dateStr,
        timezone: validTimezone
      });
      // Return current time as fallback
      return DateTime.now().setZone(validTimezone);
    }
  }

  /**
   * Convert to UTC for storage
   */
  static toUTC(date: DateTime): string {
    try {
      return date.toUTC().toISO() || '';
    } catch (error) {
      console.error('[TimeZoneService] Error converting to UTC:', error, {
        date: date.toString()
      });
      return DateTime.now().toUTC().toISO() || '';
    }
  }

  /**
   * Convert from UTC to user timezone
   */
  static fromUTC(utcStr: string, timezone: string): DateTime {
    const validTimezone = this.ensureIANATimeZone(timezone);
    
    try {
      const dt = DateTime.fromISO(utcStr, { zone: 'UTC' }).setZone(validTimezone);
      if (!dt.isValid) {
        throw new Error(`Invalid DateTime: ${dt.invalidReason} - ${dt.invalidExplanation}`);
      }
      return dt;
    } catch (error) {
      console.error('[TimeZoneService] Error converting from UTC:', error, {
        utcStr,
        timezone: validTimezone
      });
      // Return current time as fallback
      return DateTime.now().setZone(validTimezone);
    }
  }

  /**
   * Format a time string
   */
  static formatTime(timeStr: string, format: string = 'h:mm a', timezone?: string): string {
    try {
      let dt: DateTime;
      
      // Handle different input formats
      if (timeStr.includes('T')) {
        // Full ISO date string
        dt = DateTime.fromISO(timeStr);
      } else if (timeStr.includes(':')) {
        // Just time string like "14:30:00"
        const now = DateTime.now();
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        dt = DateTime.local(
          now.year, 
          now.month, 
          now.day, 
          hours || 0, 
          minutes || 0, 
          seconds || 0
        );
      } else {
        throw new Error(`Unsupported time format: ${timeStr}`);
      }
      
      if (timezone) {
        dt = dt.setZone(this.ensureIANATimeZone(timezone));
      }
      
      return dt.toFormat(format);
    } catch (error) {
      console.error('[TimeZoneService] Error formatting time:', error, {
        timeStr,
        format,
        timezone
      });
      return timeStr; // Return original as fallback
    }
  }

  /**
   * Format timezone for display
   */
  static formatTimeZoneDisplay(timezone: string): string {
    const validTimezone = this.ensureIANATimeZone(timezone);
    
    try {
      const now = DateTime.now().setZone(validTimezone);
      const offset = now.toFormat('ZZ');
      
      // Get just the city name from the timezone
      const city = validTimezone.split('/').pop()?.replace(/_/g, ' ');
      
      return city ? `${city} (${offset})` : offset;
    } catch (error) {
      console.error('[TimeZoneService] Error formatting timezone display:', error, {
        timezone: validTimezone
      });
      return validTimezone; // Return original as fallback
    }
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
        startDt = DateTime.fromJSDate(event.start).setZone(validTimeZone);
      } else {
        startDt = this.parseWithZone(String(event.start), validTimeZone);
      }
      
      if (event.end instanceof Date) {
        endDt = DateTime.fromJSDate(event.end).setZone(validTimeZone);
      } else {
        endDt = this.parseWithZone(String(event.end), validTimeZone);
      }
      
      const extendedProps = {
        ...(event.extendedProps || {}),
        displayStart: startDt.toFormat('h:mm a'),
        displayEnd: endDt.toFormat('h:mm a'),
        displayDay: startDt.toFormat('ccc'),
        displayDate: startDt.toFormat('MMM d'),
        sourceTimeZone: event.extendedProps?.sourceTimeZone || 'UTC',
        userTimeZone: validTimeZone
      };
      
      return {
        ...event,
        start: startDt.toISO() || '',
        end: endDt.toISO() || '',
        title: event.title || '',
        extendedProps,
        _userTimeZone: validTimeZone
      };
    } catch (error) {
      console.error('[TimeZoneService] Error converting event to user timezone:', error, {
        event,
        userTimeZone: validTimeZone
      });
      return event;
    }
  }

  /**
   * Debug timezone issues - logs full timezone information
   */
  static debugTimezone(timezone: string): object {
    try {
      const validTimezone = this.ensureIANATimeZone(timezone);
      const now = DateTime.now().setZone(validTimezone);
      
      return {
        inputTimezone: timezone,
        validTimezone,
        offset: now.offset,
        offsetString: now.toFormat('Z'),
        currentTime: now.toISO(),
        formatted: now.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'),
        isValid: now.isValid,
        invalidReason: now.invalidReason,
        invalidExplanation: now.invalidExplanation,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Not in browser',
        browserTimezone: typeof Intl !== 'undefined' ? 
          Intl.DateTimeFormat().resolvedOptions().timeZone : 'Unknown'
      };
    } catch (error) {
      console.error('[TimeZoneService] Error debugging timezone:', error);
      return {
        inputTimezone: timezone,
        error: String(error)
      };
    }
  }
}

// Export a singleton instance as default
export default TimeZoneService;
