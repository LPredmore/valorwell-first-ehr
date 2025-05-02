
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timeZoneService';

/**
 * Utility to transform calendar events between database and application formats
 */
export const calendarTransformer = {
  /**
   * Convert a database record to a CalendarEvent
   */
  fromDatabase: (dbEvent: any, timezone: string): CalendarEvent => {
    // Ensure we have a valid timezone
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    // Parse start and end times
    const startTime = DateTime.fromISO(dbEvent.start_time || dbEvent.start, { zone: 'UTC' });
    const endTime = DateTime.fromISO(dbEvent.end_time || dbEvent.end, { zone: 'UTC' });
    
    // Determine event type and color
    const eventType = dbEvent.event_type || dbEvent.type || 'general';
    const backgroundColor = getEventColor(eventType as CalendarEventType);
    const textColor = '#ffffff';
    
    // Build the calendar event
    const event: CalendarEvent = {
      id: dbEvent.id,
      title: dbEvent.title || 'Untitled Event',
      start: startTime.toJSDate(),
      end: endTime.toJSDate(),
      allDay: !!dbEvent.all_day,
      backgroundColor,
      borderColor: backgroundColor,
      textColor,
      extendedProps: {
        eventType: eventType as CalendarEventType,
        clinicianId: dbEvent.clinician_id,
        clientId: dbEvent.client_id,
        sourceTimeZone: dbEvent.timezone || 'UTC',
        status: dbEvent.status,
        description: dbEvent.description,
      }
    };
    
    // Add display properties
    const displayStart = TimeZoneService.formatTime(startTime, 'h:mm a', validTimeZone);
    const displayEnd = TimeZoneService.formatTime(endTime, 'h:mm a', validTimeZone);
    const displayDay = startTime.setZone(validTimeZone).toFormat('cccc');
    const displayDate = startTime.setZone(validTimeZone).toFormat('MMM d, yyyy');
    
    event.extendedProps = {
      ...event.extendedProps,
      displayStart,
      displayEnd,
      displayDay,
      displayDate,
    };
    
    return event;
  },
  
  /**
   * Convert a CalendarEvent to database format
   */
  toDatabase: (event: CalendarEvent, timezone: string): any => {
    // Ensure we have a valid timezone
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    // Convert dates to ISO strings in UTC
    const startTime = typeof event.start === 'string'
      ? event.start
      : TimeZoneService.toUTC(event.start).toISO();
    
    const endTime = typeof event.end === 'string'
      ? event.end
      : TimeZoneService.toUTC(event.end).toISO();
    
    // Build the database record
    return {
      id: event.id,
      title: event.title,
      start_time: startTime,
      end_time: endTime,
      all_day: !!event.allDay,
      clinician_id: event.extendedProps?.clinicianId || event.clinician_id,
      client_id: event.extendedProps?.clientId,
      event_type: event.extendedProps?.eventType || event.type,
      status: event.extendedProps?.status,
      description: event.extendedProps?.description || event.description,
      timezone: event.extendedProps?.sourceTimeZone || validTimeZone,
    };
  }
};

// Helper function to get event color based on type
function getEventColor(eventType: CalendarEventType): string {
  switch (eventType) {
    case 'appointment':
      return '#4f46e5'; // Indigo
    case 'availability':
      return '#10b981'; // Green
    case 'time_off':
      return '#f59e0b'; // Amber
    default:
      return '#6b7280'; // Gray
  }
}

export default calendarTransformer;
