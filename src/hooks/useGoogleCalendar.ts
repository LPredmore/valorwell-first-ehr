
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { CalendarEvent } from '@/types/calendar';
import { GOOGLE_SCOPES, convertFromGoogleEvent, convertToGoogleEvent, getGoogleApiConfig } from '@/utils/googleCalendarUtils';
import { supabase } from '@/integrations/supabase/client';

// Define the type for the Google Calendar API object
declare global {
  interface Window {
    google?: any;
  }
}

export const useGoogleCalendar = (clinicianId: string | null, userTimeZone: string) => {
  const [isGoogleApiReady, setIsGoogleApiReady] = useState(false);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [googleAuthInstance, setGoogleAuthInstance] = useState<any>(null);
  const [apiInitError, setApiInitError] = useState<string | null>(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
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
      setIsLoadingCredentials(true);
      await loadGoogleApi();
      
      // Fetch credentials from Edge Function
      const googleApiConfig = await getGoogleApiConfig();
      
      console.log('Google API Config:', { 
        clientId: googleApiConfig.clientId ? `present (length: ${googleApiConfig.clientId.length})` : 'missing', 
        apiKey: googleApiConfig.apiKey ? `present (length: ${googleApiConfig.apiKey.length})` : 'missing',
        scope: googleApiConfig.scope
      });
      
      if (!googleApiConfig.clientId) {
        console.error('Google Client ID is missing or undefined');
        setApiInitError('Google Client ID is missing. Please check your Supabase secrets configuration.');
        return;
      }

      if (!googleApiConfig.apiKey) {
        console.error('Google API Key is missing or undefined');
        setApiInitError('Google API Key is missing. Please check your Supabase secrets configuration.');
        return;
      }

      try {
        console.log('Initializing Google client with params');
        await window.google?.client.init(googleApiConfig);
        const authInstance = window.google?.auth2.getAuthInstance();
        
        if (!authInstance) {
          throw new Error('Failed to initialize Google Auth instance');
        }
        
        setGoogleAuthInstance(authInstance);
        setIsGoogleApiReady(true);
        setIsGoogleCalendarConnected(authInstance.isSignedIn.get());
        setApiInitError(null);

        // Set up listener for sign-in state changes
        authInstance.isSignedIn.listen((isSignedIn: boolean) => {
          setIsGoogleCalendarConnected(isSignedIn);
        });

      } catch (err: any) {
        console.error('Error initializing Google API client:', err);
        setApiInitError(`Error initializing Google API: ${err.message || 'Unknown error'}`);
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
    } finally {
      setIsLoadingCredentials(false);
    }
  }, [clinicianId, toast, loadGoogleApi]);

  useEffect(() => {
    if (clinicianId) {
      console.log('Initializing Google API for clinician:', clinicianId);
      initializeGoogleApi();
    }

    return () => {
      // Clean up any listeners if needed
    };
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
      
      await googleAuthInstance.signIn({
        prompt: 'consent',  // Always ask for consent to ensure fresh tokens
        ux_mode: 'popup'    // Use popup to avoid page redirects
      });
      
      setIsGoogleCalendarConnected(true);
      toast({
        title: 'Google Calendar Connected',
        description: 'Successfully connected to Google Calendar.',
        duration: 3000
      });
    } catch (error: any) {
      // Special handling for user cancellation which is not really an error
      if (error.error === "popup_closed_by_user") {
        console.log('User closed the Google sign-in popup');
        toast({
          title: 'Connection Cancelled',
          description: 'Google Calendar connection was cancelled.',
          duration: 3000
        });
        return;
      }

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
      if (!isGoogleCalendarConnected) {
        throw new Error('Not connected to Google Calendar');
      }

      const googleEvent = convertToGoogleEvent(event, userTimeZone);

      const request = window.google?.client.calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent
      });

      const response = await request.execute();
      
      if (response.error) {
        console.error('Error creating Google Calendar event', response.error);
        toast({
          title: 'Error creating Google Calendar event',
          description: response.error.message,
          variant: 'destructive'
        });
        return null;
      } 

      toast({
        title: 'Google Calendar Event Created',
        description: 'Event created successfully in Google Calendar.',
        duration: 3000
      });
      
      return response.id;
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
      if (!isGoogleCalendarConnected) {
        throw new Error('Not connected to Google Calendar');
      }

      if (!event.extendedProps?.googleEventId) {
        throw new Error('Google Event ID is missing');
      }

      const googleEvent = convertToGoogleEvent(event, userTimeZone);

      const request = window.google?.client.calendar.events.update({
        calendarId: 'primary',
        eventId: event.extendedProps.googleEventId,
        resource: googleEvent
      });

      const response = await request.execute();
      
      if (response.error) {
        console.error('Error updating Google Calendar event', response.error);
        toast({
          title: 'Error updating Google Calendar event',
          description: response.error.message,
          variant: 'destructive'
        });
        return null;
      }

      toast({
        title: 'Google Calendar Event Updated',
        description: 'Event updated successfully in Google Calendar.',
        duration: 3000
      });
      
      return response.id;
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
      if (!isGoogleCalendarConnected) {
        throw new Error('Not connected to Google Calendar');
      }

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
    apiInitError,
    isLoadingCredentials
  };
};
