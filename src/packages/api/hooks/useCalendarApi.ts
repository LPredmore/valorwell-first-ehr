
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  getClinicianAvailability,
  getAvailabilitySettings,
  createCalendarException
} from '../services/calendar';
import { getQueryOptions } from '../utils/cache';
import { CalendarEvent } from '@/types/calendar';
import { useState, useEffect, useCallback } from 'react';
import { subscriptionManager } from '../utils/subscriptions';

// Hook for calendar events
export const useCalendarEvents = (
  clinicianId: string | undefined,
  userTimeZone: string,
  startDate?: Date,
  endDate?: Date,
  options = { realtime: true }
) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  const { 
    data = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    ...getQueryOptions(['calendar-events', clinicianId, startDate?.toISOString(), endDate?.toISOString()], 'volatile'),
    queryFn: async () => {
      if (!clinicianId) return [];
      return getCalendarEvents(clinicianId, userTimeZone, startDate, endDate);
    },
    enabled: !!clinicianId && !!userTimeZone
  });
  
  // Set initial events
  useEffect(() => {
    if (data) {
      setEvents(data);
    }
  }, [data]);
  
  // Set up realtime subscription for calendar events if enabled
  useEffect(() => {
    if (!options.realtime || !clinicianId) return;
    
    // Subscribe to calendar events updates
    const unsubscribe = subscriptionManager.subscribe(
      `calendar_events_${clinicianId}`,
      {
        table: 'calendar_events',
        schema: 'public',
        filter: `clinician_id=eq.${clinicianId}`
      },
      {
        onData: (payload: any) => {
          // Refresh the data when events change
          refetch();
        },
        onError: (error) => {
          console.error('Calendar events subscription error:', error);
        },
        onReconnect: () => {
          refetch();
        }
      }
    );
    
    return unsubscribe;
  }, [clinicianId, refetch, options.realtime, userTimeZone]);
  
  // CRUD operations for events
  const createEvent = useMutation({
    mutationFn: (event: CalendarEvent) => createCalendarEvent(event, userTimeZone),
    onSuccess: () => {
      refetch();
    }
  });
  
  const updateEvent = useMutation({
    mutationFn: (event: CalendarEvent) => updateCalendarEvent(event, userTimeZone),
    onSuccess: () => {
      refetch();
    }
  });
  
  const deleteEvent = useMutation({
    mutationFn: (eventId: string) => deleteCalendarEvent(eventId),
    onSuccess: () => {
      refetch();
    }
  });
  
  const createException = useMutation({
    mutationFn: ({ 
      eventId, 
      date, 
      isCancelled = true 
    }: { 
      eventId: string; 
      date: string; 
      isCancelled?: boolean;
    }) => {
      return createCalendarException(eventId, date, isCancelled);
    },
    onSuccess: () => {
      refetch();
    }
  });
  
  return {
    events,
    isLoading,
    error,
    refetch,
    createEvent: createEvent.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
    createException: createException.mutateAsync,
    createEventStatus: createEvent.status,
    updateEventStatus: updateEvent.status,
    deleteEventStatus: deleteEvent.status
  };
};

// Hook for clinician availability
export const useClinicianAvailability = (clinicianId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['clinician-availability', clinicianId], 'standard'),
    queryFn: async () => {
      if (!clinicianId) return [];
      return getClinicianAvailability(clinicianId);
    },
    enabled: !!clinicianId
  });
};

// Hook for availability settings
export const useAvailabilitySettings = (clinicianId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['availability-settings', clinicianId], 'persistent'),
    queryFn: async () => {
      if (!clinicianId) return null;
      return getAvailabilitySettings(clinicianId);
    },
    enabled: !!clinicianId
  });
};
