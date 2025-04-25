
import { DateTime } from 'luxon';
import { TimeZoneService } from './timeZoneService';

// Re-export TimeZoneService functions to maintain backward compatibility
export const {
  ensureIANATimeZone,
  formatTimeZoneDisplay,
  formatTime: formatTimeInUserTimeZone,
  toUTCTimestamp,
  fromUTCTimestamp,
  formatTimeForUser: formatUTCTimeForUser,
  convertDateTime: convertDateTimeBetweenTimeZones,
  createISODateTimeString,
  formatWithTimeZone,
  formatDateToTime12Hour,
  toUTC,
  fromUTC
} = TimeZoneService;

/**
 * Get user timezone or fallback to browser timezone
 */
export const getUserTimeZone = (): string => {
  try {
    return TimeZoneService.ensureIANATimeZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  } catch (error) {
    console.error('Error getting user timezone, falling back to UTC:', error);
    return 'UTC';
  }
};

/**
 * @deprecated Use TimeZoneService.formatTime instead
 */
export const formatTime12Hour = (time: string): string => {
  try {
    return TimeZoneService.formatTime(time, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return time;
  }
};
