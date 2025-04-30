
import { useState, useRef, useCallback, useMemo } from 'react';
import { CalendarService } from '@/services/calendar/CalendarFacade';
import { CalendarEvent } from '@/types/calendar';
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timezone';
import { CalendarErrorHandler } from '@/services/calendar/CalendarFacade';
import { componentMonitor } from '@/utils/performance/componentMonitor';
import { debugUuidValidation, trackCalendarApi } from '@/utils/calendarDebugUtils';
import { formatAsUUID, isValidUUID } from '@/utils/validation/uuidUtils';

interface UseFetchCalendarEventsProps {
  clinicianId: string | null;
  userTimeZone: string;
  userId: string | null;
  isUserLoading: boolean;
  startDate?: Date;
  endDate?: Date;
}

export function useFetchCalendarEvents({
  clinicianId,
  userTimeZone,
  userId,
  isUserLoading,
  startDate,
  endDate
}: UseFetchCalendarEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const fetchInProgress = useRef(false);
  const { toast } = useToast();
  const maxRetries = 3;
  
  // Cache for calendar events to implement lazy loading
  const eventsCache = useRef<Record<string, {
    events: CalendarEvent[],
    timestamp: number,
    range: { start: Date, end: Date }
  }>>({});
  
  // Cache expiration time (2 minutes)
  const CACHE_EXPIRATION = 2 * 60 * 1000;
  
  // Performance monitoring
  const fetchStartTime = useRef(0);

  // Generate a cache key based on clinician ID and date range
  const getCacheKey = useCallback((
    clinicianId: string,
    start?: Date,
    end?: Date
  ): string => {
    const startStr = start ? start.toISOString().split('T')[0] : 'all';
    const endStr = end ? end.toISOString().split('T')[0] : 'all';
    return `${clinicianId}:${startStr}:${endStr}`;
  }, []);
  
  // Check if we have valid cached data for the current request
  const getValidCachedEvents = useCallback((
    clinicianId: string,
    start?: Date,
    end?: Date
  ): CalendarEvent[] | null => {
    if (!clinicianId) return null;
    
    const cacheKey = getCacheKey(clinicianId, start, end);
    const cacheEntry = eventsCache.current[cacheKey];
    const now = Date.now();
    
    // If we have a valid cache entry that hasn't expired
    if (cacheEntry && (now - cacheEntry.timestamp) < CACHE_EXPIRATION) {
      // If no date range specified, return all cached events
      if (!start || !end) {
        return cacheEntry.events;
      }
      
      // If the requested range is fully contained within the cached range
      if (
        cacheEntry.range.start <= start &&
        cacheEntry.range.end >= end
      ) {
        return cacheEntry.events.filter(event => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          return eventStart <= end && eventEnd >= start;
        });
      }
    }
    
    return null;
  }, [getCacheKey]);

  const fetchEvents = useCallback(async (retry: boolean = false) => {
    // Start performance monitoring
    fetchStartTime.current = performance.now();
    
    if (isUserLoading) {
      console.log('[useFetchCalendarEvents] User authentication still loading, deferring fetch');
      return;
    }
    
    if (!userId) {
      console.log('[useFetchCalendarEvents] No authenticated user, skipping fetch');
      setEvents([]);
      setError(new Error('Authentication required'));
      setIsLoading(false);
      return;
    }
    
    if (!clinicianId || fetchInProgress.current) {
      console.log('[useFetchCalendarEvents] Skipping fetch:', {
        reason: !clinicianId ? 'No clinicianId' : 'Fetch in progress',
        clinicianId,
        fetchInProgress: fetchInProgress.current
      });
      
      if (!clinicianId) setEvents([]);
      return;
    }
    
    // Debug UUID validation
    debugUuidValidation(clinicianId, 'useFetchCalendarEvents.fetchEvents', {
      userId,
      timeZone: userTimeZone,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });

    // Check cache first
    const cachedEvents = getValidCachedEvents(clinicianId, startDate, endDate);
    if (cachedEvents) {
      console.log('[useFetchCalendarEvents] Using cached events:', cachedEvents.length);
      setEvents(cachedEvents);
      
      // Record performance
      const fetchTime = performance.now() - fetchStartTime.current;
      componentMonitor.recordRender('useFetchCalendarEvents (cached)', fetchTime, {
        props: { clinicianId, eventCount: cachedEvents.length }
      });
      
      return;
    }

    try {
      console.log('[useFetchCalendarEvents] Starting fetch:', {
        clinicianId,
        userTimeZone,
        startDate,
        endDate,
        userId,
        rawClinicianIdType: typeof clinicianId
      });
      
      setIsLoading(true);
      setError(null);
      fetchInProgress.current = true;

      // Try to format the clinicianId to ensure it's a valid UUID
      let validClinicianId = clinicianId;
      
      if (!isValidUUID(clinicianId)) {
        console.warn('[useFetchCalendarEvents] Invalid UUID format for clinicianId:', clinicianId);
        const formattedId = formatAsUUID(clinicianId);
        
        if (isValidUUID(formattedId)) {
          console.info(`[useFetchCalendarEvents] Formatted clinicianId: "${clinicianId}" → "${formattedId}"`);
          validClinicianId = formattedId;
        } else {
          console.error(`[useFetchCalendarEvents] Unable to format clinicianId as valid UUID: "${clinicianId}"`);
          setEvents([]);
          setError(new Error(`Invalid clinician ID format: ${clinicianId}`));
          setIsLoading(false);
          fetchInProgress.current = false;
          return;
        }
      }

      trackCalendarApi('request', {
        endpoint: 'fetchCalendarEvents',
        clinicianId: validClinicianId,
        userTimeZone,
        startDate,
        endDate
      });

      const fetchedEvents = await CalendarService.getEvents(
        validClinicianId,
        userTimeZone,
        startDate,
        endDate
      );
      
      const convertedEvents = fetchedEvents?.map(event =>
        TimeZoneService.convertEventToUserTimeZone(event, userTimeZone)
      ) || [];
      
      // Update cache
      const cacheKey = getCacheKey(validClinicianId, startDate, endDate);
      eventsCache.current[cacheKey] = {
        events: convertedEvents,
        timestamp: Date.now(),
        range: {
          start: startDate || new Date(0), // Beginning of time if no start date
          end: endDate || new Date(8640000000000000) // End of time if no end date
        }
      };
      
      setEvents(convertedEvents);
      if (retryCount > 0) setRetryCount(0);
      
      trackCalendarApi('success', {
        endpoint: 'fetchCalendarEvents',
        clinicianId: validClinicianId,
        resultCount: convertedEvents.length
      });
      
      // Record performance
      const fetchTime = performance.now() - fetchStartTime.current;
      componentMonitor.recordRender('useFetchCalendarEvents (network)', fetchTime, {
        props: { clinicianId: validClinicianId, eventCount: convertedEvents.length }
      });
      
    } catch (err) {
      console.error("[useFetchCalendarEvents] Error fetching calendar events:", err);
      const errorMessage = CalendarErrorHandler.getUserFriendlyMessage(err);
      const fetchError = err instanceof Error ? err : new Error(errorMessage);
      setError(fetchError);
      
      trackCalendarApi('error', {
        endpoint: 'fetchCalendarEvents',
        clinicianId,
        error: err
      });
      
      if (retry && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        const backoffTime = Math.pow(2, retryCount) * 1000;
        
        toast({
          title: "Retrying calendar fetch",
          description: `Attempt ${retryCount + 1} of ${maxRetries}. Retrying in ${backoffTime/1000} seconds.`,
          variant: "default",
        });
        
        setTimeout(() => {
          fetchEvents(true);
        }, backoffTime);
      } else {
        toast({
          title: "Error fetching calendar events",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Record performance for error case
      const fetchTime = performance.now() - fetchStartTime.current;
      componentMonitor.recordRender('useFetchCalendarEvents (error)', fetchTime, {
        props: { clinicianId, error: errorMessage }
      });
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [
    clinicianId,
    userTimeZone,
    startDate,
    endDate,
    toast,
    retryCount,
    userId,
    isUserLoading,
    getValidCachedEvents,
    getCacheKey
  ]);

  return {
    events,
    isLoading,
    error,
    retryCount,
    fetchEvents
  };
}
