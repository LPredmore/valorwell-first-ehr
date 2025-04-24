
import { DateTime } from 'luxon';
import { ensureIANATimeZone } from './timeZone';

/**
 * Check if a time is ambiguous due to DST transitions
 */
export const isDSTTransitionTime = (
  date: string | Date, 
  time: string, 
  timeZone: string
): boolean => {
  try {
    const ianaTimeZone = ensureIANATimeZone(timeZone);
    const dateObj = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create base date in the specified timezone
    const baseDate = DateTime.fromObject(
      {
        year: dateObj.year,
        month: dateObj.month,
        day: dateObj.day,
        hour: hours,
        minute: minutes
      },
      { zone: ianaTimeZone }
    );
    
    // Check one hour before and after
    const oneHourBefore = baseDate.minus({ hours: 1 });
    const oneHourAfter = baseDate.plus({ hours: 1 });
    
    // If the offset changes in this window, we're in a DST transition
    return oneHourBefore.offset !== oneHourAfter.offset;
  } catch (error) {
    console.error('Error checking DST transition:', error);
    return false;
  }
};

/**
 * Validates if a string is a valid IANA timezone
 */
export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch (e) {
    return false;
  }
};
