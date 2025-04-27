
import { useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { CalendarService } from '@/services/calendar/CalendarFacade';
import { useToast } from '@/hooks/use-toast';
import { CalendarErrorHandler } from '@/services/calendar/CalendarFacade';

interface UseCalendarMutationsProps {
  userTimeZone: string;
  onSuccess?: () => void;
}

export function useCalendarMutations({ userTimeZone, onSuccess }: UseCalendarMutationsProps) {
  const { toast } = useToast();

  const createEvent = async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    let retries = 0;
    const maxCreateRetries = 2;
    
    while (retries <= maxCreateRetries) {
      try {
        const eventWithTimezone = {
          ...event,
          _userTimeZone: userTimeZone
        };
        
        const createdEvent = await CalendarService.createEvent(eventWithTimezone, userTimeZone);
        onSuccess?.();
        return createdEvent;
      } catch (err) {
        console.error(`Error creating calendar event (attempt ${retries + 1}/${maxCreateRetries + 1}):`, err);
        
        if (retries === maxCreateRetries) {
          toast({
            title: "Error creating event",
            description: CalendarErrorHandler.getUserFriendlyMessage(err),
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
      const eventWithTimezone = {
        ...event,
        _userTimeZone: userTimeZone
      };
      
      const updatedEvent = await CalendarService.updateEvent(eventWithTimezone, userTimeZone);
      onSuccess?.();
      return updatedEvent;
    } catch (err) {
      console.error("Error updating calendar event:", err);
      toast({
        title: "Error updating event",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      const success = await CalendarService.deleteEvent(eventId);
      if (success) {
        onSuccess?.();
        return true;
      } else {
        throw new Error("Delete operation failed");
      }
    } catch (err) {
      console.error("Error deleting calendar event:", err);
      toast({
        title: "Error deleting event",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    createEvent,
    updateEvent,
    deleteEvent
  };
}
