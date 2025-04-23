
import { format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Ensure we have a valid IANA timezone
export const ensureIANATimeZone = (timeZone: string): string => {
  const validTimeZones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'America/Puerto_Rico',
    'America/Halifax'
  ];
  
  // Map common display name to IANA
  const timeZoneMap: Record<string, string> = {
    'Eastern Standard Time (EST)': 'America/New_York',
    'Central Standard Time (CST)': 'America/Chicago',
    'Mountain Standard Time (MST)': 'America/Denver',
    'Pacific Standard Time (PST)': 'America/Los_Angeles',
    'Alaska Standard Time (AKST)': 'America/Anchorage',
    'Hawaii-Aleutian Standard Time (HST)': 'Pacific/Honolulu',
    'Atlantic Standard Time (AST)': 'America/Halifax',
    'EST': 'America/New_York',
    'CST': 'America/Chicago',
    'MST': 'America/Denver',
    'PST': 'America/Los_Angeles',
  };

  if (timeZone in timeZoneMap) {
    return timeZoneMap[timeZone];
  }

  if (validTimeZones.includes(timeZone)) {
    return timeZone;
  }

  console.warn(`Unknown timezone: ${timeZone}, using America/Chicago as fallback`);
  return 'America/Chicago';
};

// Format a time in a user's timezone
export const formatTimeInUserTimeZone = (
  time: string, 
  userTimeZone: string,
  formatString: string = 'h:mm a'
): string => {
  try {
    // Handle time-only strings by adding a date
    let timeString = time;
    if (!time.includes('T')) {
      // Create a UTC date at today's date with the given time
      const today = new Date().toISOString().split('T')[0];
      timeString = `${today}T${time}`;
    }
    
    const ianaTz = ensureIANATimeZone(userTimeZone);
    const utcDate = zonedTimeToUtc(new Date(timeString), 'UTC');
    const userTzDate = utcToZonedTime(utcDate, ianaTz);
    return format(userTzDate, formatString);
  } catch (error) {
    console.error('Error formatting time in user timezone:', error);
    return formatTime12Hour(time) || time;
  }
};

// Simple 12-hour time formatter fallback
export const formatTime12Hour = (time: string): string | null => {
  if (!time) return null;
  
  try {
    // Parse HH:MM:SS format
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formatting 12-hour time:', error);
    return null;
  }
};

// Format timezone for display
export const formatTimeZoneDisplay = (timeZone: string): string => {
  const ianaTz = ensureIANATimeZone(timeZone);
  
  // Create mapping of common timezones to display names
  const displayNames: Record<string, string> = {
    'America/New_York': 'Eastern Time',
    'America/Chicago': 'Central Time',
    'America/Denver': 'Mountain Time',
    'America/Phoenix': 'Arizona Time',
    'America/Los_Angeles': 'Pacific Time',
    'America/Anchorage': 'Alaska Time',
    'Pacific/Honolulu': 'Hawaii Time',
    'America/Puerto_Rico': 'Atlantic Time',
    'America/Halifax': 'Atlantic Time'
  };
  
  return displayNames[ianaTz] || ianaTz;
};
