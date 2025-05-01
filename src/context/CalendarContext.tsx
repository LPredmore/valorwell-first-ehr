import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DateTime } from 'luxon';
import { CalendarEvent, CalendarViewType } from '@/types/calendar';
import { useAsyncState } from '@/hooks/useAsyncState';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { CalendarService } from '@/services/calendar/CalendarService';
import { AvailabilityService } from '@/services/calendar/AvailabilityService';
import { AppointmentService } from '@/services/calendar/AppointmentService';
import { TimeOffService } from '@/services/calendar/TimeOffService';
import { CalendarErrorHandler } from '@/services/calendar/CalendarErrorHandler';
import { AppError } from '@/utils/errors/AppError';
import { PermissionService } from '@/services/PermissionService';

// Define the context state type
interface CalendarState {
  // View state
  view: CalendarViewType;
  currentDate: DateTime;
  selectedClinicianId: string | null;
  
  // Data state
  events: {
    availability: CalendarEvent[];
    appointments: CalendarEvent[];
    timeOff: CalendarEvent[];
  };
  
  // UI state
  isLoading: {
    availability: boolean;
    appointments: boolean;
    timeOff: boolean;
  };
  error: Error | null;
  
  // Filters
  showAvailability: boolean;
  showAppointments: boolean;
  showTimeOff: boolean;
  
  // Authentication state
  isAuthenticated: boolean;
  authenticationPending: boolean;
}

interface CalendarContextValue extends CalendarState {
  // View actions
  setView: (view: CalendarViewType) => void;
  setCurrentDate: (date: DateTime) => void;
  setSelectedClinicianId: (id: string | null) => void;
  
  // Filter actions
  setShowAvailability: (show: boolean) => void;
  setShowAppointments: (show: boolean) => void;
  setShowTimeOff: (show: boolean) => void;
  
  // Data actions
  refreshEvents: () => Promise<void>;
  
  // Availability actions
  createAvailability: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateAvailability: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteAvailability: (eventId: string) => Promise<boolean>;
  
  // Appointment actions
  createAppointment: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateAppointment: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteAppointment: (eventId: string) => Promise<boolean>;
  
  // Time off actions
  createTimeOff: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateTimeOff: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteTimeOff: (eventId: string) => Promise<boolean>;
  
  // Permission checks
  canManageCalendar: (clinicianId: string) => Promise<boolean>;
  canEditAvailability: (clinicianId: string) => Promise<boolean>;
}

// Create the context with undefined initial value
const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

// Provider props type
interface CalendarProviderProps {
  children: React.ReactNode;
  initialClinicianId?: string | null;
  initialView?: CalendarViewType;
}

/**
 * Provider component for calendar state management
 */
