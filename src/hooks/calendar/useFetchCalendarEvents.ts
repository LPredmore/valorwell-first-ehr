
import { useState, useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { CalendarQueryService } from '@/services/calendar/CalendarQueryService';
import { TimeZoneService } from '@/utils/timeZoneService';

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
 * Hook to fetch calendar events for a clinician
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchParams, setLastFetchParams] = useState<{
    clinicianId: string | null;
    startDate?: Date;
    endDate?: Date;
  } | null>(null);

  /**
   * Fetch calendar events
   */
  const fetchEvents = useCallback(async (forceRefresh = false) => {
    // Skip if clinician ID is missing
    if (!clinicianId) {
      console.log('[useFetchCalendarEvents] No clinician ID provided, skipping fetch');
      return;
    }

    // Skip fetch if user authentication is still loading
    if (isUserLoading) {
      console.log('[useFetchCalendarEvents] User authentication loading, deferring fetch');
      return;
    }

    // Skip if user is not authenticated
    if (userId === null) {
      console.log('[useFetchCalendarEvents] No authenticated user, skipping fetch');
      setError(new Error('User authentication required'));
      return;
    }

    // Default date range if not provided
    const now = new Date();
    const defaultStartDate = new Date(now);
    defaultStartDate.setDate(defaultStartDate.getDate() - 30); // 30 days ago
    
    const defaultEndDate = new Date(now);
    defaultEndDate.setDate(defaultEndDate.getDate() + 60); // 60 days in the future
    
    const effectiveStartDate = startDate || defaultStartDate;
    const effectiveEndDate = endDate || defaultEndDate;

    // Skip unnecessary fetches with same parameters
    if (
      !forceRefresh &&
      lastFetchParams &&
      lastFetchParams.clinicianId === clinicianId &&
      lastFetchParams.startDate?.getTime() === effectiveStartDate.getTime() &&
      lastFetchParams.endDate?.getTime() === effectiveEndDate.getTime() &&
      events.length > 0
    ) {
      console.log('[useFetchCalendarEvents] Skipping duplicate fetch with same parameters');
      return;
    }

    // Start fetch process
    setIsLoading(true);
    setError(null);

    try {
      console.log('[useFetchCalendarEvents] Fetching calendar events', {
        clinicianId,
        startDate: effectiveStartDate.toISOString(),
        endDate: effectiveEndDate.toISOString(),
        timeZone: userTimeZone,
      });

      // Fetch events
      const fetchedEvents = await CalendarQueryService.getEventsInRange(
        clinicianId,
        effectiveStartDate,
        effectiveEndDate,
        userTimeZone,
        { includeAppointments: true, includeAvailability: true, includeTimeOff: true }
      );

      console.log(`[useFetchCalendarEvents] Fetched ${fetchedEvents.length} events`);

      // Update state with fetched events
      setEvents(fetchedEvents);
      setLastFetchParams({
        clinicianId,
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
      });
    } catch (err) {
      console.error('[useFetchCalendarEvents] Error fetching events:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch calendar events'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicianId, userTimeZone, userId, isUserLoading, events.length, startDate, endDate, lastFetchParams]);

  return {
    events,
    isLoading,
    error,
    fetchEvents
  };
}
