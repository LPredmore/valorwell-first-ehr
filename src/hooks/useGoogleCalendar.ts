
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ICalendarEvent, CalendarEvent } from '@/types/calendar';
import { 
  GOOGLE_API_CONFIG, 
  convertToGoogleEvent, 
  convertFromGoogleEvent,
  TimeCalendarType
} from '@/utils/googleCalendarUtils';
import ApiCalendar from 'react-google-calendar-api';

export interface UseGoogleCalendarProps {
  clinicianId: string | null;
  userTimeZone: string;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

export interface UseGoogleCalendarReturn {
  isGoogleLinked: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncCalendar: () => Promise<void>;
  
  addEvent: (event: ICalendarEvent) => Promise<ICalendarEvent | null>;
  updateEvent: (event: ICalendarEvent) => Promise<ICalendarEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  
  fetchGoogleEvents: (
    startDate?: Date, 
    endDate?: Date
  ) => Promise<CalendarEvent[]>;
  
  error: Error | null;
}

export const initializeGoogleApiClient = () => {
  try {
    if (!GOOGLE_API_CONFIG.clientId) {
      console.error('Google Client ID is missing');
      return false;
    }

    const apiCalendar = new ApiCalendar({
      clientId: GOOGLE_API_CONFIG.clientId,
      apiKey: GOOGLE_API_CONFIG.apiKey,
      scope: GOOGLE_API_CONFIG.scope,
      discoveryDocs: GOOGLE_API_CONFIG.discoveryDocs
    });

    return apiCalendar;
  } catch (error) {
    console.error('Error initializing Google Calendar API:', error);
    return false;
  }
};

export function useGoogleCalendar({
  clinicianId,
  userTimeZone,
  onSyncComplete,
  onSyncError
}: UseGoogleCalendarProps): UseGoogleCalendarReturn {
  const [googleApiCalendar, setGoogleApiCalendar] = useState<ApiCalendar | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const initClient = initializeGoogleApiClient();
    if (initClient) {
      setGoogleApiCalendar(initClient);
    }
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isSignedIn = googleApiCalendar?.sign;
        setIsAuthenticated(!!isSignedIn);
        
        if (isSignedIn && clinicianId) {
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
    
    if (googleApiCalendar && clinicianId) {
      checkAuthStatus();
    }
  }, [clinicianId, googleApiCalendar]);

