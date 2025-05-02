
import { useState, useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { CalendarMutationService } from '@/services/calendar/CalendarMutationService';
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timeZoneService';

interface UseCalendarMutationsProps {
  userTimeZone: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for calendar event mutations (create, update, delete)
 */
export function useCalendarMutations({
  userTimeZone,
  onSuccess,
  onError
}: UseCalendarMutationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Create a new calendar event
   */
  const createEvent = useCallback(
    async (event: CalendarEvent): Promise<CalendarEvent | null> => {
      setIsLoading(true);
      try {
        // Ensure we have a valid timezone
        const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);

        // Create the event
        const createdEvent = await CalendarMutationService.createEvent(event, validTimeZone);

        // Notify success
        toast({
          title: 'Success',
          description: 'Event created successfully',
        });

        // Call the success callback
        onSuccess?.();

        return createdEvent;
      } catch (error) {
        console.error('[useCalendarMutations] Error creating event:', error);
        
        // Show error toast
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to create event',
          variant: 'destructive',
        });
        
        // Call the error callback
        if (error instanceof Error) {
          onError?.(error);
        }
        
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userTimeZone, toast, onSuccess, onError]
  );

  /**
   * Update an existing calendar event
   */
  const updateEvent = useCallback(
    async (event: CalendarEvent): Promise<CalendarEvent | null> => {
      if (!event.id) {
        console.error('[useCalendarMutations] Cannot update event without ID');
        toast({
          title: 'Error',
          description: 'Cannot update event without ID',
          variant: 'destructive',
        });
        return null;
      }

      setIsLoading(true);
      try {
        // Ensure we have a valid timezone
        const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);

        // Update the event
        const updatedEvent = await CalendarMutationService.updateEvent(event, validTimeZone);

        // Notify success
        toast({
          title: 'Success',
          description: 'Event updated successfully',
        });

        // Call the success callback
        onSuccess?.();

        return updatedEvent;
      } catch (error) {
        console.error('[useCalendarMutations] Error updating event:', error);
        
        // Show error toast
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update event',
          variant: 'destructive',
        });
        
        // Call the error callback
        if (error instanceof Error) {
          onError?.(error);
        }
        
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userTimeZone, toast, onSuccess, onError]
  );

  /**
   * Delete a calendar event
   */
  const deleteEvent = useCallback(
    async (eventId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        // Delete the event
        const success = await CalendarMutationService.deleteEvent(eventId);

        if (success) {
          // Notify success
          toast({
            title: 'Success',
            description: 'Event deleted successfully',
          });

          // Call the success callback
          onSuccess?.();
        } else {
          throw new Error('Failed to delete event');
        }

        return success;
      } catch (error) {
        console.error('[useCalendarMutations] Error deleting event:', error);
        
        // Show error toast
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete event',
          variant: 'destructive',
        });
        
        // Call the error callback
        if (error instanceof Error) {
          onError?.(error);
        }
        
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, onSuccess, onError]
  );

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    isLoading
  };
}
