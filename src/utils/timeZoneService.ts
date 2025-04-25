
import { DateTime } from 'luxon';
import { ensureIANATimeZone as ensureIANATimeZoneUtil } from './timeZoneUtils';

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
    try {
      if (!timezone) return '';
      
      // If it's a display name already, just return it without the parentheses part
      if (timezone.includes('(') && timezone.includes(')')) {
        return timezone.split('(')[0].trim();
      }
      
      // If it's an IANA identifier, extract the location part (after the /)
      if (timezone.includes('/')) {
        const location = timezone.split('/').pop() || timezone;
        return location.replace(/_/g, ' ');
      }
      
      return timezone;
    } catch (error) {
      console.error('[TimeZoneService] Error formatting time zone display:', error, timezone);
      return timezone || '';
    }
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
}
