import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CalendarEvent, CalendarViewType } from '@/types/calendar';
import { useAsyncState } from '@/hooks/useAsyncState';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { CalendarErrorHandler, CalendarService } from '@/services/calendar/CalendarFacade';
import { AppError } from '@/utils/errors/AppError';

// Define the context state type
interface CalendarContextState {
  // State
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  view: CalendarViewType;
  currentDate: Date;
  selectedClinicianId: string | null;
  showAvailability: boolean;
  isAuthenticated: boolean;
  authenticationPending: boolean;
  
  // Actions
  setView: (view: CalendarViewType) => void;
  setCurrentDate: (date: Date) => void;
  setSelectedClinicianId: (id: string | null) => void;
  setShowAvailability: (show: boolean) => void;
  refreshEvents: () => Promise<CalendarEvent[]>;
  createEvent: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateEvent: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
}

// Create the context with undefined initial value
const CalendarContext = createContext<CalendarContextState | undefined>(undefined);

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
  // Local state
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(initialClinicianId);
  const [view, setView] = useState<CalendarViewType>(initialView);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showAvailability, setShowAvailability] = useState<boolean>(true);
  
  // External hooks
  const { userTimeZone } = useTimeZone();
  const { toast } = useToast();
  const { userId, isLoading: isUserLoading } = useUser();
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

  // Calendar service parameters
  const calendarParams = useMemo(() => ({
    clinicianId: selectedClinicianId,
    userTimeZone,
    userId,
    isAuthenticated: !isUserLoading && !!userId
  }), [selectedClinicianId, userTimeZone, userId, isUserLoading]);
  
  // Fetch events using useAsyncState
  const {
    data: events = [],
    isLoading,
    error,
    execute: fetchEvents
  } = useAsyncState<CalendarEvent[], []>({
    asyncFunction: async () => {
      // Check authentication state first
      if (isUserLoading) {
        console.log('[CalendarContext] User authentication still loading, deferring fetch');
        
        // If we're already at max retries, throw an error
        if (authRetryCount >= maxAuthRetries) {
          console.error(`[CalendarContext] Max auth retries (${maxAuthRetries}) reached`);
          throw new AppError('Authentication timeout', 'AUTH_TIMEOUT', {
            userVisible: true,
            userMessage: 'Authentication is taking longer than expected. Please refresh the page.'
          });
        }
        
        // Set up exponential backoff for auth retry
        return new Promise((resolve, reject) => {
          const nextRetryDelay = Math.min(authRetryDelay * Math.pow(2, authRetryCount), 30000); // Max 30 seconds
          console.log(`[CalendarContext] Scheduling auth retry #${authRetryCount + 1} in ${nextRetryDelay}ms`);
          
          // Clear any existing timer
          if (authRetryTimerRef.current) {
            clearTimeout(authRetryTimerRef.current);
          }
          
          // Set new timer for retry
          authRetryTimerRef.current = setTimeout(() => {
            setAuthRetryCount(prev => prev + 1);
            fetchEvents().then(resolve).catch(reject);
          }, nextRetryDelay);
        });
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
        throw new AppError('Authentication required', 'AUTH_REQUIRED', {
          userVisible: true,
          userMessage: 'You must be logged in to view calendar events.'
        });
      }
      
      if (!selectedClinicianId) {
        console.log('[CalendarContext] No clinician selected, returning empty events array');
        return [];
      }
      
      console.log('[CalendarContext] Fetching events for clinician:', selectedClinicianId);
      return await CalendarService.getEvents(selectedClinicianId, userTimeZone);
    },
    immediate: !!selectedClinicianId && !isUserLoading && !!userId
  });
  
  // Refresh events function
  const refreshEvents = useCallback(async () => {
    if (selectedClinicianId) {
      console.log('[CalendarContext] Refreshing events for clinician:', selectedClinicianId);
      return await fetchEvents();
    } else {
      console.log('[CalendarContext] No clinician selected, skipping refresh');
      return [];
    }
  }, [selectedClinicianId, fetchEvents]);
  
  // Create event function
  const createEvent = useCallback(async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    try {
      const createdEvent = await CalendarService.createEvent(event, userTimeZone);
      await refreshEvents();
      return createdEvent;
    } catch (error) {
      console.error('[CalendarContext] Error creating event:', error);
      return null;
    }
  }, [CalendarService, refreshEvents, userTimeZone]);
  
  // Update event function
  const updateEvent = useCallback(async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    try {
      const updatedEvent = await CalendarService.updateEvent(event, userTimeZone);
      await refreshEvents();
      return updatedEvent;
    } catch (error) {
      console.error('[CalendarContext] Error updating event:', error);
      return null;
    }
  }, [CalendarService, refreshEvents, userTimeZone]);
  
  // Delete event function
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const result = await CalendarService.deleteEvent(eventId);
      await refreshEvents();
      return result;
    } catch (error) {
      console.error('[CalendarContext] Error deleting event:', error);
      return false;
    }
  }, [CalendarService, refreshEvents]);
  
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
    // State
    events,
    isLoading,
    error,
    view,
    currentDate,
    selectedClinicianId,
    showAvailability,
    isAuthenticated: !isUserLoading && !!userId,
    authenticationPending: isUserLoading,
    
    // Actions
    setView,
    setCurrentDate,
    setSelectedClinicianId,
    setShowAvailability,
    refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent
  }), [
    events,
    isLoading,
    error,
    view,
    currentDate,
    selectedClinicianId,
    showAvailability,
    isUserLoading,
    userId,
    setView,
    setCurrentDate,
    setSelectedClinicianId,
    setShowAvailability,
    refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent
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
export const useCalendar = (): CalendarContextState => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
