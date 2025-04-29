/**
 * CalendarQueryService - Responsible for all calendar event query operations
 * Handles fetching events with various filters and transformations
 * Optimized with caching for improved performance
 */

import { supabase } from '@/integrations/supabase/client';
import { cachedSupabase } from '@/integrations/supabase/cacheClient';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import { calendarTransformer } from '@/utils/calendarTransformer';
import { DatabaseCalendarEvent } from '@/types/calendarTypes';
import { CalendarErrorHandler } from './CalendarErrorHandler';
import { ensureClinicianID } from '@/utils/validation/clinicianUtils';
import { RecurrenceService } from '../RecurrenceService';

// Cache TTL configuration (in milliseconds)
const CACHE_CONFIG = {
  SHORT: 2 * 60 * 1000,  // 2 minutes for frequently changing data
  MEDIUM: 10 * 60 * 1000, // 10 minutes for moderately changing data
  LONG: 30 * 60 * 1000   // 30 minutes for rarely changing data
};

export class CalendarQueryService {
  /**
   * Main entry point to get events based on provided parameters
   * Uses caching for improved performance
   */
  static async getEvents(
    clinicianId: string,
    timezone: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    // Validate clinician ID
    const validClinicianId = ensureClinicianID(clinicianId);
    
    if (startDate && endDate) {
      return this.getEventsInRange(validClinicianId, startDate, endDate, timezone);
    } else if (startDate) {
      return this.getEventsForDate(validClinicianId, startDate, timezone);
    } else {
      return this.getAllEvents(validClinicianId, timezone);
    }
  }

