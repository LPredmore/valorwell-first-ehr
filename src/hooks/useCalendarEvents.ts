
import { useState, useEffect } from 'react';
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
  const { toast } = useToast();

  // Function to fetch events
  const fetchEvents = async () => {
    if (!clinicianId) {
      setEvents([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedEvents = await CalendarService.getEvents(
        clinicianId,
        userTimeZone,
        startDate,
        endDate
      );

      // Filter events based on showAvailability flag
      const filteredEvents = showAvailability
        ? fetchedEvents
        : fetchedEvents.filter(event => 
            event.extendedProps?.eventType !== 'availability'
          );

      setEvents(filteredEvents);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error fetching calendar events",
        description: "There was a problem loading your calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create an event
  const createEvent = async (event: ICalendarEvent): Promise<ICalendarEvent | null> => {
    try {
      const createdEvent = await CalendarService.createEvent(event, userTimeZone);
      fetchEvents(); // Refresh the events
      return createdEvent;
    } catch (err) {
      console.error("Error creating calendar event:", err);
      toast({
        title: "Error creating event",
        description: "There was a problem creating your event. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Function to update an event
  const updateEvent = async (event: ICalendarEvent): Promise<ICalendarEvent | null> => {
    try {
      const updatedEvent = await CalendarService.updateEvent(event, userTimeZone);
      fetchEvents(); // Refresh the events
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

  // Function to delete an event
  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      await CalendarService.deleteEvent(eventId);
      fetchEvents(); // Refresh the events
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

  // Fetch events when dependencies change
  useEffect(() => {
    fetchEvents();
  }, [clinicianId, userTimeZone, showAvailability, startDate, endDate]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
}
