
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

/**
 * Format calendar event times to user's timezone
 * @param event Calendar event to format
 * @param userTimeZone User's timezone
 * @returns Calendar event with times in user timezone
 */
export const formatEventTimeToUserTimeZone = (event: CalendarEvent, userTimeZone: string): CalendarEvent => {
  if (!event.start || !event.end) return event;

  // Use TimeZoneService for consistent timezone handling
  return TimeZoneService.convertEventToUserTimeZone(event, userTimeZone);
};

/**
 * Convert time from one timezone to another
 * @param time Time string in ISO format
 * @param fromTimeZone Source timezone
 * @param toTimeZone Target timezone
 * @returns Time string in target timezone
 */
export const convertTimeToUserTimeZone = (time: string, fromTimeZone: string, toTimeZone: string): string => {
  // Fix the type error by using parseWithZone to create a DateTime object first
  const dateTime = TimeZoneService.parseWithZone(time, fromTimeZone);
  const convertedTime = TimeZoneService.convertDateTime(dateTime, fromTimeZone, toTimeZone);
  return convertedTime.toFormat('HH:mm:ss');
};

/**
 * Check if a timezone string is valid
 * @param timeZone Timezone string to validate
 * @returns True if valid timezone
 */
export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    const validZone = TimeZoneService.ensureIANATimeZone(timeZone);
    return validZone !== 'UTC' || timeZone === 'UTC';
  } catch (e) {
    return false;
  }
};
