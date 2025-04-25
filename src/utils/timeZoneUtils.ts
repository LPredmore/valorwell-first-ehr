
/**
 * Map of common timezone display names to IANA format
 */
const TIME_ZONE_MAP: Record<string, string> = {
  'Eastern Time (ET)': 'America/New_York',
  'Central Time (CT)': 'America/Chicago',
  'Mountain Time (MT)': 'America/Denver',
  'Pacific Time (PT)': 'America/Los_Angeles',
  'Alaska Time (AKT)': 'America/Anchorage',
  'Hawaii-Aleutian Time (HST)': 'Pacific/Honolulu',
  'Atlantic Time (AST)': 'America/Puerto_Rico'
};

/**
 * Ensure timezone is in IANA format
 */
export const ensureIANATimeZone = (timeZone: string): string => {
  if (timeZone && timeZone.includes('/')) {
    return timeZone;
  }
  
  if (timeZone && TIME_ZONE_MAP[timeZone]) {
    return TIME_ZONE_MAP[timeZone];
  }
  
  try {
    console.log(`Unable to map timezone "${timeZone}" to IANA format, using system default`);
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting system timezone, using America/Chicago as fallback:', error);
    return 'America/Chicago';
  }
};

/**
 * Format a date to display in a specific format with the timezone
 */
export const formatDateWithTimeZone = (date: Date, format: string, timeZone: string): string => {
  // Implementation depends on your date formatting library
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ensureIANATimeZone(timeZone),
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  }).format(date);
};

/**
 * Format time only (HH:MM) with AM/PM
 */
export const formatDateToTime12Hour = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};
