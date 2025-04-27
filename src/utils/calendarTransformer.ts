
import { CalendarEvent } from '@/types/calendar';
import { DatabaseCalendarEvent, CalendarEventTransform } from '@/types/calendarTypes';
import { TimeZoneService } from './timezone';
import { DateTime } from 'luxon';
import { CalendarErrorHandler } from '@/services/calendar/CalendarErrorHandler';

/**
 * Validates a DatabaseCalendarEvent object to ensure it has the required fields
 * @param event The database event to validate
 * @throws Error if validation fails
 */
const validateDatabaseEvent = (event: DatabaseCalendarEvent): void => {
  if (!event.id) {
    throw new Error('Database event must have an ID');
  }
  
  if (!event.start_time) {
    throw new Error('Database event must have a start time');
  }
  
  if (!event.end_time) {
    throw new Error('Database event must have an end time');
  }
  
  if (!event.title) {
    throw new Error('Database event must have a title');
  }
  
  if (!event.event_type) {
    throw new Error('Database event must have an event type');
  }
  
  if (!event.clinician_id) {
    throw new Error('Database event must have a clinician ID');
  }
};

/**
 * Validates a CalendarEvent object to ensure it has the required fields for database operations
 * @param event The calendar event to validate
 * @throws Error if validation fails
 */
const validateCalendarEvent = (event: CalendarEvent): void => {
  if (!event.title) {
    throw new Error('Calendar event must have a title');
  }
  
  if (!event.start) {
    throw new Error('Calendar event must have a start time');
  }
  
  if (!event.end) {
    throw new Error('Calendar event must have an end time');
  }
  
  if (!event.extendedProps?.eventType) {
    throw new Error('Calendar event must have an event type');
  }
  
  if (!event.extendedProps?.clinicianId) {
    throw new Error('Calendar event must have a clinician ID');
  }
};

export const calendarTransformer: CalendarEventTransform = {
  fromDatabase: (dbEvent: DatabaseCalendarEvent, timezone: string): CalendarEvent => {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    try {
      // Validate the database event
      validateDatabaseEvent(dbEvent);
      
      // Parse dates with timezone - improved error handling
      const startInUserTz = TimeZoneService.fromUTCTimestamp(dbEvent.start_time, validTimeZone);
      if (!startInUserTz.isValid) {
        throw new Error(`Invalid start time: ${startInUserTz.invalidReason}`);
      }
      
      const endInUserTz = TimeZoneService.fromUTCTimestamp(dbEvent.end_time, validTimeZone);
      if (!endInUserTz.isValid) {
        throw new Error(`Invalid end time: ${endInUserTz.invalidReason}`);
      }
      
      // Create the calendar event with improved timezone handling
      return {
        id: dbEvent.id,
        title: dbEvent.title,
        start: startInUserTz.toISO() || '',
        end: endInUserTz.toISO() || '',
        allDay: dbEvent.all_day || false,
        extendedProps: {
          eventType: dbEvent.event_type,
          description: dbEvent.description,
          isAvailability: dbEvent.event_type === 'availability',
          isActive: dbEvent.is_active,
          timezone: validTimeZone,
          clinicianId: dbEvent.clinician_id,
          recurrenceId: dbEvent.recurrence_id,
          displayStart: startInUserTz.toFormat('h:mm a'),
          displayEnd: endInUserTz.toFormat('h:mm a'),
          displayDay: startInUserTz.toFormat('ccc'),
          displayDate: startInUserTz.toFormat('MMM d'),
          originalTimezone: dbEvent.source_time_zone || validTimeZone
        }
      };
    } catch (error) {
      console.error('[CalendarTransformer] Error transforming database event:', error, {
        event: dbEvent,
        timezone: validTimeZone
      });
      throw CalendarErrorHandler.createError(
        `Failed to transform calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CALENDAR_CONVERSION_ERROR',
        { dbEvent, timezone: validTimeZone }
      );
    }
  },

  toDatabase: (event: CalendarEvent, timezone: string): Omit<DatabaseCalendarEvent, 'id'> => {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    try {
      // Validate the calendar event
      validateCalendarEvent(event);
      
      // Improved UTC conversion with proper error handling
      let startUtc: string;
      let endUtc: string;
      
      if (typeof event.start === 'string' && typeof event.end === 'string') {
        startUtc = TimeZoneService.toUTCTimestamp(event.start, validTimeZone);
        endUtc = TimeZoneService.toUTCTimestamp(event.end, validTimeZone);
      } else {
        throw new Error('Event start and end times must be strings');
      }
      
      if (!startUtc || !endUtc) {
        throw new Error('Failed to convert times to UTC');
      }
      
      // Create the database event with improved timezone tracking
      return {
        title: event.title,
        start_time: startUtc,
        end_time: endUtc,
        description: event.extendedProps?.description,
        event_type: event.extendedProps?.eventType || 'general',
        is_active: event.extendedProps?.isActive ?? true,
        clinician_id: event.extendedProps?.clinicianId || '',
        time_zone: validTimeZone,
        source_time_zone: event.extendedProps?.originalTimezone || validTimeZone,
        all_day: event.allDay,
        recurrence_id: event.extendedProps?.recurrenceId
      };
    } catch (error) {
      console.error('[CalendarTransformer] Error transforming to database format:', error, {
        event,
        timezone: validTimeZone
      });
      throw CalendarErrorHandler.createError(
        `Failed to transform to database format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CALENDAR_CONVERSION_ERROR',
        { event, timezone: validTimeZone }
      );
    }
  }
};