  // Check for last sync time
  useEffect(() => {
    const fetchLastSyncTime = async () => {
      if (!clinicianId || !isGoogleLinked) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('google_calendar_last_sync')
          .eq('id', clinicianId)
          .maybeSingle();
          
        if (data?.google_calendar_last_sync) {
          setLastSyncTime(new Date(data.google_calendar_last_sync));
        }
      } catch (err) {
        console.error('Error fetching last sync time:', err);
      }
    };
    
    fetchLastSyncTime();
  }, [clinicianId, isGoogleLinked]);

  const signIn = useCallback(async () => {
    if (!clinicianId) {
      setError(new Error('No clinician ID provided'));
      return;
    }
    
    setIsAuthenticating(true);
    setError(null);
    
    try {
      await googleApiCalendar?.handleAuthClick();
      setIsAuthenticated(true);
      
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
  }, [clinicianId, googleApiCalendar, toast]);

  const signOut = useCallback(async () => {
    if (!clinicianId) {
      setError(new Error('No clinician ID provided'));
      return;
    }
    
    setIsAuthenticating(true);
    setError(null);
    
    try {
      await googleApiCalendar?.handleSignoutClick();
      setIsAuthenticated(false);
      
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
  }, [clinicianId, googleApiCalendar, toast]);

  const fetchGoogleEvents = useCallback(async (
    startDate: Date = new Date(),
    endDate: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ): Promise<CalendarEvent[]> => {
    if (!isAuthenticated || !clinicianId) {
      return [];
    }
    
    try {
      const googleEvents = await googleApiCalendar?.listEvents({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        showDeleted: false,
        singleEvents: true,
      });
      
      return googleEvents?.result.items.map(googleEvent => {
        const localEvent = convertFromGoogleEvent(googleEvent, clinicianId, userTimeZone);
        
        return {
          id: localEvent.id,
          title: localEvent.title,
          start: localEvent.startTime,
          end: localEvent.endTime,
          allDay: localEvent.allDay,
          backgroundColor: '#039be5',
          borderColor: '#039be5',
          textColor: '#ffffff',
          extendedProps: {
            eventType: localEvent.eventType,
            googleEventId: googleEvent.id,
            isGoogleEvent: true,
            recurrenceRule: localEvent.recurrenceRule
          }
        };
      }) || [];
    } catch (err) {
      console.error('Error fetching Google Calendar events:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    }
  }, [isAuthenticated, clinicianId, googleApiCalendar, userTimeZone]);

  const addEvent = useCallback(async (event: ICalendarEvent): Promise<ICalendarEvent | null> => {
    if (!clinicianId) {
      setError(new Error('No clinician ID provided'));
      return null;
    }
    
    try {
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
      
      const googleEvent = convertToGoogleEvent(
        {
          ...event,
          id: localEvent.id
        },
        userTimeZone
      );

      const googleResponse = await googleApiCalendar?.createEvent(googleEvent);

      await supabase
        .from('calendar_events')
        .update({
          google_event_id: googleResponse?.result.id
        })
        .eq('id', localEvent.id);
        
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
  }, [clinicianId, isAuthenticated, isGoogleLinked, toast, userTimeZone, googleApiCalendar]);

  const updateEvent = useCallback(async (event: ICalendarEvent): Promise<ICalendarEvent | null> => {
    if (!clinicianId) {
      setError(new Error('No clinician ID provided'));
      return null;
    }
    
    try {
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
      
      const googleEvent = convertToGoogleEvent({
        ...event,
        id: localEvent.id
      }, userTimeZone);

      await googleApiCalendar?.updateEvent(googleEvent, localEvent.google_event_id);
      
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
  }, [clinicianId, isAuthenticated, isGoogleLinked, toast, userTimeZone, googleApiCalendar]);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!clinicianId) {
      setError(new Error('No clinician ID provided'));
      return false;
    }
    
    try {
      const { data: event, error: fetchError } = await supabase
        .from('calendar_events')
        .select('google_event_id')
        .eq('id', eventId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
        
      if (deleteError) throw deleteError;
      
      if (!isAuthenticated || !isGoogleLinked || !event?.google_event_id) {
        return true;
      }
      
      await googleApiCalendar?.deleteEvent(event.google_event_id);
      
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
  }, [clinicianId, isAuthenticated, isGoogleLinked, toast, googleApiCalendar]);

  const syncCalendar = useCallback(async (): Promise<void> => {
    if (!clinicianId || !isAuthenticated || !isGoogleLinked) {
      return;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 180);
      
      const googleEvents = await googleApiCalendar?.listEvents({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        showDeleted: false,
        singleEvents: true,
      });
      
      const { data: localEvents, error: localError } = await supabase
        .from('calendar_events')
        .select('*, google_event_id')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .eq('clinician_id', clinicianId);
        
      if (localError) throw localError;
      
      const googleEventsMap = new Map();
      googleEvents?.result.items.forEach(event => {
        googleEventsMap.set(event.id, event);
      });
      
      const localEventsWithGoogleId = new Map();
      const localEventsWithoutGoogleId = [];
      
      localEvents.forEach(event => {
        if (event.google_event_id) {
          localEventsWithGoogleId.set(event.google_event_id, event);
        } else {
          localEventsWithoutGoogleId.push(event);
        }
      });
      
      for (const [googleId, googleEvent] of googleEventsMap) {
        if (!localEventsWithGoogleId.has(googleId)) {
          const localEvent = convertFromGoogleEvent(googleEvent, clinicianId, userTimeZone);
          
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
      
      for (const localEvent of localEventsWithoutGoogleId) {
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
        
        const googleResponse = await googleApiCalendar?.createEvent(googleEvent);
        
        await supabase
          .from('calendar_events')
          .update({
            google_event_id: googleResponse?.result.id
          })
          .eq('id', localEvent.id);
      }
      
      const now = new Date();
      setLastSyncTime(now);
      
      await supabase
        .from('profiles')
        .update({ 
          google_calendar_last_sync: now.toISOString(),
          google_calendar_linked: true
        })
        .eq('id', clinicianId);
        
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
  }, [clinicianId, isAuthenticated, isGoogleLinked, onSyncComplete, onSyncError, toast, userTimeZone, googleApiCalendar]);

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
