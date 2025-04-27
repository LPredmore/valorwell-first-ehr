
import { useState, useRef, useCallback } from 'react';
import { CalendarService } from '@/services/calendar/CalendarFacade';
import { CalendarEvent } from '@/types/calendar';
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timeZoneService';
import { CalendarErrorHandler } from '@/services/calendar/CalendarFacade';

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

  const fetchEvents = useCallback(async (retry: boolean = false) => {
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

    try {
      console.log('[useFetchCalendarEvents] Starting fetch:', {
        clinicianId,
        userTimeZone,
        startDate,
        endDate,
        userId
      });
      
      setIsLoading(true);
      setError(null);
      fetchInProgress.current = true;

      const validClinicianId = clinicianId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ? clinicianId
        : null;

      if (!validClinicianId) {
        console.warn('[useFetchCalendarEvents] Invalid UUID format for clinicianId:', clinicianId);
        setEvents([]);
        setError(new Error('Invalid clinician ID format'));
        return;
      }

      const fetchedEvents = await CalendarService.getEvents(
        validClinicianId,
        userTimeZone,
        startDate,
        endDate
      );
      
      const convertedEvents = fetchedEvents?.map(event => 
        TimeZoneService.convertEventToUserTimeZone(event, userTimeZone)
      ) || [];
      
      setEvents(convertedEvents);
      if (retryCount > 0) setRetryCount(0);
      
    } catch (err) {
      console.error("[useFetchCalendarEvents] Error fetching calendar events:", err);
      const errorMessage = CalendarErrorHandler.getUserFriendlyMessage(err);
      const fetchError = err instanceof Error ? err : new Error(errorMessage);
      setError(fetchError);
      
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
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [clinicianId, userTimeZone, startDate, endDate, toast, retryCount, userId, isUserLoading]);

  return {
    events,
    isLoading,
    error,
    retryCount,
    fetchEvents
  };
}
