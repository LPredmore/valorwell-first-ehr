import { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarService } from '@/services/calendarService';
import { CalendarEvent, ICalendarEvent } from '@/types/calendar';
import { useToast } from '@/hooks/use-toast';

interface UseCalendarEventsProps {
  clinicianId: string | null;
  userTimeZone: string;
  startDate?: Date;
  endDate?: Date;
  showAvailability?: boolean;
}

export function useCalendarEvents({
  clinicianId,
  userTimeZone,
  startDate,
  endDate,
  showAvailability = true
}: UseCalendarEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const fetchInProgress = useRef(false);
  const maxRetries = 3;

  const fetchEvents = useCallback(async (retry: boolean = false) => {
    if (!clinicianId || fetchInProgress.current) {
      if (!clinicianId) setEvents([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      fetchInProgress.current = true;

      const fetchedEvents = await CalendarService.getEvents(
        clinicianId,
        userTimeZone,
        startDate,
        endDate
      );

      const filteredEvents = showAvailability
        ? fetchedEvents
        : fetchedEvents.filter(event => 
            event.extendedProps?.eventType !== 'availability'
          );

      setEvents(filteredEvents);
      
      if (retryCount > 0) setRetryCount(0);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
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
  }, [clinicianId, userTimeZone, showAvailability, startDate, endDate, toast, retryCount]);

  const createEvent = async (event: ICalendarEvent): Promise<ICalendarEvent | null> => {
    let retries = 0;
    const maxCreateRetries = 2;
    
    while (retries <= maxCreateRetries) {
      try {
        const createdEvent = await CalendarService.createEvent(event, userTimeZone);
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

  const updateEvent = async (event: ICalendarEvent): Promise<ICalendarEvent | null> => {
    try {
      const updatedEvent = await CalendarService.updateEvent(event, userTimeZone);
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
      await CalendarService.deleteEvent(eventId);
      fetchEvents();
      return true;
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
    fetchEvents();
    
    return () => {
      fetchInProgress.current = false;
    };
  }, [clinicianId, userTimeZone, showAvailability, startDate, endDate]);

  const refetch = () => {
    setRetryCount(0);
    fetchEvents(true);
  };

  return {
    events,
    isLoading,
    error,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent
  };
}