  /**
   * Fetch all events for a clinician with caching
   */
  static async getAllEvents(clinicianId: string, timezone: string): Promise<CalendarEvent[]> {
    try {
      // Validate clinician ID
      const validClinicianId = ensureClinicianID(clinicianId);
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      console.log('[CalendarQueryService] Fetching all events for clinician:', validClinicianId);
      
      // Use cached query with medium TTL since all events don't change very frequently
      const { data, error, fromCache } = await cachedSupabase.query<DatabaseCalendarEvent[]>(
        'calendar_events',
        (client) => client
          .from('calendar_events')
          .select('*')
          .eq('clinician_id', validClinicianId)
          .order('start_time', { ascending: true }),
        { ttl: CACHE_CONFIG.MEDIUM }
      );

      if (error) {
        console.error('[CalendarQueryService] Error fetching all events:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      console.log(`[CalendarQueryService] Retrieved ${data?.length || 0} events (from cache: ${fromCache})`);
      
      // Process and expand recurring events
      const processedEvents = await this.processRecurringEvents(data || [], validTimeZone);
      
      return processedEvents.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      );
      
    } catch (error) {
      console.error('[CalendarQueryService] Error in getAllEvents:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Fetch events within a specific date range with caching
   * Uses shorter TTL for date-specific queries as they're more likely to change
   */
  static async getEventsInRange(
    clinicianId: string,
    startDate: Date | string,
    endDate: Date | string,
    timezone: string
  ): Promise<CalendarEvent[]> {
    try {
      // Validate clinician ID
      const validClinicianId = ensureClinicianID(clinicianId);
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Convert dates to UTC for database query
      const startDt = typeof startDate === 'string' ? 
        TimeZoneService.parseWithZone(startDate, validTimeZone) :
        TimeZoneService.createDateTime(startDate.toISOString().split('T')[0], '00:00:00', validTimeZone);
        
      const endDt = typeof endDate === 'string' ?
        TimeZoneService.parseWithZone(endDate, validTimeZone) :
        TimeZoneService.createDateTime(endDate.toISOString().split('T')[0], '23:59:59', validTimeZone);

      const startUtc = startDt.toUTC().toISO();
      const endUtc = endDt.toUTC().toISO();

      console.log('[CalendarQueryService] Fetching events in range:', {
        clinicianId: validClinicianId,
        start: startUtc,
        end: endUtc
      });

      // Use cached query with short TTL for date range queries
      const { data, error, fromCache } = await cachedSupabase.query<DatabaseCalendarEvent[]>(
        'calendar_events',
        (client) => client
          .from('calendar_events')
          .select('*')
          .eq('clinician_id', validClinicianId)
          .or(`start_time.gte.${startUtc},recurrence_id.is.not.null`)
          .lte('end_time', endUtc)
          .order('start_time', { ascending: true }),
        { ttl: CACHE_CONFIG.SHORT }
      );

      if (error) {
        console.error('[CalendarQueryService] Error fetching events in range:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      console.log(`[CalendarQueryService] Retrieved ${data?.length || 0} events in range (from cache: ${fromCache})`);

      // Process and expand recurring events
      const processedEvents = await this.processRecurringEvents(data || [], validTimeZone, startDt.toJSDate(), endDt.toJSDate());
      
      return processedEvents.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      );
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEventsInRange:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Fetch events for a specific date with caching
   * Uses shorter TTL for date-specific queries
   */
  static async getEventsForDate(
    clinicianId: string,
    date: Date | string,
    timezone: string
  ): Promise<CalendarEvent[]> {
    try {
      // Validate clinician ID
      const validClinicianId = ensureClinicianID(clinicianId);
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const dt = typeof date === 'string' ?
        TimeZoneService.parseWithZone(date, validTimeZone) :
        TimeZoneService.createDateTime(date.toISOString().split('T')[0], '00:00:00', validTimeZone);

      const startOfDay = dt.startOf('day').toUTC().toISO();
      const endOfDay = dt.endOf('day').toUTC().toISO();

      console.log('[CalendarQueryService] Fetching events for date:', {
        clinicianId: validClinicianId,
        date: dt.toISO(),
        startOfDay,
        endOfDay
      });

      // Use cached query with short TTL for single day queries
      const { data, error, fromCache } = await cachedSupabase.query<DatabaseCalendarEvent[]>(
        'calendar_events',
        (client) => client
          .from('calendar_events')
          .select('*')
          .eq('clinician_id', validClinicianId)
          .or(`start_time.gte.${startOfDay},recurrence_id.is.not.null`)
          .lte('end_time', endOfDay)
          .order('start_time', { ascending: true }),
        { ttl: CACHE_CONFIG.SHORT }
      );

      if (error) {
        console.error('[CalendarQueryService] Error fetching events for date:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      console.log(`[CalendarQueryService] Retrieved ${data?.length || 0} events for date (from cache: ${fromCache})`);

      // Process and expand recurring events
      const processedEvents = await this.processRecurringEvents(data || [], validTimeZone, dt.toJSDate(), dt.endOf('day').toJSDate());
      
      return processedEvents.map(event => 
        calendarTransformer.fromDatabase(event as DatabaseCalendarEvent, validTimeZone)
      );
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEventsForDate:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Batch fetch events for multiple dates
   * Reduces number of database queries by fetching a date range and filtering in memory
   */
  static async getEventsForMultipleDates(
    clinicianId: string,
    dates: (Date | string)[],
    timezone: string
  ): Promise<Record<string, CalendarEvent[]>> {
    try {
      if (!dates.length) {
        return {};
      }

      // Validate clinician ID
      const validClinicianId = ensureClinicianID(clinicianId);
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Convert all dates to DateTime objects
      const dateTimes = dates.map(date => 
        typeof date === 'string' ?
          TimeZoneService.parseWithZone(date, validTimeZone) :
          TimeZoneService.createDateTime(date.toISOString().split('T')[0], '00:00:00', validTimeZone)
      );
      
      // Find min and max dates to create a single query range
      const sortedDates = [...dateTimes].sort((a, b) => a.toMillis() - b.toMillis());
      const minDate = sortedDates[0];
      const maxDate = sortedDates[sortedDates.length - 1];
      
      // Get start of first day and end of last day
      const rangeStart = minDate.startOf('day').toUTC().toISO();
      const rangeEnd = maxDate.endOf('day').toUTC().toISO();
      
      console.log('[CalendarQueryService] Batch fetching events for multiple dates:', {
        clinicianId: validClinicianId,
        dateCount: dates.length,
        rangeStart,
        rangeEnd
      });
      
      // Fetch all events in the date range with a single query
      const { data, error } = await cachedSupabase.query<DatabaseCalendarEvent[]>(
        'calendar_events',
        (client) => client
          .from('calendar_events')
          .select('*')
          .eq('clinician_id', validClinicianId)
          .or(`start_time.gte.${rangeStart},recurrence_id.is.not.null`)
          .lte('end_time', rangeEnd)
          .order('start_time', { ascending: true }),
        { ttl: CACHE_CONFIG.SHORT }
      );
      
      if (error) {
        console.error('[CalendarQueryService] Error batch fetching events:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      // Process and expand recurring events
      const processedEvents = await this.processRecurringEvents(
        data || [], 
        validTimeZone, 
        minDate.toJSDate(), 
        maxDate.endOf('day').toJSDate()
      );
      
      // Group events by date
      const eventsByDate: Record<string, CalendarEvent[]> = {};
      
      // Initialize empty arrays for each requested date
      dates.forEach(date => {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        eventsByDate[dateStr] = [];
      });
      
      // Process and distribute events to their respective dates
      processedEvents.forEach(event => {
        const eventStart = TimeZoneService.parseWithZone(event.start_time, validTimeZone);
        const eventDate = eventStart.toFormat('yyyy-MM-dd');
        
        if (eventsByDate[eventDate]) {
          const calendarEvent = calendarTransformer.fromDatabase(event, validTimeZone);
          eventsByDate[eventDate].push(calendarEvent);
        }
      });
      
      return eventsByDate;
    } catch (error) {
      console.error('[CalendarQueryService] Error in getEventsForMultipleDates:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Process and expand recurring events
   * @param events The events to process
   * @param timezone The timezone to use
   * @param startDate Optional start date for expansion
   * @param endDate Optional end date for expansion
   * @returns The processed events, including expanded recurring events
   */
  private static async processRecurringEvents(
    events: DatabaseCalendarEvent[],
    timezone: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DatabaseCalendarEvent[]> {
    try {
      if (!events.length) {
        return [];
      }
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const result: DatabaseCalendarEvent[] = [];
      
      // Group events by whether they are recurring or not
      const recurringEvents = events.filter(event => event.recurrence_id);
      const nonRecurringEvents = events.filter(event => !event.recurrence_id);
      
      // Add non-recurring events directly
      result.push(...nonRecurringEvents);
      
      // Process recurring events
      for (const event of recurringEvents) {
        if (startDate && endDate) {
          // Expand recurring events within the date range
          const expandedEvents = await RecurrenceService.expandRecurringEvent(
            event,
            startDate,
            endDate,
            validTimeZone
          );
          
          result.push(...expandedEvents);
        } else {
          // If no date range is provided, just add the base event
          result.push(event);
        }
      }
      
      // Sort by start time
      return result.sort((a, b) => {
        const aStart = new Date(a.start_time).getTime();
        const bStart = new Date(b.start_time).getTime();
        return aStart - bStart;
      });
    } catch (error) {
      console.error('[CalendarQueryService] Error processing recurring events:', error);
      return events; // Return original events if processing fails
    }
  }

  /**
   * Invalidate calendar events cache for a specific clinician
   * Call this after mutations to ensure fresh data
   */
  static invalidateClinicianCache(clinicianId: string): void {
    // Generate a partial key that would match all queries for this clinician
    const cacheKey = `calendar_events:{"from":"calendar_events","eq":{"clinician_id":"${clinicianId}"}`;
    
    // Invalidate all cache entries that match this key pattern
    cachedSupabase.invalidateTable('calendar_events');
    
    // Also invalidate recurrence cache
    RecurrenceService.invalidateCache(clinicianId);
    
    console.log(`[CalendarQueryService] Invalidated cache for clinician: ${clinicianId}`);
  }
}
