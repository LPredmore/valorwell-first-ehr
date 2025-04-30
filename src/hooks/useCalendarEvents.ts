
import { useUser } from '@/context/UserContext';
import { CalendarEvent } from '@/types/calendar';
import { useFetchCalendarEvents } from './calendar/useFetchCalendarEvents';
import { useCalendarMutations } from './calendar/useCalendarMutations';
import { useEffect, useMemo } from 'react';
import { TimeZoneService } from '@/utils/timezone';
import { formatAsUUID } from '@/utils/validation/uuidUtils';

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
  
  // Format clinician ID to ensure consistent UUID format
  const formattedClinicianId = useMemo(() => {
    if (!clinicianId) return null;
    return formatAsUUID(clinicianId);
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
      formattedClinicianId,
      userTimeZone: validTimeZone,
      startDate,
      endDate,
      isUserLoading,
      userId
    });

    if (!isUserLoading && formattedClinicianId) {
      fetchEvents();
    }
  }, [formattedClinicianId, validTimeZone, startDate, endDate, fetchEvents, isUserLoading, userId, clinicianId]);

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
