
import { DateTime } from 'luxon';
import { toast } from '@/hooks/use-toast';

/**
 * TimeZoneService provides standardized timezone and date handling functionality
 * for the entire application following the Timezone Handling Standards.
 *
 * All dates should be stored in UTC in the database and converted to the user's
 * timezone for display. All UI date/time displays should use AM/PM formatting.
 */
export class TimeZoneService {
  // Default timezone to use when none is provided
  static DEFAULT_TIMEZONE = 'America/Chicago';
  
  // Common date/time formats
  static DATE_FORMAT = 'yyyy-MM-dd';
  static TIME_FORMAT = 'HH:mm';
  static TIME_FORMAT_AMPM = 'h:mm a';
  static DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';
  static DATETIME_FORMAT_AMPM = 'yyyy-MM-dd h:mm a';
  static DISPLAY_DATE_FORMAT = 'MMM d, yyyy';
  static DISPLAY_DATETIME_FORMAT = 'MMM d, yyyy h:mm a';
  static FULL_DATE_FORMAT = 'EEEE, MMMM d, yyyy';

  /**
   * Mapping of common timezone names, abbreviations, and descriptive names to IANA timezone identifiers
   */
  static TIMEZONE_MAP: Record<string, string> = {
    // US Timezones - Common names
    'Eastern Standard Time': 'America/New_York',
    'Eastern Standard Time (EST)': 'America/New_York',
    'EST': 'America/New_York',
    'EDT': 'America/New_York',
    'Central Standard Time': 'America/Chicago',
    'Central Standard Time (CST)': 'America/Chicago',
    'CST': 'America/Chicago',
    'CDT': 'America/Chicago',
    'Mountain Standard Time': 'America/Denver',
    'Mountain Standard Time (MST)': 'America/Denver',
    'MST': 'America/Denver',
    'MDT': 'America/Denver',
    'Pacific Standard Time': 'America/Los_Angeles',
    'Pacific Standard Time (PST)': 'America/Los_Angeles',
    'PST': 'America/Los_Angeles',
    'PDT': 'America/Los_Angeles',
    'Alaska Standard Time': 'America/Anchorage',
    'Alaska Standard Time (AKST)': 'America/Anchorage',
    'AKST': 'America/Anchorage',
    'Hawaii-Aleutian Standard Time': 'Pacific/Honolulu',
    'Hawaii-Aleutian Standard Time (HST)': 'Pacific/Honolulu',
    'HST': 'Pacific/Honolulu',
    'Atlantic Standard Time': 'America/Puerto_Rico',
    'Atlantic Standard Time (AST)': 'America/Puerto_Rico',
    'AST': 'America/Puerto_Rico',

    // Windows timezone names
    'Eastern Time (US & Canada)': 'America/New_York',
    'Central Time (US & Canada)': 'America/Chicago',
    'Mountain Time (US & Canada)': 'America/Denver',
    'Pacific Time (US & Canada)': 'America/Los_Angeles',
    'US Eastern Standard Time': 'America/New_York',
    'US Mountain Standard Time': 'America/Phoenix',
  };
  
  /**
   * Normalizes timezone identifiers to valid IANA format
   * Attempts to convert common timezone names and abbreviations to valid IANA identifiers
   */
  static normalizeTimeZone(timezone: string | null | undefined): string | null {
    if (!timezone) {
      return null;
    }

    // If it's already a valid IANA timezone, return it
    try {
      const testDt = DateTime.now().setZone(timezone);
      if (testDt.isValid) {
        return timezone;
      }
    } catch (e) {
      // Not a valid IANA timezone, continue with normalization
    }

    // Try to map the timezone to an IANA identifier
    const mappedTimezone = this.TIMEZONE_MAP[timezone.trim()];
    if (mappedTimezone) {
      return mappedTimezone;
    }

    // If no mapping found, return null
    console.warn(`Unable to map timezone '${timezone}' to an IANA identifier`);
    return null;
  }

