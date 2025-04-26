
import { CalendarEvent } from '@/types/calendar';
import { DatabaseCalendarEvent, CalendarEventTransform } from '@/types/calendarTypes';
import { TimeZoneService } from './timeZoneService';
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
      
      // Parse dates with timezone
      const startInUserTz = TimeZoneService.fromUTCTimestamp(dbEvent.start_time, validTimeZone);
      const endInUserTz = TimeZoneService.fromUTCTimestamp(dbEvent.end_time, validTimeZone);
      
      // Ensure times are valid
      if (!startInUserTz.isValid || !endInUserTz.isValid) {
        const invalidTime = !startInUserTz.isValid ? 'start_time' : 'end_time';
        const invalidReason = !startInUserTz.isValid ? startInUserTz.invalidReason : endInUserTz.invalidReason;
        
        throw new Error(`Invalid ${invalidTime}: ${invalidReason}`);
      }
      
      // Create the calendar event
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
          displayDate: startInUserTz.toFormat('MMM d')
        }
      };
    } catch (error) {
      console.error('Error transforming database event:', error, {
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
      
      // Parse and convert times to UTC
      let startUtc: DateTime;
      let endUtc: DateTime;
      
      if (typeof event.start === 'string') {
        startUtc = TimeZoneService.toUTC(
          TimeZoneService.parseWithZone(event.start, validTimeZone)
        );
      } else if (event.start instanceof Date) {
        startUtc = TimeZoneService.toUTC(
          DateTime.fromJSDate(event.start).setZone(validTimeZone)
        );
      } else {
        throw new Error('Invalid start time format');
      }
      
      if (typeof event.end === 'string') {
        endUtc = TimeZoneService.toUTC(
          TimeZoneService.parseWithZone(event.end, validTimeZone)
        );
      } else if (event.end instanceof Date) {
        endUtc = TimeZoneService.toUTC(
          DateTime.fromJSDate(event.end).setZone(validTimeZone)
        );
      } else {
        throw new Error('Invalid end time format');
      }
      
      // Ensure times are valid
      if (!startUtc.isValid || !endUtc.isValid) {
        throw new Error('Invalid date conversion: ' + 
          (!startUtc.isValid ? startUtc.invalidReason : endUtc.invalidReason));
      }
      
      // Ensure start is before end
      if (startUtc >= endUtc) {
        throw new Error('Start time must be before end time');
      }
      
      // Create the database event
      return {
        title: event.title,
        start_time: startUtc.toISO() || '',
        end_time: endUtc.toISO() || '',
        description: event.extendedProps?.description,
        event_type: event.extendedProps?.eventType || 'general',
        is_active: event.extendedProps?.isActive ?? true,
        clinician_id: event.extendedProps?.clinicianId || '',
        time_zone: validTimeZone,
        source_time_zone: validTimeZone,
        all_day: event.allDay,
        recurrence_id: event.extendedProps?.recurrenceId
      };
    } catch (error) {
      console.error('Error transforming calendar event to database format:', error, {
        event,
        timezone: validTimeZone
      });
      throw CalendarErrorHandler.createError(
        `Failed to transform event to database format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CALENDAR_CONVERSION_ERROR',
        { event, timezone: validTimeZone }
      );
    }
  }
};
