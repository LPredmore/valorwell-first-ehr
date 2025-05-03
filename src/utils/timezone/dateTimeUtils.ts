
import { DateTime, Duration } from 'luxon';
import { TimeZoneService } from './TimeZoneService';

/**
 * Format a date range for display (e.g., "Jan 1 - Jan 5, 2023")
 */
export function formatDateRange(
  startDate: DateTime | Date | string,
  endDate: DateTime | Date | string,
  timezone: string = 'UTC',
  includeYear: boolean = true
): string {
  const validZone = TimeZoneService.ensureIANATimeZone(timezone);
  
  try {
    // Convert to DateTime objects
    const start = startDate instanceof DateTime ? 
      startDate.setZone(validZone) : 
      DateTime.fromJSDate(startDate instanceof Date ? startDate : new Date(startDate), { zone: validZone });
    
    const end = endDate instanceof DateTime ? 
      endDate.setZone(validZone) : 
      DateTime.fromJSDate(endDate instanceof Date ? endDate : new Date(endDate), { zone: validZone });
    
    // Check if dates are in the same year
    const sameYear = start.year === end.year;
    
    // Format based on whether dates are in same month
    if (start.month === end.month && start.year === end.year) {
      return `${start.toFormat('LLL d')}${start.day !== end.day ? ` - ${end.toFormat('d')}` : ''}${includeYear || !sameYear ? `, ${start.year}` : ''}`;
    } else if (start.year === end.year) {
      return `${start.toFormat('LLL d')} - ${end.toFormat('LLL d')}${includeYear ? `, ${start.year}` : ''}`;
    } else {
      return `${start.toFormat('LLL d, yyyy')} - ${end.toFormat('LLL d, yyyy')}`;
    }
  } catch (error) {
    console.error('[dateTimeUtils] Error formatting date range:', error);
    return '';
  }
}

/**
 * Calculate the difference between two dates in the specified units
 */
export function calculateDateDifference(
  startDate: DateTime | Date | string,
  endDate: DateTime | Date | string,
  unit: 'days' | 'hours' | 'minutes' | 'seconds' = 'days'
): number {
  try {
    // Convert to DateTime objects
    const start = startDate instanceof DateTime ? 
      startDate : 
      DateTime.fromJSDate(startDate instanceof Date ? startDate : new Date(startDate));
    
    const end = endDate instanceof DateTime ? 
      endDate : 
      DateTime.fromJSDate(endDate instanceof Date ? endDate : new Date(endDate));
    
    // Calculate the difference
    const diff = end.diff(start, unit);
    return diff.get(unit);
  } catch (error) {
    console.error('[dateTimeUtils] Error calculating date difference:', error);
    return 0;
  }
}

/**
 * Format a duration for display (e.g., "2 hours 30 minutes")
 */
export function formatDuration(
  durationMinutes: number,
  format: 'long' | 'short' | 'compact' = 'long'
): string {
  try {
    // Convert minutes to duration
    const duration = Duration.fromObject({ minutes: durationMinutes });
    
    // Extract hours and minutes
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    // Format based on specified format
    if (format === 'compact') {
      return hours > 0 ? 
        `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` : 
        `${minutes}m`;
    } else if (format === 'short') {
      return hours > 0 ? 
        `${hours} hr${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} min` : ''}` : 
        `${minutes} min`;
    } else {
      return hours > 0 ? 
        `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}` : 
        `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('[dateTimeUtils] Error formatting duration:', error);
    return '';
  }
}

/**
 * Generate time slot options for dropdown menus
 */
export function generateTimeSlotOptions(
  interval: number = 30,
  is24Hour: boolean = false
): { value: string; label: string }[] {
  try {
    const options: { value: string; label: string }[] = [];
    const totalMinutesInDay = 24 * 60;
    
    for (let minutes = 0; minutes < totalMinutesInDay; minutes += interval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      const value = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      
      let label;
      if (is24Hour) {
        label = value;
      } else {
        const h = hours % 12 || 12;
        const period = hours < 12 ? 'AM' : 'PM';
        label = `${h}:${mins.toString().padStart(2, '0')} ${period}`;
      }
      
      options.push({ value, label });
    }
    
    return options;
  } catch (error) {
    console.error('[dateTimeUtils] Error generating time slot options:', error);
    return [];
  }
}

/**
 * Get start of week date
 */
export function getStartOfWeek(
  date: DateTime | Date | string,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0,
  timezone: string = 'UTC'
): DateTime {
  try {
    const validZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    // Convert to DateTime
    let dt: DateTime;
    if (date instanceof DateTime) {
      dt = date.setZone(validZone);
    } else if (date instanceof Date) {
      dt = DateTime.fromJSDate(date, { zone: validZone });
    } else {
      dt = DateTime.fromISO(date, { zone: validZone });
    }
    
    // Calculate the start of week
    const currentDay = dt.weekday % 7; // 0-based day of week, Sunday = 0
    const diff = (currentDay + 7 - weekStartsOn) % 7;
    
    return dt.minus({ days: diff }).startOf('day');
  } catch (error) {
    console.error('[dateTimeUtils] Error getting start of week:', error);
    return DateTime.now();
  }
}

/**
 * Parse a date string with flexible formats
 */
export function parseFlexibleDate(
  dateStr: string,
  timezone: string = 'UTC'
): DateTime | null {
  try {
    const validZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    // Try ISO format
    let dt = DateTime.fromISO(dateStr, { zone: validZone });
    if (dt.isValid) return dt;
    
    // Try SQL format
    dt = DateTime.fromSQL(dateStr, { zone: validZone });
    if (dt.isValid) return dt;
    
    // Try HTTP format
    dt = DateTime.fromHTTP(dateStr, { zone: validZone });
    if (dt.isValid) return dt;
    
    // Try common US format MM/DD/YYYY
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/').map(Number);
      dt = DateTime.fromObject({ month, day, year }, { zone: validZone });
      if (dt.isValid) return dt;
    }
    
    // Try common EU format DD.MM.YYYY
    if (dateStr.includes('.')) {
      const [day, month, year] = dateStr.split('.').map(Number);
      dt = DateTime.fromObject({ day, month, year }, { zone: validZone });
      if (dt.isValid) return dt;
    }
    
    // Try ISO-like format without timezone YYYY-MM-DD
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      dt = DateTime.fromObject({ year, month, day }, { zone: validZone });
      if (dt.isValid) return dt;
    }
    
    return null;
  } catch (error) {
    console.error('[dateTimeUtils] Error parsing flexible date:', error);
    return null;
  }
}
