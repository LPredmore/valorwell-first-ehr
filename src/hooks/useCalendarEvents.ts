
import { useUser } from '@/context/UserContext';
import { CalendarEvent } from '@/types/calendar';
import { useFetchCalendarEvents } from './calendar/useFetchCalendarEvents';
import { useCalendarMutations } from './calendar/useCalendarMutations';
import { useEffect, useMemo, useRef } from 'react';
import { TimeZoneService } from '@/utils/timezone';
import { formatAsUUID } from '@/utils/validation/uuidUtils';
import { AppError } from '@/utils/errors/AppError';

interface UseCalendarEventsProps {
  clinicianId: string | null;
  userTimeZone: string;
  startDate?: Date;
  endDate?: Date;
  authRetryDelay?: number;
  maxAuthRetries?: number;
}

export function useCalendarEvents({
  clinicianId,
  userTimeZone,
  startDate,
  endDate,
  authRetryDelay = 1000,
  maxAuthRetries = 5
}: UseCalendarEventsProps) {
  const { isLoading: isUserLoading, userId } = useUser();
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
  const initialFetchAttempted = useRef(false);
  
  // Format clinician ID to ensure consistent UUID format using our enhanced formatAsUUID function
  const formattedClinicianId = useMemo(() => {
    if (!clinicianId) return null;
    try {
      return formatAsUUID(clinicianId, {
        strictMode: true,
        logLevel: 'warn'
      });
    } catch (error) {
      console.error('[useCalendarEvents] Invalid clinician ID format:', error);
      return null;
    }
  }, [clinicianId]);
  
  const {
    events,
    isLoading,
    error,
    fetchEvents
  } = useFetchCalendarEvents({
    clinicianId: formattedClinicianId,
    userTimeZone: validTimeZone,
    userId,
    isUserLoading,
    startDate,
    endDate,
    authRetryDelay,
    maxAuthRetries
  });

  const {
    createEvent,
    updateEvent,
    deleteEvent
  } = useCalendarMutations({
    userTimeZone: validTimeZone,
    onSuccess: () => fetchEvents()
  });
  
  useEffect(() => {
    console.log('[useCalendarEvents] Effect triggered:', {
      clinicianId,
      formattedClinicianId,
      userTimeZone: validTimeZone,
      startDate,
      endDate,
      isUserLoading,
      userId,
      initialFetchAttempted: initialFetchAttempted.current
    });

    // Only proceed if we have a clinician ID
    if (!formattedClinicianId) {
      console.log('[useCalendarEvents] No clinician ID, skipping fetch');
      return;
    }

    // Authentication check with better logging
    if (isUserLoading) {
      console.log('[useCalendarEvents] User authentication still loading, will retry when complete');
      return;
    }

    if (!userId) {
      console.log('[useCalendarEvents] No authenticated user, cannot fetch events');
      return;
    }

    // Track that we've attempted an initial fetch
    initialFetchAttempted.current = true;
    
    // All conditions met, fetch events
    console.log('[useCalendarEvents] Authentication complete and clinician ID available, fetching events');
    fetchEvents();
    
  }, [formattedClinicianId, validTimeZone, startDate, endDate, fetchEvents, isUserLoading, userId]);

  return {
    events,
    isLoading: isLoading || isUserLoading,
    error,
    refetch: () => {
      console.log('[useCalendarEvents] Manual refetch triggered');
      fetchEvents(true);
    },
    createEvent,
    updateEvent,
    deleteEvent,
    isAuthenticated: !isUserLoading && !!userId,
    isInitialized: initialFetchAttempted.current
  };
}
