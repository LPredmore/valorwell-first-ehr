
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { CalendarErrorHandler } from '@/services/calendar/CalendarErrorHandler';
import { TimeZoneService } from '@/services/calendar/TimeZoneService';

interface UseFetchCalendarEventsProps {
  clinicianId: string | null;
  userTimeZone: string;
  userId?: string | null;
  isUserLoading?: boolean;
  startDate?: Date;
  endDate?: Date;
  authRetryDelay?: number;
  maxAuthRetries?: number;
}

/**
 * Custom hook for fetching calendar events
 */
export function useFetchCalendarEvents({
  clinicianId,
  userTimeZone,
  userId,
  isUserLoading = false,
  startDate,
  endDate,
  authRetryDelay = 1000,
  maxAuthRetries = 3
}: UseFetchCalendarEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [authRetries, setAuthRetries] = useState<number>(0);
  
  /**
   * Fetch calendar events from the database
   */
  const fetchEvents = useCallback(async (forceRefresh = false) => {
    // Don't fetch if no clinician ID
    if (!clinicianId) {
      console.log('[useFetchCalendarEvents] No clinician ID provided, skipping fetch');
      return;
    }
    
    // Don't fetch if authentication is still loading
    if (isUserLoading) {
      console.log('[useFetchCalendarEvents] Authentication still loading, delaying fetch');
      
      // Only retry if we haven't exceeded the max retries
      if (authRetries < maxAuthRetries) {
        setTimeout(() => {
          setAuthRetries(prev => prev + 1);
          fetchEvents(forceRefresh);
        }, authRetryDelay);
      }
      
      return;
    }
    
    // Reset auth retries
    setAuthRetries(0);
    
    // Don't fetch if no user ID (not authenticated)
    if (!userId) {
      console.error('[useFetchCalendarEvents] Not authenticated, cannot fetch events');
      setError(new Error('Authentication required'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useFetchCalendarEvents] Fetching events for clinician:', clinicianId);
      
      // Prepare date range filter
      const startDateIso = startDate ? new Date(startDate).toISOString() : undefined;
      const endDateIso = endDate ? new Date(endDate).toISOString() : undefined;
      
      // Use the new unified_calendar_view_new view
      let query = supabase
        .from('unified_calendar_view_new')
        .select('*')
        .eq('clinician_id', clinicianId);
        
      // Add date range filter if provided
      if (startDateIso) {
        query = query.gte('start_time', startDateIso);
      }
      
      if (endDateIso) {
        query = query.lte('end_time', endDateIso);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[useFetchCalendarEvents] Error fetching events:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      if (!data) {
        console.log('[useFetchCalendarEvents] No events found');
        setEvents([]);
        setIsLoading(false);
        return;
      }
      
      // Transform the database records into CalendarEvent objects
      const calendarEvents: CalendarEvent[] = data.map(record => {
        // Convert to UTC first to ensure consistent handling
        const startUtc = TimeZoneService.parseWithZone(record.start_time, 'UTC');
        const endUtc = TimeZoneService.parseWithZone(record.end_time, 'UTC');
        
        // Convert to user timezone for display
        const startInUserTz = startUtc.setZone(userTimeZone);
        const endInUserTz = endUtc.setZone(userTimeZone);
        
        return {
          id: record.id,
          title: record.title,
          start: startInUserTz.toISO() || '',
          end: endInUserTz.toISO() || '',
          allDay: record.all_day || false,
          extendedProps: {
            eventType: record.event_type,
            isAvailability: record.event_type === 'availability',
            isActive: record.is_active,
            timezone: userTimeZone,
            clinicianId: record.clinician_id,
            recurrenceId: record.recurrence_id,
            displayStart: startInUserTz.toFormat('h:mm a'),
            displayEnd: endInUserTz.toFormat('h:mm a'),
            displayDay: startInUserTz.toFormat('ccc'),
            displayDate: startInUserTz.toFormat('MMM d'),
            sourceTable: record.source_table
          }
        };
      });
      
      console.log(`[useFetchCalendarEvents] Fetched ${calendarEvents.length} events`);
      setEvents(calendarEvents);
      
    } catch (err) {
      console.error('[useFetchCalendarEvents] Error in fetchEvents:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching events'));
    } finally {
      setIsLoading(false);
    }
    
  }, [clinicianId, userTimeZone, userId, isUserLoading, startDate, endDate, authRetries, maxAuthRetries, authRetryDelay]);
  
  return {
    events,
    isLoading,
    error,
    fetchEvents
  };
}
