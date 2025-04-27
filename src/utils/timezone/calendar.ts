
import { CalendarEvent } from '@/types/calendar';
import { DateTime } from 'luxon';
import { ensureIANATimeZone, parseWithZone } from './core';
import { formatTime } from './formatting';
import { TimeZoneError } from './TimeZoneError';

/**
 * Convert a calendar event to user's timezone
 */
export function convertEventToUserTimeZone(event: CalendarEvent, userTimeZone: string): CalendarEvent {
  const validTimeZone = ensureIANATimeZone(userTimeZone);
  
  if (!event.start || !event.end) {
    return event;
  }
  
  try {
    let startDt: DateTime;
    let endDt: DateTime;
    
    if (event.start instanceof Date) {
      startDt = DateTime.fromJSDate(event.start).setZone(validTimeZone);
    } else {
      startDt = parseWithZone(String(event.start), validTimeZone);
    }
    
    if (event.end instanceof Date) {
      endDt = DateTime.fromJSDate(event.end).setZone(validTimeZone);
    } else {
      endDt = parseWithZone(String(event.end), validTimeZone);
    }
    
    const extendedProps = {
      ...(event.extendedProps || {}),
      displayStart: startDt.toFormat('h:mm a'),
      displayEnd: endDt.toFormat('h:mm a'),
      displayDay: startDt.toFormat('ccc'),
      displayDate: startDt.toFormat('MMM d')
    };
    
    return {
      ...event,
      start: startDt.toISO() || '',
      end: endDt.toISO() || '',
      title: event.title || '',
      extendedProps
    };
  } catch (error) {
    console.error('[TimeZoneService] Error converting event to user timezone:', error);
    return event;
  }
}
