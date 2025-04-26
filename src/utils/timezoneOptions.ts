
import { TimeZoneService } from './timeZoneService';

export const TIMEZONE_OPTIONS = TimeZoneService.TIMEZONE_OPTIONS.map(tz => ({
  value: tz,
  label: TimeZoneService.formatTimeZoneDisplay(tz)
}));

export const DEFAULT_TIMEZONE = 'America/Chicago';

export const getTimezoneOption = (timeZone: string) => {
  const tz = TimeZoneService.ensureIANATimeZone(timeZone);
  return {
    value: tz,
    label: TimeZoneService.formatTimeZoneDisplay(tz)
  };
};
