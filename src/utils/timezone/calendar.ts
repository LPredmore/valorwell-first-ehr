
import { CalendarEvent } from '@/types/calendar';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timeZoneService';

/**
 * Convert a calendar event to user's timezone
 * @deprecated Use TimeZoneService.convertEventToUserTimeZone instead
 */
export function convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
  return TimeZoneService.convertEventToUserTimeZone(event, userTimeZone);
}

/**
 * Get formatted time display for calendar events
 */
export function getEventTimeDisplay(event: CalendarEvent): string {
  if (!event.start || !event.end) {
    return '';
  }

  if (event.allDay) {
    return 'All day';
  }

  const startDt = typeof event.start === 'string' 
    ? DateTime.fromISO(event.start) 
    : DateTime.fromJSDate(event.start);

  const endDt = typeof event.end === 'string' 
    ? DateTime.fromISO(event.end) 
    : DateTime.fromJSDate(event.end);

  const timezone = event.extendedProps?.timezone || 'UTC';
  
  return `${startDt.setZone(timezone).toFormat('h:mm a')} - ${endDt.setZone(timezone).toFormat('h:mm a')}`;
}