  /**
   * Ensures that a timezone string is a valid IANA timezone.
   * If invalid, falls back to a default timezone and logs the error.
   */
  static ensureIANATimeZone(timezone: string | null | undefined): string {
    // First try to normalize the timezone
    const normalizedTimezone = this.normalizeTimeZone(timezone);
    
    if (!normalizedTimezone) {
      console.warn(`Invalid or empty timezone provided: '${timezone}', falling back to ${this.DEFAULT_TIMEZONE}`);
      return this.DEFAULT_TIMEZONE;
    }

    try {
      // Check if normalized timezone is a valid IANA timezone
      const dt = DateTime.now().setZone(normalizedTimezone);
      if (dt.isValid) {
        return normalizedTimezone;
      }
      
      console.warn(`Normalized timezone '${normalizedTimezone}' is still invalid, falling back to ${this.DEFAULT_TIMEZONE}`);
      return this.DEFAULT_TIMEZONE;
    } catch (error) {
      console.error(`Error validating timezone: '${normalizedTimezone}'`, error);
      return this.DEFAULT_TIMEZONE;
    }
  }

  /**
   * Creates a DateTime object from date and time strings in the specified timezone
   */
  static createDateTime(dateStr: string, timeStr: string, timezone: string): DateTime {
    const safeTimezone = this.ensureIANATimeZone(timezone);
    const fullDateTimeStr = `${dateStr}T${timeStr}`;
    
    try {
      const dt = DateTime.fromISO(fullDateTimeStr, { zone: safeTimezone });
      if (!dt.isValid) {
        console.error(`Invalid DateTime created: ${dt.invalidReason}: ${dt.invalidExplanation}`);
      }
      return dt;
    } catch (error) {
      console.error(`Error creating DateTime from: ${fullDateTimeStr} in timezone ${safeTimezone}`, error);
      // Return current time as fallback
      return DateTime.now().setZone(safeTimezone);
    }
  }

  /**
   * Creates a DateTime object from a JavaScript Date object
   */
  static fromJSDate(date: Date, timezone?: string): DateTime {
    const safeTimezone = timezone ? this.ensureIANATimeZone(timezone) : 'local';
    
    try {
      return DateTime.fromJSDate(date, { zone: safeTimezone });
    } catch (error) {
      console.error(`Error converting JS Date to DateTime: ${error}`);
      return DateTime.now().setZone(safeTimezone);
    }
  }

  /**
   * Creates a DateTime object from an ISO string
   */
  static fromISO(isoString: string, timezone?: string): DateTime {
    const safeTimezone = timezone ? this.ensureIANATimeZone(timezone) : 'utc';
    
    try {
      return DateTime.fromISO(isoString, { zone: safeTimezone });
    } catch (error) {
      console.error(`Error creating DateTime from ISO string: ${isoString}`, error);
      return DateTime.now().setZone(safeTimezone);
    }
  }

