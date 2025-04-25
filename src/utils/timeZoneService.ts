
import { DateTime } from 'luxon';
import { 
  ensureIANATimeZone as ensureIANATimeZoneUtil, 
  formatTimeZoneDisplay as formatTimeZoneDisplayUtil 
} from './timeZoneUtils';
import { 
  formatDateTime, 
  toISOWithZone,
  parseWithZone
} from './dateFormatUtils';

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
   * Format a datetime with consistent timezone handling
   */
  static formatDateTime(
    dateTime: DateTime, 
    format: string = 'yyyy-MM-dd HH:mm:ss',
    timeZone?: string
  ): string {
    if (!dateTime.isValid) {
      console.error('Invalid DateTime object:', dateTime.invalidReason);
      return 'Invalid date';
    }
    
    if (timeZone) {
      const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      return dateTime.setZone(safeTimeZone).toFormat(format);
    }
    
    return dateTime.toFormat(format);
  }
  
  /**
   * Create a DateTime object with consistent timezone handling
   */
  static createDateTime(
    date: string | Date,
    time: string,
    timeZone: string
  ): DateTime {
    const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const [hours, minutes] = time.split(':').map(Number);
    
    const dt = DateTime.fromObject(
      {
        year: parseInt(dateStr.split('-')[0]),
        month: parseInt(dateStr.split('-')[1]),
        day: parseInt(dateStr.split('-')[2]),
        hour: hours,
        minute: minutes,
      },
      { zone: safeTimeZone }
    );
    
    if (!dt.isValid) {
      console.error('Failed to create valid DateTime:', { date, time, timeZone, error: dt.invalidReason });
      throw new Error(`Invalid date/time combination: ${dt.invalidReason}`);
    }
    
    return dt;
  }
  
  /**
   * Convert UTC time to local time
   */
  static fromUTC(utcDateTime: string | Date, timeZone: string): DateTime {
    const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    
    const dt = typeof utcDateTime === 'string'
      ? DateTime.fromISO(utcDateTime, { zone: 'UTC' })
      : DateTime.fromJSDate(utcDateTime, { zone: 'UTC' });
      
    if (!dt.isValid) {
      console.error('Invalid UTC datetime:', { utcDateTime, error: dt.invalidReason });
      throw new Error(`Invalid UTC datetime: ${dt.invalidReason}`);
    }
    
    return dt.setZone(safeTimeZone);
  }
  
  /**
   * Convert local time to UTC
   */
  static toUTC(localDateTime: string | Date, fromTimeZone: string): DateTime {
    const safeTimeZone = TimeZoneService.ensureIANATimeZone(fromTimeZone);
    
    const dt = typeof localDateTime === 'string'
      ? DateTime.fromISO(localDateTime, { zone: safeTimeZone })
      : DateTime.fromJSDate(localDateTime, { zone: safeTimeZone });
      
    if (!dt.isValid) {
      console.error('Invalid local datetime:', { localDateTime, fromTimeZone, error: dt.invalidReason });
      throw new Error(`Invalid local datetime: ${dt.invalidReason}`);
    }
    
    return dt.setZone('UTC');
  }
  
  /**
   * Format time only (no date component) with timezone consideration
   */
  static formatTime(
    time: string,
    timeZone: string,
    format: string = 'h:mm a'
  ): string {
    try {
      const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      
      // Handle HH:MM:SS format
      if (time.includes(':')) {
        const [hours, minutes] = time.split(':').map(Number);
        const today = DateTime.now().setZone(safeTimeZone);
        const dt = today.set({ hour: hours, minute: minutes });
        
        if (!dt.isValid) {
          console.error('Invalid time format:', { time, error: dt.invalidReason });
          return time;
        }
        
        return dt.toFormat(format);
      }
      
      return time;
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
    }
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
   * Get display name for a day of the week from a date
   * Consistent with the getWeekdayName function
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
   * Parse an ISO string with timezone awareness
   */
  static parseWithZone(dateString: string, timeZone: string): DateTime {
    const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    return DateTime.fromISO(dateString, { zone: safeTimeZone });
  }
  
  /**
   * Convert a DateTime to ISO string with timezone
   */
  static toISOWithZone(dateTime: DateTime): string {
    return dateTime.toISO();
  }
  
  /**
   * Format a date in a consistent way
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
}