export const CalendarProvider: React.FC<CalendarProviderProps> = ({ 
  children, 
  initialClinicianId = null, 
  initialView = 'timeGridWeek' 
}) => {
  // View state
  const [view, setView] = useState<CalendarViewType>(initialView);
  const [currentDate, setCurrentDate] = useState<DateTime>(DateTime.now());
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(initialClinicianId);
  
  // Filter state
  const [showAvailability, setShowAvailability] = useState<boolean>(true);
  const [showAppointments, setShowAppointments] = useState<boolean>(true);
  const [showTimeOff, setShowTimeOff] = useState<boolean>(true);
  
  // Data state
  const [events, setEvents] = useState<{
    availability: CalendarEvent[];
    appointments: CalendarEvent[];
    timeOff: CalendarEvent[];
  }>({
    availability: [],
    appointments: [],
    timeOff: []
  });
  
  // Loading state
  const [isLoading, setIsLoading] = useState<{
    availability: boolean;
    appointments: boolean;
    timeOff: boolean;
  }>({
    availability: false,
    appointments: false,
    timeOff: false
  });
  
  // Error state
  const [error, setError] = useState<Error | null>(null);
  
  // External hooks
  const { userTimeZone } = useTimeZone();
  const { toast } = useToast();
  const { userId, isLoading: isUserLoading } = useUser();
  
  // Authentication retry logic
  const authRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const maxAuthRetries = 5;
  const authRetryDelay = 1000; // Base delay in ms
  
  // Clear any existing auth retry timer when component unmounts
  useEffect(() => {
    return () => {
      if (authRetryTimerRef.current) {
        clearTimeout(authRetryTimerRef.current);
        authRetryTimerRef.current = null;
      }
    };
  }, []);
  
  // Fetch availability events
  const fetchAvailabilityEvents = useCallback(async () => {
    if (!selectedClinicianId || !userId) return [];
    
    try {
      setIsLoading(prev => ({ ...prev, availability: true }));
      const availabilityEvents = await CalendarService.getAvailabilityEvents(
        selectedClinicianId,
        userTimeZone
      );
      setEvents(prev => ({ ...prev, availability: availabilityEvents }));
      return availabilityEvents;
    } catch (err) {
      console.error('[CalendarContext] Error fetching availability events:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch availability events'));
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, availability: false }));
    }
  }, [selectedClinicianId, userTimeZone, userId]);
  
  // Fetch appointment events
  const fetchAppointmentEvents = useCallback(async () => {
    if (!selectedClinicianId || !userId) return [];
    
    try {
      setIsLoading(prev => ({ ...prev, appointments: true }));
      const appointmentEvents = await CalendarService.getAppointmentEvents(
        selectedClinicianId,
        userTimeZone
      );
      setEvents(prev => ({ ...prev, appointments: appointmentEvents }));
      return appointmentEvents;
    } catch (err) {
      console.error('[CalendarContext] Error fetching appointment events:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch appointment events'));
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, appointments: false }));
    }
  }, [selectedClinicianId, userTimeZone, userId]);
  
  // Fetch time off events
  const fetchTimeOffEvents = useCallback(async () => {
    if (!selectedClinicianId || !userId) return [];
    
    try {
      setIsLoading(prev => ({ ...prev, timeOff: true }));
      const timeOffEvents = await CalendarService.getTimeOffEvents(
        selectedClinicianId,
        userTimeZone
      );
      setEvents(prev => ({ ...prev, timeOff: timeOffEvents }));
      return timeOffEvents;
    } catch (err) {
      console.error('[CalendarContext] Error fetching time off events:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch time off events'));
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, timeOff: false }));
    }
  }, [selectedClinicianId, userTimeZone, userId]);
  
  // Refresh all events
  const refreshEvents = useCallback(async () => {
    if (isUserLoading) {
      console.log('[CalendarContext] User authentication still loading, deferring fetch');
      
      // If we're already at max retries, throw an error
      if (authRetryCount >= maxAuthRetries) {
        console.error(`[CalendarContext] Max auth retries (${maxAuthRetries}) reached`);
        setError(new AppError('Authentication timeout', 'AUTH_TIMEOUT', {
          userVisible: true,
          userMessage: 'Authentication is taking longer than expected. Please refresh the page.'
        }));
        return;
      }
      
      // Set up exponential backoff for auth retry
      const nextRetryDelay = Math.min(authRetryDelay * Math.pow(2, authRetryCount), 30000); // Max 30 seconds
      console.log(`[CalendarContext] Scheduling auth retry #${authRetryCount + 1} in ${nextRetryDelay}ms`);
      
      // Clear any existing timer
      if (authRetryTimerRef.current) {
        clearTimeout(authRetryTimerRef.current);
      }
      
      // Set new timer for retry
      authRetryTimerRef.current = setTimeout(() => {
        setAuthRetryCount(prev => prev + 1);
        refreshEvents();
      }, nextRetryDelay);
      
      return;
    }
    
    // Reset auth retry count once user is loaded
    if (authRetryCount > 0) {
      setAuthRetryCount(0);
    }
    
    // Clear any pending auth retry timer
    if (authRetryTimerRef.current) {
      clearTimeout(authRetryTimerRef.current);
      authRetryTimerRef.current = null;
    }
    
    if (!userId) {
      console.log('[CalendarContext] No authenticated user, skipping fetch');
      setError(new AppError('Authentication required', 'AUTH_REQUIRED', {
        userVisible: true,
        userMessage: 'You must be logged in to view calendar events.'
      }));
      return;
    }
    
    if (!selectedClinicianId) {
      console.log('[CalendarContext] No clinician selected, returning empty events array');
      setEvents({
        availability: [],
        appointments: [],
        timeOff: []
      });
      return;
    }
    
    console.log('[CalendarContext] Refreshing events for clinician:', selectedClinicianId);
    
    try {
      // Fetch all event types in parallel
      await Promise.all([
        fetchAvailabilityEvents(),
        fetchAppointmentEvents(),
        fetchTimeOffEvents()
      ]);
    } catch (err) {
      console.error('[CalendarContext] Error refreshing events:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh events'));
    }
  }, [
    selectedClinicianId,
    userTimeZone,
    userId,
    isUserLoading,
    authRetryCount,
    fetchAvailabilityEvents,
    fetchAppointmentEvents,
    fetchTimeOffEvents
  ]);
  
  // Availability actions
  const createAvailability = useCallback(async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    try {
      const createdEvent = await CalendarService.createEvent({
        ...event,
        extendedProps: {
          ...event.extendedProps,
          eventType: 'availability',
          clinicianId: selectedClinicianId
        }
      }, userTimeZone);
      
      await fetchAvailabilityEvents();
      return createdEvent;
    } catch (err) {
      console.error('[CalendarContext] Error creating availability:', err);
      toast({
        title: "Error creating availability",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive"
      });
      return null;
    }
  }, [selectedClinicianId, userTimeZone, fetchAvailabilityEvents, toast]);
  
  const updateAvailability = useCallback(async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    try {
      const updatedEvent = await CalendarService.updateEvent({
        ...event,
        extendedProps: {
          ...event.extendedProps,
          eventType: 'availability',
          clinicianId: selectedClinicianId
        }
      }, userTimeZone);
      
      await fetchAvailabilityEvents();
      return updatedEvent;
    } catch (err) {
      console.error('[CalendarContext] Error updating availability:', err);
      toast({
        title: "Error updating availability",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive"
      });
      return null;
    }
  }, [selectedClinicianId, userTimeZone, fetchAvailabilityEvents, toast]);
  
  const deleteAvailability = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const success = await CalendarService.deleteEvent(eventId, 'availability');
      
      if (success) {
        await fetchAvailabilityEvents();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[CalendarContext] Error deleting availability:', err);
      toast({
        title: "Error deleting availability",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive"
      });
      return false;
    }
  }, [fetchAvailabilityEvents, toast]);
  
  // Appointment actions
  const createAppointment = useCallback(async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    try {
      const createdEvent = await CalendarService.createEvent({
        ...event,
        extendedProps: {
          ...event.extendedProps,
          eventType: 'appointment',
          clinicianId: selectedClinicianId
        }
      }, userTimeZone);
      
      await fetchAppointmentEvents();
      return createdEvent;
    } catch (err) {
      console.error('[CalendarContext] Error creating appointment:', err);
      toast({
        title: "Error creating appointment",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive"
      });
      return null;
    }
  }, [selectedClinicianId, userTimeZone, fetchAppointmentEvents, toast]);
  
  const updateAppointment = useCallback(async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    try {
      const updatedEvent = await CalendarService.updateEvent({
        ...event,
        extendedProps: {
          ...event.extendedProps,
          eventType: 'appointment',
          clinicianId: selectedClinicianId
        }
      }, userTimeZone);
      
      await fetchAppointmentEvents();
      return updatedEvent;
    } catch (err) {
      console.error('[CalendarContext] Error updating appointment:', err);
      toast({
        title: "Error updating appointment",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive"
      });
      return null;
    }
  }, [selectedClinicianId, userTimeZone, fetchAppointmentEvents, toast]);
  
  const deleteAppointment = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const success = await CalendarService.deleteEvent(eventId, 'appointment');
      
      if (success) {
        await fetchAppointmentEvents();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[CalendarContext] Error deleting appointment:', err);
      toast({
        title: "Error deleting appointment",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive"
      });
      return false;
    }
  }, [fetchAppointmentEvents, toast]);
  
  // Time off actions
  const createTimeOff = useCallback(async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    try {
      const createdEvent = await CalendarService.createEvent({
        ...event,
        extendedProps: {
          ...event.extendedProps,
          eventType: 'time_off',
          clinicianId: selectedClinicianId
        }
      }, userTimeZone);
      
      await fetchTimeOffEvents();
      return createdEvent;
    } catch (err) {
      console.error('[CalendarContext] Error creating time off:', err);
      toast({
        title: "Error creating time off",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive"
      });
      return null;
    }
  }, [selectedClinicianId, userTimeZone, fetchTimeOffEvents, toast]);
  
  const updateTimeOff = useCallback(async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    try {
      const updatedEvent = await CalendarService.updateEvent({
        ...event,
        extendedProps: {
          ...event.extendedProps,
          eventType: 'time_off',
          clinicianId: selectedClinicianId
        }
      }, userTimeZone);
      
      await fetchTimeOffEvents();
      return updatedEvent;
    } catch (err) {
      console.error('[CalendarContext] Error updating time off:', err);
      toast({
        title: "Error updating time off",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive"
      });
      return null;
    }
  }, [selectedClinicianId, userTimeZone, fetchTimeOffEvents, toast]);
  
  const deleteTimeOff = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const success = await CalendarService.deleteEvent(eventId, 'time_off');
      
      if (success) {
        await fetchTimeOffEvents();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[CalendarContext] Error deleting time off:', err);
      toast({
        title: "Error deleting time off",
        description: CalendarErrorHandler.getUserFriendlyMessage(err),
        variant: "destructive"
      });
      return false;
    }
  }, [fetchTimeOffEvents, toast]);
  
  // Permission checks
  const canManageCalendar = useCallback(async (clinicianId: string): Promise<boolean> => {
    if (!userId) return false;
    return await PermissionService.canManageCalendar(userId, clinicianId);
  }, [userId]);
  
  const canEditAvailability = useCallback(async (clinicianId: string): Promise<boolean> => {
    if (!userId) return false;
    return await PermissionService.canEditAvailability(userId, clinicianId);
  }, [userId]);
  
  // Refresh events when clinician changes or authentication completes
  useEffect(() => {
    if (selectedClinicianId && !isUserLoading && userId) {
      console.log('[CalendarContext] Authentication complete and clinician selected, refreshing events');
      refreshEvents();
    }
  }, [selectedClinicianId, refreshEvents, isUserLoading, userId, userTimeZone, authRetryCount]);
  
  // Notify on errors
  useEffect(() => {
    if (error) {
      const errorMessage = CalendarErrorHandler.getUserFriendlyMessage(error);
      
      toast({
        title: "Calendar Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Log detailed error information
      console.error('[CalendarContext] Calendar error:', {
        error,
        message: error.message,
        stack: error.stack
      });
    }
  }, [error, toast]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // View state
    view,
    currentDate,
    selectedClinicianId,
    
    // Data state
    events,
    
    // UI state
    isLoading,
    error,
    
    // Filters
    showAvailability,
    showAppointments,
    showTimeOff,
    
    // Authentication state
    isAuthenticated: !isUserLoading && !!userId,
    authenticationPending: isUserLoading,
    
    // View actions
    setView,
    setCurrentDate,
    setSelectedClinicianId,
    
    // Filter actions
    setShowAvailability,
    setShowAppointments,
    setShowTimeOff,
    
    // Data actions
    refreshEvents,
    
    // Availability actions
    createAvailability,
    updateAvailability,
    deleteAvailability,
    
    // Appointment actions
    createAppointment,
    updateAppointment,
    deleteAppointment,
    
    // Time off actions
    createTimeOff,
    updateTimeOff,
    deleteTimeOff,
    
    // Permission checks
    canManageCalendar,
    canEditAvailability
  }), [
    view,
    currentDate,
    selectedClinicianId,
    events,
    isLoading,
    error,
    showAvailability,
    showAppointments,
    showTimeOff,
    isUserLoading,
    userId,
    setView,
    setCurrentDate,
    setSelectedClinicianId,
    setShowAvailability,
    setShowAppointments,
    setShowTimeOff,
    refreshEvents,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    createTimeOff,
    updateTimeOff,
    deleteTimeOff,
    canManageCalendar,
    canEditAvailability
  ]);
  
  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

/**
 * Hook for consuming the calendar context
 */
export const useCalendar = (): CalendarContextValue => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