  /**
   * Creates a DateTime object from a date string in yyyy-MM-dd format
   */
  static fromDateString(dateString: string, timezone?: string): DateTime {
    const safeTimezone = timezone ? this.ensureIANATimeZone(timezone) : 'utc';
    
    try {
      // Ensure the date string is in yyyy-MM-dd format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Try to parse and normalize the date
        const jsDate = new Date(dateString);
        if (isNaN(jsDate.getTime())) {
          throw new Error(`Invalid date string: ${dateString}`);
        }
        dateString = jsDate.toISOString().split('T')[0];
      }
      
      return DateTime.fromISO(`${dateString}T00:00:00`, { zone: safeTimezone });
    } catch (error) {
      console.error(`Error creating DateTime from date string: ${dateString}`, error);
      return DateTime.now().setZone(safeTimezone).startOf('day');
    }
  }

  /**
   * Creates a DateTime object from a time string in HH:mm format
   */
  static fromTimeString(timeString: string, timezone?: string): DateTime {
    const safeTimezone = timezone ? this.ensureIANATimeZone(timezone) : 'utc';
    
    try {
      // Use today's date with the specified time
      const today = DateTime.now().setZone(safeTimezone).startOf('day');
      const [hours, minutes] = timeString.split(':').map(Number);
      
      return today.set({ hour: hours, minute: minutes });
    } catch (error) {
      console.error(`Error creating DateTime from time string: ${timeString}`, error);
      return DateTime.now().setZone(safeTimezone);
    }
  }

  /**
   * Converts a DateTime object from one timezone to another
   */
  static convertDateTime(dt: DateTime, fromTimezone: string, toTimezone: string): DateTime {
    const safeFromTimezone = this.ensureIANATimeZone(fromTimezone);
    const safeToTimezone = this.ensureIANATimeZone(toTimezone);
    
    try {
      return dt.setZone(safeFromTimezone).setZone(safeToTimezone);
    } catch (error) {
      console.error(`Error converting timezone from ${safeFromTimezone} to ${safeToTimezone}`, error);
      return dt;
    }
  }

  /**
   * Formats a DateTime object according to the specified format and timezone
   */
  static formatDateTime(dt: DateTime, format: string, timezone?: string): string {
    const safeTimezone = timezone ? this.ensureIANATimeZone(timezone) : dt.zoneName;
    
    try {
      return dt.setZone(safeTimezone).toFormat(format);
    } catch (error) {
      console.error(`Error formatting DateTime in timezone ${safeTimezone}`, error);
      return dt.toFormat(format);
    }
  }

  /**
   * Formats a DateTime object as a date string (yyyy-MM-dd)
   */
  static formatDate(dt: DateTime, timezone?: string): string {
    return this.formatDateTime(dt, this.DATE_FORMAT, timezone);
  }

  /**
   * Formats a DateTime object as a time string with AM/PM (h:mm a)
   */
  static formatTime(dt: DateTime, timezone?: string): string {
    return this.formatDateTime(dt, this.TIME_FORMAT_AMPM, timezone);
  }

  /**
   * Formats a DateTime object as a time string in 24-hour format (HH:mm)
   */
  static formatTime24(dt: DateTime, timezone?: string): string {
    return this.formatDateTime(dt, this.TIME_FORMAT, timezone);
  }

  /**
   * Formats a DateTime object as a display date (MMM d, yyyy)
   */
  static formatDisplayDate(dt: DateTime, timezone?: string): string {
    return this.formatDateTime(dt, this.DISPLAY_DATE_FORMAT, timezone);
  }

  /**
   * Formats a DateTime object as a full date (EEEE, MMMM d, yyyy)
   */
  static formatFullDate(dt: DateTime, timezone?: string): string {
    return this.formatDateTime(dt, this.FULL_DATE_FORMAT, timezone);
  }

  /**
   * Formats a DateTime object as a display date and time (MMM d, yyyy h:mm a)
   */
  static formatDisplayDateTime(dt: DateTime, timezone?: string): string {
    return this.formatDateTime(dt, this.DISPLAY_DATETIME_FORMAT, timezone);
  }

  /**
   * Gets the current date and time in the specified timezone
   */
  static now(timezone?: string): DateTime {
    const safeTimezone = timezone ? this.ensureIANATimeZone(timezone) : 'local';
    return DateTime.now().setZone(safeTimezone);
  }

  /**
   * Gets the current date (start of day) in the specified timezone
   */
  static today(timezone?: string): DateTime {
    return this.now(timezone).startOf('day');
  }

  /**
   * Converts a DateTime to UTC for database storage
   */
  static toUTC(dt: DateTime): string {
    try {
      return dt.toUTC().toISO();
    } catch (error) {
      console.error('Error converting to UTC', error);
      return DateTime.utc().toISO();
    }
  }

  /**
   * Converts a UTC string from the database to the user's timezone
   */
  static fromUTC(utcStr: string, userTimezone: string): DateTime {
    const safeTimezone = this.ensureIANATimeZone(userTimezone);
    
    try {
      return DateTime.fromISO(utcStr, { zone: 'utc' }).setZone(safeTimezone);
    } catch (error) {
      console.error(`Error converting from UTC to ${safeTimezone}`, error);
      return DateTime.now().setZone(safeTimezone);
    }
  }

  /**
   * Converts a time string from one timezone to another
   * @param timeString ISO time string (e.g. "2000-01-01T09:00:00Z")
   * @param fromZone Source timezone
   * @param toZone Target timezone
   * @returns DateTime object in the target timezone
   */
  static convertTimeToZone(timeString: string, fromZone: string, toZone: string): DateTime {
    const safeFromZone = this.ensureIANATimeZone(fromZone);
    const safeToZone = this.ensureIANATimeZone(toZone);
    
    // Create a DateTime object with the time in the source timezone
    const dt = DateTime.fromISO(timeString, { zone: safeFromZone });
    
    if (!dt.isValid) {
      console.error(`Invalid time string: ${timeString}, reason: ${dt.invalidReason}`);
      // Return current time as fallback
      return DateTime.now().setZone(safeToZone);
    }
    
    // Convert to the target timezone
    return dt.setZone(safeToZone);
  }

  /**
   * Adds a specified number of days to a DateTime
   */
  static addDays(dt: DateTime, days: number): DateTime {
    return dt.plus({ days });
  }

  /**
   * Adds a specified number of weeks to a DateTime
   */
  static addWeeks(dt: DateTime, weeks: number): DateTime {
    return dt.plus({ weeks });
  }

  /**
   * Adds a specified number of months to a DateTime
   */
  static addMonths(dt: DateTime, months: number): DateTime {
    return dt.plus({ months });
  }

  /**
   * Subtracts a specified number of days from a DateTime
   */
  static subtractDays(dt: DateTime, days: number): DateTime {
    return dt.minus({ days });
  }

  /**
   * Subtracts a specified number of weeks from a DateTime
   */
  static subtractWeeks(dt: DateTime, weeks: number): DateTime {
    return dt.minus({ weeks });
  }

  /**
   * Subtracts a specified number of months from a DateTime
   */
  static subtractMonths(dt: DateTime, months: number): DateTime {
    return dt.minus({ months });
  }

  /**
   * Checks if a DateTime is before another DateTime
   */
  static isBefore(dt1: DateTime, dt2: DateTime): boolean {
    return dt1 < dt2;
  }

  /**
   * Checks if a DateTime is after another DateTime
   */
  static isAfter(dt1: DateTime, dt2: DateTime): boolean {
    return dt1 > dt2;
  }

  /**
   * Checks if a DateTime is the same day as another DateTime
   */
  static isSameDay(dt1: DateTime, dt2: DateTime): boolean {
    return dt1.hasSame(dt2, 'day');
  }

  /**
   * Checks if a DateTime is today
   */
  static isToday(dt: DateTime): boolean {
    return dt.hasSame(DateTime.now(), 'day');
  }

  /**
   * Checks if a DateTime is in the future
   */
  static isFuture(dt: DateTime): boolean {
    return dt > DateTime.now();
  }

  /**
   * Checks if a DateTime is in the past
   */
  static isPast(dt: DateTime): boolean {
    return dt < DateTime.now();
  }

  /**
   * Gets the start of the week containing the specified DateTime
   */
  static startOfWeek(dt: DateTime, weekStartsOn: number = 0): DateTime {
    // Adjust for week start (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = dt.weekday % 7; // Convert to 0-6 range where 0 is Sunday
    const diff = (dayOfWeek - weekStartsOn + 7) % 7;
    return dt.minus({ days: diff }).startOf('day');
  }

  /**
   * Gets the end of the week containing the specified DateTime
   */
  static endOfWeek(dt: DateTime, weekStartsOn: number = 0): DateTime {
    return this.startOfWeek(dt, weekStartsOn).plus({ days: 6 }).endOf('day');
  }

  /**
   * Gets the start of the month containing the specified DateTime
   */
  static startOfMonth(dt: DateTime): DateTime {
    return dt.startOf('month');
  }

  /**
   * Gets the end of the month containing the specified DateTime
   */
  static endOfMonth(dt: DateTime): DateTime {
    return dt.endOf('month');
  }

  /**
   * Gets an array of DateTimes for each day in the specified interval
   */
  static eachDayOfInterval(start: DateTime, end: DateTime): DateTime[] {
    const days: DateTime[] = [];
    let current = start.startOf('day');
    const endDay = end.startOf('day');
    
    while (current <= endDay) {
      days.push(current);
      current = current.plus({ days: 1 });
    }
    
    return days;
  }

  /**
   * Converts a calendar event to the user's timezone
   */
  static convertEventToUserTimeZone(event: any, userTimezone: string): any {
    if (!event) return null;
    
    try {
      const safeTimezone = this.ensureIANATimeZone(userTimezone);
      
      // Deep clone the event to avoid modifying the original
      const localEvent = JSON.parse(JSON.stringify(event));
      
      // Convert start and end times
      if (localEvent.start) {
        const startDt = DateTime.fromISO(localEvent.start);
        localEvent.start = startDt.setZone(safeTimezone).toISO();
      }
      
      if (localEvent.end) {
        const endDt = DateTime.fromISO(localEvent.end);
        localEvent.end = endDt.setZone(safeTimezone).toISO();
      }
      
      // Handle legacy event format with start_time and end_time as HH:MM
      if (event.start_time && event.date) {
        // Log the original values for debugging
        console.log(`[TimeZoneService] Converting event from UTC to ${safeTimezone}:`, {
          originalDate: event.date,
          originalStartTime: event.start_time,
          originalEndTime: event.end_time || 'N/A'
        });
        
        // Ensure date is in correct format
        let dateStr = event.date;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          // Try to normalize non-standard date formats
          const jsDate = new Date(dateStr);
          if (!isNaN(jsDate.getTime())) {
            dateStr = jsDate.toISOString().split('T')[0];
            console.log(`[TimeZoneService] Normalized non-standard date: ${event.date} -> ${dateStr}`);
          }
        }
        
        // Assuming start_time is in HH:MM format
        const [startHours, startMinutes] = event.start_time.split(':').map(Number);
        
        // Create a DateTime object in UTC first
        const startDateTime = DateTime.fromISO(`${dateStr}T${event.start_time}:00Z`, { zone: 'utc' });
        
        if (!startDateTime.isValid) {
          console.error(`[TimeZoneService] Invalid start DateTime: ${startDateTime.invalidReason}`);
        }
        
        // Convert to user timezone
        const localStartDateTime = startDateTime.setZone(safeTimezone);
        
        // Update the date based on the localized time (important for timezone boundaries)
        const normalizedDate = localStartDateTime.toFormat(this.DATE_FORMAT);
        localEvent.date = normalizedDate;
        localEvent.start_time = localStartDateTime.toFormat(this.TIME_FORMAT);
        
        console.log(`[TimeZoneService] Converted start time:`, {
          utcDateTime: startDateTime.toISO(),
          localDateTime: localStartDateTime.toISO(),
          normalizedDate,
          localizedStartTime: localEvent.start_time
        });
      }
      
      if (event.end_time && event.date) {
        // Assuming end_time is in HH:MM format
        const [endHours, endMinutes] = event.end_time.split(':').map(Number);
        
        // Create a DateTime object in UTC first
        const endDateTime = DateTime.fromISO(`${event.date}T${event.end_time}:00Z`, { zone: 'utc' });
        
        if (!endDateTime.isValid) {
          console.error(`[TimeZoneService] Invalid end DateTime: ${endDateTime.invalidReason}`);
        }
        
        // Convert to user timezone
        const localEndDateTime = endDateTime.setZone(safeTimezone);
        
        // We already set the date in the start_time block, but set it here too as a fallback
        if (!localEvent.date) {
          localEvent.date = localEndDateTime.toFormat(this.DATE_FORMAT);
        }
        
        localEvent.end_time = localEndDateTime.toFormat(this.TIME_FORMAT);
        
        console.log(`[TimeZoneService] Converted end time:`, {
          utcDateTime: endDateTime.toISO(),
          localDateTime: localEndDateTime.toISO(),
          localizedEndTime: localEvent.end_time
        });
      }
      
      return localEvent;
    } catch (error) {
      console.error('Error converting event to user timezone', error);
      return event;
    }
  }
}

