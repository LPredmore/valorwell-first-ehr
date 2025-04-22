import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { CalendarEvent } from '@/types/calendar';
import { GOOGLE_API_CONFIG, convertFromGoogleEvent, convertToGoogleEvent } from '@/utils/googleCalendarUtils';

// Define the type for the Google Calendar API object
declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleApiParams {
  apiKey: string | undefined;
  clientId: string | undefined;
  clientSecret: string | undefined;
  discoveryDocs: string[];
  scope: string | undefined;
}

interface UseGoogleCalendarReturn {
  isGoogleApiReady: boolean;
  isGoogleCalendarConnected: boolean;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => void;
  createGoogleCalendarEvent: (event: CalendarEvent) => Promise<string | null>;
  updateGoogleCalendarEvent: (event: CalendarEvent) => Promise<string | null>;
  deleteGoogleCalendarEvent: (eventId: string) => Promise<boolean>;
  apiInitError: string | null;
}

export const useGoogleCalendar = (clinicianId: string | null, userTimeZone: string): UseGoogleCalendarReturn => {
  const [isGoogleApiReady, setIsGoogleApiReady] = useState(false);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [googleAuthInstance, setGoogleAuthInstance] = useState<any>(null);
  const [apiInitError, setApiInitError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadGoogleApi = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.google?.load('client:auth2', () => {
          resolve();
        });
      };
      script.onerror = (err) => {
        console.error('Error loading Google API script:', err);
        reject(new Error('Failed to load Google API'));
      };
      document.head.appendChild(script);
    });
  }, []);

  const initializeGoogleApi = useCallback(async () => {
    try {
      await loadGoogleApi();
      
      console.log('Initializing Google API with:', { 
        clientId: GOOGLE_API_CONFIG.clientId ? 'present' : 'missing', 
        clientSecret: GOOGLE_API_CONFIG.clientSecret ? 'present' : 'missing',
        apiKey: GOOGLE_API_CONFIG.apiKey ? 'present' : 'missing'
      });
      
      if (!GOOGLE_API_CONFIG.clientId) {
        console.error('Google Client ID is missing or undefined');
        setApiInitError('Google Client ID is missing');
        return;
      }

      if (!GOOGLE_API_CONFIG.clientSecret) {
        console.error('Google Client Secret is missing or undefined');
        setApiInitError('Google Client Secret is missing');
        return;
      }

      const googleApiParams: GoogleApiParams = {
        apiKey: GOOGLE_API_CONFIG.apiKey,
        clientId: GOOGLE_API_CONFIG.clientId,
        clientSecret: GOOGLE_API_CONFIG.clientSecret,
        discoveryDocs: GOOGLE_API_CONFIG.discoveryDocs,
        scope: GOOGLE_API_CONFIG.scope
      };

      try {
        await window.google?.client.init(googleApiParams);
        const authInstance = window.google?.auth2.getAuthInstance();
        
        if (!authInstance) {
          throw new Error('Failed to initialize Google Auth instance');
        }
        
        setGoogleAuthInstance(authInstance);
        setIsGoogleApiReady(true);
        setIsGoogleCalendarConnected(authInstance.isSignedIn.get());
        setApiInitError(null);
      } catch (err: any) {
        console.error('Error initializing Google API client:', err);
        setApiInitError(err.message || 'Error initializing Google API');
        toast({
          title: 'Error initializing Google API',
          description: err.message || 'Could not initialize Google Calendar API',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error in Google API initialization process:', error);
      setApiInitError(error.message || 'Failed to load Google API');
      toast({
        title: 'Error loading Google API',
        description: error.message || 'Could not load Google Calendar API',
        variant: 'destructive'
      });
    }
  }, [clinicianId, toast, loadGoogleApi]);

  useEffect(() => {
    if (clinicianId) {
      initializeGoogleApi();
    }
  }, [clinicianId, initializeGoogleApi]);

  const connectGoogleCalendar = async () => {
    try {
      if (!googleAuthInstance) {
        console.error('Google Auth instance not initialized');
        toast({
          title: 'Google Calendar Error',
          description: 'Google authentication is not initialized. Please refresh the page and try again.',
          variant: 'destructive'
        });
        return;
      }
      
      await googleAuthInstance.signIn();
      setIsGoogleCalendarConnected(true);
      toast({
        title: 'Google Calendar Connected',
        description: 'Successfully connected to Google Calendar.',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error connecting to Google Calendar', error);
      toast({
        title: 'Error connecting to Google Calendar',
        description: error.message || 'Connection failed. Please try again.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const disconnectGoogleCalendar = () => {
    try {
      if (!googleAuthInstance) {
        console.error('Google Auth instance not initialized');
        return;
      }
      
      googleAuthInstance.signOut();
      setIsGoogleCalendarConnected(false);
      toast({
        title: 'Google Calendar Disconnected',
        description: 'Successfully disconnected from Google Calendar.',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error disconnecting Google Calendar', error);
      toast({
        title: 'Error disconnecting Google Calendar',
        description: error.message || 'Failed to disconnect. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const createGoogleCalendarEvent = async (event: CalendarEvent): Promise<string | null> => {
    try {
      const googleEvent = convertToGoogleEvent(event, userTimeZone);

      const request = window.google?.client.calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent
      });

      const response = await request.execute((googleEvent: any) => {
        if (googleEvent.error) {
          console.error('Error creating Google Calendar event', googleEvent.error);
          toast({
            title: 'Error creating Google Calendar event',
            description: googleEvent.error.message,
            variant: 'destructive'
          });
          return null;
        } else {
          toast({
            title: 'Google Calendar Event Created',
            description: 'Event created successfully in Google Calendar.',
            duration: 3000
          });
          return googleEvent.id;
        }
      });

      return response?.result?.id || null;
    } catch (error: any) {
      console.error('Error creating Google Calendar event', error);
      toast({
        title: 'Error creating Google Calendar event',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateGoogleCalendarEvent = async (event: CalendarEvent): Promise<string | null> => {
    try {
      if (!event.extendedProps?.googleEventId) {
        throw new Error('Google Event ID is missing');
      }

      const googleEvent = convertToGoogleEvent(event, userTimeZone);

      const request = window.google?.client.calendar.events.update({
        calendarId: 'primary',
        eventId: event.extendedProps.googleEventId,
        resource: googleEvent
      });

      const response = await request.execute((googleEvent: any) => {
        if (googleEvent.error) {
          console.error('Error updating Google Calendar event', googleEvent.error);
          toast({
            title: 'Error updating Google Calendar event',
            description: googleEvent.error.message,
            variant: 'destructive'
          });
          return null;
        } else {
          toast({
            title: 'Google Calendar Event Updated',
            description: 'Event updated successfully in Google Calendar.',
            duration: 3000
          });
          return googleEvent.id;
        }
      });

      return response?.result?.id || null;
    } catch (error: any) {
      console.error('Error updating Google Calendar event', error);
      toast({
        title: 'Error updating Google Calendar event',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const deleteGoogleCalendarEvent = async (eventId: string): Promise<boolean> => {
    try {
      const request = window.google?.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      await request.execute();

      toast({
        title: 'Google Calendar Event Deleted',
        description: 'Event deleted successfully from Google Calendar.',
        duration: 3000
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting Google Calendar event', error);
      toast({
        title: 'Error deleting Google Calendar event',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    isGoogleApiReady,
    isGoogleCalendarConnected,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    createGoogleCalendarEvent,
    updateGoogleCalendarEvent,
    deleteGoogleCalendarEvent,
    apiInitError
  };
};
