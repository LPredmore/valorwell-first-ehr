
import { TimeZoneService } from './timezone';

// Export both named exports for backward compatibility
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii-Aleutian Time (HST)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' }
];

export const timezoneOptions = TIMEZONE_OPTIONS;

export const DEFAULT_TIMEZONE = 'America/Chicago';

export const getTimezoneOption = (timeZone: string) => {
  const tz = TimeZoneService.ensureIANATimeZone(timeZone);
  return {
    value: tz,
    label: TimeZoneService.formatTimeZoneDisplay(tz)
  };
};
