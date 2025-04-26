
import { CalendarEvent } from '@/types/calendar';
import { DatabaseCalendarEvent, CalendarEventTransform } from '@/types/calendarTypes';
import { TimeZoneService } from './timeZoneService';

export const calendarTransformer: CalendarEventTransform = {
  fromDatabase: (dbEvent: DatabaseCalendarEvent, timezone: string): CalendarEvent => {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    try {
      const startInUserTz = TimeZoneService.fromUTCTimestamp(dbEvent.start_time, validTimeZone);
      const endInUserTz = TimeZoneService.fromUTCTimestamp(dbEvent.end_time, validTimeZone);
      
      return {
        id: dbEvent.id,
        title: dbEvent.title,
        start: startInUserTz.toISO(),
        end: endInUserTz.toISO(),
        allDay: dbEvent.all_day || false,
        extendedProps: {
          eventType: dbEvent.event_type,
          description: dbEvent.description,
          isAvailability: dbEvent.event_type === 'availability',
          isActive: dbEvent.is_active,
          timezone: validTimeZone,
          clinicianId: dbEvent.clinician_id,
          recurrenceId: dbEvent.recurrence_id
        }
      };
    } catch (error) {
      console.error('Error transforming database event:', error, {
        event: dbEvent,
        timezone: validTimeZone
      });
      throw new Error(`Failed to transform calendar event: ${error.message}`);
    }
  },

  toDatabase: (event: CalendarEvent, timezone: string): Omit<DatabaseCalendarEvent, 'id'> => {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    try {
      const startUtc = TimeZoneService.toUTC(
        TimeZoneService.parseWithZone(String(event.start), validTimeZone)
      );
      const endUtc = TimeZoneService.toUTC(
        TimeZoneService.parseWithZone(String(event.end), validTimeZone)
      );
      
      return {
        title: event.title,
        start_time: startUtc.toISO(),
        end_time: endUtc.toISO(),
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
      throw new Error(`Failed to transform event to database format: ${error.message}`);
    }
  }
};
