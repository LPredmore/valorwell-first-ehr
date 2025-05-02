
import { CalendarEvent } from '@/types/calendar';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timeZoneService';

export type DatabaseCalendarEvent = {
  id: string;
  clinician_id: string;
  title: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  event_type: string;
  source_table?: string;
  status?: string;
  is_active?: boolean;
  [key: string]: any;
};

/**
 * CalendarTransformer - Utility for transforming between database and frontend event formats
 */
export const calendarTransformer = {
  /**
   * Convert a database calendar event to a frontend CalendarEvent
   */
  fromDatabase(dbEvent: DatabaseCalendarEvent, timeZone: string): CalendarEvent {
    const sourceTimeZone = dbEvent.time_zone || dbEvent.source_time_zone || 'UTC';
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    
    // Parse dates with the original timezone
    let startTime: DateTime;
    let endTime: DateTime;
    
    try {
      startTime = DateTime.fromISO(dbEvent.start_time, { zone: sourceTimeZone });
      endTime = DateTime.fromISO(dbEvent.end_time, { zone: sourceTimeZone });
      
      // Handle invalid dates
      if (!startTime.isValid || !endTime.isValid) {
        throw new Error(`Invalid date format: ${dbEvent.start_time} or ${dbEvent.end_time}`);
      }
    } catch (error) {
      console.error('[calendarTransformer] Error parsing dates:', error);
      // Fallback to current time
      startTime = DateTime.now().setZone(sourceTimeZone);
      endTime = startTime.plus({ hours: 1 });
    }
    
    // Set color based on event type
    let backgroundColor = '#93C5FD'; // Default blue
    let borderColor = '#3B82F6';
    let textColor = '#000000';
    
    switch (dbEvent.event_type) {
      case 'appointment':
        backgroundColor = dbEvent.status === 'cancelled' ? '#FCA5A5' : '#93C5FD';
        borderColor = dbEvent.status === 'cancelled' ? '#EF4444' : '#3B82F6';
        break;
      case 'availability':
        backgroundColor = '#A7F3D0'; // Green
        borderColor = '#10B981';
        break;
      case 'time_off':
        backgroundColor = '#FDE68A'; // Yellow
        borderColor = '#F59E0B';
        break;
    }
    
    // Create the calendar event
    const event: CalendarEvent = {
      id: dbEvent.id,
      title: dbEvent.title,
      start: startTime.toJSDate(),
      end: endTime.toJSDate(),
      allDay: dbEvent.all_day || false,
      backgroundColor,
      borderColor,
      textColor,
      extendedProps: {
        clinicianId: dbEvent.clinician_id,
        eventType: dbEvent.event_type,
        sourceTable: dbEvent.source_table,
        status: dbEvent.status,
        isActive: dbEvent.is_active !== false,
        isAvailability: dbEvent.event_type === 'availability',
        timezone: sourceTimeZone,
        sourceTimeZone,
        // Include any other fields
        ...Object.keys(dbEvent)
          .filter(key => !['id', 'title', 'start_time', 'end_time', 'all_day', 'event_type'].includes(key))
          .reduce((obj, key) => {
            obj[key] = dbEvent[key];
            return obj;
          }, {} as Record<string, any>)
      }
    };
    
    return event;
  },

  /**
   * Convert a frontend CalendarEvent to a database format
   */
  toDatabase(event: CalendarEvent, timeZone: string): any {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    const sourceTimeZone = event.extendedProps?.sourceTimeZone || event.extendedProps?.timezone || validTimeZone;
    
    // Parse dates with the original timezone
    let startTime: DateTime;
    let endTime: DateTime;
    
    try {
      if (typeof event.start === 'string') {
        startTime = DateTime.fromISO(event.start, { zone: sourceTimeZone });
      } else {
        startTime = DateTime.fromJSDate(event.start, { zone: sourceTimeZone });
      }
      
      if (typeof event.end === 'string') {
        endTime = DateTime.fromISO(event.end, { zone: sourceTimeZone });
      } else {
        endTime = DateTime.fromJSDate(event.end, { zone: sourceTimeZone });
      }
    } catch (error) {
      console.error('[calendarTransformer] Error parsing dates:', error);
      // Fallback to current time
      startTime = DateTime.now().setZone(sourceTimeZone);
      endTime = startTime.plus({ hours: 1 });
    }
    
    // Create the database object
    const dbEvent: any = {
      title: event.title,
      start_time: startTime.toISO(),
      end_time: endTime.toISO(),
      all_day: event.allDay || false,
      clinician_id: event.extendedProps?.clinicianId,
      event_type: event.extendedProps?.eventType,
      time_zone: sourceTimeZone,
      source_time_zone: sourceTimeZone,
    };
    
    // Include ID if present
    if (event.id) {
      dbEvent.id = event.id;
    }
    
    // Include any other extended props that might be needed
    if (event.extendedProps) {
      if (event.extendedProps.description) dbEvent.description = event.extendedProps.description;
      if (event.extendedProps.status) dbEvent.status = event.extendedProps.status;
      if (event.extendedProps.isActive !== undefined) dbEvent.is_active = event.extendedProps.isActive;
      
      // For appointment specific fields
      if (event.extendedProps.clientId) dbEvent.client_id = event.extendedProps.clientId;
      
      // For availability specific fields
      if (event.extendedProps.recurrenceId) dbEvent.recurrence_id = event.extendedProps.recurrenceId;
      if (event.extendedProps.availabilityType) dbEvent.availability_type = event.extendedProps.availabilityType;
    }
    
    return dbEvent;
  }
};
