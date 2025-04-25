import { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarService } from '@/services/CalendarService';
import { CalendarEvent } from '@/types/calendar';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { isLoading: isUserLoading, userId } = useUser();
  const fetchInProgress = useRef(false);
  const maxRetries = 3;
  
  // Ensure we have a valid IANA timezone
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
  
  const fetchEvents = useCallback(async (retry: boolean = false) => {
    if (isUserLoading) {
      console.log('[useCalendarEvents] User authentication still loading, deferring fetch');
      return;
    }
    
    if (!userId) {
      console.log('[useCalendarEvents] No authenticated user, skipping fetch');
      setEvents([]);
      setError(new Error('Authentication required'));
      setIsLoading(false);
      return;
    }
    
    if (!clinicianId || fetchInProgress.current) {
      console.log('[useCalendarEvents] Skipping fetch:', { 
        reason: !clinicianId ? 'No clinicianId' : 'Fetch in progress',
        clinicianId,
        fetchInProgress: fetchInProgress.current
      });
      
      if (!clinicianId) setEvents([]);
      return;
    }

    try {
      console.log('[useCalendarEvents] Starting fetch:', {
        clinicianId,
        userTimeZone: validTimeZone,
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
        console.warn('[useCalendarEvents] Invalid UUID format for clinicianId:', clinicianId);
        setEvents([]);
        setError(new Error('Invalid clinician ID format'));
        return;
      }

      const fetchedEvents = await CalendarService.getEvents(
        validClinicianId,
        validTimeZone,
        startDate,
        endDate
      );

      console.log('[useCalendarEvents] Events fetched:', fetchedEvents?.length || 0);
      
      // Apply timezone conversion to events using TimeZoneService
      const convertedEvents = fetchedEvents?.map(event => 
        TimeZoneService.convertEventToUserTimeZone(event, validTimeZone)
      ) || [];
      
      setEvents(convertedEvents);
      if (retryCount > 0) setRetryCount(0);
      
    } catch (err) {
      console.error("[useCalendarEvents] Error fetching calendar events:", err);
      const fetchError = err instanceof Error ? err : new Error(String(err));
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
      } else if (retry) {
        toast({
          title: "Error fetching calendar events",
          description: "Max retry attempts reached. Please try again manually.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error fetching calendar events",
          description: "There was a problem loading your calendar. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [clinicianId, validTimeZone, startDate, endDate, toast, retryCount, userId, isUserLoading]);

  const createEvent = async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    let retries = 0;
    const maxCreateRetries = 2;
    
    while (retries <= maxCreateRetries) {
      try {
        // Ensure the event timezone is properly set before creation
        const eventWithTimezone = {
          ...event,
          _userTimeZone: validTimeZone
        };
        
        const createdEvent = await CalendarService.createEvent(eventWithTimezone, validTimeZone);
        fetchEvents();
        return createdEvent;
      } catch (err) {
        console.error(`Error creating calendar event (attempt ${retries + 1}/${maxCreateRetries + 1}):`, err);
        
        if (retries === maxCreateRetries) {
          toast({
            title: "Error creating event",
            description: "Failed to create your event after multiple attempts. Please try again.",
            variant: "destructive",
          });
          return null;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        retries++;
      }
    }
    
    return null;
  };

  const updateEvent = async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    try {
      // Ensure the event timezone is properly set before update
      const eventWithTimezone = {
        ...event,
        _userTimeZone: validTimeZone
      };
      
      const updatedEvent = await CalendarService.updateEvent(eventWithTimezone, validTimeZone);
      fetchEvents();
      return updatedEvent;
    } catch (err) {
      console.error("Error updating calendar event:", err);
      toast({
        title: "Error updating event",
        description: "There was a problem updating your event. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      const success = await CalendarService.deleteEvent(eventId);
      if (success) {
        fetchEvents();
        return true;
      } else {
        throw new Error("Delete operation returned false");
      }
    } catch (err) {
      console.error("Error deleting calendar event:", err);
      toast({
        title: "Error deleting event",
        description: "There was a problem deleting your event. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };
  
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

    return () => {
      fetchInProgress.current = false;
    };
  }, [clinicianId, validTimeZone, startDate, endDate, fetchEvents, isUserLoading, userId]);

  const refetch = useCallback(() => {
    console.log('[useCalendarEvents] Manual refetch triggered');
    setRetryCount(0);
    fetchEvents(true);
  }, [fetchEvents]);

  return {
    events,
    isLoading: isLoading || isUserLoading,
    error,
    refetch,
    createEvent,
    updateEvent: async (event: CalendarEvent) => {
      try {
        // Ensure the event timezone is properly set before update
        const eventWithTimezone = {
          ...event,
          _userTimeZone: validTimeZone
        };
        
        const updatedEvent = await CalendarService.updateEvent(eventWithTimezone, validTimeZone);
        fetchEvents();
        return updatedEvent;
      } catch (err) {
        console.error("Error updating calendar event:", err);
        toast({
          title: "Error updating event",
          description: "There was a problem updating your event. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    },
    deleteEvent: async (eventId: string) => {
      try {
        const success = await CalendarService.deleteEvent(eventId);
        if (success) {
          fetchEvents();
          return true;
        } else {
          throw new Error("Delete operation returned false");
        }
      } catch (err) {
        console.error("Error deleting calendar event:", err);
        toast({
          title: "Error deleting event",
          description: "There was a problem deleting your event. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    }
  };
}
