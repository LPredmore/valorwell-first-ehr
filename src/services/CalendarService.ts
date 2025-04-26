
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { calendarTransformer } from '@/utils/calendarTransformer';
import { DatabaseCalendarEvent } from '@/types/calendarTypes';

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
      console.log('[CalendarService] Fetching all events for clinician:', clinicianId);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[CalendarService] Error fetching all events:', error);
        throw error;
      }

      return data ? data.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) : [];
      
    } catch (error) {
      console.error('[CalendarService] Error in getAllEvents:', error);
      throw error;
    }
  }

  static async getEventsInRange(
    clinicianId: string, 
    startDate: Date | string, 
    endDate: Date | string, 
    timezone: string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Convert dates to UTC for database query
      const startDt = typeof startDate === 'string' ? 
        TimeZoneService.parseWithZone(startDate, validTimeZone) :
        TimeZoneService.createDateTime(startDate.toISOString().split('T')[0], '00:00:00', validTimeZone);
        
      const endDt = typeof endDate === 'string' ?
        TimeZoneService.parseWithZone(endDate, validTimeZone) :
        TimeZoneService.createDateTime(endDate.toISOString().split('T')[0], '23:59:59', validTimeZone);

      console.log('[CalendarService] Fetching events in range:', {
        clinicianId,
        start: startDt.toUTC().toISO(),
        end: endDt.toUTC().toISO()
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .gte('start_time', startDt.toUTC().toISO())
        .lte('end_time', endDt.toUTC().toISO())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[CalendarService] Error fetching events in range:', error);
        throw error;
      }

      return data ? data.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) : [];
    } catch (error) {
      console.error('[CalendarService] Error in getEventsInRange:', error);
      throw error;
    }
  }

  static async getEventsForDate(
    clinicianId: string, 
    date: Date | string, 
    timezone: string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const dt = typeof date === 'string' ?
        TimeZoneService.parseWithZone(date, validTimeZone) :
        TimeZoneService.createDateTime(date.toISOString().split('T')[0], '00:00:00', validTimeZone);

      const startOfDay = dt.startOf('day').toUTC().toISO();
      const endOfDay = dt.endOf('day').toUTC().toISO();

      console.log('[CalendarService] Fetching events for date:', {
        clinicianId,
        date: dt.toISO(),
        startOfDay,
        endOfDay
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .gte('start_time', startOfDay)
        .lte('end_time', endOfDay)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[CalendarService] Error fetching events for date:', error);
        throw error;
      }

      return data ? data.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) : [];
    } catch (error) {
      console.error('[CalendarService] Error in getEventsForDate:', error);
      throw error;
    }
  }

  static async createEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const dbEvent = calendarTransformer.toDatabase(event, validTimeZone);

      console.log('[CalendarService] Creating event:', {
        event: dbEvent,
        timezone: validTimeZone
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([dbEvent])
        .select()
        .single();

      if (error) {
        console.error('[CalendarService] Error creating event:', error);
        throw error;
      }

      return data ? calendarTransformer.fromDatabase(data as DatabaseCalendarEvent, validTimeZone) : null;
    } catch (error) {
      console.error('[CalendarService] Error in createEvent:', error);
      throw error;
    }
  }

  static async updateEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const dbEvent = calendarTransformer.toDatabase(event, validTimeZone);

      console.log('[CalendarService] Updating event:', {
        id: event.id,
        event: dbEvent,
        timezone: validTimeZone
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .update(dbEvent)
        .eq('id', event.id)
        .select()
        .single();

      if (error) {
        console.error('[CalendarService] Error updating event:', error);
        throw error;
      }

      return data ? calendarTransformer.fromDatabase(data as DatabaseCalendarEvent, validTimeZone) : null;
    } catch (error) {
      console.error('[CalendarService] Error in updateEvent:', error);
      throw error;
    }
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      console.log('[CalendarService] Deleting event:', eventId);
      
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('[CalendarService] Error deleting event:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[CalendarService] Error in deleteEvent:', error);
      return false;
    }
  }
}
