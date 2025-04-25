import { DateTime } from 'luxon';
import { 
  ensureIANATimeZone as ensureIANATimeZoneUtil, 
  formatTimeZoneDisplay as formatTimeZoneDisplayUtil 
} from './timeZoneUtils';

/**
 * TimeZoneService: A centralized service for handling timezone conversions
 * This eliminates the scattered timezone logic throughout the application
 */
export class TimeZoneService {
  /**
   * Ensure timezone is in IANA format
   * This is a wrapper around the existing utility function
   */
  static ensureIANATimeZone(timeZone: string): string {
    return ensureIANATimeZoneUtil(timeZone);
  }
  
  /**
   * Format a timezone for display
   */
  static formatTimeZoneDisplay(timezone: string): string {
    return formatTimeZoneDisplayUtil(timezone);
  }
  
  /**
   * Convert a date/time from one timezone to another
   */
  static convertDateTime(
    dateTime: string | Date,
    fromTimeZone: string,
    toTimeZone: string
  ): DateTime {
    const safeFromTimeZone = TimeZoneService.ensureIANATimeZone(fromTimeZone);
    const safeToTimeZone = TimeZoneService.ensureIANATimeZone(toTimeZone);
    
    let dt: DateTime;
    
    if (typeof dateTime === 'string') {
      // Handle ISO string format
      dt = DateTime.fromISO(dateTime, { zone: safeFromTimeZone });
    } else {
      // Handle JavaScript Date object
      dt = DateTime.fromJSDate(dateTime, { zone: safeFromTimeZone });
    }
    
    if (!dt.isValid) {
      console.error('Invalid date/time conversion input:', { dateTime, fromTimeZone, toTimeZone, error: dt.invalidReason });
      throw new Error(`Invalid date/time: ${dt.invalidReason}`);
    }
    
    return dt.setZone(safeToTimeZone);
  }
  
  /**
   * Get DateTime for specific day of week
   * Helps with weekly recurring availability based on day name
   */
  static getDateTimeForDayOfWeek(
    dayName: string,
    timeZone: string,
    startFromDate?: DateTime
  ): DateTime {
    const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    const now = startFromDate || DateTime.now().setZone(safeTimeZone);
    
    // Map day name to Luxon weekday number (1-7, Monday is 1)
    const dayNameToWeekday: Record<string, number> = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    };
    
    const targetWeekday = dayNameToWeekday[dayName.toLowerCase()];
    if (!targetWeekday) {
      throw new Error(`Invalid day of week: ${dayName}`);
    }
    
    // Calculate days to add to get to the target weekday
    let daysToAdd = targetWeekday - now.weekday;
    if (daysToAdd <= 0) {
      // If today is the target day or we've passed it this week, go to next week
      daysToAdd += 7;
    }
    
    const targetDate = now
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .plus({ days: daysToAdd });
      
    console.log('Calculated date for day of week:', {
      dayName,
      targetWeekday,
      currentWeekday: now.weekday,
      daysToAdd,
      result: targetDate.toISO()
    });
    
