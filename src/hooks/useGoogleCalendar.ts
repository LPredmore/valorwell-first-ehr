
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ICalendarEvent, CalendarEvent } from '@/types/calendar';
import { 
  GOOGLE_API_CONFIG, 
  convertToGoogleEvent, 
  convertFromGoogleEvent 
} from '@/utils/googleCalendarUtils';
import ApiCalendar from 'react-google-calendar-api';

// Define interface for Google Calendar hook
export interface UseGoogleCalendarProps {
  clinicianId: string | null;
  userTimeZone: string;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

export interface UseGoogleCalendarReturn {
  // Authentication state and functions
  isGoogleLinked: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Sync state and functions
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncCalendar: () => Promise<void>;
  
  // CRUD operations that also update Google Calendar
  addEvent: (event: ICalendarEvent) => Promise<ICalendarEvent | null>;
  updateEvent: (event: ICalendarEvent) => Promise<ICalendarEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  
  // Google Calendar specific functions
  fetchGoogleEvents: (
    startDate?: Date, 
    endDate?: Date
  ) => Promise<CalendarEvent[]>;
  
  // Error state
  error: Error | null;
}

// Create a singleton instance of the ApiCalendar
export const googleApiCalendar = new ApiCalendar({
  clientId: GOOGLE_API_CONFIG.clientId,
  apiKey: GOOGLE_API_CONFIG.apiKey,
  scope: GOOGLE_API_CONFIG.scope,
  discoveryDocs: GOOGLE_API_CONFIG.discoveryDocs,
});

// The main Google Calendar hook
export function useGoogleCalendar({
  clinicianId,
  userTimeZone,
  onSyncComplete,
  onSyncError
}: UseGoogleCalendarProps): UseGoogleCalendarReturn {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean>(false);
  const { toast } = useToast();

  // Check initial authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isSignedIn = googleApiCalendar.sign;
        setIsAuthenticated(isSignedIn);
        
        if (isSignedIn && clinicianId) {
          // Check if we have stored tokens/linked status in the database
          const { data } = await supabase
            .from('profiles')
            .select('google_calendar_linked')
            .eq('id', clinicianId)
            .single();
            
          setIsGoogleLinked(!!data?.google_calendar_linked);
        }
      } catch (err) {
        console.error('Error checking Google Calendar auth status:', err);
        setIsAuthenticated(false);
      }
    };
    
    checkAuthStatus();
  }, [clinicianId]);

  // Sign in to Google Calendar
  const signIn = useCallback(async () => {
    if (!clinicianId) {
      setError(new Error('No clinician ID provided'));
      return;
    }
    
    setIsAuthenticating(true);
    setError(null);
    
    try {
      await googleApiCalendar.handleAuthClick();
      setIsAuthenticated(true);
      
      // Update the database to store the linked status
      await supabase
        .from('profiles')
        .update({ google_calendar_linked: true })
        .eq('id', clinicianId);
        
      setIsGoogleLinked(true);
      
      toast({
        title: 'Google Calendar Connected',
        description: 'Your Google Calendar has been successfully linked.',
      });
    } catch (err) {
      console.error('Error signing into Google Calendar:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to Google Calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAuthenticating(false);
    }
  }, [clinicianId, toast]);

  // Sign out of Google Calendar
  const signOut = useCallback(async () => {
    if (!clinicianId) {
      setError(new Error('No clinician ID provided'));
      return;
    }
    
    setIsAuthenticating(true);
    setError(null);
    
    try {
      await googleApiCalendar.handleSignoutClick();
      setIsAuthenticated(false);
      
      // Update the database to remove the linked status
      await supabase
        .from('profiles')
        .update({ google_calendar_linked: false })
        .eq('id', clinicianId);
        
      setIsGoogleLinked(false);
      
      toast({
        title: 'Google Calendar Disconnected',
        description: 'Your Google Calendar has been unlinked.',
      });
    } catch (err) {
      console.error('Error signing out of Google Calendar:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      toast({
        title: 'Disconnection Error',
        description: 'Failed to disconnect from Google Calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAuthenticating(false);
    }
  }, [clinicianId, toast]);

  // Fetch events from Google Calendar
  const fetchGoogleEvents = useCallback(async (
    startDate: Date = new Date(),
    endDate: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default: 30 days from now
  ): Promise<CalendarEvent[]> => {
    if (!isAuthenticated || !clinicianId) {
      return [];
    }
    
    try {
      const googleEvents = await googleApiCalendar.listEvents({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        showDeleted: false,
        singleEvents: true,
      });
      
      // Convert Google events to our format
      return googleEvents.result.items.map(googleEvent => {
        const localEvent = convertFromGoogleEvent(googleEvent, clinicianId, userTimeZone);
        
        // Format it as a CalendarEvent for FullCalendar
        return {
          id: localEvent.id,
          title: localEvent.title,
          start: localEvent.startTime,
          end: localEvent.endTime,
          allDay: localEvent.allDay,
          backgroundColor: '#039be5', // Google blue color
          borderColor: '#039be5',
          textColor: '#ffffff',
          extendedProps: {
            eventType: localEvent.eventType,
            googleEventId: googleEvent.id,
            isGoogleEvent: true,
            recurrenceRule: localEvent.recurrenceRule
          }
        };
      });
    } catch (err) {
      console.error('Error fetching Google Calendar events:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    }
  }, [isAuthenticated, clinicianId, userTimeZone]);

  // Add an event to both local storage and Google Calendar
  const addEvent = useCallback(async (event: ICalendarEvent): Promise<ICalendarEvent | null> => {
    if (!clinicianId) {
      setError(new Error('No clinician ID provided'));
      return null;
    }
    
    try {
      // First add to local database
      const { data: localEvent, error: localError } = await supabase
        .from('calendar_events')
        .insert({
          title: event.title,
          description: event.description,
          start_time: event.startTime,
          end_time: event.endTime,
          all_day: event.allDay,
          clinician_id: event.clinicianId,
          event_type: event.eventType
        })
        .select()
        .single();
        
      if (localError) throw localError;
      
      // If we're not authenticated with Google, just return the local event
      if (!isAuthenticated || !isGoogleLinked) {
        return {
          id: localEvent.id,
          clinicianId: localEvent.clinician_id,
          title: localEvent.title,
          description: localEvent.description,
          startTime: localEvent.start_time,
          endTime: localEvent.end_time,
          allDay: localEvent.all_day,
          eventType: localEvent.event_type,
        };
      }
      
      // Add to Google Calendar
      const googleEvent = convertToGoogleEvent(
        {
          ...event,
          id: localEvent.id
        },
        userTimeZone
      );
      
      // Add to Google Calendar
      const googleResponse = await googleApiCalendar.createEvent(googleEvent);
      
      // Update local event with Google Calendar ID
      await supabase
        .from('calendar_events')
        .update({
          google_event_id: googleResponse.result.id
        })
        .eq('id', localEvent.id);
        
      // Return the newly created event
      return {
        id: localEvent.id,
        clinicianId: localEvent.clinician_id,
        title: localEvent.title,
        description: localEvent.description,
        startTime: localEvent.start_time,
        endTime: localEvent.end_time,
        allDay: localEvent.all_day,
        eventType: localEvent.event_type,
      };
    } catch (err) {
      console.error('Error adding event:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      toast({
        title: 'Error Adding Event',
        description: 'Failed to add event. Please try again.',
        variant: 'destructive',
      });
      
      return null;
    }
  }, [clinicianId, isAuthenticated, isGoogleLinked, toast, userTimeZone]);

  // Update an event in both local storage and Google Calendar
  const updateEvent = useCallback(async (event: ICalendarEvent): Promise<ICalendarEvent | null> => {
    if (!clinicianId) {
      setError(new Error('No clinician ID provided'));
      return null;
    }
    
    try {
      // First update local database
      const { data: localEvent, error: localError } = await supabase
        .from('calendar_events')
        .update({
          title: event.title,
          description: event.description,
          start_time: event.startTime,
          end_time: event.endTime,
          all_day: event.allDay,
          event_type: event.eventType
        })
        .eq('id', event.id)
        .select('*, google_event_id')
        .single();
        
      if (localError) throw localError;
      
      // If we're not authenticated with Google or the event doesn't have a Google ID, just return
      if (!isAuthenticated || !isGoogleLinked || !localEvent.google_event_id) {
        return {
          id: localEvent.id,
          clinicianId: localEvent.clinician_id,
          title: localEvent.title,
          description: localEvent.description,
          startTime: localEvent.start_time,
          endTime: localEvent.end_time,
          allDay: localEvent.all_day,
          eventType: localEvent.event_type,
        };
      }
      
      // Update in Google Calendar
      const googleEvent = convertToGoogleEvent({
        ...event,
        id: localEvent.id
      }, userTimeZone);
      
      await googleApiCalendar.updateEvent(
        googleEvent,
        localEvent.google_event_id
      );
      
      // Return the updated event
      return {
        id: localEvent.id,
        clinicianId: localEvent.clinician_id,
        title: localEvent.title,
        description: localEvent.description,
        startTime: localEvent.start_time,
        endTime: localEvent.end_time,
        allDay: localEvent.all_day,
        eventType: localEvent.event_type,
      };
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      toast({
        title: 'Error Updating Event',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive',
      });
      
      return null;
    }
  }, [clinicianId, isAuthenticated, isGoogleLinked, toast, userTimeZone]);

  // Delete an event from both local storage and Google Calendar
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!clinicianId) {
      setError(new Error('No clinician ID provided'));
      return false;
    }
    
    try {
      // First get the event to check if it has a Google Calendar ID
      const { data: event, error: fetchError } = await supabase
        .from('calendar_events')
        .select('google_event_id')
        .eq('id', eventId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      // Delete from local database
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
        
      if (deleteError) throw deleteError;
      
      // If we're not authenticated with Google or the event doesn't have a Google ID, just return
      if (!isAuthenticated || !isGoogleLinked || !event?.google_event_id) {
        return true;
      }
      
      // Delete from Google Calendar
      await googleApiCalendar.deleteEvent(event.google_event_id);
      
      return true;
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      toast({
        title: 'Error Deleting Event',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [clinicianId, isAuthenticated, isGoogleLinked, toast]);

  // Sync calendar data between local database and Google Calendar
  const syncCalendar = useCallback(async (): Promise<void> => {
    if (!clinicianId || !isAuthenticated || !isGoogleLinked) {
      return;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      // 1. Fetch events from Google Calendar
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 180); // Look 6 months ahead
      
      const googleEvents = await googleApiCalendar.listEvents({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        showDeleted: false,
        singleEvents: true,
      });
      
      // 2. Fetch events from local database
      const { data: localEvents, error: localError } = await supabase
        .from('calendar_events')
        .select('*, google_event_id')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .eq('clinician_id', clinicianId);
        
      if (localError) throw localError;
      
      // 3. Map Google events by ID for quick lookup
      const googleEventsMap = new Map();
      googleEvents.result.items.forEach(event => {
        googleEventsMap.set(event.id, event);
      });
      
      // 4. Map local events by Google ID for quick lookup
      const localEventsWithGoogleId = new Map();
      const localEventsWithoutGoogleId = [];
      
      localEvents.forEach(event => {
        if (event.google_event_id) {
          localEventsWithGoogleId.set(event.google_event_id, event);
        } else {
          localEventsWithoutGoogleId.push(event);
        }
      });
      
      // 5. Process events that exist in Google but not locally
      for (const [googleId, googleEvent] of googleEventsMap) {
        if (!localEventsWithGoogleId.has(googleId)) {
          // Convert Google event to our format
          const localEvent = convertFromGoogleEvent(googleEvent, clinicianId, userTimeZone);
          
          // Add to local database
          await supabase
            .from('calendar_events')
            .insert({
              title: localEvent.title,
              description: localEvent.description,
              start_time: localEvent.startTime,
              end_time: localEvent.endTime,
              all_day: localEvent.allDay,
              clinician_id: localEvent.clinicianId,
              event_type: localEvent.eventType,
              google_event_id: googleId
            });
        }
      }
      
      // 6. Process local events that need to be added to Google
      for (const localEvent of localEventsWithoutGoogleId) {
        // Add to Google Calendar
        const googleEvent = convertToGoogleEvent({
          id: localEvent.id,
          clinicianId: localEvent.clinician_id,
          title: localEvent.title,
          description: localEvent.description,
          startTime: localEvent.start_time,
          endTime: localEvent.end_time,
          allDay: localEvent.all_day,
          eventType: localEvent.event_type,
        }, userTimeZone);
        
        const googleResponse = await googleApiCalendar.createEvent(googleEvent);
        
        // Update local event with Google Calendar ID
        await supabase
          .from('calendar_events')
          .update({
            google_event_id: googleResponse.result.id
          })
          .eq('id', localEvent.id);
      }
      
      // 7. Update last sync time
      const now = new Date();
      setLastSyncTime(now);
      
      // Update the database with the last sync time
      await supabase
        .from('profiles')
        .update({ 
          google_calendar_last_sync: now.toISOString(),
          google_calendar_linked: true
        })
        .eq('id', clinicianId);
        
      // 8. Call the onSyncComplete callback if provided
      if (onSyncComplete) {
        onSyncComplete();
      }
      
      toast({
        title: 'Calendar Synced',
        description: 'Your calendar has been successfully synced with Google Calendar.',
      });
    } catch (err) {
      console.error('Error syncing calendar:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Call the onSyncError callback if provided
      if (onSyncError) {
        onSyncError(err instanceof Error ? err : new Error(String(err)));
      }
      
      toast({
        title: 'Sync Error',
        description: 'Failed to sync with Google Calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [clinicianId, isAuthenticated, isGoogleLinked, onSyncComplete, onSyncError, toast, userTimeZone]);

  return {
    isGoogleLinked,
    isAuthenticated,
    isAuthenticating,
    signIn,
    signOut,
    isSyncing,
    lastSyncTime,
    syncCalendar,
    addEvent,
    updateEvent,
    deleteEvent,
    fetchGoogleEvents,
    error
  };
}
