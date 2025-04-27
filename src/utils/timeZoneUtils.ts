
/**
 * This file is provided for backward compatibility with components that import from @/utils/timeZoneUtils
 * It re-exports everything from the new modular timezone service.
 * New code should import from @/utils/timezone directly.
 * 
 * @deprecated Use the new modular TimeZoneService from @/utils/timezone instead
 */
import { TimeZoneService } from './timezone';

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
  formatDate,
  getDisplayNameFromIANA,
  getIANAFromDisplayName,
  getTimezoneOffsetString,
  toUTCTimestamp,
  fromUTCTimestamp
} = TimeZoneService;

// For backward compatibility
export const formatTimeWithTimezone = (time: string, timeZone: string): string => {
  return TimeZoneService.formatTime(time, 'h:mm a', timeZone);
};

export const getTimezoneDisplayName = (timeZone: string): string => {
  return TimeZoneService.formatTimeZoneDisplay(timeZone);
};

export const convertToTimezone = (dateTime: any, targetZone: string): any => {
  return TimeZoneService.convertDateTime(dateTime, dateTime.zone.name, targetZone);
};
