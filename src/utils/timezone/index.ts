
// Re-export everything from the timeZoneService
import { TimeZoneService } from '../timeZoneService';

// Export all methods and properties
export const {
  ensureIANATimeZone,
  getLocalTimeZone,
  getUserTimeZone,
  formatTimeZoneDisplay,
  createDateTime,
  convertDateTime,
  formatDateTime,
  formatTime,
  parseWithZone,
  toUTC,
  fromUTC,
  getCurrentDateTime,
  isSameDay,
  addDuration,
  getWeekdayName,
  getMonthName,
  convertTimeZone,
  convertEventToUserTimeZone,
  getCommonTimezones,
  toUTCTimestamp,
  fromUTCTimestamp,
  getTimezoneOffsetString,
  formatDate
} = TimeZoneService;

// Export TimeZoneService as the default
export { TimeZoneService } from '../timeZoneService';

// Export TimeZoneService as the default for backward compatibility
export { default } from '../timeZoneService';
