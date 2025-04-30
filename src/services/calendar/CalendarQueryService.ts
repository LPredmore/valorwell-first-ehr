
/**
 * CalendarQueryService - Responsible for all calendar event read operations
 * Handles fetching events from the database and transforming them into usable formats
 */

import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import { calendarTransformer } from '@/utils/calendarTransformer';
import { DatabaseCalendarEvent } from '@/types/calendarTypes';
import { CalendarErrorHandler } from './CalendarErrorHandler';

export class CalendarQueryService {
  /**
   * Get calendar events for a specific clinician and time range
   */
  static async getEvents(
    clinicianId: string,
    timezone: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      console.log('[CalendarQueryService] Getting events for clinician:', {
        clinicianId,
        timezone: validTimeZone,
        startDate,
        endDate
      });

      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_active', true);

      if (startDate && endDate) {
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();
        query = query.gte('start_time', startISO).lte('end_time', endISO);
      }

      const { data, error } = await query;

      if (error) {
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      const transformedEvents: CalendarEvent[] = data?.map(event =>
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) || [];

      return transformedEvents;
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEvents:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Get all calendar events for a clinician
   */
  static async getAllEvents(
    clinicianId: string,
    timezone: string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      console.log('[CalendarQueryService] Getting all events for clinician:', clinicianId);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_active', true);

      if (error) {
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      const transformedEvents: CalendarEvent[] = data?.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) || [];

      return transformedEvents;
    } catch (error) {
      console.error('[CalendarQueryService] Error in getAllEvents:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Get calendar events within a specific date range
   */
  static async getEventsInRange(
    clinicianId: string,
    startDate: Date | string,
    endDate: Date | string,
    timezone: string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      console.log('[CalendarQueryService] Getting events in range for clinician:', {
        clinicianId,
        startDate,
        endDate,
        timezone: validTimeZone
      });

      const startDateISO = typeof startDate === 'string' ? startDate : startDate.toISOString();
      const endDateISO = typeof endDate === 'string' ? endDate : endDate.toISOString();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .gte('end_time', startDateISO)
        .lte('start_time', endDateISO)
        .eq('is_active', true);

      if (error) {
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      const transformedEvents: CalendarEvent[] = data?.map(event =>
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) || [];

      return transformedEvents;
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEventsInRange:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Get calendar events for a specific date
   */
  static async getEventsForDate(
    clinicianId: string,
    date: Date | string,
    timezone: string
  ): Promise<CalendarEvent[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      console.log('[CalendarQueryService] Getting events for date for clinician:', {
        clinicianId,
        date,
        timezone: validTimeZone
      });

      const dateISO = typeof date === 'string' ? date : date.toISOString();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .gte('end_time', dateISO)
        .lte('start_time', dateISO)
        .eq('is_active', true);

      if (error) {
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      const transformedEvents: CalendarEvent[] = data?.map(event =>
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      ) || [];

      return transformedEvents;
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEventsForDate:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
}
