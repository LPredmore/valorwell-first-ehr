
/**
 * This file is provided for backward compatibility with components that import from @/utils/timeZoneUtils
 * It re-exports everything from the TimeZoneService.
 * New code should import from @/utils/timeZoneService directly.
 * 
 * @deprecated Use TimeZoneService from @/utils/timeZoneService instead
 */
import { TimeZoneService } from './timeZoneService';

// Re-export all methods from TimeZoneService
export const {
  ensureIANATimeZone,
  formatTimeZoneDisplay,
  createDateTime,
  toUTC,
  fromUTC,
  convertDateTime,
  formatDateTime,
  formatTime,
  convertEventToUserTimeZone,
  getUserTimeZone,
  parseWithZone,
  formatDateToTime12Hour,
  getCurrentDateTime,
  isSameDay,
  addDuration,
  getWeekdayName,
  getMonthName,
  convertTimeZone,
  getLocalTimeZone,
  getCommonTimezones,
  toUTCTimestamp,
  fromUTCTimestamp,
  getTimezoneOffsetString,
  formatDate
} = TimeZoneService;

// For backward compatibility
export const formatTimeWithTimezone = (time: string, timeZone: string): string => {
  return TimeZoneService.formatTime(time, 'h:mm a');
};

export const getTimezoneDisplayName = (timeZone: string): string => {
  return TimeZoneService.formatTimeZoneDisplay(timeZone);
};

export const convertToTimezone = (dateTime: any, targetZone: string): any => {
  const sourceZone = dateTime.zoneName || 'UTC';
  return TimeZoneService.convertDateTime(dateTime, sourceZone, targetZone);
};
