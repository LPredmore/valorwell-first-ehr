import { useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { useCalendar } from '@/context/CalendarContext';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useToast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';

interface UseTimeOffResult {
  timeOffEvents: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  createTimeOff: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateTimeOff: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteTimeOff: (eventId: string) => Promise<boolean>;
  getTimeOffByDate: (date: DateTime) => CalendarEvent[];
  getUpcomingTimeOff: (limit?: number) => CalendarEvent[];
  refreshTimeOff: () => Promise<void>;
}

/**
 * Hook for managing time off in the calendar system
 * Provides methods for creating, updating, and deleting time off events,
 * as well as retrieving time off by various criteria
 */
export function useTimeOff(): UseTimeOffResult {
  const { 
    events, 
    isLoading, 
    error, 
    createTimeOff, 
    updateTimeOff, 
    deleteTimeOff,
    refreshEvents,
    selectedClinicianId
  } = useCalendar();
  
  const { userTimeZone } = useTimeZone();
  const { toast } = useToast();
  
  // Refresh time off events
  const refreshTimeOff = useCallback(async () => {
    await refreshEvents();
  }, [refreshEvents]);
  
  // Get time off for a specific date
  const getTimeOffByDate = useCallback((date: DateTime) => {
    // Filter time off for the specified date
    const timeOffForDate = events.timeOff.filter(event => {
      const eventStart = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start) 
        : DateTime.fromJSDate(event.start);
      
      const eventEnd = typeof event.end === 'string' 
        ? DateTime.fromISO(event.end) 
        : DateTime.fromJSDate(event.end);
      
      // Check if the time off period overlaps with the specified date
      const dateStart = date.startOf('day');
      const dateEnd = date.endOf('day');
      
      return (
        (eventStart >= dateStart && eventStart <= dateEnd) || // Time off starts on this date
        (eventEnd >= dateStart && eventEnd <= dateEnd) || // Time off ends on this date
        (eventStart <= dateStart && eventEnd >= dateEnd) // Time off spans this date
      );
    });
    
    // Sort by start time (ascending)
    return timeOffForDate.sort((a, b) => {
      const aStart = typeof a.start === 'string' 
        ? DateTime.fromISO(a.start) 
        : DateTime.fromJSDate(a.start);
      
      const bStart = typeof b.start === 'string' 
        ? DateTime.fromISO(b.start) 
        : DateTime.fromJSDate(b.start);
      
      return aStart.toMillis() - bStart.toMillis();
    });
  }, [events.timeOff]);
  
  // Get upcoming time off
  const getUpcomingTimeOff = useCallback((limit: number = 10) => {
    const now = DateTime.now().setZone(userTimeZone);
    
    // Filter time off that is in the future
    const upcomingTimeOff = events.timeOff
      .filter(event => {
        const eventStart = typeof event.start === 'string' 
          ? DateTime.fromISO(event.start) 
          : DateTime.fromJSDate(event.start);
        
        return eventStart > now;
      })
      // Sort by start time (ascending)
      .sort((a, b) => {
        const aStart = typeof a.start === 'string' 
          ? DateTime.fromISO(a.start) 
          : DateTime.fromJSDate(a.start);
        
        const bStart = typeof b.start === 'string' 
          ? DateTime.fromISO(b.start) 
          : DateTime.fromJSDate(b.start);
        
        return aStart.toMillis() - bStart.toMillis();
      })
      // Limit the number of results
      .slice(0, limit);
    
    return upcomingTimeOff;
  }, [events.timeOff, userTimeZone]);
  
  // Create a new time off with validation
  const createValidatedTimeOff = useCallback(async (event: CalendarEvent) => {
    try {
      // Validate required fields
      if (!event.title) {
        event.title = 'Time Off'; // Default title if not provided
      }
      
      if (!event.start || !event.end) {
        throw new Error('Time off start and end times are required');
      }
      
      // Validate that the time off doesn't conflict with appointments
      const start = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start) 
        : DateTime.fromJSDate(event.start);
      
      const end = typeof event.end === 'string' 
        ? DateTime.fromISO(event.end) 
        : DateTime.fromJSDate(event.end);
      
      // Check if the time off conflicts with any existing appointment
      const hasAppointmentConflict = events.appointments.some(appt => {
        const apptStart = typeof appt.start === 'string' 
          ? DateTime.fromISO(appt.start) 
          : DateTime.fromJSDate(appt.start);
        
        const apptEnd = typeof appt.end === 'string' 
          ? DateTime.fromISO(appt.end) 
          : DateTime.fromJSDate(appt.end);
        
        return (
          (start <= apptStart && end > apptStart) || // Time off starts before appointment and ends during/after
          (start >= apptStart && start < apptEnd) || // Time off starts during appointment
          (start <= apptStart && end >= apptEnd) // Time off contains appointment
        );
      });
      
      if (hasAppointmentConflict) {
        throw new Error('Time off conflicts with existing appointments. Please cancel or reschedule appointments first.');
      }
      
      // Create the time off
      return await createTimeOff(event);
    } catch (error) {
      console.error('[useTimeOff] Error creating time off:', error);
      
      toast({
        title: "Error creating time off",
        description: error instanceof Error ? error.message : 'Failed to create time off',
        variant: "destructive"
      });
      
      return null;
    }
  }, [createTimeOff, events.appointments, toast]);
  
  // Update time off with validation
  const updateValidatedTimeOff = useCallback(async (event: CalendarEvent) => {
    try {
      // Validate required fields
      if (!event.id) {
        throw new Error('Time off ID is required for updates');
      }
      
      if (!event.title) {
        event.title = 'Time Off'; // Default title if not provided
      }
      
      if (!event.start || !event.end) {
        throw new Error('Time off start and end times are required');
      }
      
      // Validate that the time off doesn't conflict with appointments
      const start = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start) 
        : DateTime.fromJSDate(event.start);
      
      const end = typeof event.end === 'string' 
        ? DateTime.fromISO(event.end) 
        : DateTime.fromJSDate(event.end);
      
      // Check if the time off conflicts with any existing appointment
      const hasAppointmentConflict = events.appointments.some(appt => {
        const apptStart = typeof appt.start === 'string' 
          ? DateTime.fromISO(appt.start) 
          : DateTime.fromJSDate(appt.start);
        
        const apptEnd = typeof appt.end === 'string' 
          ? DateTime.fromISO(appt.end) 
          : DateTime.fromJSDate(appt.end);
        
        return (
          (start <= apptStart && end > apptStart) || // Time off starts before appointment and ends during/after
          (start >= apptStart && start < apptEnd) || // Time off starts during appointment
          (start <= apptStart && end >= apptEnd) // Time off contains appointment
        );
      });
      
      if (hasAppointmentConflict) {
        throw new Error('Time off conflicts with existing appointments. Please cancel or reschedule appointments first.');
      }
      
      // Update the time off
      return await updateTimeOff(event);
    } catch (error) {
      console.error('[useTimeOff] Error updating time off:', error);
      
      toast({
        title: "Error updating time off",
        description: error instanceof Error ? error.message : 'Failed to update time off',
        variant: "destructive"
      });
      
      return null;
    }
  }, [updateTimeOff, events.appointments, toast]);
  
  // Delete time off with validation
  const deleteValidatedTimeOff = useCallback(async (eventId: string) => {
    try {
      // Find the time off event
      const timeOffEvent = events.timeOff.find(event => event.id === eventId);
      
      if (!timeOffEvent) {
        throw new Error('Time off event not found');
      }
      
      // Delete the time off
      return await deleteTimeOff(eventId);
    } catch (error) {
      console.error('[useTimeOff] Error deleting time off:', error);
      
      toast({
        title: "Error deleting time off",
        description: error instanceof Error ? error.message : 'Failed to delete time off',
        variant: "destructive"
      });
      
      return false;
    }
  }, [deleteTimeOff, events.timeOff, toast]);
  
  return {
    timeOffEvents: events.timeOff,
    isLoading: isLoading.timeOff,
    error,
    createTimeOff: createValidatedTimeOff,
    updateTimeOff: updateValidatedTimeOff,
    deleteTimeOff: deleteValidatedTimeOff,
    getTimeOffByDate,
    getUpcomingTimeOff,
    refreshTimeOff
  };
}