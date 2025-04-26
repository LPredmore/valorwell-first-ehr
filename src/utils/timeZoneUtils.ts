
/**
 * This file is provided for backward compatibility with components that import from @/utils/timeZoneUtils
 * It re-exports everything from TimeZoneService.
 * New code should import from @/utils/timeZoneService directly.
 */
import { TimeZoneService } from './timeZoneService';

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
  getTimezoneOffsetString
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
