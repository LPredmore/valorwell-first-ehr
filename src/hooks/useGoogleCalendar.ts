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
}

export const useGoogleCalendar = (clinicianId: string | null, userTimeZone: string): UseGoogleCalendarReturn => {
  const [isGoogleApiReady, setIsGoogleApiReady] = useState(false);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [googleAuthInstance, setGoogleAuthInstance] = useState<any>(null);
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
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  const initializeGoogleApi = useCallback(async () => {
    try {
      await loadGoogleApi();

      const googleApiParams: GoogleApiParams = {
        apiKey: GOOGLE_API_CONFIG.apiKey,
        clientId: GOOGLE_API_CONFIG.clientId,
        discoveryDocs: GOOGLE_API_CONFIG.discoveryDocs,
        scope: GOOGLE_API_CONFIG.scope
      };

      window.google?.client.init(googleApiParams).then(() => {
        const authInstance = window.google?.auth2.getAuthInstance();
        setGoogleAuthInstance(authInstance);
        setIsGoogleApiReady(true);
        setIsGoogleCalendarConnected(authInstance?.isSignedIn.get());
      }).catch((error: any) => {
        console.error('Error initializing Google API', error);
        toast({
          title: 'Error initializing Google API',
          description: error.message,
          variant: 'destructive'
        });
      });
    } catch (error: any) {
      console.error('Error loading Google API', error);
      toast({
        title: 'Error loading Google API',
        description: error.message,
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
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const disconnectGoogleCalendar = () => {
    try {
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
        description: error.message,
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
    deleteGoogleCalendarEvent
  };
};
