
/**
 * CalendarQueryService - Responsible for all calendar event query operations
 * Handles fetching events with various filters and transformations
 */

import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { calendarTransformer } from '@/utils/calendarTransformer';
import { DatabaseCalendarEvent } from '@/types/calendarTypes';
import { CalendarErrorHandler } from './CalendarErrorHandler';

export class CalendarQueryService {
  /**
   * Main entry point to get events based on provided parameters
   */
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

  /**
   * Fetch all events for a clinician
   */
  static async getAllEvents(clinicianId: string, timezone: string): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      console.log('[CalendarQueryService] Fetching all events for clinician:', clinicianId);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[CalendarQueryService] Error fetching all events:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      return data ? data.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) : [];
      
    } catch (error) {
      console.error('[CalendarQueryService] Error in getAllEvents:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Fetch events within a specific date range
   */
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

      console.log('[CalendarQueryService] Fetching events in range:', {
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
        console.error('[CalendarQueryService] Error fetching events in range:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      return data ? data.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) : [];
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEventsInRange:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Fetch events for a specific date
   */
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

      console.log('[CalendarQueryService] Fetching events for date:', {
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
        console.error('[CalendarQueryService] Error fetching events for date:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      return data ? data.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) : [];
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEventsForDate:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
}