    return targetDate;
  }
  
  /**
   * Convert calendar event to user's timezone
   * Properly handles FullCalendar event objects
   */
  static convertEventToUserTimeZone(event: any, userTimeZone: string): any {
    if (!event || (!event.start && !event.end)) {
      return event;
    }
    
    try {
      const safeTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
      
      // If the event already has the correct timezone, return it unchanged
      if (event._userTimeZone === safeTimeZone) {
        return event;
      }
      
      let startDt = null;
      let endDt = null;
      
      if (event.start) {
        startDt = typeof event.start === 'string'
          ? DateTime.fromISO(event.start)
          : DateTime.fromJSDate(event.start);
          
        if (startDt.isValid) {
          startDt = startDt.setZone(safeTimeZone);
        }
      }
      
      if (event.end) {
        endDt = typeof event.end === 'string'
          ? DateTime.fromISO(event.end)
          : DateTime.fromJSDate(event.end);
          
        if (endDt.isValid) {
          endDt = endDt.setZone(safeTimeZone);
        }
      }
      
      // Create a new event object with converted times
      return {
        ...event,
        start: startDt ? startDt.toJSDate() : null,
        end: endDt ? endDt.toJSDate() : null,
        _userTimeZone: safeTimeZone // Add tracking property
      };
    } catch (error) {
      console.error('Error converting event to user timezone:', error, { event, userTimeZone });
      return event; // Return original on error
    }
  }
  
  /**
   * Get weekday name from a date
   */
  static getWeekdayName(date: string | Date | DateTime): string {
    try {
      let dt: DateTime;
      
      if (date instanceof DateTime) {
        dt = date;
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date);
      } else {
        dt = DateTime.fromISO(date);
      }
      
      if (!dt.isValid) {
        console.error('Invalid date for getWeekdayName:', { date, error: dt.invalidReason });
        return '';
      }
      
      return dt.weekdayLong.toLowerCase();
    } catch (error) {
      console.error('Error in getWeekdayName:', error, { date });
      return '';
    }
  }
  
  /**
   * Format a date
   */
  static formatDate(
    date: string | Date | DateTime,
    format: string = 'yyyy-MM-dd',
    timeZone?: string
  ): string {
    try {
      let dt: DateTime;
      
      if (date instanceof DateTime) {
        dt = date;
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date);
      } else {
        dt = DateTime.fromISO(date);
      }
      
      if (!dt.isValid) {
        console.error('Invalid date for formatDate:', { date, error: dt.invalidReason });
        return 'Invalid date';
      }
      
      if (timeZone) {
        const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
        dt = dt.setZone(safeTimeZone);
      }
      
      return dt.toFormat(format);
    } catch (error) {
      console.error('Error in formatDate:', error, { date, format, timeZone });
      return 'Error formatting date';
    }
  }
  
  /**
   * Format a date and time
   */
  static formatDateTime(
    dateTime: string | Date | DateTime,
    format: string = 'yyyy-MM-dd HH:mm',
    timeZone?: string
  ): string {
    try {
      let dt: DateTime;
      
      if (dateTime instanceof DateTime) {
        dt = dateTime;
      } else if (dateTime instanceof Date) {
        dt = DateTime.fromJSDate(dateTime);
      } else {
        dt = DateTime.fromISO(dateTime);
      }
      
      if (!dt.isValid) {
        console.error('Invalid datetime for formatDateTime:', { dateTime, error: dt.invalidReason });
        return 'Invalid datetime';
      }
      
      if (timeZone) {
        const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
        dt = dt.setZone(safeTimeZone);
      }
      
      return dt.toFormat(format);
    } catch (error) {
      console.error('Error in formatDateTime:', error, { dateTime, format, timeZone });
      return 'Error formatting datetime';
    }
  }
  
  /**
   * Format just the time portion
   */
  static formatTime(
    time: string,
    format: string = 'h:mm a',
    timeZone?: string
  ): string {
    try {
      let dt: DateTime;
      
      if (time.includes('T') || time.includes('Z')) {
        dt = DateTime.fromISO(time);
      } else if (time.includes(':')) {
        const [hours, minutes] = time.split(':').map(Number);
        dt = DateTime.now().set({ hour: hours, minute: minutes });
      } else {
        throw new Error(`Unsupported time format: ${time}`);
      }
      
      if (!dt.isValid) {
        console.error('Invalid time format:', { time, error: dt.invalidReason });
        return time;
      }
      
      if (timeZone) {
        const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
        dt = dt.setZone(safeTimeZone);
      }
      
      return dt.toFormat(format);
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
    }
  }
  
  /**
   * Format in a specific timezone
   */
  static formatInTimezone(
    date: string | Date | DateTime,
    format: string,
    timeZone: string
  ): string {
    return TimeZoneService.formatDateTime(date, format, timeZone);
  }
  
  /**
   * Get the month name
   */
  static getMonthName(date: string | Date | DateTime): string {
    try {
      let dt: DateTime;
      
      if (date instanceof DateTime) {
        dt = date;
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date);
      } else {
        dt = DateTime.fromISO(date);
      }
      
      if (!dt.isValid) {
        console.error('Invalid date for getMonthName:', { date, error: dt.invalidReason });
        return 'Invalid date';
      }
      
      return dt.monthLong;
    } catch (error) {
      console.error('Error in getMonthName:', error, { date });
      return 'Invalid date';
    }
  }
  
  /**
   * Get the current date/time in the specified timezone
   */
  static getCurrentDateTime(timeZone: string): DateTime {
    const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    return DateTime.now().setZone(safeTimeZone);
  }
  
  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: string | Date | DateTime, date2: string | Date | DateTime): boolean {
    try {
      const dt1 = date1 instanceof DateTime ? date1 : 
                  date1 instanceof Date ? DateTime.fromJSDate(date1) : 
                  DateTime.fromISO(date1);
                  
      const dt2 = date2 instanceof DateTime ? date2 : 
                  date2 instanceof Date ? DateTime.fromJSDate(date2) : 
                  DateTime.fromISO(date2);
      
      if (!dt1.isValid || !dt2.isValid) {
        console.error('Invalid date for isSameDay check');
        return false;
      }
      
      return dt1.hasSame(dt2, 'day');
    } catch (error) {
      console.error('Error in isSameDay:', error, { date1, date2 });
      return false;
    }
  }
  
  /**
   * Add a duration to a date
   */
  static addDuration(
    date: string | Date | DateTime,
    amount: number,
    unit: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds',
    timeZone?: string
  ): DateTime {
    try {
      let dt = date instanceof DateTime ? date : 
               date instanceof Date ? DateTime.fromJSDate(date) : 
               DateTime.fromISO(date);
      
      if (!dt.isValid) {
        throw new Error('Invalid date for adding duration');
      }
      
      if (timeZone) {
        const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
        dt = dt.setZone(safeTimeZone);
      }
      
      return dt.plus({ [unit]: amount });
    } catch (error) {
      console.error('Error adding duration to date:', error);
      throw error;
    }
  }
  
  /**
   * Convert Date to ISO format with timezone
   */
  static toISOWithZone(
    date: Date | string | DateTime,
    timezone?: string
  ): string {
    try {
      let dt: DateTime;
      
      if (date instanceof DateTime) {
        dt = date;
      } else if (date instanceof Date) {
        dt = DateTime.fromJSDate(date);
      } else {
        dt = DateTime.fromISO(date);
      }
      
      if (timezone) {
        const safeTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
        dt = dt.setZone(safeTimeZone);
      }
      
      return dt.toISO();
    } catch (error) {
      console.error('Error converting to ISO with zone:', error);
      throw error;
    }
  }
  
  /**
   * Parse a date string to a DateTime object with timezone
   */
  static parseWithZone(
    dateString: string,
    timezone: string
  ): DateTime {
    const safeTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    const dt = DateTime.fromISO(dateString, { zone: safeTimeZone });
    
    if (!dt.isValid) {
      console.error('Invalid date string:', { dateString, error: dt.invalidReason });
      throw new Error(`Invalid date string: ${dateString}`);
    }
    
    return dt;
  }
}
