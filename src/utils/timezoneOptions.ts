
import { TimeZoneService } from './timeZoneService';

// Export both named exports for backward compatibility
export const TIMEZONE_OPTIONS = TimeZoneService.TIMEZONE_OPTIONS;
export const timezoneOptions = TimeZoneService.TIMEZONE_OPTIONS;

export const DEFAULT_TIMEZONE = 'America/Chicago';

export const getTimezoneOption = (timeZone: string) => {
  const tz = TimeZoneService.ensureIANATimeZone(timeZone);
  return {
    value: tz,
    label: TimeZoneService.formatTimeZoneDisplay(tz)
  };
};
