
import { useUser } from '@/context/UserContext';
import { CalendarEvent } from '@/types/calendar';
import { useFetchCalendarEvents } from './calendar/useFetchCalendarEvents';
import { useCalendarMutations } from './calendar/useCalendarMutations';
import { useEffect } from 'react';
import { TimeZoneService } from '@/utils/timeZoneService';

interface UseCalendarEventsProps {
  clinicianId: string | null;
  userTimeZone: string;
  startDate?: Date;
  endDate?: Date;
}

export function useCalendarEvents({
  clinicianId,
  userTimeZone,
  startDate,
  endDate,
}: UseCalendarEventsProps) {
  const { isLoading: isUserLoading, userId } = useUser();
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
  
  const {
    events,
    isLoading,
    error,
    fetchEvents
  } = useFetchCalendarEvents({
    clinicianId,
    userTimeZone: validTimeZone,
    userId,
    isUserLoading,
    startDate,
    endDate
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
      userTimeZone: validTimeZone,
      startDate,
      endDate,
      isUserLoading,
      userId
    });

    if (!isUserLoading) {
      fetchEvents();
    }
  }, [clinicianId, validTimeZone, startDate, endDate, fetchEvents, isUserLoading, userId]);

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
    deleteEvent
  };
}
