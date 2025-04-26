import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

export class CalendarService {
  static async getEvents(
    clinicianId: string,
    timezone: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    if (startDate && endDate) {
      return this.getEventsInRange(startDate, endDate, timezone);
    } else if (startDate) {
      return this.getEventsForDate(startDate, timezone);
    } else {
      return this.getAllEvents(clinicianId, timezone);
    }
  }

  static async getAllEvents(clinicianId: string, timezone: string): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .order('start', { ascending: true });

      if (error) {
        console.error('Error fetching all events:', error);
        throw error;
      }

      return data ? data.map(event => ({
        ...event,
        start: TimeZoneService.fromUTCTimestamp(event.start, validTimeZone).toISO(),
        end: TimeZoneService.fromUTCTimestamp(event.end, validTimeZone).toISO()
      })) : [];
    } catch (error) {
      console.error('Error fetching all events:', error);
      throw error;
    }
  }

  static async getEventsInRange(startDate: string | Date, endDate: string | Date, timezone: string): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const startDt = typeof startDate === 'string' ? 
        TimeZoneService.parseWithZone(startDate, validTimeZone) :
        DateTime.fromJSDate(startDate).setZone(validTimeZone);
        
      const endDt = typeof endDate === 'string' ?
        TimeZoneService.parseWithZone(endDate, validTimeZone) :
        DateTime.fromJSDate(endDate).setZone(validTimeZone);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', '49c37c97-66ca-4ca9-954a-9c119ff0500f')
        .gte('start', startDt.toUTC().toISO())
        .lte('end', endDt.toUTC().toISO())
        .order('start', { ascending: true });

      if (error) {
        console.error('Error fetching events in range:', error);
        throw error;
      }

      return data ? data.map(event => ({
        ...event,
        start: TimeZoneService.fromUTCTimestamp(event.start, validTimeZone).toISO(),
        end: TimeZoneService.fromUTCTimestamp(event.end, validTimeZone).toISO()
      })) : [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  static async getEventsForDate(date: string | Date, timezone: string): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const dt = typeof date === 'string' ?
        TimeZoneService.parseWithZone(date, validTimeZone) :
        DateTime.fromJSDate(date).setZone(validTimeZone);

      const startOfDay = dt.startOf('day').toUTC().toISO();
      const endOfDay = dt.endOf('day').toUTC().toISO();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', '49c37c97-66ca-4ca9-954a-9c119ff0500f')
        .gte('start', startOfDay)
        .lte('end', endOfDay)
        .order('start', { ascending: true });

      if (error) {
        console.error('Error fetching events for date:', error);
        throw error;
      }

      return data ? data.map(event => ({
        ...event,
        start: TimeZoneService.fromUTCTimestamp(event.start, validTimeZone).toISO(),
        end: TimeZoneService.fromUTCTimestamp(event.end, validTimeZone).toISO()
      })) : [];
    } catch (error) {
      console.error('Error fetching events for date:', error);
      throw error;
    }
  }

  static async createEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const startDateTime = TimeZoneService.parseWithZone(String(event.start), validTimeZone).toUTC().toISO();
      const endDateTime = TimeZoneService.parseWithZone(String(event.end), validTimeZone).toUTC().toISO();

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([
          {
            clinician_id: event.clinician_id,
            title: event.title,
            start: startDateTime,
            end: endDateTime,
            description: event.description,
            location: event.location,
            type: event.type,
            source_time_zone: validTimeZone
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        throw error;
      }

      return data ? {
        ...data,
        start: TimeZoneService.fromUTCTimestamp(data.start, validTimeZone).toISO(),
        end: TimeZoneService.fromUTCTimestamp(data.end, validTimeZone).toISO()
      } : null;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  static async updateEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const startDateTime = TimeZoneService.parseWithZone(String(event.start), validTimeZone).toUTC().toISO();
      const endDateTime = TimeZoneService.parseWithZone(String(event.end), validTimeZone).toUTC().toISO();

      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          title: event.title,
          start: startDateTime,
          end: endDateTime,
          description: event.description,
          location: event.location,
          type: event.type,
          source_time_zone: validTimeZone
        })
        .eq('id', event.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
        throw error;
      }

      return data ? {
        ...data,
        start: TimeZoneService.fromUTCTimestamp(data.start, validTimeZone).toISO(),
        end: TimeZoneService.fromUTCTimestamp(data.end, validTimeZone).toISO()
      } : null;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting event:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }
}
