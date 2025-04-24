
/**
 * This file contains timezone-specific utilities that are used across the application
 * but haven't yet been migrated to the standardized date/time utilities.
 * 
 * The goal is to gradually move all date/time utilities to use the standardized utilities
 * in dateFormatUtils.ts, but this file serves as a transition aid.
 */

import { DateTime } from 'luxon';
import { 
  formatTime, 
  formatDateTime, 
  formatInTimezone 
} from './dateFormatUtils';
import { ensureIANATimeZone } from './timeZoneUtils';

/**
 * Format a date and time in a specific timezone with timezone indicator
 * @param date The date string or Date object
 * @param time The time string (HH:MM format)
 * @param timeZone The timezone string
 * @param includeTimeZone Whether to include timezone in output
 * @returns Formatted date and time with timezone indicator
 */
export const formatDateTimeWithTimeZone = (
  date: string | Date,
  time: string,
  timeZone: string,
  includeTimeZone: boolean = true
): string => {
  try {
    const ianaTimeZone = ensureIANATimeZone(timeZone);
    
    // Use standardized formatInTimezone
    const formattedTime = formatTime(`${typeof date === 'string' ? date : date.toISOString().split('T')[0]}T${time}`);
    
    if (!includeTimeZone) {
      return formattedTime;
    }
    
    // Extract timezone abbreviation/name for display
    const timeZoneDisplay = formatTimeZoneDisplay(timeZone);
    return `${formattedTime} (${timeZoneDisplay})`;
  } catch (error) {
    console.error('Error formatting with timezone:', error, { date, time, timeZone });
    return time;
  }
};

/**
 * Generate a formatted time zone display name
 * @param timeZone IANA time zone identifier or display name
 * @returns User-friendly time zone display
 */
export const formatTimeZoneDisplay = (timeZone: string): string => {
  try {
    if (!timeZone) return '';
    
    // If it's a display name already, just return it without the parentheses part
    if (timeZone.includes('(') && timeZone.includes(')')) {
      return timeZone.split('(')[0].trim();
    }
    
    // If it's an IANA identifier, extract the location part (after the /)
    if (timeZone.includes('/')) {
      const location = timeZone.split('/').pop() || timeZone;
      return location.replace(/_/g, ' ');
    }
    
    return timeZone;
  } catch (error) {
    console.error('Error formatting time zone display:', error, timeZone);
    return timeZone || '';
  }
};

/**
 * Get timezone offset string (e.g., GMT+2)
 * @param timeZone IANA timezone identifier
 * @returns Formatted timezone offset string
 */
export const getTimezoneOffsetString = (timeZone: string): string => {
  try {
    const now = DateTime.now().setZone(ensureIANATimeZone(timeZone));
    return now.toFormat('ZZZZ');
  } catch (error) {
    console.error('Error getting timezone offset string:', error);
    return '';
  }
};
