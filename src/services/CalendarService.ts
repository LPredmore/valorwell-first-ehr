
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
      return this.getEventsInRange(clinicianId, startDate, endDate, timezone);
    } else if (startDate) {
      return this.getEventsForDate(clinicianId, startDate, timezone);
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
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching all events:', error);
        throw error;
      }

      return data ? data.map(event => ({
        ...event,
        start: TimeZoneService.fromUTCTimestamp(event.start_time, validTimeZone).toISO(),
        end: TimeZoneService.fromUTCTimestamp(event.end_time, validTimeZone).toISO()
      })) : [];
    } catch (error) {
      console.error('Error fetching all events:', error);
      throw error;
    }
  }

  static async getEventsInRange(
    clinicianId: string, 
    startDate: string | Date, 
    endDate: string | Date, 
    timezone: string
  ): Promise<CalendarEvent[]> {
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
        .eq('clinician_id', clinicianId)
        .gte('start_time', startDt.toUTC().toISO())
        .lte('end_time', endDt.toUTC().toISO())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events in range:', error);
        throw error;
      }

      return data ? data.map(event => ({
        ...event,
        start: TimeZoneService.fromUTCTimestamp(event.start_time, validTimeZone).toISO(),
        end: TimeZoneService.fromUTCTimestamp(event.end_time, validTimeZone).toISO()
      })) : [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  static async getEventsForDate(
    clinicianId: string, 
    date: string | Date, 
    timezone: string
  ): Promise<CalendarEvent[]> {
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
        .eq('clinician_id', clinicianId)
        .gte('start_time', startOfDay)
        .lte('end_time', endOfDay)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events for date:', error);
        throw error;
      }

      return data ? data.map(event => ({
        ...event,
        start: TimeZoneService.fromUTCTimestamp(event.start_time, validTimeZone).toISO(),
        end: TimeZoneService.fromUTCTimestamp(event.end_time, validTimeZone).toISO()
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
            start_time: startDateTime,
            end_time: endDateTime,
            description: event.description,
            location: event.location,
            type: event.type,
            source_time_zone: validTimeZone,
            time_zone: validTimeZone
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
        start: TimeZoneService.fromUTCTimestamp(data.start_time, validTimeZone).toISO(),
        end: TimeZoneService.fromUTCTimestamp(data.end_time, validTimeZone).toISO()
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
          start_time: startDateTime,
          end_time: endDateTime,
          description: event.description,
          location: event.location,
          type: event.type,
          source_time_zone: validTimeZone,
          time_zone: validTimeZone
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
        start: TimeZoneService.fromUTCTimestamp(data.start_time, validTimeZone).toISO(),
        end: TimeZoneService.fromUTCTimestamp(data.end_time, validTimeZone).toISO()
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
