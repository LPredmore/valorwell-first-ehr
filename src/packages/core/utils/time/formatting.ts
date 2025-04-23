import { DateTime } from 'luxon';
import { ensureIANATimeZone } from './timeZone';

export const formatDateTime = (
  dateTime: DateTime,
  formatStr: string = "h:mm a"
): string => {
  return dateTime.toFormat(formatStr);
};

export const formatEventTime = (startDateTime: DateTime, endDateTime: DateTime): string => {
  return `${startDateTime.toFormat('h:mm a')} - ${endDateTime.toFormat('h:mm a')}`;
};

export const getTimezoneDisplayName = (timezone: string): string => {
  const ianaZone = ensureIANATimeZone(timezone);
  
  try {
    const locationName = ianaZone.split("/").pop()?.replace("_", " ") || ianaZone;
    const now = DateTime.now().setZone(ianaZone);
    const offsetStr = now.toFormat("ZZZZ");
    
    return `${locationName} (${offsetStr})`;
  } catch (error) {
    console.error("Error formatting timezone name:", error);
    return ianaZone;
  }
};

export const formatTimeWithTimeZone = (
  time: string,
  timeZone: string,
  includeTimeZone: boolean = true
): string => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const hour = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const timeStr = `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    if (!includeTimeZone) return timeStr;
    
    const timeZoneName = timeZone.split('/').pop()?.replace('_', ' ') || timeZone;
    return `${timeStr} (${timeZoneName})`;
  } catch (error) {
    console.error('Error formatting time with timezone:', error);
    return time;
  }
};
